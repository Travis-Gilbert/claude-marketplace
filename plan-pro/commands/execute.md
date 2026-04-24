---
description: "Execute phase. Runs the approved implementation plan task-by-task with domain-router delegation and two-stage review. Auto-invokes /review at the end."
argument-hint: "<slug>"
allowed-tools: Glob, Grep, Read, Write, Edit, Bash, Agent
---

# /execute

Apply CLAUDE.md response + independence discipline throughout.

## Input

`$ARGUMENTS` is the slug. `docs/plans/<slug>/implementation-plan.md` must exist.

## Sequence

1. Invoke `executor`. It loads `lib/executing-plans/SKILL.md` and `lib/subagent-driven-development/SKILL.md` (both seeded from superpowers, with plan-pro additions).
2. Per task: `domain-router` → specialist subagent → `spec-reviewer` → `quality-reviewer` → commit.
3. On solve signals during execution: `capture-agent` runs inline.
4. After all tasks complete: auto-invoke `/review` over the full implementation. Write `review-report.md`.

## Output

After each task, one line:

```
[N/K] <task title> → <plugin> → spec ok → quality ok → commit <sha>
```

For multi-file plans, prefix with stage:

```
[Stage 2 · 3/5] <task title> → <plugin> → spec ok → quality ok → commit <sha>
```

At stage boundaries (multi-file only):

```
Stage 2 complete. Integration test ok. Re-reading Stage 3…
```

At the end:

```
Done. N/N tasks complete. Review: docs/plans/<slug>/review-report.md
```

## Blockers

If `implementation-plan.md` is missing, one line and stop:

```
Blocker: docs/plans/<slug>/implementation-plan.md not found. Run /plan <topic> or /write-plan <slug> first.
```

If a task cannot be completed after 2 spec-review loops + 2 quality-review loops, stop with:

```
Blocker on Task N: <one-line description of the issue>
Proposed fix: <one line>
```

Then wait for the user.

## Tips

- Fresh subagent per task. The executor does not hold implementation context across tasks.
- Auto-/review is not optional. Every execute ends with a review-report.md.
