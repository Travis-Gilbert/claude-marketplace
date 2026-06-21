---
description: Audit the whole repository for over-engineering and deletion opportunities.
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:ponytail-audit` skill over the repository.

Scan beyond the current diff. Rank findings by biggest cut first, use Ponytail's
`delete`, `stdlib`, `native`, `yagni`, and `shrink` tags, and end with the net
lines and dependencies removable. If nothing meaningful can be cut, say
`Lean already. Ship.`

Do not apply fixes unless the user asks.
