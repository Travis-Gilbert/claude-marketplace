---
description: The default Theorem's Harness command. One pass that turns intent into grounded work: plan, compile context, coordinate, delegate, expose action rail, validate, encode learning, and report.
argument-hint: <intent-or-task-or-mode=plan|execute|theorize>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent, Skill
---

Run Theorem's Harness on the user's intent or task.

1. Parse the user's argument. Recognize `mode=plan`, `mode=execute`, or `mode=theorize` as optional prefixes. Everything else is the task description.
2. Confirm the parsed (mode, task) pair back to the user in one line before doing any work.
3. Invoke the `theorems-harness:theorems-harness` skill via the Skill tool, passing the full argument string. The skill body (`skills/theorems-harness/SKILL.md`) is the authoritative spec for planning, context compilation, coordination, delegation, action rail, validation, memory, and reporting.
4. The harness skill delegates internally to planning-theorem, theorize, execute, Redis harness agents, coordination, memory, and specialist agents as needed. Stream phase boundaries to the user as they happen.
5. At the end, surface the path to the produced report so the user can review it.

If the user supplied no argument, ask them what they want the Harness to do before proceeding.
