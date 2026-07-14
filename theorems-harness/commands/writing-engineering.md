---
description: Toggle the Writing Engineering prose mode (plain/spare/wire), the harness analog of /caveman. Persistent until "normal mode".
argument-hint: [on|off|plain|spare|wire|status]
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:writing-engineering` skill as a persistent output
mode, the harness analog of `/caveman`.

Parse `$ARGUMENTS`:

- empty / `on` / `plain` -> activate the `plain` register.
- `spare` -> activate the `spare` register (tighter; briefs and postmortems).
- `wire` -> activate the `wire` register (agent-to-agent: intents, reflections,
  records, handoff summaries, mentions).
- `off` / `normal` -> deactivate (normal mode).
- `status` -> report the current register and whether the mode is active.

Then:

1. Read `skills/writing-engineering/SKILL.md` for the chosen register's targets
   and the fidelity and auto-clarity rules.
2. If activating: adopt that register for THIS response and EVERY following
   response until the user says "normal mode" / "stop writing engineering". Do
   not drift. Apply the Core Directive: plain, active voice, every word earns its
   place; keep identifiers, file paths, numbers, error strings, and code exact;
   no em dashes; spend full grammar on security warnings, irreversible actions,
   and ordered sequences.
3. If deactivating: return to normal prose.
4. Confirm the new state in one line, written in the register you just set.

This is the explicit on-ramp for the same mode the
`sessionstart-writing-engineering` hook arms by default each session. The
`prose-check` receipt loop runs at `advisory` and includes the pinned 1918
Elements ruleset inside the same Writing Engineering receipt.
