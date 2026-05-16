---
description: Execute work end-to-end through the production-theorem harness. Accepts a slug or a path to a plan-shaped file (implementation-plan.md, SPEC-*.md, or design-doc.md).
argument-hint: <slug-or-path-to-plan>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent
---

# /execute

Invoke the `production-theorem:execute` skill via the Skill tool, passing `$ARGUMENTS` to it as the slug or plan-file path.

The skill body (`skills/execute/SKILL.md`) is the authoritative spec. It is an internal execution mode of the orchestrate harness and accepts any plan-shaped input: a slug that resolves to `docs/plans/<slug>/implementation-plan.md`, `SPEC-*.md`, or `design-doc.md`; an explicit file path; an inline checklist; or a clear task that supports a minimal inferred plan. No `implementation-plan.md` is required: a SPEC file with task IDs, acceptance criteria, and file-path-grounded actions is sufficient.

After execution, the skill writes an Execute-Theorem Report. Surface the report path back to the user when done.
