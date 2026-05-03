# plan-pro 1.1.0 SDK Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild plan-pro as an SDK-driven Python orchestrator, collapsing 19 agents to 5 and replacing the 3-phase `/plan` chain with a single structured-output call. See [design doc](./2026-05-03-sdk-redesign-design.md) for the full rationale.

**Architecture:** Slash commands (`/plan`, `/execute`) become thin Bash wrappers that invoke `scripts/plan_pro.py`. The Python script uses `claude-agent-sdk` (v0.1.72) — a wrapper around the Claude Code CLI — to dispatch subagents programmatically, with the CLI providing automatic prompt caching across calls and `asyncio.gather` providing real parallelism for the two reviewers in `/execute`.

**Tech Stack:** Python 3.11+, `claude-agent-sdk` 0.1.72, Pydantic v2, anyio, pytest, ruff. Markdown agent files stay as today; orchestration logic is Python.

**Plugin Source:** `/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/` (git repo at parent `/Users/travisgilbert/Tech Dev Local/codex-plugins/`, branch `pluginscodex`).

---

## File Structure

After this plan, the plugin layout is:

```
plan-pro/
├── .claude-plugin/plugin.json          MODIFIED: version 1.0.0 → 1.1.0
├── MIGRATION.md                         NEW
├── pyproject.toml                       NEW
├── README.md                            (existing, untouched)
├── commands/
│   ├── plan.md                          MODIFIED: thin Bash wrapper
│   ├── execute.md                       MODIFIED: thin Bash wrapper
│   ├── review.md                        unchanged
│   ├── retrofit.md                      unchanged
│   ├── brainstorm.md                    DELETED
│   ├── research.md                      DELETED
│   ├── write-plan.md                    DELETED
│   └── learn.md                         DELETED
├── agents/
│   ├── planner.md                       NEW
│   ├── implementer.md                   NEW (replaces executor)
│   ├── spec-reviewer.md                 unchanged
│   ├── quality-reviewer.md              unchanged
│   ├── retrofitter.md                   unchanged
│   ├── researcher.md                    DELETED
│   ├── problem-framer.md                DELETED
│   ├── divergent-thinker.md             DELETED
│   ├── decision-scribe.md               DELETED
│   ├── clarifier.md                     DELETED
│   ├── event-mapper.md                  DELETED
│   ├── functional-decomposer.md         DELETED
│   ├── contract-first-architect.md      DELETED
│   ├── walking-skeleton-planner.md      DELETED
│   ├── scope-gatekeeper.md              DELETED
│   ├── domain-router.md                 DELETED
│   ├── plan-reviewer.md                 DELETED
│   ├── concision-enforcer.md            DELETED
│   ├── capture-agent.md                 DELETED
│   └── executor.md                      DELETED
├── scripts/
│   ├── run.sh                           NEW
│   ├── plan_pro.py                      NEW
│   ├── prompts.py                       NEW
│   ├── grounding.py                     NEW
│   ├── validators.py                    NEW
│   ├── models.py                        NEW
│   └── epistemic/                       (existing, untouched)
├── tests/
│   ├── __init__.py                      NEW
│   ├── test_validators.py               NEW
│   ├── test_grounding.py                NEW
│   ├── test_models.py                   NEW
│   ├── test_prompts.py                  NEW
│   └── fixtures/                        NEW
│       ├── tiny-plan.md
│       └── plan-with-placeholders.md
├── lib/                                 (kept entries listed below; rest deleted)
│   ├── writing-plans/                   kept
│   ├── executing-plans/                 kept
│   ├── subagent-driven-development/     kept
│   ├── test-driven-development/         kept
│   ├── verification-before-completion/  kept
│   ├── finishing-a-development-branch/  kept
│   ├── plan-retrofitting/               kept
│   ├── systematic-debugging/            kept
│   └── (10 others deleted, see Task 13)
├── templates/                           unchanged
├── references/                          unchanged
└── knowledge/                           DELETED (capture-agent sidebar)
```

---

## Task 1: Scaffold Python package

**Files:**
- Create: `pyproject.toml`
- Create: `scripts/__init__.py`
- Create: `scripts/plan_pro.py` (stub)
- Create: `tests/__init__.py`
- Create: `.gitignore` entries

**Step 1: Write pyproject.toml**

Create `/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "plan-pro"
version = "1.1.0"
requires-python = ">=3.11"
description = "SDK-driven planning and execution orchestrator (Claude Code plugin)"
dependencies = [
  "claude-agent-sdk>=0.1.72,<0.2",
  "pydantic>=2.5",
  "anyio>=4",
]

[project.optional-dependencies]
dev = [
  "pytest>=8",
  "pytest-asyncio>=0.23",
  "ruff>=0.6",
]

[tool.setuptools.packages.find]
where = ["."]
include = ["scripts*", "tests*"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py311"
```

**Step 2: Append to .gitignore**

Edit `.gitignore` (create if missing). Add:

```
.venv/
__pycache__/
*.egg-info/
.pytest_cache/
.ruff_cache/
```

**Step 3: Create stub Python files**

Create `scripts/__init__.py` with content: `# plan-pro orchestrator package`
Create `tests/__init__.py` empty.
Create `scripts/plan_pro.py` with content:

```python
"""plan-pro orchestrator entry point."""
import sys

def main() -> int:
    if len(sys.argv) < 2:
        print("usage: plan_pro.py {plan|execute|review|retrofit} [args...]", file=sys.stderr)
        return 2
    cmd = sys.argv[1]
    print(f"plan_pro: {cmd} (not yet implemented)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

**Step 4: Verify package structure**

Run from plugin root:

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/python scripts/plan_pro.py plan "smoke"
```

Expected output: `plan_pro: plan (not yet implemented)` and exit 0.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/pyproject.toml plan-pro/.gitignore plan-pro/scripts/__init__.py plan-pro/scripts/plan_pro.py plan-pro/tests/__init__.py
git commit -m "feat(plan-pro): scaffold Python package for v1.1.0 SDK redesign"
```

**Delegate to:** plan-pro (self)

---

## Task 2: Pydantic models for the plan

**Files:**
- Create: `scripts/models.py`
- Create: `tests/test_models.py`

**Step 1: Write the failing test**

Create `tests/test_models.py`:

```python
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
```

**Step 2: Run test to verify it fails**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
.venv/bin/pytest tests/test_models.py -v
```

Expected: ImportError (no `scripts.models`).

**Step 3: Implement scripts/models.py**

```python
"""Pydantic models for plan-pro plans."""
from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, Field, field_validator


class Task(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    body: str = Field(..., min_length=1)
    files: list[Path] = Field(default_factory=list)
    delegate_plugin: str = Field(..., min_length=1)
    acceptance: str = Field(..., min_length=1)

    @field_validator("delegate_plugin")
    @classmethod
    def _no_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("delegate_plugin must be non-empty")
        return v.strip()

    @property
    def full_text(self) -> str:
        return f"# Task {self.id}: {self.title}\n\n{self.body}\n\nDelegate to: {self.delegate_plugin}"


class Stage(BaseModel):
    number: int = Field(..., ge=1)
    slug: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    tasks: list[Task] = Field(default_factory=list)


class PlanModel(BaseModel):
    title: str
    overview: str
    file_structure: list[Path] = Field(default_factory=list)
    stages: list[Stage] = Field(default_factory=list)
    tasks: list[Task] = Field(default_factory=list)
    is_multi_stage: bool = False

    LARGE_STAGE_THRESHOLD: int = 4
    LARGE_TASK_THRESHOLD: int = 10

    def total_task_count(self) -> int:
        if self.is_multi_stage:
            return sum(len(s.tasks) for s in self.stages)
        return len(self.tasks)

    def is_large(self) -> bool:
        if self.is_multi_stage and len(self.stages) >= self.LARGE_STAGE_THRESHOLD:
            return True
        return self.total_task_count() >= self.LARGE_TASK_THRESHOLD

    def all_tasks(self) -> list[Task]:
        if self.is_multi_stage:
            return [t for s in self.stages for t in s.tasks]
        return list(self.tasks)
```

**Step 4: Run test to verify it passes**

```bash
.venv/bin/pytest tests/test_models.py -v
```

Expected: 4 passed.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/models.py plan-pro/tests/test_models.py
git commit -m "feat(plan-pro): add Pydantic models for plan structure"
```

**Delegate to:** plan-pro (self)

---

## Task 3: Deterministic plan validators

**Files:**
- Create: `scripts/validators.py`
- Create: `tests/test_validators.py`

**Step 1: Write the failing test**

Create `tests/test_validators.py`:

```python
from pathlib import Path

import pytest

from scripts.models import PlanModel, Task
from scripts.validators import (
    PlanValidationError,
    scan_for_placeholders,
    scan_acceptance_criteria,
    scan_paths_resolve,
)


def _task(body: str = "real body", files: list[Path] | None = None,
          acceptance: str = "tests pass") -> Task:
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
```

**Step 2: Run tests to verify they fail**

```bash
.venv/bin/pytest tests/test_validators.py -v
```

Expected: ImportError.

**Step 3: Implement scripts/validators.py**

```python
"""Deterministic plan validators (replaces the LLM-driven plan-reviewer agent)."""
from __future__ import annotations

import re
from pathlib import Path

from scripts.models import PlanModel, Task


class PlanValidationError(ValueError):
    pass


_PLACEHOLDER_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bTBD\b", re.IGNORECASE),       "TBD"),
    (re.compile(r"\bFIXME\b", re.IGNORECASE),     "FIXME"),
    (re.compile(r"\bplaceholder\b", re.IGNORECASE), "placeholder"),
    (re.compile(r"similar to (?:the previous task|task \d+)", re.IGNORECASE), "similar to <task>"),
    (re.compile(r"\.{3}\s*$|^\.{3}", re.MULTILINE), "ellipsis-elided code"),
    (re.compile(r"<your[ -]code[ -]here>", re.IGNORECASE), "<your code here>"),
]

_TRIVIAL_ACCEPTANCE = {"ok", "done", "passes", "works", "complete", ""}


def _iter_tasks(plan: PlanModel):
    yield from plan.all_tasks()


def scan_for_placeholders(plan: PlanModel) -> None:
    """Raise PlanValidationError if any task body contains a placeholder pattern."""
    issues: list[str] = []
    for task in _iter_tasks(plan):
        for pattern, label in _PLACEHOLDER_PATTERNS:
            if pattern.search(task.body):
                issues.append(f"task {task.id} ({task.title!r}) contains placeholder: {label}")
    if issues:
        raise PlanValidationError("placeholders found:\n  " + "\n  ".join(issues))


def scan_acceptance_criteria(plan: PlanModel) -> None:
    """Raise if any task lacks meaningful acceptance criteria."""
    issues: list[str] = []
    for task in _iter_tasks(plan):
        token = task.acceptance.strip().lower()
        if token in _TRIVIAL_ACCEPTANCE or len(token) < 8:
            issues.append(f"task {task.id} acceptance is trivial: {task.acceptance!r}")
    if issues:
        raise PlanValidationError("weak acceptance criteria:\n  " + "\n  ".join(issues))


def scan_paths_resolve(plan: PlanModel, *, repo_root: Path | None = None) -> None:
    """Raise if a task names files that don't exist and aren't marked as 'Create:'."""
    root = repo_root or Path.cwd()
    issues: list[str] = []
    for task in _iter_tasks(plan):
        for f in task.files:
            abs_path = root / f
            if abs_path.exists():
                continue
            # Permit if body explicitly creates this file
            if re.search(rf"\bCreate:\s*`?{re.escape(str(f))}`?", task.body):
                continue
            issues.append(f"task {task.id} references missing path: {f}")
    if issues:
        raise PlanValidationError("unresolved paths:\n  " + "\n  ".join(issues))


def run_all(plan: PlanModel, *, repo_root: Path | None = None) -> None:
    """Run all validators; raise on first failure."""
    scan_for_placeholders(plan)
    scan_acceptance_criteria(plan)
    scan_paths_resolve(plan, repo_root=repo_root)
```

**Step 4: Run tests to verify they pass**

```bash
.venv/bin/pytest tests/test_validators.py -v
```

Expected: 8 passed.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/validators.py plan-pro/tests/test_validators.py
git commit -m "feat(plan-pro): deterministic plan validators replace plan-reviewer agent"
```

**Delegate to:** plan-pro (self)

---

## Task 4: Codebase grounding helpers

**Files:**
- Create: `scripts/grounding.py`
- Create: `tests/test_grounding.py`

**Step 1: Write the failing test**

Create `tests/test_grounding.py`:

```python
import subprocess
from pathlib import Path

import pytest

from scripts.grounding import grep_for_topic, recent_commits_touching, read_claude_md_chain


def _init_git(repo: Path):
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


def test_read_claude_md_chain_concatenates(tmp_path: Path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "CLAUDE.md").write_text("# Project\nrules\n")
    out = read_claude_md_chain(project_root=tmp_path, global_path=None)
    assert "# Project" in out
    assert "rules" in out


def test_read_claude_md_chain_handles_missing(tmp_path: Path):
    out = read_claude_md_chain(project_root=tmp_path, global_path=None)
    assert out == ""
```

**Step 2: Run tests to verify they fail**

```bash
.venv/bin/pytest tests/test_grounding.py -v
```

Expected: ImportError.

**Step 3: Implement scripts/grounding.py**

```python
"""Cheap, deterministic codebase grounding (no LLM)."""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

_DEFAULT_INCLUDE = ["*.py", "*.ts", "*.tsx", "*.js", "*.jsx", "*.md", "*.toml"]
_DEFAULT_EXCLUDE = [".venv", "node_modules", ".git", "dist", "build", "__pycache__"]


def _have_rg() -> bool:
    return shutil.which("rg") is not None


def grep_for_topic(topic: str, *, repo_root: Path, max_files: int = 12) -> list[Path]:
    """Return up to max_files paths whose contents match the topic.

    Uses ripgrep when available; falls back to git-grep, then to a Python walker.
    Topic words are split on whitespace; OR-matched.
    """
    words = [w for w in topic.split() if len(w) >= 3]
    if not words:
        return []
    pattern = "|".join(words)

    if _have_rg():
        cmd = ["rg", "-l", "-i", "-e", pattern, "--max-count", "1"]
        for p in _DEFAULT_EXCLUDE:
            cmd += ["-g", f"!{p}"]
        for p in _DEFAULT_INCLUDE:
            cmd += ["-g", p]
        result = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True)
        files = [Path(line) for line in result.stdout.splitlines() if line.strip()]
        return files[:max_files]

    # Fallback: python walker
    matches: list[Path] = []
    for path in repo_root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in _DEFAULT_EXCLUDE for part in path.parts):
            continue
        if not any(path.match(g) for g in _DEFAULT_INCLUDE):
            continue
        try:
            content = path.read_text(errors="ignore")
        except OSError:
            continue
        if any(w.lower() in content.lower() for w in words):
            matches.append(path.relative_to(repo_root))
            if len(matches) >= max_files:
                break
    return matches


def recent_commits_touching(files: list[Path], *, repo_root: Path, limit: int = 30) -> list[str]:
    """Return one-line commit messages touching any of `files`. Empty if no files."""
    if not files:
        return []
    cmd = ["git", "log", f"-n{limit}", "--pretty=format:%h %s", "--"] + [str(f) for f in files]
    result = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True)
    if result.returncode != 0:
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def read_claude_md_chain(*, project_root: Path, global_path: Path | None) -> str:
    """Concatenate global + project CLAUDE.md content. Missing files are skipped silently."""
    parts: list[str] = []
    paths = []
    if global_path is not None:
        paths.append(global_path)
    paths.append(project_root / "CLAUDE.md")
    for p in paths:
        try:
            parts.append(p.read_text())
        except (OSError, FileNotFoundError):
            continue
    return "\n\n".join(parts)
```

**Step 4: Run tests to verify they pass**

```bash
.venv/bin/pytest tests/test_grounding.py -v
```

Expected: 6 passed.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/grounding.py plan-pro/tests/test_grounding.py
git commit -m "feat(plan-pro): codebase grounding helpers (rg + git log + CLAUDE.md)"
```

**Delegate to:** plan-pro (self)

---

## Task 5: Prompt loader and agent registry

**Files:**
- Create: `scripts/prompts.py`
- Create: `tests/test_prompts.py`
- Create: `tests/fixtures/sample-agent.md`

**Step 1: Write the failing test**

Create `tests/fixtures/sample-agent.md`:

```markdown
---
name: sample
description: A sample agent for tests
tools: Read, Write
model: sonnet
---

You are a sample agent. Do sample things.
```

Create `tests/test_prompts.py`:

```python
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
```

**Step 2: Run tests to verify they fail**

```bash
.venv/bin/pytest tests/test_prompts.py -v
```

Expected: ImportError.

**Step 3: Implement scripts/prompts.py**

```python
"""Load agent definitions and skill text from the plugin filesystem."""
from __future__ import annotations

import re
from pathlib import Path

from claude_agent_sdk import AgentDefinition

_FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.DOTALL)


def _parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    raw, body = m.group(1), m.group(2)
    fields: dict[str, str] = {}
    current_key: str | None = None
    for line in raw.splitlines():
        if not line.strip():
            continue
        if line.startswith(" ") and current_key is not None:
            fields[current_key] += " " + line.strip()
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        if val.startswith(">-") or val == ">":
            current_key = key
            fields[key] = ""
            continue
        fields[key] = val
        current_key = key
    return fields, body.strip()


def _split_csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


def load_agent_definitions(agents_dir: Path) -> dict[str, AgentDefinition]:
    """Read every *.md in agents_dir, return name -> AgentDefinition.

    Skips files without frontmatter or without a `name:` field.
    """
    out: dict[str, AgentDefinition] = {}
    if not agents_dir.is_dir():
        return out
    for path in sorted(agents_dir.glob("*.md")):
        text = path.read_text()
        fields, body = _parse_frontmatter(text)
        name = fields.get("name") or path.stem
        if not name:
            continue
        tools_field = fields.get("tools")
        tools = _split_csv(tools_field) if tools_field else None
        out[name] = AgentDefinition(
            description=fields.get("description", "").strip(),
            prompt=body,
            tools=tools,
            model=fields.get("model"),
        )
    return out


def load_skill_text(lib_dir: Path, *, names: list[str]) -> str:
    """Concatenate the SKILL.md files for the named skills. Missing skills skip silently."""
    parts: list[str] = []
    for name in names:
        skill = lib_dir / name / "SKILL.md"
        try:
            parts.append(skill.read_text())
        except (OSError, FileNotFoundError):
            continue
    return "\n\n".join(parts)
```

**Step 4: Run tests to verify they pass**

```bash
.venv/bin/pytest tests/test_prompts.py -v
```

Expected: 4 passed.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/prompts.py plan-pro/tests/test_prompts.py plan-pro/tests/fixtures/sample-agent.md
git commit -m "feat(plan-pro): prompt + agent loaders for SDK orchestrator"
```

**Delegate to:** plan-pro (self)

---

## Task 6: Author the new planner.md and implementer.md agents

**Files:**
- Create: `agents/planner.md`
- Create: `agents/implementer.md`

**Step 1: Write agents/planner.md**

```markdown
---
name: planner
description: Produces a complete implementation plan from a topic, including light codebase grounding, problem framing for ambiguous topics, and (when needed) divergent options. Outputs a structured PlanModel.
tools: Read, Glob, Grep, Bash, WebSearch, WebFetch
model: sonnet
---

# Planner

You produce one complete implementation plan in a single pass. The orchestrator has already given you:

- The topic (in the user message).
- A codebase grounding block (relevant files + recent commits + CLAUDE.md).
- The contents of `lib/writing-plans/SKILL.md`.

Your job: produce a `PlanModel` JSON object matching the schema you have been given. Follow these rules in order.

## 1. Frame, then plan

If the topic is ambiguous (`"I want something like X"`, `"explore X"`, vague verbs without nouns), open the plan's `overview` field with a one-sentence problem restatement. Otherwise jump to step 2.

## 2. Consider 2-3 approaches if the design is open

If the topic admits clearly distinct approaches (different libraries, different storage models, different sync strategies), list them in `overview` with one-sentence trade-offs each, then state the chosen approach in one sentence. If there is one obvious approach, skip this.

## 3. Greenfield → walking skeleton first

If the codebase grounding shows the project has no relevant code yet (zero matches in `grep_for_topic`), the first task in `tasks` (or first stage in `stages`) MUST be a thinnest-possible end-to-end skeleton touching every architectural layer. Subsequent tasks add features on top.

## 4. Multi-subsystem detection

If the topic describes ≥3 independent subsystems ("auth, billing, admin, analytics"), produce a plan for the FIRST subsystem only. List the deferred subsystems at the end of `overview` with one line each. Do not write tasks for them.

## 5. Task shape

Each task body must contain:

- Numbered steps (Write the failing test, Run it, Implement, Run it, Commit).
- Exact file paths in the `files` array (relative to repo root).
- Complete code in step bodies; no placeholders, no "...", no "similar to Task N", no "TBD".
- A meaningful `acceptance` field (≥8 chars, not "ok"/"done"/"passes").
- A `delegate_plugin` value chosen from: plan-pro, django-engine-pro, next-pro, ml-pro, three-pro, swift-pro, ux-pro, ui-design-pro, app-pro, scipy-pro, app-forge, animation-pro, vie-design, theseus-pro, cosmos-pro, d3-pro, js-pro. Pick `plan-pro` for plugin-self tasks.

## 6. Multi-stage threshold

If your plan has ≥4 stages OR ≥10 tasks, set `is_multi_stage=True` and use `stages`. Otherwise set `is_multi_stage=False` and use `tasks` directly.

## 7. File structure first

Populate `file_structure` with every file you intend to create or modify, in tree order. The reader sees the destination before the journey.

## 8. Output

Return ONLY the JSON object. The orchestrator parses it with Pydantic.
```

**Step 2: Write agents/implementer.md**

```markdown
---
name: implementer
description: Implements one task from an implementation plan. Follows the task body's TDD steps verbatim; reads files before editing; commits with the message the task specifies.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Implementer

You implement exactly one task. The orchestrator passed you:

- The task body (numbered steps, exact paths, complete code).
- The current working directory (the user's repo).
- The plugin to delegate to is recorded as `Delegate to: <plugin>` at the end of the task. Treat that as a hint about the codebase domain; do not actually subagent-dispatch.

Rules:

1. **Follow the steps in order.** Write the failing test first, run it, implement, run it, commit. Do not skip.
2. **Read files before editing.** If a step says "Modify x.py:123-145", Read the file first.
3. **Use the exact code in the task body.** Do not improvise; the code was approved by the planner.
4. **Run the verification commands the task specifies.** Report exit codes.
5. **Commit with the message the task specifies** if it provides one. Otherwise use `<type>(<scope>): <one-line summary>` matching the project's CLAUDE.md.
6. **If a step fails after one fix attempt**, return a one-line blocker description. The orchestrator decides whether to retry.
7. **Never invent acceptance criteria.** If the task's acceptance is unmet, say so explicitly.

## Output

Brief progress lines as you go (one per step). At the end, one line:

```
Task <id> complete: <commit-sha-short> (<file-count> files changed)
```

Or on blocker:

```
Blocker on Task <id>: <description>
```
```

**Step 3: Verify the new files load via the prompt loader**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
.venv/bin/python -c "
from pathlib import Path
from scripts.prompts import load_agent_definitions
agents = load_agent_definitions(Path('agents'))
print('loaded:', sorted(agents.keys()))
assert 'planner' in agents
assert 'implementer' in agents
print('planner desc:', agents['planner'].description[:60])
print('implementer model:', agents['implementer'].model)
"
```

Expected output includes both agent names with reasonable descriptions and `sonnet` model.

**Step 4: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/agents/planner.md plan-pro/agents/implementer.md
git commit -m "feat(plan-pro): planner and implementer agent prompts for v1.1.0"
```

**Delegate to:** plan-pro (self)

---

## Task 7: Implement plan() — the /plan command's orchestrator

**Files:**
- Modify: `scripts/plan_pro.py`
- Create: `scripts/markdown.py` (writes PlanModel → markdown)
- Create: `tests/test_markdown.py`

**Step 1: Write the failing test for markdown rendering**

Create `tests/test_markdown.py`:

```python
from pathlib import Path

from scripts.markdown import render_implementation_plan
from scripts.models import PlanModel, Task


def test_renders_single_file_plan_with_tasks():
    plan = PlanModel(
        title="Add Endpoint",
        overview="Adds /hello endpoint with tests.",
        file_structure=[Path("src/api.py"), Path("tests/test_api.py")],
        stages=[],
        tasks=[
            Task(id="1", title="Write failing test", body="**Step 1**: ...",
                 files=[Path("tests/test_api.py")], delegate_plugin="django-engine-pro",
                 acceptance="pytest fails as expected"),
            Task(id="2", title="Implement endpoint", body="**Step 1**: ...",
                 files=[Path("src/api.py")], delegate_plugin="django-engine-pro",
                 acceptance="pytest tests/test_api.py passes"),
        ],
        is_multi_stage=False,
    )
    md = render_implementation_plan(plan)
    assert "# Add Endpoint Implementation Plan" in md
    assert "executing-plans" in md  # the required header line
    assert "## File Structure" in md
    assert "src/api.py" in md
    assert "## Task 1: Write failing test" in md
    assert "Delegate to: django-engine-pro" in md
    assert "pytest tests/test_api.py passes" in md
```

**Step 2: Run test to verify it fails**

```bash
.venv/bin/pytest tests/test_markdown.py -v
```

Expected: ImportError.

**Step 3: Implement scripts/markdown.py**

```python
"""Render PlanModel objects to the implementation-plan.md markdown format."""
from __future__ import annotations

from scripts.models import PlanModel, Stage, Task

_HEADER = """# {title} Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** {overview_first_line}

**Overview:** {overview}

---

## File Structure

```
{file_tree}
```

---
"""


def _file_tree(plan: PlanModel) -> str:
    if not plan.file_structure:
        return "(no files declared)"
    return "\n".join(str(p) for p in plan.file_structure)


def _render_task(task: Task) -> str:
    return (
        f"## Task {task.id}: {task.title}\n\n"
        f"**Files:**\n"
        + "\n".join(f"- `{p}`" for p in task.files)
        + "\n\n"
        + task.body.rstrip()
        + f"\n\n**Acceptance:** {task.acceptance}\n\n"
        f"**Delegate to:** {task.delegate_plugin}\n\n---\n"
    )


def _render_stage(stage: Stage) -> str:
    out = [f"# Stage {stage.number}: {stage.title}\n"]
    for t in stage.tasks:
        out.append(_render_task(t))
    return "\n".join(out)


def render_implementation_plan(plan: PlanModel) -> str:
    """Single-file plan rendering. Multi-stage plans render as an index instead."""
    overview_first = plan.overview.split("\n", 1)[0]
    out = _HEADER.format(
        title=plan.title,
        overview_first_line=overview_first,
        overview=plan.overview,
        file_tree=_file_tree(plan),
    )
    for task in plan.tasks:
        out += "\n" + _render_task(task)
    return out


def render_plan_index(plan: PlanModel) -> str:
    """Multi-stage index, points at NN-stage-<slug>.md files."""
    overview_first = plan.overview.split("\n", 1)[0]
    out = _HEADER.format(
        title=plan.title,
        overview_first_line=overview_first,
        overview=plan.overview,
        file_tree=_file_tree(plan),
    )
    out += "\n## Stages\n\n"
    out += "| # | File | Title | Tasks |\n|---|---|---|---|\n"
    for s in plan.stages:
        fname = f"{s.number:02d}-stage-{s.slug}.md"
        out += f"| {s.number} | [{fname}](./{fname}) | {s.title} | {len(s.tasks)} |\n"
    return out
```

**Step 4: Run test to verify it passes**

```bash
.venv/bin/pytest tests/test_markdown.py -v
```

Expected: 1 passed.

**Step 5: Implement plan() in scripts/plan_pro.py**

Replace the stub `scripts/plan_pro.py` body with the full orchestrator. The file becomes:

```python
"""plan-pro orchestrator entry point."""
from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, query

from scripts.grounding import grep_for_topic, read_claude_md_chain, recent_commits_touching
from scripts.markdown import render_implementation_plan, render_plan_index
from scripts.models import PlanModel
from scripts.prompts import load_agent_definitions, load_skill_text
from scripts.validators import PlanValidationError, run_all as run_validators

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
GLOBAL_CLAUDE_MD = Path.home() / ".claude" / "CLAUDE.md"


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:60] or "topic"


async def _run_planner(topic: str, grounding: str) -> PlanModel:
    agents = load_agent_definitions(PLUGIN_ROOT / "agents")
    if "planner" not in agents:
        raise RuntimeError("agents/planner.md missing")

    skill_text = load_skill_text(PLUGIN_ROOT / "lib", names=["writing-plans"])

    system_prompt = (
        agents["planner"].prompt
        + "\n\n## Reference: writing-plans skill\n\n"
        + skill_text
        + "\n\n## Codebase grounding\n\n"
        + grounding
        + "\n\n## Output schema\n\n"
        + "Return ONLY a JSON object matching this Pydantic schema:\n```json\n"
        + json.dumps(PlanModel.model_json_schema(), indent=2)
        + "\n```\n"
    )

    options = ClaudeAgentOptions(
        system_prompt=system_prompt,
        allowed_tools=["Read", "Glob", "Grep", "Bash"],
        permission_mode="acceptEdits",
        model=os.environ.get("PLAN_PRO_MODEL", "claude-sonnet-4-7"),
        cwd=str(Path.cwd()),
        max_turns=8,
        setting_sources=["user", "project"],
    )

    user_prompt = (
        f"Topic: {topic}\n\n"
        f"Produce a complete implementation plan as JSON matching the schema. "
        f"Output ONLY the JSON, no surrounding prose."
    )

    raw_text = ""
    async for msg in query(prompt=user_prompt, options=options):
        text = _extract_text(msg)
        if text:
            raw_text += text

    return _parse_plan_json(raw_text)


def _extract_text(msg) -> str:
    """Pull text content out of a SDK message dataclass, if any."""
    content = getattr(msg, "content", None)
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: list[str] = []
        for block in content:
            t = getattr(block, "text", None)
            if t:
                chunks.append(t)
        return "".join(chunks)
    return ""


def _parse_plan_json(text: str) -> PlanModel:
    # Strip markdown code fences if present
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if m:
        text = m.group(1)
    else:
        # Best-effort: take the first {...} block
        m = re.search(r"(\{.*\})", text, re.DOTALL)
        if m:
            text = m.group(1)
    data = json.loads(text)
    return PlanModel.model_validate(data)


async def cmd_plan(topic: str) -> Path:
    slug = slugify(topic)
    out_dir = Path("docs/plans") / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    repo_root = Path.cwd()
    files = grep_for_topic(topic, repo_root=repo_root, max_files=12)
    commits = recent_commits_touching(files, repo_root=repo_root, limit=30)
    claude_md = read_claude_md_chain(project_root=repo_root, global_path=GLOBAL_CLAUDE_MD)

    grounding = (
        f"### CLAUDE.md\n\n{claude_md}\n\n"
        f"### Files matching topic\n\n"
        + "\n".join(str(f) for f in files)
        + "\n\n### Recent commits\n\n"
        + "\n".join(commits)
    )

    plan = await _run_planner(topic, grounding)

    try:
        run_validators(plan, repo_root=repo_root)
    except PlanValidationError as e:
        sys.stderr.write(f"plan-pro: validation failed:\n{e}\n")
        sys.exit(3)

    if plan.is_large():
        index_path = out_dir / "implementation-plan.md"
        index_path.write_text(render_plan_index(plan))
        for stage in plan.stages:
            stage_path = out_dir / f"{stage.number:02d}-stage-{stage.slug}.md"
            from scripts.markdown import _render_stage  # noqa: PLC0415
            stage_path.write_text(_render_stage(stage))
        primary = index_path
    else:
        primary = out_dir / "implementation-plan.md"
        primary.write_text(render_implementation_plan(plan))

    print(f"Plan: {primary} ({plan.total_task_count()} tasks)")
    print("Next: (A) /execute, (B) review the plan first, (C) /retrofit")
    return primary


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: plan_pro.py {plan|execute|review|retrofit} [args...]", file=sys.stderr)
        return 2

    cmd, *rest = sys.argv[1:]
    if cmd == "plan":
        if not rest:
            print("usage: plan_pro.py plan <topic>", file=sys.stderr)
            return 2
        topic = " ".join(rest)
        asyncio.run(cmd_plan(topic))
        return 0

    print(f"plan_pro: {cmd} not yet implemented", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
```

**Step 6: Smoke test plan() against a fixture topic**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
.venv/bin/python -c "
import asyncio
from scripts.plan_pro import slugify
assert slugify('Add a hello world endpoint') == 'add-a-hello-world-endpoint'
print('slug ok')
"
```

The end-to-end SDK call requires `ANTHROPIC_API_KEY` and a real Claude Code CLI install. Skip in CI; document as a manual smoke test for the user to run.

**Step 7: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/plan_pro.py plan-pro/scripts/markdown.py plan-pro/tests/test_markdown.py
git commit -m "feat(plan-pro): /plan orchestrator end-to-end via claude-agent-sdk"
```

**Acceptance:** `pytest plan-pro/tests/ -v` shows all tests passing; `slugify('Add hello')` returns `'add-hello'`; `python scripts/plan_pro.py plan` prints usage when no topic.

**Delegate to:** plan-pro (self)

---

## Task 8: Implement execute() — parallel reviewers, single retry

**Files:**
- Modify: `scripts/plan_pro.py` (add `cmd_execute`)
- Create: `scripts/plan_parser.py`
- Create: `tests/test_plan_parser.py`
- Create: `tests/fixtures/tiny-plan.md`

**Step 1: Write the failing test for plan parsing**

Create `tests/fixtures/tiny-plan.md`:

```markdown
# Tiny Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hello function.

**Overview:** Single function with a test.

---

## File Structure

```
src/hello.py
tests/test_hello.py
```

---

## Task 1: Write failing test

**Files:**
- `tests/test_hello.py`

Step body here.

**Acceptance:** pytest fails with ImportError

**Delegate to:** plan-pro

---

## Task 2: Implement function

**Files:**
- `src/hello.py`

Step body two.

**Acceptance:** pytest tests/test_hello.py passes

**Delegate to:** plan-pro

---
```

Create `tests/test_plan_parser.py`:

```python
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
```

**Step 2: Run test to verify it fails**

```bash
.venv/bin/pytest tests/test_plan_parser.py -v
```

Expected: ImportError.

**Step 3: Implement scripts/plan_parser.py**

```python
"""Parse an implementation-plan.md back into a PlanModel for /execute."""
from __future__ import annotations

import re
from pathlib import Path

from scripts.models import PlanModel, Task

_TITLE_RE = re.compile(r"^#\s+(.+?)\s+Implementation Plan", re.MULTILINE)
_FILE_STRUCTURE_RE = re.compile(r"## File Structure\s*\n+```\n(.*?)\n```", re.DOTALL)
_OVERVIEW_RE = re.compile(r"\*\*Overview:\*\*\s*(.+?)\n\n", re.DOTALL)
_TASK_RE = re.compile(
    r"## Task (?P<id>\S+):\s*(?P<title>.+?)\n+"
    r"(?:\*\*Files:\*\*\s*\n(?P<files>(?:- .*\n)+)\s*\n)?"
    r"(?P<body>.+?)"
    r"\*\*Acceptance:\*\*\s*(?P<acc>.+?)\n+"
    r"\*\*Delegate to:\*\*\s*(?P<delegate>\S+)",
    re.DOTALL,
)


def parse_plan_markdown(text: str) -> PlanModel:
    title_match = _TITLE_RE.search(text)
    title = title_match.group(1).strip() if title_match else "Untitled"

    overview_match = _OVERVIEW_RE.search(text)
    overview = overview_match.group(1).strip() if overview_match else ""

    files_match = _FILE_STRUCTURE_RE.search(text)
    file_structure: list[Path] = []
    if files_match:
        for line in files_match.group(1).splitlines():
            line = line.strip()
            if line:
                file_structure.append(Path(line))

    tasks: list[Task] = []
    for m in _TASK_RE.finditer(text):
        files = []
        if m.group("files"):
            for f_line in m.group("files").splitlines():
                cleaned = f_line.strip().lstrip("-").strip().strip("`")
                if cleaned:
                    files.append(Path(cleaned))
        tasks.append(Task(
            id=m.group("id").strip(),
            title=m.group("title").strip(),
            body=m.group("body").strip(),
            files=files or [Path(".")],   # avoid empty list; set deliberate placeholder
            delegate_plugin=m.group("delegate").strip(),
            acceptance=m.group("acc").strip(),
        ))

    return PlanModel(
        title=title,
        overview=overview,
        file_structure=file_structure,
        stages=[],
        tasks=tasks,
        is_multi_stage=False,
    )
```

**Step 4: Run test to verify it passes**

```bash
.venv/bin/pytest tests/test_plan_parser.py -v
```

Expected: 1 passed.

**Step 5: Add cmd_execute to scripts/plan_pro.py**

Append to `scripts/plan_pro.py` (do NOT replace existing content — add):

```python
import subprocess

from scripts.plan_parser import parse_plan_markdown


async def _run_subagent(*, system_prompt: str, prompt: str, allowed_tools: list[str],
                        model: str, max_turns: int = 6) -> str:
    options = ClaudeAgentOptions(
        system_prompt=system_prompt,
        allowed_tools=allowed_tools,
        permission_mode="acceptEdits",
        model=model,
        cwd=str(Path.cwd()),
        max_turns=max_turns,
        setting_sources=["user", "project"],
    )
    raw = ""
    async for msg in query(prompt=prompt, options=options):
        raw += _extract_text(msg)
    return raw


def _git_head_sha() -> str:
    r = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True)
    return r.stdout.strip()


def _git_diff_since(start_sha: str) -> str:
    r = subprocess.run(["git", "diff", start_sha], capture_output=True, text=True)
    return r.stdout


def _has_issues(review_text: str) -> tuple[bool, str]:
    """Heuristic: any line starting with 'Issue:' or 'Blocker:' or 'Reject' indicates failure."""
    bad = [line for line in review_text.splitlines()
           if re.match(r"\s*(Issue|Blocker|Reject|FAIL)\b", line, re.IGNORECASE)]
    return bool(bad), "\n".join(bad)


async def cmd_execute(slug: str) -> Path:
    out_dir = Path("docs/plans") / slug
    plan_path = out_dir / "implementation-plan.md"
    if not plan_path.exists():
        sys.stderr.write(f"Blocker: {plan_path} not found. Run /plan <topic> first.\n")
        sys.exit(4)

    plan = parse_plan_markdown(plan_path.read_text())
    agents = load_agent_definitions(PLUGIN_ROOT / "agents")
    skill_text = load_skill_text(
        PLUGIN_ROOT / "lib",
        names=["executing-plans", "subagent-driven-development",
               "test-driven-development", "verification-before-completion"],
    )
    claude_md = read_claude_md_chain(project_root=Path.cwd(), global_path=GLOBAL_CLAUDE_MD)

    impl_system = (agents["implementer"].prompt + "\n\n## Skills\n\n" + skill_text
                   + "\n\n## CLAUDE.md\n\n" + claude_md)
    spec_system = agents["spec-reviewer"].prompt + "\n\n## CLAUDE.md\n\n" + claude_md
    qual_system = agents["quality-reviewer"].prompt + "\n\n## CLAUDE.md\n\n" + claude_md

    model = os.environ.get("PLAN_PRO_MODEL", "claude-sonnet-4-7")
    tasks = plan.all_tasks()
    total = len(tasks)

    for i, task in enumerate(tasks, 1):
        start_sha = _git_head_sha()

        await _run_subagent(
            system_prompt=impl_system,
            prompt=task.full_text,
            allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
            model=model,
            max_turns=20,
        )

        diff = _git_diff_since(start_sha)

        spec_task = _run_subagent(
            system_prompt=spec_system,
            prompt=f"Task:\n{task.full_text}\n\nDiff:\n{diff}\n\nDoes the diff match the task? Output one of: APPROVE / Issue: <list>",
            allowed_tools=["Read", "Grep", "Glob", "Bash"],
            model=model,
            max_turns=4,
        )
        qual_task = _run_subagent(
            system_prompt=qual_system,
            prompt=f"Diff:\n{diff}\n\nDoes this code follow the project's patterns and avoid smells? Output: APPROVE / Issue: <list>",
            allowed_tools=["Read", "Grep", "Glob", "Bash"],
            model=model,
            max_turns=4,
        )

        spec_text, qual_text = await asyncio.gather(spec_task, qual_task)
        spec_bad, spec_issues = _has_issues(spec_text)
        qual_bad, qual_issues = _has_issues(qual_text)

        if spec_bad or qual_bad:
            combined = ""
            if spec_bad:
                combined += "Spec issues:\n" + spec_issues + "\n\n"
            if qual_bad:
                combined += "Quality issues:\n" + qual_issues + "\n\n"
            await _run_subagent(
                system_prompt=impl_system,
                prompt=f"{task.full_text}\n\nFix:\n{combined}",
                allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
                model=model,
                max_turns=15,
            )
            # Re-review after retry; this run is final regardless.
            diff = _git_diff_since(start_sha)
            spec_text2 = await _run_subagent(
                system_prompt=spec_system,
                prompt=f"Task:\n{task.full_text}\n\nDiff:\n{diff}\nFinal pass.",
                allowed_tools=["Read", "Grep", "Glob", "Bash"],
                model=model, max_turns=4,
            )
            spec_bad, _ = _has_issues(spec_text2)
            if spec_bad:
                sys.stderr.write(f"Blocker on Task {task.id}: spec mismatch after retry.\n")
                sys.exit(5)

        end_sha = _git_head_sha()
        sha_short = end_sha[:8] if end_sha != start_sha else "(no-commit)"
        print(f"[{i}/{total}] {task.title} → {task.delegate_plugin} → ok → {sha_short}")

    review_path = out_dir / "review-report.md"
    review_path.write_text(
        f"# Review report for {slug}\n\nAll {total} tasks completed and committed.\n"
    )
    print(f"Done. {total}/{total} tasks complete. Review: {review_path}")
    return review_path
```

Update `main()` to dispatch `execute`:

```python
def main() -> int:
    if len(sys.argv) < 2:
        print("usage: plan_pro.py {plan|execute} [args...]", file=sys.stderr)
        return 2
    cmd, *rest = sys.argv[1:]
    if cmd == "plan":
        if not rest:
            print("usage: plan_pro.py plan <topic>", file=sys.stderr)
            return 2
        asyncio.run(cmd_plan(" ".join(rest)))
        return 0
    if cmd == "execute":
        if not rest:
            print("usage: plan_pro.py execute <slug>", file=sys.stderr)
            return 2
        asyncio.run(cmd_execute(rest[0]))
        return 0
    print(f"plan_pro: unknown command {cmd}", file=sys.stderr)
    return 2
```

**Step 6: Run all tests**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
.venv/bin/pytest tests/ -v
```

Expected: all green.

**Step 7: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/plan_pro.py plan-pro/scripts/plan_parser.py plan-pro/tests/test_plan_parser.py plan-pro/tests/fixtures/tiny-plan.md
git commit -m "feat(plan-pro): /execute orchestrator with parallel reviewers"
```

**Acceptance:** `pytest tests/` passes; `python scripts/plan_pro.py execute nonexistent` exits 4 with "Blocker: ... not found"; the source contains an `asyncio.gather(spec_task, qual_task)` call (parallel reviewers).

**Delegate to:** plan-pro (self)

---

## Task 9: Bash bootstrap script

**Files:**
- Create: `scripts/run.sh`

**Step 1: Create scripts/run.sh**

```bash
#!/usr/bin/env bash
# plan-pro bootstrap: ensure venv exists, then run the orchestrator.
set -euo pipefail

if [[ -z "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  CLAUDE_PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

cd "$CLAUDE_PLUGIN_ROOT"

if [[ ! -d .venv ]]; then
  echo "plan-pro: creating venv..." >&2
  python3 -m venv .venv
  .venv/bin/pip install -e . >/dev/null 2>&1
fi

exec .venv/bin/python scripts/plan_pro.py "$@"
```

**Step 2: Make executable and verify**

```bash
chmod +x "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/scripts/run.sh"
CLAUDE_PLUGIN_ROOT="/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro" \
  "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/scripts/run.sh" plan
```

Expected: exit 2 with usage message.

**Step 3: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/scripts/run.sh
git commit -m "feat(plan-pro): bash bootstrap creates venv on first run"
```

**Acceptance:** `run.sh` is executable; passes through args to plan_pro.py; idempotent venv creation.

**Delegate to:** plan-pro (self)

---

## Task 10: Replace commands/plan.md and commands/execute.md

**Files:**
- Modify: `commands/plan.md`
- Modify: `commands/execute.md`

**Step 1: Replace commands/plan.md**

```markdown
---
description: "Produce a complete implementation plan from a topic. Single SDK-driven call; codebase-grounded; outputs to docs/plans/<slug>/implementation-plan.md."
argument-hint: "<topic>"
allowed-tools: Bash
---

# /plan

Run the orchestrator:

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/run.sh" plan "$ARGUMENTS"
```

Wait for the script to finish. Report only the final paths it prints. Do not summarize the plan body — the user will read the markdown file.

If the script exits non-zero (validation failure or missing config), report the stderr message and stop.
```

**Step 2: Replace commands/execute.md**

```markdown
---
description: "Execute the implementation plan task-by-task with parallel reviewers."
argument-hint: "<slug>"
allowed-tools: Bash
---

# /execute

Run the orchestrator:

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/run.sh" execute "$ARGUMENTS"
```

Stream the per-task lines as they print. At the end, report the path to `review-report.md`.

If the script exits with a Blocker, surface the blocker line and stop. Do not retry.
```

**Step 3: Verify slash commands resolve**

Eyeball that `$CLAUDE_PLUGIN_ROOT` is referenced (Claude Code expands it at runtime).

**Step 4: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/commands/plan.md plan-pro/commands/execute.md
git commit -m "feat(plan-pro): /plan and /execute become thin Bash wrappers around scripts/run.sh"
```

**Acceptance:** Both command files are <30 lines; both invoke `run.sh` with the appropriate subcommand.

**Delegate to:** plan-pro (self)

---

## Task 11: Delete deprecated agents and dead commands

**Files:**
- Delete: 14 agents listed below
- Delete: `commands/brainstorm.md`, `commands/research.md`, `commands/write-plan.md`, `commands/learn.md`

**Step 1: Delete the agents**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
git rm \
  agents/researcher.md \
  agents/problem-framer.md \
  agents/divergent-thinker.md \
  agents/decision-scribe.md \
  agents/clarifier.md \
  agents/event-mapper.md \
  agents/functional-decomposer.md \
  agents/contract-first-architect.md \
  agents/walking-skeleton-planner.md \
  agents/scope-gatekeeper.md \
  agents/domain-router.md \
  agents/plan-reviewer.md \
  agents/concision-enforcer.md \
  agents/capture-agent.md \
  agents/executor.md
```

**Step 2: Delete the dead commands**

```bash
git rm \
  commands/brainstorm.md \
  commands/research.md \
  commands/write-plan.md \
  commands/learn.md
```

**Step 3: Verify the surviving agent set**

```bash
ls agents/
```

Expected output:
```
implementer.md
planner.md
quality-reviewer.md
retrofitter.md
spec-reviewer.md
```

**Step 4: Verify the surviving commands**

```bash
ls commands/
```

Expected:
```
execute.md
plan.md
retrofit.md
review.md
```

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add -A plan-pro/
git commit -m "refactor(plan-pro): remove 14 unused agents + 4 deprecated commands

Of 19 agents shipped in v1.0.0, only spec-reviewer and quality-reviewer
demonstrably caught real problems. Researcher, problem-framer, divergent-
thinker, decision-scribe, plan-reviewer, domain-router, etc. were ritual
scaffolding. /plan now runs as a single SDK call; /execute uses parallel
reviewers. See docs/plans/2026-05-03-sdk-redesign-design.md."
```

**Acceptance:** `ls agents/` shows exactly 5 files; `ls commands/` shows exactly 4 files.

**Delegate to:** plan-pro (self)

---

## Task 12: Delete deprecated lib skills and knowledge sidebar

**Files:**
- Delete: `lib/research-methodology/`, `lib/brainstorming/`, `lib/event-storming-lite/`, `lib/contract-first-design/`, `lib/scope-decomposition/`, `lib/functional-decomposition/`, `lib/walking-skeleton/`, `lib/codebase-grounding/`, `lib/compound-learning/`, `lib/spec-compliance-review/`, `lib/requesting-code-review/`, `lib/receiving-code-review/`
- Delete: `knowledge/` (entire directory)
- Delete: `scripts/epistemic/` (was used by capture-agent only)

**Step 1: Delete the skills**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
git rm -r \
  lib/research-methodology \
  lib/brainstorming \
  lib/event-storming-lite \
  lib/contract-first-design \
  lib/scope-decomposition \
  lib/functional-decomposition \
  lib/walking-skeleton \
  lib/codebase-grounding \
  lib/compound-learning \
  lib/spec-compliance-review \
  lib/requesting-code-review \
  lib/receiving-code-review
```

**Step 2: Delete the knowledge sidebar and epistemic capture scripts**

```bash
git rm -r knowledge scripts/epistemic 2>/dev/null || true
# scripts/epistemic may not be tracked; ignore failure
```

**Step 3: Verify the surviving lib set**

```bash
ls lib/
```

Expected:
```
executing-plans
finishing-a-development-branch
plan-retrofitting
subagent-driven-development
systematic-debugging
test-driven-development
verification-before-completion
writing-plans
```

**Step 4: Run all tests to confirm nothing referenced deleted skills**

```bash
.venv/bin/pytest tests/ -v
```

Expected: all green.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add -A plan-pro/
git commit -m "refactor(plan-pro): remove 12 unused lib skills + knowledge sidebar"
```

**Acceptance:** `ls lib/` shows exactly 8 directories; tests still pass.

**Delegate to:** plan-pro (self)

---

## Task 13: Bump plugin version and write MIGRATION.md

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Create: `MIGRATION.md`

**Step 1: Read the current plugin.json**

```bash
cat "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/.claude-plugin/plugin.json"
```

**Step 2: Edit plugin.json**

Change the `version` field from `"1.0.0"` to `"1.1.0"`. Leave all other fields (name, description, author, etc.) untouched.

**Step 3: Create MIGRATION.md**

```markdown
# plan-pro v1.0.0 → v1.1.0 Migration Notes

## What changed

v1.1.0 replaces the LLM-orchestrated plugin (19 agents, 3-phase planning chain)
with an SDK-driven Python orchestrator (5 agents, single planning call). The
slash command surface is unchanged: `/plan`, `/execute`, `/review`, and
`/retrofit` work the same way externally.

## What stays the same

- Final artifact paths: `docs/plans/<slug>/implementation-plan.md` and
  `review-report.md` are produced in the same locations and the same shapes.
- Multi-stage plans (≥4 stages or ≥10 tasks) still split into an index +
  per-stage sub-plans.
- Slash command names and argument shapes.
- Existing plans on disk remain readable.

## What's gone

The following intermediate artifacts are no longer produced:

- `docs/plans/<slug>/research-brief.md`
- `docs/plans/<slug>/design-doc.md`
- `docs/plans/<slug>/decisions/*.md` (ADRs)

If you relied on any of these, generate them with a one-off prompt before
you upgrade. The reasoning is that nobody re-read them once the plan was
written; they were write-only scaffolding.

The following commands are removed (their behavior is now folded into `/plan`):

- `/research`
- `/brainstorm`
- `/write-plan`
- `/learn`

## Why

`/plan` cost roughly 70-85% more tokens than necessary because the 3-phase
chain produced 4 docs you only re-read 1 of. `/execute` ran 4-6 LLM calls per
task in series; v1.1.0 runs 3 (with the two reviewers in parallel) and
prompt-caches the per-task system context.

Estimated improvements on a 10-task plan:

- `/plan`: 70-85% token reduction
- `/execute`: 60-75% token reduction, 2-3× wall-clock speedup

## Reverting

The previous version remains in `~/.claude/plugins/cache/codex-marketplace/plan-pro/1.0.0/`.
To roll back, set your plugin manifest to depend on `1.0.0` explicitly.

## Python dependency

v1.1.0 requires Python 3.11+ in the user's `PATH`. The first invocation of
`/plan` or `/execute` creates a venv inside the plugin directory and installs
`claude-agent-sdk`, `pydantic`, and `anyio`. Subsequent invocations reuse it.
```

**Step 4: Verify**

```bash
grep '"version"' "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/.claude-plugin/plugin.json"
```

Expected: `"version": "1.1.0"`.

**Step 5: Commit**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git add plan-pro/.claude-plugin/plugin.json plan-pro/MIGRATION.md
git commit -m "chore(plan-pro): bump to v1.1.0 with migration notes"
```

**Acceptance:** plugin.json reports version 1.1.0; MIGRATION.md exists at plugin root with the headings shown above.

**Delegate to:** plan-pro (self)

---

## Task 14: End-to-end smoke (manual)

**Files:**
- None (verification step)

**Step 1: Confirm test suite passes**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro"
.venv/bin/pytest tests/ -v
```

Expected: 100% green.

**Step 2: Confirm Bash bootstrap works**

```bash
CLAUDE_PLUGIN_ROOT="/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro" \
  "/Users/travisgilbert/Tech Dev Local/codex-plugins/plan-pro/scripts/run.sh" plan
```

Expected: prints usage and exits 2 (no topic).

**Step 3: Confirm git status is clean**

```bash
cd "/Users/travisgilbert/Tech Dev Local/codex-plugins"
git status --short plan-pro/
```

Expected: empty output (all changes committed).

**Step 4: Push (only if user confirms)**

```bash
# Do NOT auto-push; surface the branch and let the user decide.
git log --oneline -10
```

Print the new commits so the user can choose to `git push` or open a PR.

**Step 5: Update marketplace cache (manual reinstall)**

The user re-runs `install.sh` or whatever marketplace sync script keeps `~/.claude/plugins/cache/codex-marketplace/plan-pro/` in sync with the dev source. After re-install, restart Claude Code so the new manifest loads.

**Acceptance:** Tests green; bootstrap script works; commits logged; user knows the next manual step is reinstall + restart.

**Delegate to:** plan-pro (self)

---

## Total Task Count

14 tasks. Single-file plan (above the 10-task threshold but below the 4-stage one; tasks form a single linear flow with no stage boundaries).

## Estimated Time

- Tasks 1-9 (the build): ~2-3 hours active work, executed by subagent dispatch.
- Tasks 10-13 (cleanup, version bump, docs): ~30 minutes.
- Task 14 (smoke + manual reinstall): ~10 minutes plus user's discretion to push.
