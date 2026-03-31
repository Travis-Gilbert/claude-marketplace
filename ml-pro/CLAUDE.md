# ML-Pro Plugin

You have deep ML engineering knowledge encoded in reference files, agent
instructions, and implementation templates. Use them. Do NOT rely on
training data for library APIs, hyperparameter defaults, or architecture
details. Verify against references before writing code.

## When You Start an ML Task

1. Read the handoff document (if one exists from the ml-builder chat skill).
   It contains: problem definition, architecture spec, training config,
   evaluation plan, risks, and file manifest.

2. Determine the task type. Route to the appropriate agent:
   - Building a model architecture: `agents/model-architect.md`
   - Writing a training pipeline: `agents/training-engineer.md`
   - Debugging training or inference: `agents/ml-debugger.md`
   - Working with graph data or GNNs: `agents/graph-engineer.md`
   - Optimizing performance or deployment: `agents/systems-optimizer.md`

3. Before writing model code, read the relevant reference in `references/`
   to verify API signatures, default parameters, and known failure modes.

4. Use templates in `templates/` as starting points. They encode
   battle-tested patterns for common ML tasks. Never start from scratch
   when a template exists.

## Reference Library

References in `references/` provide verified API details, parameter
guidance, and integration patterns:

- **references/pytorch-patterns.md** - nn.Module patterns, training loop
  variants, gradient mechanics, mixed precision, torch.compile, DDP/FSDP.
  Read before any PyTorch code.

- **references/gnn-cookbook.md** - PyG message passing, GCN/GAT/R-GCN/
  GraphSAGE patterns, graph data handling, batching, NeighborLoader,
  over-smoothing mitigation. Read before any GNN code.

- **references/transformers-patterns.md** - Attention implementation,
  positional encoding, HuggingFace integration, LoRA/QLoRA with
  torchtune, tokenizer handling, KV-cache. Read before any transformer
  or LLM code.

- **references/training-craft.md** - Loss function selection matrix,
  optimizer configs, LR schedules, regularization, data loading, mixed
  precision, gradient accumulation, early stopping, experiment tracking.
  Read when writing or debugging any training loop.

- **references/evaluation-deploy.md** - Metric implementations, cross-
  validation, ensembling, model export (ONNX, TorchScript), quantization,
  serving patterns. Read before evaluation or deployment code.

- **references/advanced-systems.md** - RL (PPO/DQN via stable-baselines3),
  KG embeddings (PyKEEN), contrastive learning (InfoNCE), diffusion models,
  evolutionary optimization (Optuna/DEAP/CMA-ES), meta-learning (MAML),
  Bayesian methods, neuro-symbolic patterns. Read for any advanced paradigm.

## Agent Instructions

Agents in `agents/` provide deep task-specific guidance:

- **agents/model-architect.md** - Designs model architectures. Selects
  layers, dimensions, activations, normalization, skip connections.
  Produces complete nn.Module code with parameter counts and shape
  annotations.

- **agents/training-engineer.md** - Builds training pipelines. Data
  loading, loss functions, optimizers, schedulers, training loops,
  validation, checkpointing, experiment tracking. Produces complete
  train.py files.

- **agents/ml-debugger.md** - Diagnoses training failures. Follows a
  systematic protocol: overfit-one-batch, loss curve analysis, gradient
  inspection, data pipeline verification, simplification. Produces
  targeted fixes with explanations.

- **agents/graph-engineer.md** - Specializes in graph ML. GNN
  architecture selection, PyG data handling, message passing customization,
  knowledge graph embeddings, link prediction, node classification.
  Handles the full PyG + NetworkX + PyKEEN stack.

- **agents/systems-optimizer.md** - Optimizes ML systems for production.
  Mixed precision, torch.compile, distributed training, quantization,
  profiling, memory optimization, inference serving. Produces deployment-
  ready configurations.

## Templates

Templates in `templates/` provide complete starting points:

- **templates/train-loop.py** - Standard PyTorch training loop with
  mixed precision, gradient clipping, LR scheduling, validation,
  checkpointing, and wandb logging.

- **templates/gnn-pipeline.py** - Complete GNN pipeline with PyG:
  data loading, model definition, training, evaluation for node
  classification and link prediction.

- **templates/fine-tune-lora.py** - LoRA fine-tuning template for
  HuggingFace models with torchtune.

- **templates/kge-pipeline.py** - Knowledge graph embedding training
  and evaluation with PyKEEN.

- **templates/rl-agent.py** - RL agent template with stable-baselines3,
  custom environment wrapper, and reward shaping.

## Commands

- `/ml-build` - Plan and build an ML system from a handoff doc or description
- `/ml-debug` - Run the 5-step diagnostic protocol for training failures
- `/ml-train` - Generate a complete training pipeline for a model
- `/ml-deploy` - Export, optimize, and deploy a trained model

## Rules

1. **Verify APIs against references.** Do not rely on training data for
   PyTorch, PyG, HuggingFace, or any ML library API. Read the reference
   file first. Grep source repos when references do not cover the
   specific API in question.

2. **Always include shape comments.** Every tensor operation in model
   code must have a comment showing the expected shape:
   ```python
   x = self.encoder(x)  # (B, T, D) -> (B, T, H)
   ```

3. **Every model must be testable on one batch.** Include an
   `if __name__ == "__main__"` block that creates dummy data and runs
   a forward pass. This catches shape mismatches immediately.

4. **Never hardcode hyperparameters in model code.** Use a config
   object or dataclass. Training parameters (lr, batch_size, epochs)
   go in config, not scattered through the code.

5. **Gradient clipping is not optional.** Every training loop must
   include `clip_grad_norm_` with a configurable max_norm (default 1.0).

6. **Mixed precision by default.** Use `torch.cuda.amp.autocast` and
   `GradScaler` unless there is a specific reason not to (e.g., CPU-only,
   numerical sensitivity in the loss function).

7. **Evaluation must compare to a baseline.** Every evaluation script
   must compute and report a baseline metric (most-frequent class, mean
   prediction, BM25, etc.) alongside the model metric.

8. **Checkpoints save the full state.** Save model state_dict, optimizer
   state_dict, scheduler state_dict, epoch, and best metric. Load all
   of them when resuming.

9. **Data pipelines must be verifiable.** Include a `--verify-data` flag
   or equivalent that prints shapes, dtypes, value ranges, and label
   distributions for one batch before training starts.

10. **Imports are explicit.** Do not use `from module import *`. Every
    imported name must be visible in the import block.

## Quality Gates

Before considering any ML code complete, verify:

**Architecture**
- [ ] Forward pass runs without error on dummy data
- [ ] Parameter count matches expectation
- [ ] All tensor shapes are annotated in comments
- [ ] Config/dataclass controls all hyperparameters

**Training**
- [ ] Overfit-one-batch test passes (loss reaches near-zero)
- [ ] Gradient clipping is present
- [ ] Mixed precision is enabled (or explicitly justified not to be)
- [ ] Checkpointing saves full training state
- [ ] Experiment tracking is configured (wandb or MLflow)

**Evaluation**
- [ ] Baseline metric is computed and reported
- [ ] Evaluation uses inference mode and no_grad
- [ ] Metrics match the task (not just accuracy for imbalanced data)

**Data**
- [ ] Data pipeline has a verification mode
- [ ] Train/val/test split is correct (no leakage)
- [ ] Normalization matches training expectations

## Cross-References

| Plugin | Relationship |
|---|---|
| **ml-builder** (chat skill) | Produces handoff documents that this plugin implements. Shared vocabulary: problem formulation, architecture spec, training config. |
| **D3-Pro** | For visualization of training metrics, embedding projections, attention patterns, or graph structures. Route viz tasks there. |
| **Three-Pro** | For 3D visualization of graph embeddings, high-dimensional projections, or spatial ML data. |

## Compound Learning Layer

This plugin learns from your work sessions. Three things happen automatically.

### At Session Start
1. Read `knowledge/manifest.json` for stats and last update time
2. Read `knowledge/claims.jsonl` for active claims relevant to this task
   (filter by domain and tags matching the agents you are loading)
3. When a claim's confidence > 0.8 and it conflicts with static
   instructions, follow the claim. It represents learned behavior.
4. When a claim's confidence < 0.5 and it conflicts with static
   instructions, follow the static instructions.

### During the Session (Passive Tracking)
- Note which claims you consult and why
- Note suggestion outcomes (accepted, modified, rejected)
- Note patterns not yet in the knowledge base
- Note any corrections the user makes that contradict existing claims

### When a Problem Is Solved (Auto-Capture)

When you detect that a non-trivial problem has been solved (trigger
phrases: "that worked", "it's fixed", "working now", "problem solved",
"that was the issue", or the user explicitly asks you to capture/document
a fix), perform a compact capture before continuing:

1. Assess: is this worth capturing? Skip trivial typo fixes, simple
   config changes, or problems with obvious one-line solutions. Capture
   when the root cause required investigation, the fix involved
   understanding something non-obvious, or the pattern is likely to
   recur.

2. If worth capturing, write a solution doc to `knowledge/solutions/`:
   - Filename: `[domain-slug]-[YYYY-MM-DD].md`
     If the file exists, append a counter: `[domain-slug]-[YYYY-MM-DD]-2.md`
   - Format: Problem, Root Cause, Solution, Prevention, Claims Extracted
   - Keep it concise. 10-30 lines total.

3. Extract 2-5 typed Claims from the solution. Each claim should be:
   - A single imperative statement (starts with a verb or "always/never")
   - Scoped to one actionable practice
   - Tagged with the relevant domain from the agent domain map

4. For each candidate claim, compute the claim_id (sha256 of
   "[plugin]:[lowercased text]", first 12 hex chars). Skip if that ID
   already exists in claims.jsonl.

5. Append new claims to `knowledge/claims.jsonl` as JSON lines:
   ```json
   {"id":"[hash]","text":"[claim]","domain":"[domain]","agent_source":"[agent]","type":"empirical","confidence":0.667,"source":"auto-capture","first_seen":"[date]","last_validated":"[date]","status":"active","evidence":{"accepted":0,"rejected":0,"modified":0},"projects_seen":["[project]"],"tags":["[tag1]","[tag2]"],"related_claims":[]}
   ```

6. Print a brief confirmation:
   ```
   [compound] Captured: [brief problem summary]
     Solution: knowledge/solutions/[filename].md
     Claims: +N new, M skipped (duplicate)
   ```

7. Log an `auto_capture` event in your mental session log:
   ```json
   {"event":"auto_capture","claims_added":["[hash1]","[hash2]"],"solution_file":"knowledge/solutions/[filename].md","domain":"[domain]","project":"[project]"}
   ```

8. Continue with whatever the user asked for next. Do not pause for
   review. The /learn command handles review.

### At Session End
Run `/learn` to save the session log, update confidence scores, and
review any items that need attention. This is optional but recommended
after substantial sessions.
