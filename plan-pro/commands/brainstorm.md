---
description: "Brainstorm phase. Runs problem-framer (if needed), divergent-thinker, clarifier, and the conditional agents, then produces a design doc and ADRs."
argument-hint: "<topic or slug>"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, WebSearch, WebFetch, Agent
---

# /brainstorm

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is either a topic (fresh start) or a slug (continues an existing plan directory). If a topic, derive a slug. If a slug with existing `research-brief.md`, use it as input.

## Sequence

1. If `docs/plans/<slug>/research-brief.md` does NOT exist → invoke `researcher` first.
2. Load lib/brainstorming/SKILL.md (modified from superpowers).
3. Invoke agents in order, single response where possible:
   - `problem-framer` (only if intent is ambiguous)
   - `divergent-thinker` (generate 5-8 approaches, filter to 2-3 in one pass)
   - `clarifier` (at most one question if genuinely irreversible)
   - `scope-gatekeeper` (detect multi-subsystem, split if needed)
   - Conditional: `functional-decomposer`, `event-mapper`, `contract-first-architect`, `walking-skeleton-planner`
4. Throughout: `decision-scribe` writes ADRs to `decisions/`.

## Output

`docs/plans/<slug>/design-doc.md` + `docs/plans/<slug>/decisions/*.md`.

Report paths in two lines:

```
Design: docs/plans/<slug>/design-doc.md
Decisions: N files in docs/plans/<slug>/decisions/
```

## Tips

- Never asks "should I proceed" or "does this look good". Ship the design doc, then stop.
- If the user wants iteration, they'll say so. Don't fish for feedback.
