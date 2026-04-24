---
description: "Research phase. Web-search for prior art, ground in the working repo, produce a research brief. No design, no plan."
argument-hint: "<topic>"
allowed-tools: Glob, Grep, Read, Write, Bash, WebSearch, WebFetch, Agent
---

# /research

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is the topic, in natural language. Derive a slug (kebab-case, under 40 chars).

## Sequence

1. Invoke the `researcher` agent with the full topic.
2. The agent applies lib/codebase-grounding/SKILL.md and lib/research-methodology/SKILL.md.
3. Agent writes `docs/plans/<slug>/research-brief.md`.

## Output

One line to the user:

```
Research brief: docs/plans/<slug>/research-brief.md
```

Nothing else. No summary of findings — they're in the file.

## Tips

- If the user wants to skip straight to a plan, direct them to `/plan <topic>` instead. `/plan` auto-chains research.
- If `research-brief.md` already exists for this slug, overwrite it. A second /research is a deliberate refresh.
