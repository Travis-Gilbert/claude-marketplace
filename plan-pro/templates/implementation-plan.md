# Implementation Plan: <TOPIC>

_Produced by /write-plan. Consumed by /execute._

## Overview

<one paragraph: what ships when this plan completes>

## File Structure

_The full set of files this plan creates or modifies. Read top-down before executing._

```
<working-repo>/
├── <path>                              # <responsibility>
├── <path>                              # <responsibility>
├── apps/<app>/
│   ├── models.py                       # <responsibility>
│   ├── views.py                        # <responsibility>
│   └── tests/
│       └── test_<feature>.py           # <responsibility>
└── docs/plans/<slug>/
    ├── research-brief.md
    ├── design-doc.md
    ├── implementation-plan.md          # this file
    └── decisions/
        ├── 0001-<slug>.md
        └── 0002-<slug>.md
```

## Tasks

### Task 1: <verb + object>

**Files**: <exact paths>

**Test first**:
```<lang>
<complete failing test code>
```
Run: `<command>` → expect RED.

**Implementation**:
```<lang>
<complete implementation code>
```

**Verify**: `<command>` → expect GREEN.

**Commit**: `<conventional commit>`

**Delegate to**: <plugin-name>

---

### Task 2: <verb + object>

...

---

### Task N: <verb + object>

...

## Completion criteria

- All tasks complete and committed.
- All tests pass: `<test-runner command>`.
- /review emits a clean review-report.md.
- <any feature-specific criteria>
