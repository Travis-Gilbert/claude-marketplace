---
name: compound-learning
description: "Auto-capture logic and /learn pipeline. Accumulates meta-claims about planning itself. Shared pipeline with django-engine-pro, ml-pro, next-pro, app-forge, app-pro, theseus-pro."
---

# Compound Learning

plan-pro participates in the shared compound-learning system. Claims it accumulates are meta-claims about planning itself: decomposition patterns that work, signals that predict drift, feature shapes that need contract-first, etc.

## Architecture

Three moving parts:

1. **Auto-capture** during a session, fired by solve signals. Writes `knowledge/solutions/*.md` + appends claims to `knowledge/claims.jsonl`.
2. **Session log** recorded throughout the session. Events: `agent_invoked`, `claim_consulted`, `suggestion`, `suggestion_outcome`, `candidate_claim`, `auto_capture`, `session_end`.
3. **/learn command** at end of session. Runs `scripts/epistemic/learn.py --plugin plan-pro` (shared pipeline). Updates confidence scores, surfaces tensions, presents review queue.

## Shared pipeline

The actual epistemic code lives in a shared location outside plan-pro — shared across django-engine-pro, ml-pro, next-pro, app-forge, app-pro, theseus-pro. See `scripts/epistemic/README.md` for the shared path.

plan-pro's `scripts/epistemic/__init__.py` is empty; `scripts/epistemic/learn.py`, `capture.py`, etc. are imported from the shared location.

## Auto-capture triggers (from CLAUDE.md)

Trigger phrases:
- "that worked"
- "it's fixed"
- "working now"
- "problem solved"
- "that was the issue"
- "nice, that did it"
- explicit: "capture this", "document this fix"

On trigger → invoke `capture-agent` inline. Budget: 30 seconds, 500 tokens.

## Capture sequence

See `agents/capture-agent.md`. In short:
1. Assess (skip trivial fixes)
2. Write solution doc to `knowledge/solutions/<domain>-<date>.md`
3. Extract 2-5 typed claims
4. Dedupe via claim_id (sha256 of `plan-pro:<lowercased text>`, first 12 hex chars)
5. Append new claims to `knowledge/claims.jsonl`
6. One-line confirmation

## Claim format

```json
{
  "id": "a1b2c3d4e5f6",
  "text": "Contract-first design is the right call for any pipeline with 3+ stages",
  "domain": "planning.contracts",
  "agent_source": "contract-first-architect",
  "type": "empirical",
  "confidence": 0.667,
  "source": "auto-capture",
  "first_seen": "2026-04-23",
  "last_validated": "2026-04-23",
  "status": "active",
  "evidence": {"accepted": 0, "rejected": 0, "modified": 0},
  "projects_seen": ["plan-pro"],
  "tags": ["contracts", "pipelines"],
  "related_claims": []
}
```

## /learn command behavior

See `commands/learn.md`. Four phases:

1. **Save session log** to `knowledge/session_log/YYYYMMDDTHHmmSS.jsonl`
2. **Learn** — run shared pipeline via `python -m scripts.epistemic.learn --plugin plan-pro`
3. **Review** — present queue (confidence changes, new tensions, candidate claims, auto-captured claims, attention items)
4. **Report** — one-line summary

## Session-start reading

At the start of a plan-pro session:
1. Read `knowledge/manifest.json` for stats + last update
2. Read `knowledge/claims.jsonl` for active claims relevant to the task (filter by domain + tags matching agents being loaded)
3. Claims with `confidence > 0.8` override static instructions when they conflict
4. Claims with `confidence < 0.5` do not override static instructions

## What claims are worth capturing

Capture:
- Non-obvious patterns that recur
- Root causes that required investigation
- Decomposition strategies that avoided pain
- Signals that predicted problems

Skip:
- Typo fixes
- Obvious one-liners
- Config tweaks with no insight
- "Fix" by re-reading the docs

## Budget discipline

Auto-capture is background infrastructure, not the user's experience. 30 seconds, 500 tokens, then resume. Missing a capture is better than stalling the session.
