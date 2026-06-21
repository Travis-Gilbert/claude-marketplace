---
description: Toggle the Design Engineering skill-pack mode for CSS, tokens, APG, motion, accessibility, and design-system work.
argument-hint: [on|off|status]
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:design-engineering` skill as a persistent mode for the
active design task.

Parse `$ARGUMENTS`:

- empty / `on` -> activate design-engineering mode.
- `off` / `normal` -> deactivate for this task.
- `status` -> report whether the mode is active.

Then:

1. Read `skills/design-engineering/SKILL.md`.
2. If activating: apply its Core Posture, Standard Workflow, Domain Map, and
   Validation Defaults to THIS response and every later design-facing turn in
   this task. Check computable axes with `design-check` where available.
3. If deactivating: return to normal design prose and validation choices.
4. Confirm the new state in one line.

The Stop hook records `design-check` receipts for changed CSS, design-token, and
APG artifacts. Registry status controls whether failures are telemetry,
advisory, or revision-gated.
