---
name: spec-compliance-review
description: "Two-stage review: spec first (does it match the task?), quality second (is it good?). Used per-task during /execute and over full implementations during /review."
---

# Spec Compliance Review

Two-stage review. First question: **did you build what the task asked for?** Second question: **is it good code?** Never collapse them.

## Why two stages

If you review for both at once, the quality bar contaminates the spec check. A beautifully-written implementation of the wrong feature is still wrong. A correct implementation that needs polish is correct — polish is the next stage.

## Stage 1: spec-reviewer

Answers: **does the code match what the task asked for?**

### Checklist
- Every bullet in the task body maps to at least one code change
- Every file the task said to create or edit was created or edited
- Every function / endpoint / model the task named exists with the specified signature
- Anything the task said **not** to do was not done (check "out of scope" notes)
- Tests named in the task body exist and pass

### Out of scope for Stage 1
- Code style (that's Stage 2)
- Performance optimization beyond what the task specified
- Adding "nice to have" improvements

### Output
```
Spec review: approved
```
Or:
```
Spec review: issues
1. <file>:<line> — <mismatch>
2. ...
```

No prose. One line per issue.

## Stage 2: quality-reviewer

Runs ONLY after Stage 1 approves.

Answers: **is the code good code for this codebase?**

### Checklist
- Pattern fit (reads 2-3 adjacent files to check conventions)
- Magic numbers / strings (extracted or inlined with comment if one-off)
- Dead code (unused imports, variables, functions)
- DRY (obvious copy-paste → helper)
- YAGNI (abstractions without a second caller → inline)
- Error handling (present where the real world fails; absent where it can't)
- Naming (English, not abbreviations)
- Fat-model / thin-view discipline (if backend)
- Test presence for non-trivial logic

### Out of scope for Stage 2
- Spec match (Stage 1's job, already passed)
- Style questions the auto-formatter catches (trust the formatter)

### Output
```
Quality review: approved
```
Or:
```
Quality review: issues
1. <file>:<line> — <smell> → <one-line fix>
```

## Loop behavior

Per task, max 2 spec-review loops + 2 quality-review loops. If issues persist after 2 loops, escalate to the user with the issue list and wait.

## Used by

- `/execute` — per-task, after each specialist implementation
- `/review` — standalone, over a full implementation against a plan

## Anti-pattern

Do not let Stage 2 comments bleed into Stage 1. "This works but is ugly" is approved at Stage 1. "This is elegant but doesn't do what the task said" is rejected at Stage 1. Keep the stages clean.
