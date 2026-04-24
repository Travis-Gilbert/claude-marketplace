---
description: "Retrofit an existing plan file. Audits for placeholders, contract gaps, weak acceptance criteria, missing delegation, oversized tasks. Rewrites in place."
argument-hint: "<path to plan file>"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, Agent
---

# /retrofit

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is a path to an existing plan file (typically `docs/plans/<slug>/implementation-plan.md`, but any markdown plan works).

## Sequence

1. Invoke `retrofitter`. It reads the plan, any sibling artifacts (design-doc, decisions, research-brief), and audits against the retrofitting skill's full checklist.
2. Retrofitter rewrites the plan in place.
3. Invoke `plan-reviewer` over the rewrite. Fix findings inline.

## Output

Overwrites the input file. Emits a delta report:

```
Retrofit: <path>
  Placeholders:     K fixed
  Contracts added:  K
  Tasks split:      K
  Delegation added: K
  Acceptance tightened: K
Review deltas:     <from plan-reviewer>
```

## Tips

- Retrofit is non-destructive to intent. Goal and structure are preserved; quality is lifted.
- If the original file was outside `docs/plans/`, retrofit writes to the same location. No directory reorg.
- Backups: git is the backup. Commit before /retrofit if uncertain.
