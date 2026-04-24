# Pattern: Bite-Sized Tasks

Each task: 2-5 minutes. TDD-shaped. Complete code. Exact paths. Commit at the end.

## Anatomy

```markdown
### Task N: <verb + object — one line>

**Files**: <exact paths, existing or to-create>

**Test first**:
```python
# tests/<path>/test_<feature>.py
def test_...():
    # Arrange
    ...
    # Act
    result = ...
    # Assert
    assert ...
```
Run: `pytest tests/<path>/test_<feature>.py::test_...`  → expect RED.

**Implementation**:
```python
# <path>
def <name>(<args>) -> <return-type>:
    """<one-line docstring>."""
    <complete code>
```

**Verify**: run the test. Expect GREEN.

**Commit**: `<conventional commit message>`

**Delegate to**: <plugin-name>
```

## Rules

### Granularity
- One task = one action. Multiple actions = multiple tasks.
- "Write failing test" + "implementation" + "run tests" → one task if they all fit in 5 min. Otherwise split.

### Complete code
- Every code block is copy-paste-ready.
- No `...`, no `# TODO`, no "similar to Task N".
- If the code depends on imports, they're in the block.

### Exact paths
- `apps/share/models.py` not `<app>/models.py`
- `src/pages/api/share.ts` not `pages/api/share.ts` (if the project uses `src/`)
- Paths must match what `ls` would return.

### TDD shape
- Failing test first.
- Minimal implementation.
- Tests pass.
- Commit.
- Reviewers come after.

### Commit per task
- One commit per task (unless the task explicitly says "no commit yet").
- Conventional commit format if the project uses one.

### Delegate
- Every task ends with `**Delegate to**: <plugin>`.
- The executor's domain-router reads this to dispatch the specialist.

## Example (Django ORM task)

```markdown
### Task 3: Create Share model and migration

**Files**: apps/share/models.py (new), apps/share/migrations/0001_initial.py (auto-generated)

**Test first**:
```python
# apps/share/tests/test_models.py
import pytest
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from apps.share.models import Share

@pytest.mark.django_db
def test_share_creation():
    user = get_user_model().objects.create_user(username="alice")
    project = Project.objects.create(name="p", owner=user)
    share = Share.objects.create(
        project=project, shared_by=user, recipient_email="bob@example.com"
    )
    assert share.pk is not None
    assert share.project == project
```
Run: `pytest apps/share/tests/test_models.py::test_share_creation` → RED (model doesn't exist).

**Implementation**:
```python
# apps/share/models.py
from django.conf import settings
from django.db import models
from apps.projects.models import Project

class Share(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="shares")
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    recipient_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["recipient_email"])]
```

**Migration**: `python manage.py makemigrations share`

**Verify**: `python manage.py migrate && pytest apps/share/tests/test_models.py` → GREEN.

**Commit**: `feat(share): add Share model and initial migration`

**Delegate to**: django-engine-pro
```

## Anti-pattern

- Tasks that span hours. Split.
- Tasks whose body is a paragraph of prose describing what to do. The body is code + file paths + commands.
- "Write the backend" as one task. Decompose.
- Tasks without tests. Every non-trivial task has a test.
