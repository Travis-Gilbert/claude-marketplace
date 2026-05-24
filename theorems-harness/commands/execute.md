---
description: Execute work end-to-end through Theorem's Harness. Accepts a slug, a path to a plan-shaped file, or a plain task description.
argument-hint: <slug-or-path-or-task>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent
---

Execute Theorem's Harness on the user's task.

1. Treat the user's argument as one of: a slug (looks for `docs/plans/<slug>/implementation-plan.md`, `docs/plans/<slug>/SPEC-*.md`, or `docs/plans/<slug>/design-doc.md`), a file path (use directly if it exists), or a plain task description (act on it without resolving a plan file).
2. Confirm the resolved input back to the user in one line before doing any work.
3. Invoke the `theorems-harness:execute` skill via the Skill tool, passing the resolved input as the argument. The skill body (`skills/execute/SKILL.md`) is the authoritative spec for how to run the execution loop, write commits, run the per-stage review, and produce the Execute-Theorem Report.
4. Stream per-task progress as the skill executes.
5. At the end, surface the path to the Execute-Theorem Report so the user can review it.

If the user supplied no argument, ask them which plan, SPEC file, or task they want executed before proceeding.
