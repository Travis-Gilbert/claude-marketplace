# PATTERNS-gl-fusion-three-stream.md

How to wire the three-stream GL-Fusion architecture that feeds structural,
semantic, and relational context into the language model.

## Problem

The language model (Gemma A31B) generates answers from retrieved text
alone. It has no awareness of graph structure (which objects are central,
which edges are bridges, which claims contradict), no awareness of
epistemic embedding similarity (which objects are semantically aligned
in the fine-tuned space), and no awareness of relational predictions
(which edges KGE predicts are missing). GL-Fusion feeds all three signals
into the generation process.

## When to Use

- Wiring the full GL-Fusion architecture for Gemma A31B on Modal
- Adding cross-attention layers for structural and semantic context
- Generating structural tokens for the token stream
- Evaluating whether the fusion gate varies by query type
- Debugging low-quality synthesis output

## The Pattern

### Stream A: Structural (EpiGNN)

Source: EpiGNN two-state output (h_content 128d + h_epistemic 32d),
ORC weights, and optionally TDA persistence features.

```python
# Stream A feature vector per retrieved object
def build_stream_a(obj_sha, epignn, orc_cache, tda_features=None):
    h_content = epignn.get_content_embedding(obj_sha)   # 128d
    h_epistemic = epignn.get_epistemic_embedding(obj_sha)  # 32d
    orc = orc_cache.get(obj_sha, 0.0)                   # 1d
    tda = tda_features.get(obj_sha, [0.0] * 4) if tda_features else [0.0] * 4  # 4d

    return torch.cat([h_content, h_epistemic, torch.tensor([orc]), torch.tensor(tda)])
    # Total: 128 + 32 + 1 + 4 = 165d
```

Stream A enters the model via cross-attention: the LLM's hidden states
attend to structural features. This is a hard fusion (custom layers in
the model architecture), not prompt injection.

```python
class StructuralCrossAttention(nn.Module):
    def __init__(self, llm_dim, struct_dim=165, num_heads=4):
        super().__init__()
        self.proj_k = nn.Linear(struct_dim, llm_dim)
        self.proj_v = nn.Linear(struct_dim, llm_dim)
        self.attn = nn.MultiheadAttention(llm_dim, num_heads, batch_first=True)

    def forward(self, llm_hidden, structural_features):
        k = self.proj_k(structural_features)  # [batch, n_objects, llm_dim]
        v = self.proj_v(structural_features)
        out, _ = self.attn(llm_hidden, k, v)
        return llm_hidden + out  # residual connection
```

### Stream B: Semantic (Epistemic SBERT)

Source: Fine-tuned SBERT embeddings, aligned to 256d shared space via
the contrastive projection head from PATTERNS-sbert-enrichment.md.

```python
def build_stream_b(obj_sha, sbert_model, text_proj):
    embedding = sbert_model.encode(get_object_text(obj_sha))  # 384d
    aligned = text_proj(torch.tensor(embedding))  # 256d
    return F.normalize(aligned, dim=-1)
```

Stream B also enters via cross-attention, similar to Stream A:

```python
class SemanticCrossAttention(nn.Module):
    def __init__(self, llm_dim, semantic_dim=256, num_heads=4):
        super().__init__()
        self.proj_k = nn.Linear(semantic_dim, llm_dim)
        self.proj_v = nn.Linear(semantic_dim, llm_dim)
        self.attn = nn.MultiheadAttention(llm_dim, num_heads, batch_first=True)

    def forward(self, llm_hidden, semantic_features):
        k = self.proj_k(semantic_features)
        v = self.proj_v(semantic_features)
        out, _ = self.attn(llm_hidden, k, v)
        return llm_hidden + out
```

### Stream C: Relational (KGE Structural Tokens)

Source: RotatE predictions formatted as bracket tokens, injected into
the standard token stream.

```python
# From PATTERNS-kge-rotate.md Phase K5
tokens = generate_structural_tokens(query_entity_sha, kge_model, budget=150)

# Prepended to the prompt:
prompt = f"""{tokens}

Based on the above structural context and the following evidence:
{retrieved_text}

Synthesize a response to: {query}"""
```

Stream C uses standard token attention (no custom cross-attention layer).
The LLM reads the bracket tokens as part of the input sequence.

### Fusion Gate

Streams A and B are combined via a learned gate before the final LLM
layers.

```python
class FusionGate(nn.Module):
    """
    alpha = sigmoid(gate(concat(structural_out, semantic_out)))
    fused = alpha * structural_out + (1 - alpha) * semantic_out
    """
    def __init__(self, dim):
        super().__init__()
        self.gate = nn.Sequential(
            nn.Linear(dim * 2, dim),
            nn.ReLU(),
            nn.Linear(dim, 1),
            nn.Sigmoid(),
        )

    def forward(self, structural_out, semantic_out):
        combined = torch.cat([structural_out, semantic_out], dim=-1)
        alpha = self.gate(combined)  # [batch, seq_len, 1]
        return alpha * structural_out + (1 - alpha) * semantic_out
```

Gate alpha must vary by query type. For structural queries ("what
connects X to Y?"), alpha should favor Stream A. For semantic queries
("explain concept X"), alpha should favor Stream B. Measure: standard
deviation of alpha across a diverse query set must exceed 0.05. If
alpha is constant, the gate has collapsed and is not discriminating.

### Integration in gl_fusion_train_a31b.py

File ownership: `modal_app/gl_fusion_train_a31b.py` owns the Phase 9
integration that wires all three streams into the Gemma model.

```python
# Phase 9: Three-stream integration
class GLFusionGemma(nn.Module):
    def __init__(self, base_model, struct_dim=165, semantic_dim=256):
        super().__init__()
        self.base = base_model
        self.struct_attn = StructuralCrossAttention(base_model.config.hidden_size, struct_dim)
        self.semantic_attn = SemanticCrossAttention(base_model.config.hidden_size, semantic_dim)
        self.fusion = FusionGate(base_model.config.hidden_size)

    def forward(self, input_ids, attention_mask, structural_features, semantic_features):
        hidden = self.base.model(input_ids, attention_mask).last_hidden_state

        struct_out = self.struct_attn(hidden, structural_features)
        semantic_out = self.semantic_attn(hidden, semantic_features)
        fused = self.fusion(struct_out, semantic_out)

        logits = self.base.lm_head(fused)
        return logits
```

### Pre-Computation Requirement

Both KGE tokens (Stream C) and SBERT embeddings (Stream B) must be
computed BEFORE the LLM generation call.

```python
# Correct: pre-compute all streams
structural_features = torch.stack([build_stream_a(sha, epignn, orc) for sha in retrieved_shas])
semantic_features = torch.stack([build_stream_b(sha, sbert, proj) for sha in retrieved_shas])
kge_tokens = generate_structural_tokens(query_sha, kge_model)

# Then: single LLM call with all context
output = gl_fusion_model(tokens, mask, structural_features, semantic_features)
```

Never compute stream features inside the generation loop.

## Key Decisions

1. Hard cross-attention for Streams A and B (custom layers in the model).
   GGUF quantization cannot represent custom cross-attention, so this
   architecture runs on Modal GPU only. The 26B MoE on Railway CPU uses
   soft fusion (prompting only, no custom layers).
2. Standard token attention for Stream C (bracket tokens in the prompt).
   This works on any backend and degrades gracefully if KGE is unavailable.
3. Residual connections in both cross-attention layers. Without residuals,
   the structural/semantic signals can overwhelm the text signal.
4. Separate projection heads per stream (not shared). Structural and
   semantic spaces have different geometries.

## Common Mistakes

- Running GL-Fusion on CPU. Cross-attention layers require GPU memory.
  The GGUF pathway cannot represent custom architecture modifications.
- Computing KGE tokens per generation step instead of once before the loop.
- Using the same cross-attention for both streams. Structural features
  (165d) and semantic features (256d) need separate projections.
- Ignoring gate alpha variance. A constant alpha means the gate learned
  nothing. Check std > 0.05 across query types.

## Related Patterns

- PATTERNS-epignn.md (Stream A source: h_content + h_epistemic)
- PATTERNS-kge-rotate.md (Stream C source: structural tokens)
- PATTERNS-sbert-enrichment.md (Stream B source: aligned SBERT)
- PATTERNS-modal-gpu.md (GL-Fusion training on Modal A100)
