---
name: plan-retrofitting
description: "Audit patterns for upgrading an existing plan. Placeholder detection, decomposition improvement, contract addition, acceptance-criteria tightening, delegation assignment."
---

# Plan Retrofitting

Take an existing plan and lift it to the quality bar `plan-reviewer` would enforce on a fresh plan. Goal and structure preserved; quality lifted.

## Inputs

- Path to an existing plan file
- Any sibling artifacts (`design-doc.md`, `decisions/*.md`, `research-brief.md`)
- Current repo state

## The audit checklist

### 1. Placeholders
Grep for: `TBD`, `TODO`, `FIXME`, `placeholder`, `XXX`, `...`, `add error handling`, `similar to task`, `follow the pattern`. Every hit is a failure. Replace with complete code or delete.

### 2. Contracts (new — retrofitter adds these)
Any data flow between modules without an explicit schema? Add a `## Contracts` section to the design-doc if missing and wire Pydantic/Zod/etc. schemas into the relevant tasks.

### 3. Weak acceptance criteria
Every task must have an observable outcome. Reject:
- "Works as expected"
- "Tests pass"
- "Looks right"

Tighten to:
- "GET /foo returns 200 with JSON matching schema X"
- "Unit test `test_foo_returns_empty_list` passes"
- "Lighthouse score ≥ 90 for contrast on /settings page"

### 4. Scope creep risk
Any task body containing "also", "while we're at it", "might as well", "quick side note"? These are scope-creep seeds. Extract the side quest as a deferred task or delete.

### 5. Missing delegation
Every task must have a `Delegate to: <plugin>` line. Missing → pick via the domain-router logic (CLAUDE.md table). Add the line.

### 6. Decomposition gaps
Any task whose body exceeds ~40 lines of instructions, or which clearly takes more than 5 minutes? Split into two or more tasks.

### 7. Type consistency
Function/method signatures referenced across multiple tasks must match exactly. Mismatch → fix.

### 8. File path exactness
`<app>/models.py` is a failure. `apps/notebook/models.py` is correct. Generic paths → specific paths.

### 9. TDD shape
Each task should be: failing test → run to verify red → implementation → run to verify green → commit. If the plan has implementation before tests, restructure.

## Output

Rewrite the plan in place. Write a delta report:

```
Retrofit: <path>
  Placeholders:        K fixed
  Contracts added:     K
  Acceptance tightened: K
  Scope items extracted: K
  Delegation added:    K
  Tasks split:         K
  Type fixes:          K
  Path fixes:          K
  TDD restructure:     K
Review deltas:         <plan-reviewer output after rewrite>
```

## Non-destructive rule

Goal and overall structure are preserved. You are lifting quality, not redesigning. If the retrofit would require changing the feature's scope or architecture, stop — the user needs `/brainstorm`, not `/retrofit`.

## Post-audit

Invoke `plan-reviewer` on the rewrite. Fix its findings inline before reporting done. The retrofitted plan must pass plan-reviewer cleanly.
