---
description: The default Production-Theorem command. One pass that turns intent into grounded work: plan, compile context, delegate, expose action rail, validate, record learning. Modes: plan, execute, theorize.
argument-hint: <intent-or-task-or-mode=plan|execute|theorize>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent
---

Run the production-theorem orchestrate harness on the user's intent or task.

1. Parse the user's argument. Recognize `mode=plan`, `mode=execute`, or `mode=theorize` as optional prefixes. Everything else is the task description.
2. Confirm the parsed (mode, task) pair back to the user in one line before doing any work.
3. Invoke the `production-theorem:orchestrate` skill via the Skill tool, passing the full argument string. The skill body (`skills/orchestrate/SKILL.md`) is the authoritative spec for how to run planning, context compilation, delegation, the action rail, validation, and the final report.
4. The orchestrate skill delegates internally to planning-theorem, theorize, execute, Redis harness agents, and specialist agents as needed. Stream phase boundaries to the user as they happen.
5. At the end, surface the path to the produced report so the user can review it.

If the user supplied no argument, ask them what they want to orchestrate before proceeding.
