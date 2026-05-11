"""Parse an implementation-plan.md back into a PlanModel for /execute."""
from __future__ import annotations

import re
from pathlib import Path

from scripts.models import PlanModel, Task

_TITLE_RE = re.compile(r"^#\s+(.+?)\s+Implementation Plan", re.MULTILINE)
_FILE_STRUCTURE_RE = re.compile(r"## File Structure\s*\n+```\n(.*?)\n```", re.DOTALL)
_OVERVIEW_RE = re.compile(r"\*\*Overview:\*\*\s*(.+?)\n\n", re.DOTALL)
_TASK_RE = re.compile(
    r"## Task (?P<id>\S+):\s*(?P<title>[^\n]+)\n+"
    r"(?:\*\*Files:\*\*\s*\n(?P<files>(?:-[^\n]*\n)+)\s*\n)?"
    r"(?P<body>.+?)"
    r"\*\*Acceptance:\*\*\s*(?P<acc>[^\n]+)\n+"
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
            files=files or [Path(".")],
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
