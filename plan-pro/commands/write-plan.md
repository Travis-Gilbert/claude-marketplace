---
description: "Write phase. Produces implementation-plan.md from an approved design-doc.md. Runs plan-writer then plan-reviewer."
argument-hint: "<slug>"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, Agent
---

# /write-plan

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is the slug. `docs/plans/<slug>/design-doc.md` must exist.

## Sequence

1. Read `design-doc.md` and any ADRs in `decisions/`.
2. Invoke `plan-writer`. It loads `lib/writing-plans/SKILL.md` (seeded from superpowers) and produces `implementation-plan.md`.
3. Invoke `plan-reviewer`. It runs the full checklist and fixes issues inline.

## Output

One line for small plans:

```
Plan: docs/plans/<slug>/implementation-plan.md (N tasks)
Review deltas: <placeholders=K, paths=K, splits=K>
```

For large plans (plan-writer auto-splits per `patterns/multi-file-plans.md`):

```
Index: docs/plans/<slug>/implementation-plan.md
Stages: <M> sub-plans, <N> total tasks
  01-stage-<slug>.md (K tasks) → <plugin>
  02-stage-<slug>.md (K tasks) → <plugin>
  ...
Review deltas: <placeholders=K, paths=K, splits=K, cross-refs=K>
```

If design-doc.md is missing, emit one line and stop:

```
Blocker: docs/plans/<slug>/design-doc.md not found. Run /brainstorm <slug> first.
```

## Tips

- The plan-writer is a thin wrapper over superpowers' `writing-plans` skill. Changes to superpowers propagate to new sessions after re-running install.sh (which overwrites nothing — manual merge).
- Never present the plan to the user for approval here. `/plan` and `/execute` handle approval gates.
