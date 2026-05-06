from pathlib import Path

from scripts.markdown import render_implementation_plan, render_plan_index, render_stage
from scripts.models import PlanModel, Stage, Task


def test_renders_single_file_plan_with_tasks():
    plan = PlanModel(
        title="Add Endpoint",
        overview="Adds /hello endpoint with tests.",
        file_structure=[Path("src/api.py"), Path("tests/test_api.py")],
        stages=[],
        tasks=[
            Task(id="1", title="Write failing test", body="**Step 1**: write the test.",
                 files=[Path("tests/test_api.py")], delegate_plugin="django-engine-pro",
                 acceptance="pytest fails as expected"),
            Task(id="2", title="Implement endpoint", body="**Step 1**: write the function.",
                 files=[Path("src/api.py")], delegate_plugin="django-engine-pro",
                 acceptance="pytest tests/test_api.py passes"),
        ],
        is_multi_stage=False,
    )
    md = render_implementation_plan(plan)
    assert "# Add Endpoint Implementation Plan" in md
    assert "executing-plans" in md
    assert "## File Structure" in md
    assert "src/api.py" in md
    assert "## Task 1: Write failing test" in md
    assert "**Delegate to:** django-engine-pro" in md
    assert "pytest tests/test_api.py passes" in md


def test_renders_index_for_multi_stage_plan():
    plan = PlanModel(
        title="Big",
        overview="Multi-stage build.",
        file_structure=[Path("a.py")],
        stages=[
            Stage(number=1, slug="setup", title="Setup",
                  tasks=[Task(id="1", title="x", body="b", files=[Path("a.py")],
                              delegate_plugin="plan-pro", acceptance="acceptable criteria")]),
            Stage(number=2, slug="impl", title="Implement",
                  tasks=[Task(id="2", title="y", body="b", files=[Path("a.py")],
                              delegate_plugin="plan-pro", acceptance="acceptable criteria")]),
        ],
        tasks=[],
        is_multi_stage=True,
    )
    idx = render_plan_index(plan)
    assert "## Stages" in idx
    assert "01-stage-setup.md" in idx
    assert "02-stage-impl.md" in idx


def test_render_stage_lists_each_task():
    stage = Stage(
        number=1, slug="setup", title="Setup",
        tasks=[
            Task(id="1", title="t1", body="step", files=[Path("a.py")],
                 delegate_plugin="plan-pro", acceptance="acceptable criteria"),
            Task(id="2", title="t2", body="step", files=[Path("b.py")],
                 delegate_plugin="plan-pro", acceptance="acceptable criteria"),
        ],
    )
    out = render_stage(stage)
    assert "# Stage 1: Setup" in out
    assert "## Task 1: t1" in out
    assert "## Task 2: t2" in out
