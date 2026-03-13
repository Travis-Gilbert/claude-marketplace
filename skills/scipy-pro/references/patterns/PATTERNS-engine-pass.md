# PATTERNS-engine-pass

## Goal
Add a new pass safely to `engine.py` (stateful) or `compose_engine.py` (stateless).

## Stateful Engine Pattern (`engine.py`)
1. Read entire engine file and pass ordering first.
2. Add feature gate + config thresholds.
3. Create edges using `from_object` / `to_object` only.
4. Store plain-English `reason` and rounded strength.
5. Record pass output counts and degraded conditions.

## Stateless Compose Pattern (`compose_engine.py`)
1. Add pass block in configured order.
2. Merge candidates into `results_map` without DB writes.
3. Track match IDs and pass-state payload.
4. Mark degraded status when feature unavailable.

## Verify
- Run pass with feature enabled and disabled.
- Confirm no DB writes in compose path.
- Confirm edge creation semantics in persisted path.
