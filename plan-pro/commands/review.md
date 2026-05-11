---
description: "Review phase. Runs spec-reviewer then quality-reviewer against implementation. Works standalone against any repo state."
argument-hint: "<slug> [or path to plan file]"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, Agent
---

# /review

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is either a slug (reviews `docs/plans/<slug>/implementation-plan.md` against current repo) or a path to a plan file directly.

## Sequence

1. Read the plan.
2. Identify files the plan touched. Read each.
3. Invoke `spec-reviewer` over the implementation. Collect its output.
4. Invoke `quality-reviewer` over the implementation. Collect its output.
5. Merge findings into `review-report.md`.

## Output

Report location mirrors `/execute`:

- Slug input: `docs/plans/<slug>/review-report.md`.
- Path input: `<plan-dir>/<plan-stem>.review-report.md` in the plan's directory.

Content:

```markdown
# Review Report: <slug or plan stem>

_Generated: YYYY-MM-DD_

## Spec Compliance
<spec-reviewer output, verbatim>

## Code Quality
<quality-reviewer output, verbatim>

## Summary
<one-line verdict: "ship" or "N blockers">
```

Report path in one line to the user.

## Tips

- Standalone /review is useful after hand-editing post-execution, or to audit a plan implementation done outside plan-pro.
- If the plan mentions files that don't exist in the repo, that's a spec-review issue, not a blocker.
