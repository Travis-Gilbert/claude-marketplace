---
description: Switch Ponytail lazy senior-dev intensity (lite/full/ultra/off).
argument-hint: [lite|full|ultra|off]
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:ponytail` skill.

Parse `$ARGUMENTS`:

- empty / `full` -> activate full Ponytail mode.
- `lite` -> activate lite mode.
- `ultra` -> activate ultra mode.
- `off` / `normal` -> deactivate Ponytail mode.

Then:

1. Read `skills/ponytail/SKILL.md`.
2. Apply the selected intensity to THIS response and every following response
   until the user says "stop ponytail", "normal mode", or `/ponytail off`.
3. Keep the safety boundary intact: do not simplify away validation, data-loss
   handling, security, accessibility, hardware calibration, or anything the
   user explicitly requested.
4. Confirm the new state in one short line.

The SessionStart hook activates the configured default mode (`full` unless
`PONYTAIL_DEFAULT_MODE` or `~/.config/ponytail/config.json` says otherwise).
