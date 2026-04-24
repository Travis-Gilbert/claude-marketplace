---
description: "Full planning chain. Research → brainstorm → write-plan. No intermediate gates. Only the final plan requires user approval before /execute."
argument-hint: "<topic>"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, WebSearch, WebFetch, Agent
---

# /plan

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is the topic. Derive a slug.

## Sequence (auto-chain, no user gates)

1. `/research` (invokes `researcher` → `research-brief.md`).
2. `/brainstorm` (invokes the brainstorm sequence → `design-doc.md` + ADRs).
3. `/write-plan` (invokes `plan-writer` → `plan-reviewer` → `implementation-plan.md`).

Do not pause between phases. Do not summarize intermediate artifacts. Only the final plan is reported.

## Output

One-line confirmation listing all three artifacts:

```
Research: docs/plans/<slug>/research-brief.md
Design:   docs/plans/<slug>/design-doc.md (N decisions)
Plan:     docs/plans/<slug>/implementation-plan.md (K tasks)
```

Then prompt the user exactly once, as multiple choice:

```
Next: (A) /execute, (B) review the plan first, (C) /retrofit
```

No further prompting. Pick A on silence.

## Tips

- `/plan` is the default path. `/research` and `/brainstorm` and `/write-plan` are for users who want to stop between phases.
- If the topic is ambiguous ("I want something like X"), the chain includes `problem-framer`. If specific ("add dark mode"), it does not.
