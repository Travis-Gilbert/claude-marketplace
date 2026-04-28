"""
LoRA Fine-Tuning for Graph-Grounded Hypothesis Generation

Demonstrates Level 3 training: construct training data from the
knowledge graph (claim + evidence pairs), configure LoRA adapters
for parameter-efficient fine-tuning, run the training loop, and
check the fine-tuned model's faithfulness to source material.

The key insight is that every training example is grounded in specific
graph nodes and edges. The model learns to generate text that is
traceable to its sources, not statistically plausible hallucination.

Two-mode note: this is a get_started.py GPU job. The base model (Qwen 2.5 0.5B)
and LoRA weights live on a get_started.py volume. Inference is also get_started.py-only.
Production never loads PyTorch.
"""

import json
import logging
import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

import torch
from peft import LoraConfig, get_peft_model, TaskType
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
)

from apps.notebook.models import Claim, Edge, Object

logger = logging.getLogger("theseus.train.lora")

BASE_MODEL = "Qwen/Qwen2.5-0.5B"
OUTPUT_DIR = "models/lora-hypothesis"
MAX_SEQ_LEN = 512


def build_training_data():
    """Construct training examples from the knowledge graph.

    Each example pairs a set of claims with their supporting evidence
    and a target hypothesis. The hypothesis is an existing claim that
    was derived from the evidence -- this gives us ground truth for
    supervised fine-tuning.
    """
    examples = []

    # Find claims that have supporting edges (evidence chains).
    claims_with_support = Claim.objects.filter(
        object__edges_to__edge_type="supports"
    ).select_related("object").distinct()[:2000]

    for claim in claims_with_support:
        # Gather supporting evidence from the graph.
        support_edges = Edge.objects.filter(
            to_object=claim.object, edge_type="supports"
        ).select_related("from_object")[:5]

        if len(support_edges) < 2:
            continue

        # Build the prompt: evidence context -> hypothesis.
        evidence_texts = []
        for edge in support_edges:
            src = edge.from_object
            evidence_texts.append(
                f"[{src.object_type}] {src.title}: "
                f"{(src.text or '')[:200]}"
            )

        prompt = (
            "Given the following evidence from the knowledge graph:\n\n"
            + "\n".join(f"- {e}" for e in evidence_texts)
            + "\n\nGenerate a hypothesis that is consistent with this "
            "evidence but not explicitly stated. Cite specific sources.\n\n"
            "Hypothesis:"
        )

        # The target is the actual claim text (ground truth).
        completion = f" {claim.text}"

        examples.append({"prompt": prompt, "completion": completion})

    logger.info("Built %d training examples from graph", len(examples))
    return examples


def setup_lora_model():
    """Load base model and attach LoRA adapters.

    LoRA config: rank 16, alpha 32, targeting attention layers.
    This trains ~0.5% of total parameters while preserving the
    base model's language capability.
    """
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )

    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=16,                    # Low rank -- keeps adapter small
        lora_alpha=32,           # Scaling factor (alpha/r = 2)
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj"],  # Attention layers only
        bias="none",
    )

    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    logger.info(
        "LoRA attached: %d trainable / %d total (%.2f%%)",
        trainable, total, 100 * trainable / total,
    )

    return model, tokenizer


def tokenize_examples(examples, tokenizer):
    """Convert prompt/completion pairs to tokenized training format."""
    texts = [ex["prompt"] + ex["completion"] for ex in examples]

    encodings = tokenizer(
        texts,
        max_length=MAX_SEQ_LEN,
        truncation=True,
        padding="max_length",
        return_tensors="pt",
    )

    # Labels = input_ids (causal LM). Mask prompt tokens with -100.
    labels = encodings["input_ids"].clone()
    for i, ex in enumerate(examples):
        prompt_len = len(tokenizer.encode(ex["prompt"], add_special_tokens=False))
        labels[i, :prompt_len] = -100  # Don't compute loss on prompt

    encodings["labels"] = labels
    return encodings


def check_faithfulness(model, tokenizer, test_examples, top_k=20):
    """Check whether generated hypotheses are faithful to their sources.

    Faithfulness = fraction of generated hypotheses that do NOT
    contradict any of the provided evidence (checked via NLI).
    """
    try:
        from apps.notebook.advanced_nlp import check_entailment
    except ImportError:
        logger.warning("NLI not available -- skipping faithfulness check")
        return None

    faithful_count = 0

    for ex in test_examples[:top_k]:
        inputs = tokenizer(ex["prompt"], return_tensors="pt").to(model.device)
        with torch.no_grad():
            output = model.generate(
                **inputs, max_new_tokens=100,
                temperature=0.7, do_sample=True,
            )
        generated = tokenizer.decode(output[0], skip_special_tokens=True)
        hypothesis = generated[len(ex["prompt"]):]

        # Check each evidence source for contradiction.
        contradicts = False
        for line in ex["prompt"].split("\n"):
            if line.startswith("- ["):
                result = check_entailment(line, hypothesis)
                if result.get("contradiction", 0) > 0.7:
                    contradicts = True
                    break

        if not contradicts:
            faithful_count += 1

    score = faithful_count / min(len(test_examples), top_k)
    logger.info("Faithfulness score: %.2f (%d/%d)", score, faithful_count, top_k)
    return score


def train_model(model, tokenizer, examples):
    """Run the fine-tuning loop with faithfulness checking."""
    # Hold out 10% for checking.
    split = int(0.9 * len(examples))
    train_examples = examples[:split]
    test_examples = examples[split:]

    train_enc = tokenize_examples(train_examples, tokenizer)
    train_dataset = torch.utils.data.TensorDataset(
        train_enc["input_ids"],
        train_enc["attention_mask"],
        train_enc["labels"],
    )

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=3,
        per_device_train_batch_size=8,
        learning_rate=2e-4,
        warmup_steps=50,
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
    )
    trainer.train()

    # Save LoRA weights (not the full base model).
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    logger.info("LoRA weights saved to %s", OUTPUT_DIR)

    # Check faithfulness on held-out examples.
    check_faithfulness(model, tokenizer, test_examples)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    examples = build_training_data()
    if len(examples) < 100:
        print(f"Only {len(examples)} examples. Need >= 100 for fine-tuning.")
        sys.exit(1)

    model, tokenizer = setup_lora_model()
    train_model(model, tokenizer, examples)
    print("\nLoRA fine-tuning complete. Adapter weights saved.")
