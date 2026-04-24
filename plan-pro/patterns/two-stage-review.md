# Pattern: Two-Stage Review

See: `lib/spec-compliance-review/SKILL.md`.

## The two stages

1. **spec-reviewer**: does the code match what the task asked for?
2. **quality-reviewer**: is the code good for this codebase?

Run in that order. Never collapse.

## Why two stages

If one reviewer does both, the quality bar contaminates the spec check. A beautifully-written implementation of the wrong feature is still wrong. A correct implementation that needs polish is correct — polish is next stage.

Two reviewers, clean outputs, clean loops.

## Per-task flow (during /execute)

```
task → implementer → spec-reviewer
                        ├── approved → quality-reviewer
                        │                 ├── approved → commit → next task
                        │                 └── issues   → back to implementer (max 2 loops) → quality-reviewer
                        └── issues       → back to implementer (max 2 loops) → spec-reviewer
```

After 2 failed spec-review loops: escalate to user with issue list.
After 2 failed quality-review loops: same.

## Per-implementation flow (during /review)

Same, but over the whole plan:

1. Read `implementation-plan.md`.
2. Identify all files the plan touched. Read them.
3. spec-reviewer against the plan's intent.
4. quality-reviewer against codebase conventions.
5. Merge findings into `review-report.md`.

## Output format (per stage)

### spec-reviewer
```
Spec review: approved
```
Or:
```
Spec review: issues
1. <file>:<line> — <mismatch>
```

### quality-reviewer
```
Quality review: approved
```
Or:
```
Quality review: issues
1. <file>:<line> — <smell> → <fix>
```

One line per issue. No prose paragraphs. No preamble.

## What each stage covers

| Concern | Stage 1 | Stage 2 |
|---|---|---|
| Every task bullet addressed | ✅ | — |
| Signature matches task | ✅ | — |
| File at spec'd path | ✅ | — |
| Anything NOT requested NOT done | ✅ | — |
| Tests named in task exist | ✅ | — |
| Magic numbers extracted | — | ✅ |
| Dead code | — | ✅ |
| DRY violations | — | ✅ |
| YAGNI (unused abstractions) | — | ✅ |
| Error handling appropriate | — | ✅ |
| Naming | — | ✅ |
| Pattern fit (matches neighbors) | — | ✅ |
| Fat models / thin views | — | ✅ |

## Anti-pattern

- Single reviewer, single pass. Spec and quality blur; issues are miscategorized; loops are harder to resolve.
- Starting quality review before spec is approved. Wastes time on code that may need to be rewritten for spec.
- Reviewer writing prose. Prose hides issues; a numbered list surfaces them.
