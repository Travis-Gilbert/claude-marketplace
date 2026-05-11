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


_SPEC_FILENAMES = ("spec.md", "source-spec.md", "SPEC.md")
_SPEC_FRONTMATTER_RE = re.compile(r"^\s*spec_path:\s*(\S+)\s*$", re.MULTILINE)


def _resolve_spec_path(out_dir: Path, plan_text: str) -> Path | None:
    """Locate the source spec for a plan.

    Looks for, in order:
      1. A `spec_path: <path>` line in the plan's leading frontmatter or body.
      2. Any of the conventional filenames in the plan directory.
    Returns None when no spec is discoverable; the gates treat this as an
    `error` condition (loud warning, proceed) rather than `blocker`.
    """
    m = _SPEC_FRONTMATTER_RE.search(plan_text)
    if m:
        candidate = Path(m.group(1))
        if not candidate.is_absolute():
            candidate = out_dir / candidate
        if candidate.exists():
            return candidate
    for name in _SPEC_FILENAMES:
        candidate = out_dir / name
        if candidate.exists():
            return candidate
    return None


def _classify_gate_output(text: str) -> tuple[str, str]:
    """Return ('approved'|'blocker'|'error', payload).

    Scans the gate's output for the canonical decision line (`...: approved`,
    `...: blocker`, or `...: error`). The decision line may appear before a
    list of numbered items, so we cannot rely on "last non-empty line". Falls
    through to `error` when no decision line is present so the orchestrator
    can warn-and-proceed instead of failing silent.
    """
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        low = line.lower()
        if low.endswith(": approved") or low == "approved":
            return "approved", ""
        if low.endswith(": blocker") or low.startswith("blocker"):
            return "blocker", text
        if ": error" in low or low.startswith("error"):
            return "error", text
    return "error", text


async def _run_spec_coverage_gate(
    *, agents, claude_md: str, model: str,
    plan_path: Path, spec_path: Path | None, out_dir: Path,
) -> tuple[str, str]:
    """Pre-execute gate. Returns ('approved'|'blocker'|'error', payload)."""
    if "spec-coverage-gate" not in agents:
        return "error", "spec-coverage-gate agent not loaded (missing agents/spec-coverage-gate.md)"
    if spec_path is None:
        return "error", "no spec file found (looked for spec.md / source-spec.md / spec_path frontmatter)"
    deferrals_path = out_dir / "deferrals.md"
    deferrals_text = deferrals_path.read_text() if deferrals_path.exists() else "(no deferrals.md present; treat all waivers as absent)"
    system = agents["spec-coverage-gate"].prompt + "\n\n## CLAUDE.md\n\n" + claude_md
    prompt = (
        f"spec_path: {spec_path}\n"
        f"plan_path: {plan_path}\n"
        f"plan_dir: {out_dir}\n\n"
        f"Spec contents:\n{spec_path.read_text()}\n\n"
        f"Plan contents:\n{plan_path.read_text()}\n\n"
        f"deferrals.md contents:\n{deferrals_text}\n\n"
        "Run the algorithm in your prompt. Write the coverage matrix to "
        f"{out_dir / 'spec-coverage-gate.md'} and emit the final decision line."
    )
    raw = await _run_subagent(
        system_prompt=system,
        prompt=prompt,
        allowed_tools=["Read", "Write", "Grep", "Glob"],
        model=model,
        max_turns=8,
    )
    return _classify_gate_output(raw)


async def _run_drift_auditor(
    *, agents, claude_md: str, model: str,
    spec_path: Path | None, plan_start_sha: str, out_dir: Path,
) -> tuple[str, str]:
    """Post-execute auditor. Returns ('approved'|'blocker'|'error', payload)."""
    if "drift-auditor" not in agents:
        return "error", "drift-auditor agent not loaded (missing agents/drift-auditor.md)"
    if spec_path is None:
        return "error", "no spec file found (looked for spec.md / source-spec.md / spec_path frontmatter)"
    if not plan_start_sha:
        return "error", "plan_start_sha not recorded; cannot diff"
    deferrals_path = out_dir / "deferrals.md"
    deferrals_text = deferrals_path.read_text() if deferrals_path.exists() else "(no deferrals.md present; treat all waivers as absent)"
    diff_text = _git_diff_since(plan_start_sha)
    system = agents["drift-auditor"].prompt + "\n\n## CLAUDE.md\n\n" + claude_md
    prompt = (
        f"spec_path: {spec_path}\n"
        f"plan_start_sha: {plan_start_sha}\n"
        f"plan_dir: {out_dir}\n\n"
        f"Spec contents:\n{spec_path.read_text()}\n\n"
        f"deferrals.md contents:\n{deferrals_text}\n\n"
        f"git diff {plan_start_sha}..HEAD:\n{diff_text}\n\n"
        "Run the algorithm in your prompt. Write the audit to "
        f"{out_dir / 'drift-audit.md'} and emit the final decision line."
    )
    raw = await _run_subagent(
        system_prompt=system,
        prompt=prompt,
        allowed_tools=["Read", "Write", "Grep", "Glob", "Bash"],
        model=model,
        max_turns=8,
    )
    return _classify_gate_output(raw)


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

    # Pre-execute discipline: spec-coverage-gate.
    # Compares the plan's checklist coverage against the source spec. Approved
    # proceeds to the task loop; blocker stops execution with a typed list;
    # error proceeds with a loud warning so the discipline cannot stall silent.
    plan_text = plan_path.read_text()
    spec_path = _resolve_spec_path(out_dir, plan_text)
    coverage_status, coverage_payload = await _run_spec_coverage_gate(
        agents=agents, claude_md=claude_md, model=model,
        plan_path=plan_path, spec_path=spec_path, out_dir=out_dir,
    )
    pre_gate_warning: str | None = None
    if coverage_status == "blocker":
        sys.stderr.write("Blocker: spec-coverage-gate refused to start execution.\n")
        sys.stderr.write(coverage_payload + "\n")
        sys.stderr.write(f"See {out_dir / 'spec-coverage-gate.md'} for the coverage matrix.\n")
        sys.exit(6)
    if coverage_status == "error":
        pre_gate_warning = coverage_payload
        sys.stderr.write(
            "Warning: spec-coverage-gate could not run; spec-as-floor discipline NOT enforced this run.\n"
            f"Cause: {coverage_payload}\n"
        )

    # Capture the SHA at the start of execution so drift-auditor can diff the
    # full set of changes produced by the task loop.
    plan_start_sha = _git_head_sha()

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

    # Post-execute discipline: drift-auditor.
    # Compares every spec requirement against the diff produced by execution.
    # Approved writes the review report; blocker withholds the report; error
    # writes the report with a loud warning header.
    drift_status, drift_payload = await _run_drift_auditor(
        agents=agents, claude_md=claude_md, model=model,
        spec_path=spec_path, plan_start_sha=plan_start_sha, out_dir=out_dir,
    )
    if drift_status == "blocker":
        sys.stderr.write("Blocker: drift-auditor found unimplemented and unwaived requirements.\n")
        sys.stderr.write(drift_payload + "\n")
        sys.stderr.write(f"See {out_dir / 'drift-audit.md'} for the full audit.\n")
        sys.stderr.write("Final review report withheld.\n")
        sys.exit(7)

    review_path = out_dir / "review-report.md"
    header = f"# Review report for {slug}\n\nAll {total} tasks completed and committed.\n"
    if pre_gate_warning:
        header += (
            "\n> WARNING: spec-coverage-gate could not run before execution. "
            f"Cause: {pre_gate_warning}\n"
        )
    if drift_status == "error":
        header += (
            "\n> WARNING: drift-auditor could not run after execution. "
            f"Cause: {drift_payload}\n"
        )
    review_path.write_text(header)
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
