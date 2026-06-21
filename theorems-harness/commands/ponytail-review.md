---
description: Review the current diff for over-engineering and what can be deleted.
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:ponytail-review` skill against the current changes.

Use the skill's format exactly: one finding per line, focused only on
over-engineering, with tags such as `delete`, `stdlib`, `native`, `yagni`, and
`shrink`. End with `net: -<N> lines possible.` If nothing meaningful can be cut,
say `Lean already. Ship.`

Do not apply fixes unless the user asks.
