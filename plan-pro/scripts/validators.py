"""Deterministic plan validators (replaces the LLM-driven plan-reviewer agent)."""
from __future__ import annotations

import re
from pathlib import Path

from scripts.models import PlanModel


class PlanValidationError(ValueError):
    pass


_PLACEHOLDER_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bTBD\b", re.IGNORECASE), "TBD"),
    (re.compile(r"\bFIXME\b", re.IGNORECASE), "FIXME"),
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
