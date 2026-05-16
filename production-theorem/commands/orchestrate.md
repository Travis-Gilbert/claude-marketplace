---
description: The default Production-Theorem command. One pass that turns intent into grounded work: plan, compile context, delegate, expose action rail, validate, record learning. Modes: plan, execute, theorize.
argument-hint: <intent-or-task-or-mode=plan|execute|theorize>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent
---

# /orchestrate

Invoke the `production-theorem:orchestrate` skill via the Skill tool, passing `$ARGUMENTS` to it.

The skill body (`skills/orchestrate/SKILL.md`) is the authoritative spec. Orchestrate is the user-facing harness command and delegates internally to planning, theorizing, execution, Redis harness agents, context, action rail, validation, and specialist agents.

Mode aliases recognized inside the skill:
- `/orchestrate mode=plan` (replaces `/plan`)
- `/orchestrate mode=execute` (replaces `/execute`)
- `/orchestrate mode=theorize`
- Default (no mode): full observation through report run.

After the run, surface the produced report path back to the user.
