from pathlib import Path

from scripts.plan_pro import _classify_gate_output, _resolve_spec_path


def test_classify_approved():
    status, _ = _classify_gate_output("Spec coverage gate: approved")
    assert status == "approved"


def test_classify_blocker():
    text = "Spec coverage gate: blocker\n1. §3 - uncovered"
    status, payload = _classify_gate_output(text)
    assert status == "blocker"
    assert "§3" in payload


def test_classify_error():
    status, payload = _classify_gate_output("Drift audit: error - no spec found")
    assert status == "error"
    assert "no spec" in payload


def test_classify_unparseable_falls_through_to_error():
    status, _ = _classify_gate_output("nothing useful here")
    assert status == "error"


def test_resolve_spec_path_finds_conventional_name(tmp_path: Path):
    out_dir = tmp_path / "plan"
    out_dir.mkdir()
    spec = out_dir / "spec.md"
    spec.write_text("# Spec\n")
    found = _resolve_spec_path(out_dir, "plan body")
    # _resolve_spec_path looks relative to its out_dir argument.
    found = _resolve_spec_path(out_dir, "plan body")
    assert found == spec


def test_resolve_spec_path_uses_frontmatter(tmp_path: Path):
    out_dir = tmp_path / "plan"
    out_dir.mkdir()
    custom = out_dir / "my-source.md"
    custom.write_text("# Source\n")
    plan_text = "---\nslug: x\nspec_path: my-source.md\n---\n# Plan\n"
    found = _resolve_spec_path(out_dir, plan_text)
    assert found == custom


def test_resolve_spec_path_returns_none_when_missing(tmp_path: Path):
    out_dir = tmp_path / "plan"
    out_dir.mkdir()
    found = _resolve_spec_path(out_dir, "no frontmatter")
    assert found is None
