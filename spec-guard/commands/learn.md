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
{"event":"agent_invoked","agent":"spec-guard","trigger":"activated spec enforcement for implementation session"}
{"event":"claim_consulted","claim_id":"claim-007","relevance_score":0.85}
{"event":"suggestion","suggestion_id":"sug-001","file":"src/components/Hero.tsx","claim_refs":["claim-007"]}
{"event":"suggestion_outcome","suggestion_id":"sug-001","outcome":"accepted"}
{"event":"candidate_claim","description":"Prompt-based hooks detect layout reinterpretation more reliably than command hooks"}
{"event":"session_end","timestamp":"...","duration_minutes":25,"files_changed":["src/components/Hero.tsx"]}
```

Reconstruct this from your memory of the session. Include:
- Whether spec-guard or spec-grind was activated
- Which deviation types were detected (if any)
- Whether protected path warnings fired
- What files were changed
- Whether the grind loop completed or was cancelled
- Any patterns you observed about spec compliance that are not in
  the knowledge base (log these as `candidate_claim` events)

## Phase 2: Learn

Run the fast learning script:

```bash
python -m scripts.epistemic.learn --plugin spec-guard
```

Read the JSON output from stdout. This is the review queue.

## Phase 3: Review

Present the review queue items to the user. Handle each type:

### Confidence Changes
Report them. No action needed from the user.

Format:
```
Knowledge updates:
  claim-007 strengthened: 0.71 -> 0.79 (deviation correctly caught)
  claim-012 weakened: 0.65 -> 0.52 (false positive on protected path)
```

### New Tensions
Show the tension and ask the user to resolve it.

Format:
```
Tension detected:
  "claim-003 says prompt hooks catch all five deviation types, but this
   session showed a layout reinterpretation that the prompt hook missed"
  Related claims: claim-003, claim-018

  Options:
  1. Update claim-003
  2. Keep both (context-dependent)
  3. Dismiss (one-off exception)
```

Wait for the user's response. If they choose to update a claim,
edit the claim in `knowledge/claims.jsonl`.

### Candidate Claims
Show proposed claims and ask if they should be added.

Format:
```
Observed pattern:
  "Prompt-based hooks detect layout reinterpretation more reliably than command hooks"
  Add to knowledge? [yes / no / edit first]
```

If yes, append to `knowledge/claims.jsonl` as a new claim with
status "active" and default confidence (0.67).

### Attention Needed
Show claims that need human judgment.

Format:
```
Needs attention:
  claim-012 (confidence 0.38): "Command-based hooks provide fast deterministic path checks"
  This claim has been rejected more often than accepted.
  Options: [keep / retire / edit]
```

If retire, set the claim's status to "retired" in claims.jsonl.

## Phase 4: Report

Print a one-line summary at the end:

```
[spec-guard]: N active claims, avg confidence X.XX, M items reviewed
```

If there were no review items, just print:

```
[spec-guard]: N active claims, avg confidence X.XX, session saved
```
