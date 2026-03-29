---
name: inject-protocol
description: "Add the Spec Compliance Protocol block to this project's CLAUDE.md"
allowed-tools: ["Read", "Edit", "Write"]
---

# Inject Spec Compliance Protocol

Add the following block to the project's CLAUDE.md file. If CLAUDE.md
does not exist, create it with this block. If it exists, append the
block at the end (before any "User Instructions" section if present).

Check whether the block already exists first (search for
"Spec Compliance Protocol"). If it does, report that it is already
installed and do nothing.

## The Block

```markdown
## Spec Compliance Protocol

When a session includes a specification document (identified by
the META section with "Status: LOCKED" or by MUST/MUST NOT/VERIFY
statement patterns), follow this protocol exactly.

### Before Writing Any Code

1. **Read the entire spec.** Do not start implementation after
   reading only part of the spec. Requirements in later sections
   may constrain earlier ones.

2. **Confirm scope.** List the files you plan to touch. If any
   file is not in the spec's SCOPE section, stop and ask before
   proceeding. If any file in the SCOPE section seems unnecessary,
   note it but do not skip it.

3. **Flag conflicts early.** If any MUST requirement conflicts with
   the current codebase (different value, different approach,
   different component), report the conflict before writing code.
   Do not silently resolve it by following the codebase.

### During Implementation

4. **Implement what is specified.** Every MUST statement must be
   satisfied in the final code. If you cannot satisfy a MUST,
   stop and report. Never skip a requirement silently.

5. **Do not add unspecified features.** If a prop, parameter,
   UI element, API field, or behavior is not in the spec, do not
   add it. This includes "helpful" additions like extra error
   handling, loading states, or accessibility attributes beyond
   what was specified. If you believe something important is
   missing, finish the specified work first, then suggest the
   addition separately.

6. **Respect MUST NOT statements absolutely.** These are not
   guidelines. They are prohibitions. A MUST NOT violation is
   equivalent to a bug.

7. **When in doubt, ask.** If a requirement is ambiguous even
   after reading the full spec, ask before implementing. Do not
   guess. "I interpreted this as X, is that right?" is always
   better than silently guessing wrong.

### After Each Batch or Checkpoint

8. **Run every VERIFY statement.** Execute each verification
   check and report pass/fail. Do not summarize with "all checks
   pass" unless you have actually run each one. Show the output.

9. **Check scope compliance.** Run `git diff --stat` (or
   equivalent) and confirm that only files listed in SCOPE were
   modified. If unexpected files appear, explain why before
   proceeding.

10. **Do not proceed past a failing VERIFY.** Fix the failure
    first. If the fix requires changing something outside the
    spec's scope, report the situation and wait for approval.

### Deviation Reporting

If at any point you deviate from the spec, report it immediately.
Deviation includes:

- Using a different value than what a MUST specifies
- Skipping a MUST requirement
- Touching a file not in SCOPE
- Adding something not in the spec
- Resolving a conflict without asking

Report format:
```
DEVIATION: [which MUST/MUST NOT was affected]
  Reason: [why you deviated]
  What I did instead: [the alternative]
  Impact: [what this changes about the final result]
  Recommendation: [what you think should happen next]
```

Do not bury deviations in conversational text. Use the format
above so they are immediately visible.
```

After injecting, confirm: "Spec Compliance Protocol added to CLAUDE.md.
It activates automatically when a session includes a LOCKED spec."
