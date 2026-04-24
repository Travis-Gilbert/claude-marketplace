# Stage <NUMBER>: <STAGE TITLE>

_Part of multi-file plan. See [implementation-plan.md](implementation-plan.md) for the index._

## Overview

<one paragraph: what this stage delivers and why it's in this position in the sequence>

## Prerequisites

- Previous stage: <name or "none — this is Stage 0">
- Required state at entry: <what must be true before this stage runs>

## Files this stage touches

_Subset of the full tree. Only what Stage <NUMBER> creates or modifies._

```
<working-repo>/
├── <path>                              # created by this stage
├── <path>                              # modified by this stage
└── ...
```

## Tasks

### Task <N>.1: <verb + object>

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

### Task <N>.2: <verb + object>

...

---

### Task <N>.K: <verb + object>

...

## Stage exit criteria

- All tasks marked `[done]`.
- Stage-scoped integration test passes: `<command>` (if defined).
- <stage-specific criterion>

## Handoff to next stage

<what's now available for later stages to consume — new functions, new migrations applied, new files created>
