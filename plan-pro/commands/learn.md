---
description: "End-of-session compound learning. Saves the session log, updates claim confidence, surfaces the review queue. Same pipeline as other compound-learning plugins."
allowed-tools: Read, Write, Edit, Bash
model: haiku
---

# /learn

Apply lib/compound-learning/SKILL.md.

## Phase 1: Save the Session

Write a session summary to `knowledge/session_log/`. Filename: current timestamp `YYYYMMDDTHHmmSS.jsonl`. One JSON line per event:

```jsonl
{"event":"session_start","timestamp":"...","project":"..."}
{"event":"agent_invoked","agent":"plan-writer","trigger":"writing dark-mode plan"}
{"event":"claim_consulted","claim_id":"...","relevance_score":0.85}
{"event":"suggestion","suggestion_id":"...","file":"...","claim_refs":["..."]}
{"event":"suggestion_outcome","suggestion_id":"...","outcome":"accepted"}
{"event":"candidate_claim","description":"..."}
{"event":"auto_capture","claims_added":["..."],"solution_file":"...","domain":"...","project":"..."}
{"event":"session_end","timestamp":"...","duration_minutes":25,"files_changed":["..."]}
```

Reconstruct from memory of the session: agents loaded, claims consulted, suggestions made + outcomes, files changed, patterns observed.

## Phase 2: Learn

Run the shared pipeline:

```bash
python -m scripts.epistemic.learn --plugin plan-pro
```

Read JSON output from stdout. That's the review queue.

## Phase 3: Review

Present queue items. Handle each type:

### Confidence changes
Report. No action needed.

```
Knowledge updates:
  claim-<id> strengthened: 0.71 → 0.79 (suggestion accepted)
  claim-<id> weakened:     0.65 → 0.52 (suggestion rejected)
```

### New tensions
Show tension. Ask one multiple-choice question. Apply the edit the user picks.

### Candidate claims
Show. Ask yes/no/edit. Append accepted claims to `knowledge/claims.jsonl`.

### Auto-captured claims
Claims with `"source":"auto-capture"` and `first_seen` matching today. Present each with options: keep / edit / retire.

### Attention needed
Claims whose confidence fell below 0.5. Options: keep / retire / edit.

## Phase 4: Report

One line at the end:

```
[plan-pro]: N active claims, avg confidence X.XX, M items reviewed
```

If no review items:

```
[plan-pro]: N active claims, avg confidence X.XX, session saved
```
