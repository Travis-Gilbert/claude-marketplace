# Pattern: No Placeholders

See: `references/anti-patterns/placeholder-plans.md` for full discussion.

## Rule

Every task body contains complete, runnable code. No placeholders, ellipses, hand-waves, or "figure out" fragments.

## The grep-list plan-reviewer runs

```
TBD
TODO
FIXME
XXX
placeholder
\.\.\.
add error handling
similar to task
follow the pattern
use the existing
figure out
roughly
something like
a bit like
```

Every hit is a failure.

## Acceptable references

Not placeholders — real references:

- `# See decisions/0007-pagination.md` (points at an ADR with the answer)
- `# See contracts in design-doc.md § Contracts` (points at a concrete schema)
- `from .shared import validate_email` (imports a concrete function that's either already implemented or is its own task)

## Transforms

### Before (placeholder)
```python
def share_project(user, project, email):
    # TODO: validate email
    # TODO: check permissions
    # TODO: create share
    ...
```

### After (no placeholder)
```python
def share_project(user: User, project: Project, email: str) -> Share:
    """Create a share for project, authored by user, to email."""
    validate_email(email)  # raises ValidationError on malformed
    if not project.can_be_shared_by(user):
        raise PermissionError("User cannot share this project")
    return Share.objects.create(
        project=project,
        shared_by=user,
        recipient_email=email,
    )
```

If `validate_email` and `can_be_shared_by` are genuinely unknown, they're Task 2 and Task 3. Task 1 calls them; Tasks 2 and 3 implement them. That's not a placeholder — that's decomposition.

## Research-level placeholders

Legitimate: a task whose purpose is to decide something.

```markdown
### Task 1: Choose email validation library

Goal: pick a library and install it.

Options:
- `email-validator` (PyPI, 2M downloads/month, actively maintained)
- `pyisemail` (smaller, RFC-5321 compliant)

Decision: ship research note to `decisions/0005-email-validator.md`. Install chosen library.

Delegate to: plan-pro (self)
```

Task 2 then uses the chosen library concretely. Task 1's output is a decision and a package install — not code that references a placeholder library.

## Why strict

Placeholders spread:
- One "TODO: error handling" becomes three inconsistent error-handling patterns when three implementers each fill it in
- "Similar to Task N" means the reader has to re-read Task N — and if Task N has its own placeholder, a chain
- "Figure out the right approach" means the decision gets made by whoever implements it, not whoever planned it

## plan-reviewer action

- Grep the plan for the list above.
- Every hit → fix inline if obvious, escalate otherwise.
- Report the count fixed in the delta.
