# Anti-Pattern: Placeholder Plans

A plan with placeholders isn't a plan. It's a prompt for a future planning session.

## The placeholders plan-reviewer hunts

### Literal markers
- `TBD`
- `TODO`
- `FIXME`
- `XXX`
- `placeholder`
- `…` / `...` where code should be

### Deferred content
- "Add error handling"
- "Add validation as appropriate"
- "Similar to Task N"
- "Follow the pattern"
- "Use the existing X" (without naming which)
- "Figure out the right approach"

### Hand-waves
- "It should work something like…"
- "Roughly follow…"
- "A bit like X but with Y"

### Type fog
- `# TODO: figure out the return type`
- `def foo(params)` (untyped)
- `return ...` (literal ellipsis body)

## Why these fail

A plan is a handoff to an implementer (another subagent or future-you). The implementer doesn't have the planner's context. Placeholders force them to re-plan, which means:

- Different choices from the original planner's intent
- Inconsistent choices across tasks (every implementer picks their own)
- Hidden decisions that never make it to an ADR
- Wasted time re-researching decisions that were already made

## What to do instead

Write the code. Even if it's trivial:

```python
# Wrong:
def create_share(user, project, email):
    # TODO: validate email
    # TODO: check permissions
    ...

# Right:
def create_share(user: User, project: Project, email: str) -> Share:
    validate_email(email)  # raises ValidationError on malformed
    if not project.can_be_shared_by(user):
        raise PermissionError("User cannot share this project")
    return Share.objects.create(
        project=project,
        shared_by=user,
        recipient_email=email,
    )
```

If you don't know the exact validation, write `validate_email(email)` and include a task for `validate_email` elsewhere. Now there's a concrete handle, not a placeholder.

## Planning-level placeholders

Sometimes a plan genuinely can't specify everything — a research task is needed first. Don't bury that as a placeholder. Make it a first-class task:

```markdown
### Task 1: Research email validation library

Goal: pick a library (python-email-validator or equivalent).
Output: a note in decisions/ + the chosen library added to pyproject.toml.
Delegate to: plan-pro (self).
```

Then Task 2 uses the chosen library concretely.

## plan-reviewer action

Every placeholder is a failure. plan-reviewer fixes them inline if the answer is obvious; escalates to the user if it isn't.

## Escape hatch

The ONE acceptable placeholder: a comment like `# See decisions/0007-pagination.md` where `0007-pagination.md` contains the actual decision. A reference is not a placeholder.
