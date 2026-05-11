from pathlib import Path

from scripts.prompts import load_agent_definitions, load_skill_text


FIXTURES = Path(__file__).parent / "fixtures"


def test_load_agent_definitions_parses_frontmatter(tmp_path: Path):
    (tmp_path / "agents").mkdir()
    (tmp_path / "agents" / "sample.md").write_text(
        (FIXTURES / "sample-agent.md").read_text()
    )
    agents = load_agent_definitions(tmp_path / "agents")
    assert "sample" in agents
    a = agents["sample"]
    assert a.description == "A sample agent for tests"
    assert "Read" in (a.tools or [])
    assert a.model == "sonnet"
    assert "sample agent" in a.prompt.lower()


def test_load_agent_definitions_skips_non_md(tmp_path: Path):
    (tmp_path / "agents").mkdir()
    (tmp_path / "agents" / "README.txt").write_text("ignore me")
    agents = load_agent_definitions(tmp_path / "agents")
    assert agents == {}


def test_load_skill_text_concatenates(tmp_path: Path):
    (tmp_path / "lib" / "skill-one").mkdir(parents=True)
    (tmp_path / "lib" / "skill-one" / "SKILL.md").write_text("# Skill One\nbody one\n")
    (tmp_path / "lib" / "skill-two").mkdir(parents=True)
    (tmp_path / "lib" / "skill-two" / "SKILL.md").write_text("# Skill Two\nbody two\n")
    text = load_skill_text(tmp_path / "lib", names=["skill-one", "skill-two"])
    assert "Skill One" in text
    assert "Skill Two" in text


def test_load_skill_text_missing_skill_silently_skipped(tmp_path: Path):
    (tmp_path / "lib").mkdir()
    text = load_skill_text(tmp_path / "lib", names=["nope"])
    assert text == ""
