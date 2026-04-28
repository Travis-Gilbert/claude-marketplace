# PATTERNS-model-swarm.md

How the multi-model coordination architecture routes tasks across
GPU-hosted, CPU-hosted, and agent-tier language models.

## Problem

No single model serves all roles. The GL-Fusion Gemma A31B needs GPU
cross-attention layers that cannot run on CPU. The 26B MoE fits on
Railway CPU via GGUF but cannot use custom architecture. Small models
(4B) are fast enough for routing and extraction but too small for
user-facing synthesis. DeepSeek V3.2 provides external reasoning via
MCP. The swarm coordinates all of these.

## When to Use

- Deciding which model handles a specific task
- Routing between GPU and CPU inference paths
- Adding a new model to the swarm
- Debugging why a model was selected for the wrong task
- Understanding the internet mediation pattern

## The Pattern

### Model Roster

| Model | Hosting | Capabilities | Never Used For |
|-------|---------|-------------|----------------|
| GL-Fusion Gemma A31B | Modal A100 GPU | Hard cross-attention, three-stream fusion, epistemic synthesis | Quick lookups, classification |
| GL-Fusion MiniMax M2.7 | Modal A100 x2 GPU | Code generation, artifact production, scaffold modification, structured multi-file output. 230B total / 10B active MoE (256 experts, 8 active per token). Cross-attention injects BEFORE expert routing, so graph signal influences which experts activate. | User-facing conversation, batch reasoning, simple lookups |
| Gemma 4 26B MoE | Railway CPU (GGUF Q4_K_M) | Prompting-only soft fusion, conversational synthesis, long context | Custom architecture, batch training |
| Gemma 4B | Railway CPU or Modal | Routing, classification, extraction, entity recognition | User-facing synthesis, complex reasoning |
| DeepSeek V3.2 | External (MCP) | Deep reasoning, metacognition, critique, adversarial analysis | Primary synthesis, latency-sensitive tasks |

### GL-Fusion Gemma A31B (Modal GPU)

Hard cross-attention fusion. Custom `StructuralCrossAttention` and
`SemanticCrossAttention` layers inject graph and embedding signals
directly into the model's hidden states.

```
Input: query + retrieved evidence + Stream A (EpiGNN 165d) + Stream B (SBERT 256d) + Stream C (KGE tokens)
Output: epistemically grounded synthesis
Latency: 5-15s (Modal cold start + generation)
Cost: GPU time per request
```

When to use: primary synthesis for Ask Theseus. The highest quality
output because all three information streams are structurally integrated
into the generation process, not just prompted.

### Gemma 4 26B MoE (Railway CPU)

GGUF Q4_K_M quantization. No custom architecture possible because GGUF
serialization cannot represent cross-attention layers. Uses soft fusion
via prompting: structural context is injected as text in the prompt, not
as tensor features.

```
Input: query + retrieved evidence + KGE tokens (text) + SBERT similarity scores (text)
Output: conversational synthesis
Latency: 10-30s (CPU inference, 3.8B active params)
Cost: Railway compute (included in plan)
```

Why GGUF cannot represent custom cross-attention: GGUF stores weight
tensors in a flat format with predefined layer types (attention, FFN,
embedding). Custom cross-attention layers have no GGUF representation.
Adding new layer types would require forking llama.cpp, which defeats
the purpose of using a standard runtime.

When to use: fallback when Modal is cold or overloaded. Acceptable
quality for simple queries. Not suitable for complex multi-hop synthesis
where structural context matters.

### Gemma 4B Agent Tier

Small and fast. Used for internal pipeline tasks, never user-facing.

```
Tasks:
- Query classification (route to A31B vs 26B)
- Entity extraction from user input
- Claim decomposition (split text into atomic claims)
- Edge type classification
- Relevance scoring (is this evidence useful for this query?)
```

Never used for synthesis. The 4B model lacks the capacity for coherent
multi-paragraph generation or nuanced epistemic reasoning.

### DeepSeek V3.2 (MCP-to-MCP)

External model accessed via bidirectional MCP protocol. Theseus sends
structured requests; DeepSeek returns structured analysis.

```
MCP request:
{
    "tool": "deepseek_critique",
    "arguments": {
        "claim": "BM25 outperforms SBERT for short queries",
        "evidence": [...],
        "task": "identify_weaknesses"
    }
}

MCP response:
{
    "critique": "...",
    "confidence": 0.72,
    "alternative_framings": [...]
}
```

Bidirectional spec: DeepSeek can also call back into Theseus to request
additional evidence or check graph state.

When to use: adversarial analysis, metacognition (reasoning about the
system's own reasoning), and deep critique. High latency (external
network call) makes it unsuitable for synchronous user requests.

### Internet Mediation

Models never access the internet directly. The pattern:

```
1. User query triggers web search (Firecrawl/Tavily)
2. Search results are ingested as Objects (with provenance)
3. Objects go through the engine pipeline (NER, claims, edges)
4. LLMs read validated Objects from the knowledge graph
5. LLMs never see raw web content
```

This ensures all external information passes through the epistemic
pipeline (provenance tracking, claim extraction, contradiction
detection) before reaching the generation model. The LLM cannot
hallucinate from raw web content because it never sees it.

### Dispatch Logic

```python
# speaking_dispatch.py
def dispatch_query(query, evidence, context):
    # Step 1: Classify query (4B agent tier)
    query_type = classify_query(query)  # factual, synthesis, code_change, ...

    # Step 2: Route by query type with documented fallback chain
    if query_type in ('code_change', 'artifact_production', 'scaffold_modification'):
        # Execution tier: M2.7 -> 31B -> 26B
        if check_m27_health():
            return dispatch_to_m27(query, files_context, graph_context)
        return dispatch_to_a31b_or_26b(query, evidence, context)
    elif query_type in ('synthesis', 'causal', 'architectural_analysis'):
        # Reasoning tier: 31B -> 26B
        return dispatch_to_a31b_or_26b(query, evidence, context)
    elif query_type == 'critique':
        return dispatch_to_deepseek(query, evidence)
    else:
        return dispatch_to_26b(query, evidence, context)
```

### Reasoning + Execution Two-Model Pattern

For complex code changes, the swarm runs reasoning and execution in
sequence:

```
Task -> 31B (ChangePlan) -> M2.7 (FileSet) -> sandbox validation -> git commit
```

The 31B reasoning tier produces a ChangePlan with intent, files,
constraints, and graph evidence. The M2.7 execution tier consumes the
plan plus the relevant existing files and emits a FileSet of generated
file dicts. The sandbox validates the FileSet across all languages
before the git pipeline commits.

### MoE Expert Routing + Graph Signal

In M2.7, the GL-Fusion cross-attention layers fire BEFORE the MoE
expert router at layers [10, 20, 30, 40, 50, 58]. This means:

1. Graph context biases the hidden state at the chosen layer.
2. The router scores experts against the biased hidden state.
3. The 8 selected experts compute on the biased representation.

Net effect: graph context influences both expert selection AND expert
output, not just the post-expert representation.

## Key Decisions

1. GPU for hard fusion, CPU for soft fusion. This is not a quality
   hierarchy; it is a capability boundary. Cross-attention requires
   GPU memory.
2. 4B never user-facing. The quality gap between 4B and 26B is too
   large for synthesis tasks. Users notice.
3. DeepSeek as adversary, not primary. External model for critique and
   metacognition, never for primary synthesis. Keeps the epistemic
   pipeline self-contained.
4. Internet mediation is non-negotiable. All external information enters
   through the Object pipeline. No raw web content reaches models.

## Common Mistakes

- Routing simple factual queries to the A31B. Wasteful. The 26B handles
  these adequately on CPU.
- Using 4B for user-facing responses to reduce latency. The quality loss
  is immediately noticeable.
- Letting models access raw web URLs. This bypasses provenance tracking
  and claim extraction.
- Forgetting Modal cold start latency. First request after idle takes
  30-60s. Pre-warm or fall back to 26B.

## Related Patterns

- PATTERNS-two-mode-deployment.md (Railway CPU vs Modal GPU contract)
- PATTERNS-modal-gpu.md (Modal dispatch and volume storage)
- PATTERNS-gl-fusion-three-stream.md (A31B cross-attention architecture)
