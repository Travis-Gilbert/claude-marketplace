---
description: Compatibility command for the Harness execution capability. Prefer /harness for new work; use this when the user explicitly wants implementation now. Accepts a slug, a path to a plan-shaped file, or a plain task description.
argument-hint: <slug-or-path-or-task>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent
---

Execute Theorem's Harness on the user's task without locking the whole session
inside a narrow tunnel.

1. Treat the user's argument as one of: a slug (looks for `docs/plans/<slug>/implementation-plan.md`, `docs/plans/<slug>/SPEC-*.md`, or `docs/plans/<slug>/design-doc.md`), a file path (use directly if it exists), or a plain task description (act on it without resolving a plan file).
2. Invoke the `theorems-harness:execute` skill via the Skill tool, passing the resolved input as the argument. The skill body (`skills/execute/SKILL.md`) is the authoritative spec for the implementation loop, validation, rerouting, and reporting.
3. Stream only material progress: first edit, validation, reroute, peer-review request, or final reconciliation.
4. At the end, report the outcome and validation. Surface a report path only when a durable report was actually produced.

If the user supplied no argument, ask them which plan, SPEC file, or task they want executed before proceeding.
