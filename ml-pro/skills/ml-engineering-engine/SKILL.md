---
name: ml-engineering-engine
description: >-
  Use when tasks involve ML engineering: designing model architectures,
  writing training pipelines, debugging training failures, deploying
  trained models, graph neural networks (PyG, R-GCN, GraphSAGE),
  transformer fine-tuning (LoRA, QLoRA), knowledge graph embeddings
  (PyKEEN RotatE), reinforcement learning, mixed precision, distributed
  training (DDP/FSDP), ONNX export, quantization, or model serving.
  Loads command routing, reference verification rules, and template-first
  execution patterns for the full ML engineering stack.
---

# ML Engineering Engine

## Prime Directives

Verify library APIs against `references/` before writing code. Do NOT
rely on training data for PyTorch, PyG, HuggingFace, PyKEEN, or
stable-baselines3 APIs. Start from a template in `templates/` when one
matches the task. Treat handoff docs as intent; reconcile with current
implementation before editing.

## Route by Workflow

1. `/ml-build` — problem spec -> architecture plan + training plan +
   file manifest. Load agents: model-architect, training-engineer,
   graph-engineer (if graph task), systems-optimizer (if constrained
   deployment target).

2. `/ml-train` — model + data -> complete training pipeline with loss,
   optimizer, scheduler, checkpointing, and experiment tracking.
   Load agents: training-engineer, graph-engineer (if GNN),
   systems-optimizer (if large-scale).

3. `/ml-debug` — training failure -> systematic 5-step diagnostic:
   overfit-one-batch, loss curve analysis, gradient inspection, data
   pipeline verification, simplification. Load agent: ml-debugger.

4. `/ml-deploy` — trained model -> export (ONNX, TorchScript),
   quantization, and serving layer. Load agent: systems-optimizer.

5. `/learn` — session log capture and reusable-practice extraction for
   future ML runs.

## Agent Routing Rules

- Building a new `nn.Module` -> `agents/model-architect.md`
- Writing or modifying a training loop -> `agents/training-engineer.md`
- Loss stuck, NaN, not learning, overfitting -> `agents/ml-debugger.md`
- Any GNN, graph data, KGE, or link prediction -> `agents/graph-engineer.md`
- Memory, speed, distributed, inference, deployment -> `agents/systems-optimizer.md`

## Reference Verification (Read Before Writing Code)

- `references/pytorch-patterns.md` — nn.Module patterns, training loop
  variants, gradient mechanics, mixed precision, torch.compile, DDP/FSDP.
- `references/gnn-cookbook.md` — PyG message passing, GCN/GAT/R-GCN/
  GraphSAGE, NeighborLoader, over-smoothing mitigation.
- `references/transformers-patterns.md` — Attention, positional encoding,
  HuggingFace, LoRA/QLoRA with torchtune, KV-cache.
- `references/training-craft.md` — Loss matrix, optimizer configs, LR
  schedules, regularization, mixed precision, gradient accumulation.
- `references/evaluation-deploy.md` — Metrics, cross-validation,
  ensembling, ONNX, TorchScript, quantization, serving.
- `references/advanced-systems.md` — RL (PPO/DQN), KG embeddings
  (PyKEEN), contrastive (InfoNCE), diffusion, Optuna/DEAP/CMA-ES, MAML,
  Bayesian methods, neuro-symbolic.

## Template-First Rule

Never start from scratch when a template exists:

- `templates/train-loop.py` — standard supervised training with AMP,
  grad clipping, LR scheduling, validation, checkpointing, wandb.
- `templates/gnn-pipeline.py` — PyG graph task pipeline.
- `templates/fine-tune-lora.py` — HuggingFace LoRA fine-tuning.
- `templates/kge-pipeline.py` — PyKEEN KGE training and evaluation.
- `templates/rl-agent.py` — stable-baselines3 RL agent with custom env.

## Invariants (Always Enforce)

1. Set all seeds (`torch`, `numpy`, `random`, CUDA) for reproducibility.
2. Verify data pipeline with `--verify-data` before full training.
3. Checkpoint full state: model + optimizer + scheduler + epoch + metric.
4. Validate baselines before reporting improvements.
5. Track experiments with wandb or equivalent; never rely on stdout alone.
6. Use mixed precision (bf16 preferred) when GPU supports it.
7. Gradient clip when training transformers or RNNs.
8. Overfit a single batch before scaling to full dataset when debugging.
9. Never silently cast dtypes in aggregation paths (shared primitives).
10. Deploy-time exports must match training-time preprocessing exactly.

## Debugging Protocol (Applied to All Failures)

1. **Overfit one batch.** Can the model fit 1-8 examples? If not, model
   or loss is wrong.
2. **Inspect the loss curve.** Flat -> LR too low or gradient vanishing.
   Exploding -> LR too high or gradient explosion. NaN -> mixed precision
   or numerical instability.
3. **Check gradients.** Zero grad in some layers -> frozen params or
   disconnected graph. Huge grad -> explosion, clip or lower LR.
4. **Verify data.** Label distribution, tokenization, normalization,
   batch shape. Wrong data -> wrong training.
5. **Simplify.** Smallest model, smallest batch, no augmentation, no
   regularization. Add complexity back one step at a time.

## Reference Pointers

- Templates: `templates/*.py` for runnable starting points.
- References: `references/*.md` for verified library APIs.
- Agents: `agents/*.md` for domain-specific expertise (5 agents).
- Commands: `commands/*.md` for workflow entry points.
- Knowledge memory: `knowledge/` for session logs and reusable claims.

## Delivery Checklist

1. Reconcile handoff doc (if provided) vs current code state explicitly.
2. Implement smallest safe slice that preserves invariants.
3. Add tests or verification runs for new behavior.
4. Run the overfit-one-batch check before claiming training works.
5. Validate on held-out data with baseline comparison.
6. Report: initial condition, design choices, training results, next
   steps.
