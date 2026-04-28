# PATTERNS-lora-fine-tuning.md

## LoRA Fine-Tuning for Theseus-Native LLM (replaces PATTERNS-lm-fine-tuning.md)

### What This Pattern Covers

End-to-end LoRA/QLoRA fine-tuning: training data generation from the
graph, QLoRA setup on Modal A10G, rank selection, DPO alignment,
RAGAS evaluation, and three-phase deployment.

### Training Data Generation

Three formats from the graph:

**Format 1: Instruction-Following (SFT)**

```python
def generate_sft_examples(objects, edges, claims):
    """Generate instruction-following training examples."""
    examples = []
    for obj in objects:
        related = get_connected_objects(obj, edges, limit=5)
        claims_for_obj = [c for c in claims if c.source_object == obj]
        example = {
            'instruction': f"Given the following knowledge about '{obj.title}', "
                          f"synthesize its relationships to related concepts.",
            'input': obj.text[:2000],
            'output': compose_synthesis(obj, related, claims_for_obj),
        }
        examples.append(example)
    return examples
```

**Format 2: Preference Pairs (DPO)**

```python
def generate_dpo_pairs(queries, good_responses, bad_responses):
    """Generate preference pairs for DPO training.

    good_responses: compose_with_reasoning output (faithful to graph)
    bad_responses: generic LLM synthesis (may hallucinate)
    """
    pairs = []
    for query, good, bad in zip(queries, good_responses, bad_responses):
        pairs.append({
            'prompt': query,
            'chosen': good,    # faithful to ReasoningResult
            'rejected': bad,   # generic synthesis without reasoning
        })
    return pairs
```

**Format 3: Few-Shot from EBL Rules**

```python
def generate_ebl_examples(ebl_rules):
    """Convert EBL-learned rules into few-shot training examples."""
    examples = []
    for rule in ebl_rules:
        example = {
            'instruction': "Apply the following reasoning pattern to analyze "
                          "the given evidence.",
            'input': f"Pattern: {rule.description}\nEvidence: {rule.example_input}",
            'output': rule.example_output,
        }
        examples.append(example)
    return examples
```

### QLoRA Setup on Modal

```python
# In modal_dispatch.py or a new modal_lora.py:

import modal

app = modal.App("theseus-lora")
image = (
    modal.Image.debian_slim()
    .pip_install("torch", "transformers", "peft", "bitsandbytes",
                 "datasets", "trl", "accelerate")
)

@app.function(gpu="A10G", image=image, timeout=7200)
def train_lora(
    base_model: str = "Qwen/Qwen2.5-3B",
    training_data: list[dict] = None,
    lora_rank: int = 16,
    lora_alpha: int = 32,
    epochs: int = 3,
    learning_rate: float = 2e-4,
):
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTTrainer, SFTConfig

    # 4-bit quantization for QLoRA
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype="float16",
    )

    model = AutoModelForCausalLM.from_pretrained(
        base_model, quantization_config=bnb_config, device_map="auto"
    )
    model = prepare_model_for_kbit_training(model)

    lora_config = LoraConfig(
        r=lora_rank,
        lora_alpha=lora_alpha,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        lora_dropout=0.05,
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    # Train
    trainer = SFTTrainer(
        model=model,
        train_dataset=training_data,
        args=SFTConfig(
            output_dir="./lora-output",
            num_train_epochs=epochs,
            learning_rate=learning_rate,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=4,
        ),
    )
    trainer.train()

    # Save adapter weights (small: ~10-50MB)
    model.save_pretrained("./lora-adapter")
    return "./lora-adapter"
```

### Rank Selection Heuristics

| Data Size | Task Complexity | Recommended Rank | Notes |
|-----------|----------------|-----------------|-------|
| < 1000 examples | Simple adaptation | r=4, alpha=8 | Minimal; avoid overfitting |
| 1000-5000 | Domain vocabulary | r=8, alpha=16 | Good for Theseus terminology |
| 5000-20000 | Style + reasoning | r=16, alpha=32 | Default for Theseus |
| 20000+ | Near full fine-tune | r=64, alpha=128 | If compute allows |

Rule of thumb: alpha = 2 * rank. Higher alpha = stronger LoRA signal.

### RAGAS Evaluation

```python
def evaluate_lora_faithfulness(model, test_queries, reasoning_results):
    """Evaluate fine-tuned model using RAGAS metrics."""
    from ragas.metrics import faithfulness, answer_relevancy
    from ragas.metrics import context_recall, context_precision

    scores = {
        'faithfulness': [],      # does output match sources?
        'answer_relevancy': [],  # is output relevant to query?
        'context_recall': [],    # are all relevant sources used?
        'context_precision': [], # are cited sources actually relevant?
    }

    for query, rr in zip(test_queries, reasoning_results):
        output = model.generate(query, context=rr)
        # Score each dimension
        scores['faithfulness'].append(
            faithfulness.score(output, rr.source_texts))
        scores['answer_relevancy'].append(
            answer_relevancy.score(query, output))
        # ... etc

    return {k: np.mean(v) for k, v in scores.items()}
    # Target: faithfulness > 0.85, relevancy > 0.80
```

### Three-Phase Deployment

```
Phase 1: Modal trains adapter weights
  -> Export: lora-adapter/ directory (~10-50MB)

Phase 2: Upload adapter to Railway storage
  -> S3 bucket or Railway volume mount

Phase 3: Railway loads merged model at startup
  -> In compose_engine.py: load base model + merge adapter
  -> Fallback: if adapter unavailable, use API-based LLM
```

### Agents Involved

1. language-model-training: LoRA architecture, QLoRA setup, rank selection
2. llm-engineering: training data format, RAGAS evaluation, faithfulness
3. software-architecture: Modal dispatch, three-phase deployment
4. formal-epistemology: grounded generation constraint enforcement
5. domain-specialization: domain pack training data contribution
