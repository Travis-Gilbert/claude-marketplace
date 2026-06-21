---
description: Harvest `ponytail:` comments into a shortcut/debt ledger.
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the `theorems-harness:ponytail-debt` skill.

Collect every code comment marker matching `ponytail:` while skipping `.git`,
`node_modules`, and build output. Report each marker by file and line, extract
the named ceiling and upgrade path, tag markers with no trigger as
`no-trigger`, and end with `<N> markers, <M> with no trigger.`

Report only; change nothing unless the user asks to persist the ledger.
