---
description: The default Theorem's Harness command. Treats the user's intent as permission to use the best harness capability mix for the session: observe, route, plan, coordinate, execute, validate, peer-review, encode, and report as the work demands.
argument-hint: <intent-or-task> [mode=plan|execute|theorize|research|coordinate]
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Agent, Skill
---

Run Theorem's Harness on the user's current intent.

1. Treat the invocation as opt-in to Harness behavior, not as a forced narrow
   mode. If the user supplied `mode=...`, honor it as a starting preference and
   add supporting capabilities when needed.
2. Resolve the active task from the argument and the latest user turn. If there
   is no recoverable task, ask one short question.
3. Read the injected "Theorems Harness Product Packet" (hooks emit it per
   event) as the live capability inventory: active capabilities are usable now,
   degraded ones are not — report degradations instead of silently falling back.
   For tools beyond the curated core, run the discovery loop on the connected
   MCP: `tool_search` (ranked candidates) -> `describe` (materialize one
   schema) -> `invoke`. Then apply `skills/theorems-harness/SKILL.md` as the
   behavior contract.
4. Invoke the `theorems-harness:theorems-harness` skill with the full argument
   and the resolved task. The skill body is the authoritative behavior contract.
5. Stream only useful phase boundaries: coordination announcement, plan/checklist
   locked, first edit, validation result, peer-review handoff, memory write, or
   final report.
6. At the end, report the actual outcome and validation. Surface artifact paths
   only when a report, plan, peer-review packet, or memory record was produced.

The command should make the agent more capable for the rest of the task, not
more ceremonial. Prefer action with route checkpoints over asking the user to
pick internal modes.
