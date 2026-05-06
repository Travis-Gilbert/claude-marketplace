import subprocess
from pathlib import Path

from scripts.grounding import grep_for_topic, read_claude_md_chain, recent_commits_touching


def _init_git(repo: Path) -> None:
    subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.email", "test@test"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.name", "Test"], cwd=repo, check=True)


def test_grep_for_topic_returns_matching_files(tmp_path: Path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "auth.py").write_text("def login_user(): ...\n")
    (tmp_path / "src" / "noise.py").write_text("def unrelated(): ...\n")
    matches = grep_for_topic("login", repo_root=tmp_path, max_files=5)
    assert any("auth.py" in str(p) for p in matches)
    assert not any("noise.py" in str(p) for p in matches)


def test_grep_for_topic_caps_at_max_files(tmp_path: Path):
    (tmp_path / "src").mkdir()
    for i in range(20):
        (tmp_path / "src" / f"f{i}.py").write_text("login\n")
    matches = grep_for_topic("login", repo_root=tmp_path, max_files=3)
    assert len(matches) <= 3


def test_recent_commits_touching_returns_messages(tmp_path: Path):
    _init_git(tmp_path)
    (tmp_path / "a.py").write_text("hello")
    subprocess.run(["git", "add", "a.py"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-q", "-m", "feat: add a.py"], cwd=tmp_path, check=True)
    msgs = recent_commits_touching([Path("a.py")], repo_root=tmp_path, limit=5)
    assert any("add a.py" in m for m in msgs)


def test_recent_commits_empty_for_no_files(tmp_path: Path):
    _init_git(tmp_path)
    msgs = recent_commits_touching([], repo_root=tmp_path, limit=5)
    assert msgs == []


def test_read_claude_md_chain_concatenates(tmp_path: Path):
    (tmp_path / "CLAUDE.md").write_text("# Project\nrules\n")
    out = read_claude_md_chain(project_root=tmp_path, global_path=None)
    assert "# Project" in out
    assert "rules" in out


def test_read_claude_md_chain_handles_missing(tmp_path: Path):
    out = read_claude_md_chain(project_root=tmp_path, global_path=None)
    assert out == ""
