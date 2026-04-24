# Anti-Pattern: Spec Deviation Modes

Common ways a plan drifts from its spec during execution. spec-reviewer catches these.

## Mode 1: Over-building

**Symptom**: Code does more than the task asked. "While I was in there, I also added X."

**Cost**: Scope creep, longer review, higher chance of regressions, harder to roll back.

**Fix**: Delete the extra. If it's genuinely needed, it belongs in a separate task.

## Mode 2: Under-building

**Symptom**: Code does less than the task asked. A sub-bullet was missed.

**Cost**: The task looks done but isn't. Downstream tasks depend on the missing piece.

**Fix**: Check every bullet in the task body against the diff. Fill gaps.

## Mode 3: Signature drift

**Symptom**: The task specified `def create_share(user, project, email)` but the code has `def create_share(user, project_id, recipient_email, notify=True)`.

**Cost**: Other tasks in the plan referenced the original signature. They now fail.

**Fix**: Restore the spec'd signature. If the change was warranted, propagate to every task that uses the function.

## Mode 4: File location drift

**Symptom**: Task said to put code in `apps/share/models.py` but it landed in `apps/share/services/share_service.py`.

**Cost**: Tasks that reference the original path fail. Imports break elsewhere.

**Fix**: Move to the spec'd location. If the other location is genuinely better, update the plan (/retrofit).

## Mode 5: Test skipping

**Symptom**: "I'll add the tests later" or "the implementation is obviously correct".

**Cost**: Tests are the executable spec. Skipped tests mean no guarantee the code matches the spec.

**Fix**: Write the test. The test is part of the task.

## Mode 6: Shortcut via stubbing

**Symptom**: "I mocked this part because it depended on X."

**Cost**: The integration is untested. The "done" task has a hole.

**Fix**: Implement X (or the minimum part of X needed). If X is a separate task, return to the plan and finish X first.

## Mode 7: Silent requirement dropping

**Symptom**: Task had 5 bullets; code covers 4. No mention of the dropped bullet.

**Cost**: The user or reviewer thinks the task is done. It isn't.

**Fix**: spec-reviewer catches this by grepping task bullets against the diff.

## Mode 8: Pattern drift

**Symptom**: Task said to follow an existing pattern; the code does the same thing differently.

**Cost**: Two patterns for the same behavior in the codebase. Future maintainers guess which is canonical.

**Fix**: Read the pattern (2-3 adjacent files). Match it. If it's a bad pattern, that's a separate /retrofit conversation.

## Mode 9: "Improvements" along the way

**Symptom**: Task asked for a specific implementation; the implementer wrote a "better" one.

**Cost**: Reviewer and user expected the spec'd behavior. The unplanned optimization may have trade-offs the task-author considered and rejected.

**Fix**: Revert to spec. If the improvement is worth it, /retrofit the plan first, then implement.

## Prevention

- Plan bite-sized tasks. Smaller scope = less room for drift.
- Plan with complete code in every step. The implementer has less to interpret.
- Two-stage review. spec-reviewer catches deviation before quality-reviewer gets distracted by it.
