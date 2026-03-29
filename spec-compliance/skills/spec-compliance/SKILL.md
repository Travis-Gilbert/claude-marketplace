---
name: spec-compliance
description: >
  This skill should be used when the user asks to "make this spec tight",
  "lock this down", "deviation-resistant", "spec compliance", "implement
  this exactly", "faithful implementation", "literal spec", "stop deviating",
  "follow this precisely", "Claude keeps changing my design", or expresses
  frustration about Claude Code not following a plan. Also triggers on:
  "convert this to MUST/MUST NOT", "lock down requirements", "testable
  spec", "binary spec". Converts design docs, implementation plans, and
  natural-language specs into deviation-resistant specifications that
  Claude Code will follow literally.
---

# Spec Compliance: Deviation-Resistant Specification Writer

Convert natural-language plans, design docs, and implementation specs
into a format that eliminates interpretation during Claude Code sessions.
Every requirement in the output is binary, testable, and explicitly scoped.

## Why This Format Exists

Claude Code treats specs as guidance, not contracts. It reads "the hero
should use a gradient" and produces a gradient that looks reasonable. But
the spec author chose a specific gradient with specific stops for specific
reasons. The gap between "reasonable" and "specified" is where deviation
lives.

This skill closes that gap by converting every requirement into one of
four statement types that leave no room for interpretation.

## The Four Statement Types

### MUST

A positive requirement. Binary: either true in the final implementation
or not. No partial compliance.

Rules for writing MUST statements:
- Name the exact CSS property, component, variable, or API
- Include specific values (colors, sizes, weights, z-indices)
- If a value comes from a design token, name the token
- One requirement per MUST line (never combine with "and")

### MUST NOT

An explicit prohibition. Prevents the five deviation modes.

Rules for writing MUST NOT:
- Be specific about what is prohibited (not "don't break the layout")
- Tie each MUST NOT to a known deviation pattern when possible
- Always include "Add props, parameters, or features not listed in
  this spec" to prevent additive deviation

### IF CONFLICT

What to do when the spec disagrees with the codebase. Addresses
reasonable substitution, the most common deviation mode.

Three standard IF CONFLICT statements belong in every spec:
1. This spec takes precedence over existing codebase patterns
2. If a MUST cannot be met due to a technical constraint, STOP and
   report (do not resolve independently)
3. If a requirement seems suboptimal, implement it as specified
   anyway and note the concern afterward

### VERIFY

A specific check to confirm a requirement was implemented correctly.
Each VERIFY pairs with one or more MUST statements.

Rules for writing VERIFY:
- Every VERIFY must be executable (a command, a grep, a CSS check,
  or a specific visual confirmation)
- Pair each VERIFY with the MUST lines it validates
- Always include "git diff --stat shows only files listed in SCOPE"

Prefer checks in this priority order:
1. CLI commands (grep, build, lint, type-check)
2. Computed style inspection
3. Git diff verification
4. Screenshot confirmation (least reliable, use as last resort)

## Spec Document Structure

Every spec produced follows this exact structure:

```markdown
# [Feature Name] Implementation Spec

## META
Status: LOCKED
Spec version: 1.0
Author: [user] via spec-compliance
Date: [date]
Implements: [reference to design doc or conversation]

## SCOPE
Files to create or modify (exhaustive list):
- path/to/file.tsx

Files that MUST NOT be modified:
- path/to/protected/file.tsx

## REQUIREMENTS

### [Section Name]

MUST: [requirement]
MUST NOT: [prohibition]
VERIFY: [check]

## CONFLICT PROTOCOL

IF CONFLICT: This spec takes precedence over existing code.
IF CONFLICT: If a MUST cannot be met, STOP and report.
IF CONFLICT: If you believe a requirement is wrong, implement
  it anyway and note your concern afterward.

## COMPLETION CHECKLIST

Run all VERIFY statements in order. Report pass/fail for each.
If any VERIFY fails, fix and re-run before marking complete.
```

## The Conversion Process

### Step 1: Receive the Source Material

Read the entire design doc, session brief, implementation plan, or
natural-language description completely before responding.

### Step 2: Extract Requirements

Parse the source for every stated or implied requirement. Classify each:

- **Explicit and specific**: Convert directly to a MUST statement
- **Explicit but vague**: Ask a clarifying question to make it specific
  enough for a MUST statement
- **Implied but unstated**: Surface it and ask if it should be a
  requirement (e.g., "The design shows Courier Prime but does not state
  the font explicitly. Lock this as a MUST?")
- **Contradictory**: Flag both sides and ask which takes precedence

### Step 3: Identify Deviation Risks

Anticipate where Claude Code is likely to deviate. Generate MUST NOT
statements for each risk. Consult `references/deviation-risks.md` for
common risks organized by task type.

### Step 4: Write Verification Checks

For every MUST, ask: "How would I confirm this is correct without
reading the full codebase?" The answer becomes a VERIFY statement.

### Step 5: Produce the Spec

Write the full spec document. Include a brief summary at the top
noting how many MUST, MUST NOT, and VERIFY statements it contains.

### Step 6: Review Pass

Before delivering, scan the spec for common gaps:
- Is scope explicitly closed? (MUST NOT modify files outside SCOPE)
- Is additive deviation blocked? (MUST NOT add unrequested features)
- Does every MUST have a corresponding VERIFY?
- Are fonts, colors, and spacing named by token or exact value?
- Is the conflict protocol present?

## What This Skill Does NOT Do

- Make design decisions. It encodes decisions already made.
- Simplify requirements. If the source says "Courier Prime, 11px,
  uppercase, terracotta, above title with short rule," all six
  attributes become individual MUST statements.
- Judge whether requirements are good. It makes them unambiguous.
- Write implementation code. It writes the contract that code must
  satisfy.

## Relationship to Other Tools

| Tool | Relationship |
|------|-------------|
| **session-launcher** | Scopes the session (what to build). Spec-compliance locks requirements within that scope. Use session-launcher first. |
| **spec-guard** | Enforces compliance at edit-time via hooks. Spec-compliance produces the spec that spec-guard enforces. |
| **design-pro** | Produces design rationale. Spec-compliance converts those decisions into locked requirements. |

## Additional Resources

### Reference Files

- **`references/deviation-risks.md`** - Common deviation risks by task
  type (component, styling, API, data visualization) with specific
  MUST NOT examples for each
- **`references/example-spec.md`** - Complete before/after example
  showing a natural-language spec converted to locked format
