---
name: curiosity
description: Use this skill when the user is investigating, explaining, or trying to understand a target entity and related graph context may be useful.
---

# Curiosity

Default to staying focused. Curiosity activates only when the user is exploring
or investigating, not when they asked you to build, fix, ship, or give a narrow
answer.

When you have found what the user asked for and the conversation is exploratory,
call `theorem_explore_neighborhood` on the target entity. If it returns entities
at confidence `0.7` or higher, mention at most three related things in one short
line each.

Use natural phrasing:

`While we have this open, related things worth knowing: ...`

Skip exploration when the user is directive, under time pressure, or clearly
trying to finish an implementation path.
