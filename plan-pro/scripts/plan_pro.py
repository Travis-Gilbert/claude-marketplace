"""plan-pro orchestrator entry point."""
from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, query

from scripts.grounding import grep_for_topic, read_claude_md_chain, recent_commits_touching
from scripts.markdown import (
    render_implementation_plan,
    render_plan_index,
    render_stage,
)
from scripts.models import PlanModel
from scripts.plan_parser import parse_plan_markdown
from scripts.prompts import load_agent_definitions, load_skill_text
from scripts.validators import PlanValidationError, run_all as run_validators

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
GLOBAL_CLAUDE_MD = Path.home() / ".claude" / "CLAUDE.md"


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:60] or "topic"


def _extract_text(msg) -> str:
    """Pull text content out of a SDK message, regardless of shape."""
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
    m = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if m:
        text = m.group(1)
    else:
        m = re.search(r"(\{.*\})", text, re.DOTALL)
        if m:
            text = m.group(1)
    data = json.loads(text)
    return PlanModel.model_validate(data)


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
        "Return ONLY a JSON object matching this Pydantic schema:\n```json\n"
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
        "Produce a complete implementation plan as JSON matching the schema. "
        "Output ONLY the JSON, no surrounding prose."
    )

    raw_text = ""
    async for msg in query(prompt=user_prompt, options=options):
        text = _extract_text(msg)
        if text:
            raw_text += text

    return _parse_plan_json(raw_text)


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
            stage_path.write_text(render_stage(stage))
        primary = index_path
    else:
        primary = out_dir / "implementation-plan.md"
        primary.write_text(render_implementation_plan(plan))

    print(f"Plan: {primary} ({plan.total_task_count()} tasks)")
    print("Next: (A) /execute, (B) review the plan first, (C) /retrofit")
    return primary


# -----------------------------------------------------------------------------
# /execute
# -----------------------------------------------------------------------------


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
            prompt=(f"Task:\n{task.full_text}\n\nDiff:\n{diff}\n\n"
                    "Does the diff match the task? Output one of: APPROVE / Issue: <list>"),
            allowed_tools=["Read", "Grep", "Glob", "Bash"],
            model=model,
            max_turns=4,
        )
        qual_task = _run_subagent(
            system_prompt=qual_system,
            prompt=(f"Diff:\n{diff}\n\nDoes this code follow the project's patterns and "
                    "avoid smells? Output: APPROVE / Issue: <list>"),
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


# -----------------------------------------------------------------------------
# entrypoint
# -----------------------------------------------------------------------------


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


if __name__ == "__main__":
    sys.exit(main())
