---
description: Replay the latest eligible Harness run or an explicit run and report its integrity receipt and event timeline.
argument-hint: [run-id-or-session-id]
allowed-tools: Read, Grep, Glob, Bash, Skill
---

Run the `theorems-harness:replay-last-run` skill against the user's request.

Treat a supplied `run:*` value as `run_id`. Treat a supplied session value as
`session_id`. With no argument, let the registered capability select the latest
run from the ambient identity binding or actor.

Lead with applied versus refused, the selected run, integrity result, and replay
receipt hash. Then answer the user's audit question from the ordered timeline.
Never substitute the Plan replay ledger for the run replay ledger.
