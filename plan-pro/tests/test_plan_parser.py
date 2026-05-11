from pathlib import Path

from scripts.plan_parser import parse_plan_markdown


def test_parse_tiny_plan():
    fixture = Path(__file__).parent / "fixtures" / "tiny-plan.md"
    plan = parse_plan_markdown(fixture.read_text())
    assert plan.title == "Tiny"
    assert plan.is_multi_stage is False
    assert len(plan.tasks) == 2
    assert plan.tasks[0].title == "Write failing test"
    assert plan.tasks[0].delegate_plugin == "plan-pro"
    assert "ImportError" in plan.tasks[0].acceptance
    assert plan.tasks[1].id == "2"


def test_parse_extracts_file_structure():
    fixture = Path(__file__).parent / "fixtures" / "tiny-plan.md"
    plan = parse_plan_markdown(fixture.read_text())
    paths = [str(p) for p in plan.file_structure]
    assert "src/hello.py" in paths
    assert "tests/test_hello.py" in paths
