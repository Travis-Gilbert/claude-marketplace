---
description: Capture a non-blocking idea or improvement that arose during this task as a structured memory atom. Auto-fires at end-of-task; manual via slash.
argument-hint: [idea text | --auto | --list]
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:surface-idea skill against the user's request.

1. Parse the user's argument:
   - If text: treat as the idea body and encode immediately.
   - If `--auto`: run the end-of-task scan over the current session's
     output and surface candidates.
   - If `--list`: list all idea atoms surfaced this session.
   - If empty: trigger `--auto`.

2. Invoke the `theorems-harness:surface-idea` skill with the argument.

3. For each high-confidence idea, encode via the harness `encode` tool
   with `kind=encode, outcome=positive, signal=pinned,
   tags=[idea, surfaced, source-task:<id>]`.

4. For each low-confidence candidate, surface to the user as a
   suggestion: "Surfaced N candidates. Want me to encode any?"

5. Return: the list of encoded ideas (doc_ids + titles) and any
   unconfirmed candidates.

Use `/surface-idea` mid-task when an idea fires and you don't want to
break flow. Use `/surface-idea --auto` at the end of a run before
final reporting. Use `/surface-idea --list` to audit what was
captured this session.

Pairs with `/peer-review` (which catches bugs) and `/encode` (which
captures durable feedback/solutions/postmortems). This skill is for
ambient ideas that are NOT in scope and would otherwise drop into
chat and be lost.
