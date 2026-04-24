# scripts/epistemic — plan-pro

This directory is intentionally almost empty. plan-pro's compound-learning layer is powered by the **shared epistemic pipeline** maintained in the `codex-plugins` repo root, not by code inside plan-pro.

## Shared pipeline location

```
codex-plugins/scripts/epistemic/
├── capture.py            # auto-capture: dedupe + append claims
├── config.py             # plugin registry, paths, thresholds
├── confidence_updater.py # Bayesian confidence updates from session outcomes
├── cross_linker.py       # cross-plugin claim cross-references
├── embedding_manager.py  # SBERT embeddings for claims
├── evaluate.py           # claim evaluation against evidence
├── evidence_collector.py # collect session_log events as evidence
├── learn.py              # fast /learn pipeline entry
├── pattern_extractor.py  # pattern mining from session logs
├── question_generator.py # generate clarifying questions for review queue
├── relevance_scorer.py   # score claims for relevance at session start
├── run_pipeline.py       # full pipeline (heavy ML, not called from /learn)
├── schema.py             # claim / session-log schemas
├── seed_knowledge.py     # seed claims from plugin files
├── session_logger.py     # session-log writer
└── tension_detector.py   # tension detection between claims
```

plan-pro is registered in the `PLUGINS` dict in `config.py` as `"plan-pro": "plan-pro"`.

## How plan-pro invokes the pipeline

From `commands/learn.md`:

```bash
python -m scripts.epistemic.learn --plugin plan-pro
```

This runs from the `codex-plugins/` repo root. The shared pipeline reads from and writes to `codex-plugins/plan-pro/knowledge/`:

- `claims.jsonl` — active claims
- `session_log/*.jsonl` — per-session logs
- `solutions/*.md` — auto-captured solution docs
- `.review_queue.json` — output of `learn.py` for the /learn command to present
- `manifest.json` — stats + last update time

## Auto-capture

The `capture-agent` agent invokes `scripts.epistemic.capture` directly at solve-signal time. See `lib/compound-learning/SKILL.md`.

## What lives in plan-pro/scripts/epistemic/

- `__init__.py` — empty. Keeps the dir a Python package so `python -m scripts.epistemic.<x>` works when run from repo root with this plugin's knowledge dir.
- `README.md` — this file.

No actual pipeline code lives here. Don't add any. If the shared pipeline needs a plan-pro-specific extension, add it to the shared pipeline under a plugin-conditional branch — keep plugins interchangeable.
