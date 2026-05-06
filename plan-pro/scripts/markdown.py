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


def render_task(task: Task) -> str:
    files_block = "\n".join(f"- `{p}`" for p in task.files) if task.files else "- (none)"
    return (
        f"## Task {task.id}: {task.title}\n\n"
        f"**Files:**\n{files_block}\n\n"
        f"{task.body.rstrip()}\n\n"
        f"**Acceptance:** {task.acceptance}\n\n"
        f"**Delegate to:** {task.delegate_plugin}\n\n---\n"
    )


def render_stage(stage: Stage) -> str:
    out = [f"# Stage {stage.number}: {stage.title}\n"]
    for t in stage.tasks:
        out.append(render_task(t))
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
        out += "\n" + render_task(task)
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
