from pathlib import Path

import pytest

from scripts.models import PlanModel, Task
from scripts.validators import (
    PlanValidationError,
    scan_acceptance_criteria,
    scan_for_placeholders,
    scan_paths_resolve,
)


def _task(body: str = "real body content for testing", files: list[Path] | None = None,
          acceptance: str = "tests pass green") -> Task:
    return Task(
        id="t1", title="Do thing", body=body,
        files=files or [Path("scripts/plan_pro.py")],
        delegate_plugin="plan-pro", acceptance=acceptance,
    )


def _plan(*tasks: Task) -> PlanModel:
    return PlanModel(
        title="P", overview="o", file_structure=[Path("scripts/plan_pro.py")],
        stages=[], tasks=list(tasks), is_multi_stage=False,
    )


def test_placeholder_TBD_caught():
    plan = _plan(_task(body="Implement TBD before shipping"))
    with pytest.raises(PlanValidationError, match="TBD"):
        scan_for_placeholders(plan)


def test_placeholder_FIXME_caught():
    plan = _plan(_task(body="FIXME: handle the error case"))
    with pytest.raises(PlanValidationError, match="FIXME"):
        scan_for_placeholders(plan)


def test_placeholder_similar_to_task_caught():
    plan = _plan(_task(body="Implementation similar to Task 3."))
    with pytest.raises(PlanValidationError, match="similar to"):
        scan_for_placeholders(plan)


def test_placeholder_clean_passes():
    plan = _plan(_task(body="Write the failing test, then implement the function."))
    scan_for_placeholders(plan)


def test_acceptance_must_not_be_blank_or_trivial():
    plan = _plan(_task(acceptance="ok"))
    with pytest.raises(PlanValidationError, match="acceptance"):
        scan_acceptance_criteria(plan)


def test_acceptance_meaningful_passes():
    plan = _plan(_task(acceptance="pytest tests/test_x.py passes; CI green"))
    scan_acceptance_criteria(plan)


def test_paths_resolve_existing_or_marked_new(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "scripts").mkdir()
    (tmp_path / "scripts" / "plan_pro.py").write_text("# placeholder")
    plan = _plan(_task(files=[Path("scripts/plan_pro.py")]))
    scan_paths_resolve(plan)


def test_paths_resolve_unmarked_missing_fails(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    plan = _plan(_task(files=[Path("scripts/nope.py")]))
    with pytest.raises(PlanValidationError, match="nope"):
        scan_paths_resolve(plan)
