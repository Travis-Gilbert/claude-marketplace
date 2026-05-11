from pathlib import Path

import pytest
from pydantic import ValidationError

from scripts.models import PlanModel, Stage, Task


def test_task_requires_delegate_plugin():
    with pytest.raises(ValidationError):
        Task(id="t1", title="Add endpoint", body="...", files=[Path("foo.py")],
             delegate_plugin="", acceptance="tests pass")


def test_single_file_plan_is_not_large():
    plan = PlanModel(
        title="Tiny",
        overview="Add one thing.",
        file_structure=[Path("a.py")],
        stages=[],
        tasks=[Task(id="t1", title="A", body="...", files=[Path("a.py")],
                    delegate_plugin="plan-pro", acceptance="ok")],
        is_multi_stage=False,
    )
    assert plan.is_large() is False
    assert plan.total_task_count() == 1


def test_multi_stage_plan_is_large_at_4_stages():
    stages = [
        Stage(number=i, slug=f"s{i}", title=f"Stage {i}",
              tasks=[Task(id=f"t{i}", title="x", body="x", files=[Path("a.py")],
                          delegate_plugin="plan-pro", acceptance="ok")])
        for i in range(1, 5)
    ]
    plan = PlanModel(
        title="Big", overview="...", file_structure=[Path("a.py")],
        stages=stages, tasks=[], is_multi_stage=True,
    )
    assert plan.is_large() is True
    assert plan.total_task_count() == 4


def test_multi_stage_plan_is_large_at_10_tasks_in_3_stages():
    stages = []
    task_ids = iter(range(1, 11))
    for i, count in enumerate([4, 3, 3], start=1):
        stages.append(Stage(
            number=i, slug=f"s{i}", title=f"Stage {i}",
            tasks=[Task(id=f"t{next(task_ids)}", title="x", body="x",
                        files=[Path("a.py")], delegate_plugin="plan-pro", acceptance="ok")
                   for _ in range(count)],
        ))
    plan = PlanModel(
        title="Big", overview="...", file_structure=[Path("a.py")],
        stages=stages, tasks=[], is_multi_stage=True,
    )
    assert plan.is_large() is True
    assert plan.total_task_count() == 10
