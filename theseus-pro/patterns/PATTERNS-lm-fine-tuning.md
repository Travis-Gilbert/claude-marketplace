# PATTERNS-lm-fine-tuning.md

How to fine-tune a language model with LoRA on graph-derived training data.

## Build Sequence

### Step 1: Construct Training Data from the Graph

The graph provides structured (claim + evidence) pairs that become training examples:

```python
def build_training_pairs(notebook_id: int) -> list[dict]:
    """Build hypothesis-generation training data from the knowledge graph."""
    from .models import Claim, Edge, Object

    pairs = []
    claims = Claim.objects.filter(
        source_object__notebook_id=notebook_id,
        status__in=['supported', 'contested'],
    ).select_related('source_object')

    for claim in claims:
        # Gather evidence: objects connected to the claim's source
        edges = Edge.objects.filter(
            from_object=claim.source_object,
            edge_type__in=['supports', 'related', 'mentions'],
        ).select_related('to_object')

        evidence_texts = [e.to_object.body[:500] for e in edges if e.to_object.body]
        if len(evidence_texts) < 2:
            continue

        pairs.append({
            'instruction': 'Given the following evidence, generate a hypothesis.',
            'input': '\n---\n'.join(evidence_texts[:5]),
            'output': claim.text,
            'metadata': {
                'claim_id': claim.pk,
                'claim_status': claim.status,
                'evidence_count': len(evidence_texts),
            },
        })

    return pairs
```

### Step 2: Format for LoRA Training

```python
def format_for_training(pairs: list[dict]) -> list[dict]:
    """Format pairs as chat-style training examples."""
    formatted = []
    for pair in pairs:
        formatted.append({
            'messages': [
                {'role': 'system', 'content': 'You generate grounded hypotheses from evidence.'},
                {'role': 'user', 'content': f'{pair["instruction"]}\n\nEvidence:\n{pair["input"]}'},
                {'role': 'assistant', 'content': pair['output']},
            ]
        })
    return formatted
```

### Step 3: Base Model Selection

| Model | Parameters | VRAM | Use Case |
|-------|-----------|------|----------|
| Qwen 2.5 3B | 3B | 8GB (T4) | Fast iteration, good multilingual |
| Phi-3 Mini | 3.8B | 8GB (T4) | Strong reasoning, English-focused |
| Qwen 2.5 7B | 7B | 16GB (A10G) | Better quality, slower training |

Start with Qwen 2.5 3B on T4 for cost efficiency. Upgrade to 7B on A10G
only after proving the training pipeline works.

### Step 4: Modal GPU Training Function

```python
# modal_functions/train_lm.py
import modal

app = modal.App("theseus-lm-training")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch>=2.0", "transformers>=4.40", "peft>=0.10", "datasets>=2.18",
    "bitsandbytes>=0.43", "accelerate>=0.28",
)

@app.function(image=image, gpu="T4", timeout=7200)
def train_lora(training_data: list[dict], config: dict) -> dict:
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
    from peft import LoraConfig, get_peft_model
    from datasets import Dataset

    model_name = config.get('base_model', 'Qwen/Qwen2.5-3B-Instruct')
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, load_in_4bit=True, device_map='auto',
    )

    lora_config = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=['q_proj', 'v_proj', 'k_proj', 'o_proj'],
        task_type='CAUSAL_LM',
    )
    model = get_peft_model(model, lora_config)

    dataset = Dataset.from_list(training_data)
    # ... tokenize, train, save adapter ...

    import io
    buffer = io.BytesIO()
    model.save_pretrained(buffer)
    return {
        'adapter_bytes': buffer.getvalue(),
        'training_loss': trainer.state.log_history[-1].get('loss', 0),
        'epochs': config.get('epochs', 3),
    }
```

### Step 5: Dispatch from Django

```python
# In tasks.py
@django_rq.job('default', timeout=60)
def dispatch_lm_training(notebook_id: int):
    pairs = build_training_pairs(notebook_id)
    if len(pairs) < 50:
        logger.info('Too few training pairs (%d), need 50+', len(pairs))
        return

    formatted = format_for_training(pairs)
    resp = httpx.post(
        f'{MODAL_ENDPOINT}/train_lora',
        json={'training_data': formatted, 'config': {'base_model': 'Qwen/Qwen2.5-3B-Instruct', 'epochs': 3}},
        timeout=30,
    )
    call_id = resp.json().get('call_id')
    poll_modal_result.delay(call_id, 'lm', notebook_id)
```

### Step 6: Faithfulness Evaluation

After training, evaluate whether generated hypotheses are grounded in evidence:

```python
def evaluate_faithfulness(model_path: str, test_pairs: list[dict]) -> dict:
    """Check if generated hypotheses are supported by the input evidence."""
    from apps.research.advanced_nlp import nli_score

    scores = []
    for pair in test_pairs:
        generated = generate_hypothesis(model_path, pair['input'])
        # NLI: does the evidence entail the hypothesis?
        nli = nli_score(pair['input'][:512], generated)
        scores.append({
            'entailment': nli['entailment'],
            'contradiction': nli['contradiction'],
            'faithful': nli['entailment'] > 0.5 and nli['contradiction'] < 0.2,
        })

    faithful_pct = sum(1 for s in scores if s['faithful']) / len(scores)
    return {
        'faithful_percentage': faithful_pct,
        'mean_entailment': sum(s['entailment'] for s in scores) / len(scores),
        'mean_contradiction': sum(s['contradiction'] for s in scores) / len(scores),
    }
```

## Critical Constraints

- Minimum 50 training pairs before dispatching training (otherwise overfit)
- Training data comes from the graph, not raw text (claims with evidence context)
- LoRA only -- never full fine-tune (adapter is small, base model stays frozen)
- 4-bit quantization required for T4 (8GB VRAM limit)
- Faithfulness evaluation uses NLI: generated text must be entailed by evidence
- Generated hypotheses that contradict evidence (NLI contradiction > 0.3) are rejected
- Training runs on Modal GPU, inference can run locally with the adapter
- IQ Tracker Learning axis measures improvement after each training cycle
