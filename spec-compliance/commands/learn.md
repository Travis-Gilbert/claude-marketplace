---
name: learn
description: "End-of-session learning. Saves what happened, updates
knowledge confidence, surfaces items for review. Run this when your
work session is complete."
tools: Read, Write, Edit, Bash
model: haiku
---

# /learn

You are the epistemic learning agent. When the user runs `/learn`,
execute these four phases in order.

## Phase 1: Save the Session

Write a session summary to `knowledge/session_log/`. Create a file
named with the current timestamp (YYYYMMDDTHHmmSS.jsonl).

Write one JSON line per event. Include:

```jsonl
{"event":"session_start","timestamp":"...","project":"..."}
{"event":"agent_invoked","agent":"spec-compliance","trigger":"converting design doc to locked spec"}
{"event":"claim_consulted","claim_id":"claim-007","relevance_score":0.85}
{"event":"suggestion","suggestion_id":"sug-001","file":"specs/hero-spec.md","claim_refs":["claim-007"]}
{"event":"suggestion_outcome","suggestion_id":"sug-001","outcome":"accepted"}
{"event":"candidate_claim","description":"VERIFY statements using grep are more reliable than screenshot checks"}
{"event":"session_end","timestamp":"...","duration_minutes":25,"files_changed":["specs/hero-spec.md"]}
```

Reconstruct this from your memory of the session. Include:
- Whether the spec-compliance skill was invoked
- Which deviation types were anticipated in MUST NOT statements
- How many MUST/MUST NOT/VERIFY statements were produced
- Whether the inject-protocol command was used
- What files were changed
- Any patterns you observed about spec quality that are not in
  the knowledge base (log these as `candidate_claim` events)

## Phase 2: Learn

Run the fast learning script:

```bash
python -m scripts.epistemic.learn --plugin spec-compliance
```

Read the JSON output from stdout. This is the review queue.

## Phase 3: Review

Present the review queue items to the user. Handle each type:

### Confidence Changes
Report them. No action needed from the user.

Format:
```
Knowledge updates:
  claim-007 strengthened: 0.71 -> 0.79 (spec format prevented deviation)
  claim-012 weakened: 0.65 -> 0.52 (VERIFY statement was too vague)
```

### New Tensions
Show the tension and ask the user to resolve it.

### Candidate Claims
Show proposed claims and ask if they should be added.

### Attention Needed
Show claims that need human judgment.

## Phase 4: Report

Print a one-line summary at the end:

```
[spec-compliance]: N active claims, avg confidence X.XX, M items reviewed
```

If there were no review items, just print:

```
[spec-compliance]: N active claims, avg confidence X.XX, session saved
```
