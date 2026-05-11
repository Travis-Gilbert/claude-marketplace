# plan-pro 1.1.0: SDK-driven redesign

**Date:** 2026-05-03
**Author:** Travis Gilbert (with Claude Code, brainstorming session)
**Status:** Approved, ready for implementation plan

## Problem

`plan-pro` 1.0.0 is token-heavy and slow. Two commands hurt most:

- `/plan` runs a 3-phase chain (research → brainstorm → write-plan) producing four artifacts. Of those, only `implementation-plan.md` is re-read after the session. `research-brief.md`, `design-doc.md`, and the ADRs in `decisions/` are write-once scaffolding.
- `/execute` runs four LLM calls per task (`domain-router` → `implementer` → `spec-reviewer` → `quality-reviewer`), all serial, with up to 2 inner retry loops per reviewer. On a 10-task plan that's 40+ subagent dispatches.

Of the 19 agents shipped today, only `spec-reviewer` and `quality-reviewer` have demonstrably caught real problems on this user's runs. The other 17 are ritual.

## Goals

1. Cut `/plan` cost by ~70-85% by collapsing the 3-phase chain into one structured-output call, with codebase grounding done in code (ripgrep + git log) rather than as an LLM phase.
2. Cut `/execute` cost by ~60-75% per task by deleting `domain-router`, parallelizing the two reviewers, tightening the retry budget, and using prompt caching across the per-task loop.
3. Keep the slash-command UX identical: `/plan`, `/execute`, `/review`, `/retrofit` still work the same way externally.
4. Keep the load-bearing artifacts identical: `implementation-plan.md` and `review-report.md` produce the same shape they do today.

## Non-goals

- No model tiering (no Haiku/Opus mix). The cleanup deletes the obvious Haiku candidate (`domain-router`), so tiering doesn't need to ship in v1.
- No structured persistence beyond markdown files. No database, no cache directory beyond the prompt cache the SDK provides.
- No cross-session learning loop. The `capture-agent` / `knowledge/solutions/` sidebar is being dropped.
- No new slash commands. Existing surface stays.

## Architecture

```
plan-pro/1.1.0/
├── .claude-plugin/plugin.json          (version bump 1.0.0 → 1.1.0)
├── commands/
│   ├── plan.md          ← thin wrapper, Bash → scripts/run.sh plan
│   ├── execute.md       ← thin wrapper, Bash → scripts/run.sh execute
│   ├── review.md        ← unchanged
│   └── retrofit.md      ← unchanged
├── agents/                             (19 → 5)
│   ├── planner.md           NEW: replaces researcher + problem-framer + divergent-thinker + plan-writer
│   ├── implementer.md       MODIFIED: simpler per-task agent, no executor wrapping
│   ├── spec-reviewer.md     unchanged
│   ├── quality-reviewer.md  unchanged
│   └── retrofitter.md       unchanged (only invoked by /retrofit)
├── scripts/
│   ├── run.sh           NEW: bash wrapper, creates venv on first call
│   ├── plan_pro.py      NEW: SDK-driven orchestrator
│   ├── prompts.py       NEW: reads agents/*.md, builds cached prompt prefixes
│   └── validators.py    NEW: deterministic plan validation (replaces plan-reviewer)
├── lib/                                (20 → 7 SKILL.md files; see Migration section)
├── templates/                          unchanged
├── pyproject.toml       NEW
└── MIGRATION.md         NEW: one-pager explaining the version bump
```

**Boundary:**
- Markdown is for prompt content (agent persona, what each agent should produce).
- Python is for orchestration (what runs when, in what order, with which model, with which cached context).

**Slash command shape:**

```yaml
---
description: "Produce implementation plan for a topic"
argument-hint: "<topic>"
allowed-tools: Bash
---
Run: bash $CLAUDE_PLUGIN_ROOT/scripts/run.sh plan "$ARGUMENTS"
Wait for the script to finish. Report only the final paths it prints.
```

The slash command itself is ~3 lines. All real work happens in `plan_pro.py`, which uses `claude-agent-sdk` to spawn subagents directly via the API, controlling cache breakpoint placement, parallelism, and tool access.

## `/plan` redesign

```python
async def plan(topic: str) -> Path:
    slug = slugify(topic)
    out_dir = Path(f"docs/plans/{slug}")
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Cheap, deterministic codebase grounding (no LLM)
    codebase_ctx = grep_for_topic(topic, max_files=12)
    git_ctx     = recent_commits_touching(codebase_ctx)
    claude_md   = read_claude_md_chain()

    # 2. Build cached prompt prefix
    cached_prefix = [
        cache_block(read("agents/planner.md")),
        cache_block(read("lib/writing-plans/SKILL.md")),
        cache_block(claude_md),
        cache_block(codebase_ctx),
        cache_block(git_ctx),
    ]

    # 3. Single LLM call, structured output (Pydantic)
    plan = await sdk.run(
        agent="planner",
        cache_prefix=cached_prefix,
        prompt=f"Topic: {topic}\nProduce a structured implementation plan.",
        output_schema=PlanModel,
        model="claude-sonnet-4-7",
    )

    # 4. Deterministic validation (replaces plan-reviewer)
    validators.scan_for_placeholders(plan)
    validators.scan_paths_resolve(plan)
    validators.scan_acceptance_criteria(plan)

    # 5. Write artifacts (single-file or index + sub-plans)
    write_implementation_plan(plan, out_dir)
    if plan.is_large():
        write_stage_sub_plans(plan, out_dir)

    return out_dir / "implementation-plan.md"
```

**Pydantic schema (sketch):**

```python
class Task(BaseModel):
    id: str
    title: str
    body: str                       # full task body, including code blocks
    files: list[Path]               # exact paths the task touches
    delegate_plugin: str            # the "Delegate to:" specialist
    acceptance: str                 # explicit completion check

class Stage(BaseModel):
    number: int
    slug: str
    title: str
    tasks: list[Task]

class PlanModel(BaseModel):
    title: str
    overview: str
    file_structure: list[Path]
    stages: list[Stage] = []         # empty if single-file plan
    tasks: list[Task] = []           # populated if single-file
    is_multi_stage: bool

    def is_large(self) -> bool:
        return len(self.stages) >= 4 or sum(len(s.tasks) for s in self.stages) >= 10
```

**Folded into the planner prompt** (instead of separate agents):
- "If the topic is ambiguous (`'I want something like X'`), restate the problem first." (was `problem-framer`)
- "If multiple approaches are viable, list them with trade-offs and pick one. Record the rationale as a one-line note in the relevant task." (was `divergent-thinker` + `decision-scribe`)
- "If the project has no code yet, the first task is a thinnest-possible end-to-end skeleton." (was `walking-skeleton-planner`)
- "If the request describes independent subsystems, decompose them in code (Python detector) and produce a plan for the first one only; list the deferred subsystems at the end." (was `scope-gatekeeper`)

## `/execute` redesign

```python
async def execute(slug: str) -> Path:
    out_dir = Path(f"docs/plans/{slug}")
    plan = parse_plan(out_dir / "implementation-plan.md")

    cached_prefix = [
        cache_block(read("agents/implementer.md")),
        cache_block(read("agents/spec-reviewer.md")),
        cache_block(read("agents/quality-reviewer.md")),
        cache_block(read("lib/executing-plans/SKILL.md")),
        cache_block(read_claude_md_chain()),
    ]

    for i, task in enumerate(plan.tasks, 1):
        impl = await sdk.run(
            agent="implementer",
            cache_prefix=cached_prefix,
            prompt=task.full_text,
            delegate_to=task.delegate_plugin,
            tools=[Read, Write, Edit, Bash, Grep, Glob],
            model="claude-sonnet-4-7",
        )

        diff = git_diff_since(impl.start_sha)
        spec_result, quality_result = await asyncio.gather(
            sdk.run(agent="spec-reviewer",   prompt=f"Task:\n{task.full_text}\n\nDiff:\n{diff}",
                    cache_prefix=cached_prefix, model="claude-sonnet-4-7"),
            sdk.run(agent="quality-reviewer", prompt=f"Diff:\n{diff}\n\nCheck against codebase patterns.",
                    cache_prefix=cached_prefix, model="claude-sonnet-4-7"),
        )

        if spec_result.has_issues or quality_result.has_issues:
            await sdk.run(agent="implementer",
                          prompt=f"{task.full_text}\n\nFix:\n{spec_result.issues}\n{quality_result.issues}",
                          cache_prefix=cached_prefix)

        commit_task(task, i, len(plan.tasks))

    write_review_report(plan, out_dir)
    return out_dir / "review-report.md"
```

**Per-task call count:** 3 LLM calls (1 implement + 2 parallel review), or 4 if a single combined retry is needed. Versus today's 4-6+ serial calls.

**Cache hit rate:** Near 100% on the cached prefix after the first task. The prefix is ~20-50KB; cached portions cost 10% of normal.

**Solve-signal capture:** dropped. Knowledge sidebar nobody re-reads.

**Stage boundaries (multi-file plans):** stay. Each stage file is read just-in-time before its tasks dispatch. Cross-cutting tasks dispatch at the boundaries declared in the index.

**Blocker handling:** unchanged. If the combined retry fails, stop with the same one-line blocker format and wait for the user.

## SDK details

**Prompt caching:**

| Block                                            | Approx size | Cached |
|--------------------------------------------------|-------------|--------|
| Agent persona (`implementer.md` etc.)            | ~2KB        | yes    |
| Skill content (`executing-plans/SKILL.md` etc.)  | ~5-10KB     | yes    |
| CLAUDE.md chain                                  | ~10-30KB    | yes    |
| Codebase grounding (selected files for `/plan`)  | ~10-20KB    | yes    |
| Task-specific prompt (task body, diff)           | ~1-3KB      | no     |

Anthropic's API allows up to 4 cache breakpoints per request. The Python SDK exposes them via cache-control fields. The first call in a 5-minute window pays full cost on cached blocks; subsequent calls pay 10%.

**Model tiering:** Sonnet only for v1. The obvious Haiku candidate (`domain-router`) is being deleted entirely.

**SDK choice:** Python `claude-agent-sdk`. TypeScript would work equally; Python matches the rest of the user's tooling.

**Dependencies (`pyproject.toml`):**

```toml
[project]
name = "plan-pro"
version = "1.1.0"
requires-python = ">=3.11"
dependencies = [
  "claude-agent-sdk>=0.3",
  "pydantic>=2.5",
  "anyio>=4",
]
```

**Bootstrap (`scripts/run.sh`):**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$CLAUDE_PLUGIN_ROOT"
if ! [[ -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -e . >/dev/null 2>&1
fi
.venv/bin/python scripts/plan_pro.py "$@"
```

First slash-command invocation creates the venv (~5s, one-time). After that, startup is <1s.

## Migration: deleted vs. kept

**Deleted (14 agents, 8 lib skills):**

| Path                                  | Reason                                       |
|---------------------------------------|----------------------------------------------|
| `agents/researcher.md`                | replaced by ripgrep + git log + CLAUDE.md   |
| `agents/problem-framer.md`            | folded into planner prompt                   |
| `agents/divergent-thinker.md`         | folded into planner prompt                   |
| `agents/decision-scribe.md`           | ADRs not re-read                             |
| `agents/clarifier.md`                 | brainstorm flow gone                         |
| `agents/event-mapper.md`              | never demonstrably used                      |
| `agents/functional-decomposer.md`     | never demonstrably used                      |
| `agents/contract-first-architect.md`  | never demonstrably used                      |
| `agents/walking-skeleton-planner.md`  | folded into planner prompt                   |
| `agents/scope-gatekeeper.md`          | folded into planner (Python detector)        |
| `agents/domain-router.md`             | replaced by `Delegate to:` line in tasks     |
| `agents/plan-reviewer.md`             | replaced by Python validators                |
| `agents/concision-enforcer.md`        | dropped                                      |
| `agents/capture-agent.md`             | knowledge sidebar dropped                    |
| `agents/executor.md`                  | logic moved to plan_pro.py                   |
| `lib/research-methodology/`           | research phase gone                          |
| `lib/brainstorming/`                  | brainstorm phase gone                        |
| `lib/event-storming-lite/`            | unused                                        |
| `lib/contract-first-design/`          | unused                                        |
| `lib/scope-decomposition/`            | folded into planner                          |
| `lib/functional-decomposition/`       | unused                                        |
| `lib/walking-skeleton/`               | folded into planner                          |
| `lib/codebase-grounding/`             | replaced by Python utilities                 |
| `lib/compound-learning/`              | knowledge sidebar dropped                    |

**Kept:**

| Path                                              | Why                            |
|---------------------------------------------------|--------------------------------|
| `agents/planner.md` (NEW)                         | single planning agent          |
| `agents/implementer.md` (MODIFIED)                | per-task code writer           |
| `agents/spec-reviewer.md`                         | earns keep                     |
| `agents/quality-reviewer.md`                      | earns keep                     |
| `agents/retrofitter.md`                           | used by `/retrofit` only       |
| `lib/writing-plans/SKILL.md`                      | used by planner                |
| `lib/executing-plans/SKILL.md`                    | used by orchestrator           |
| `lib/subagent-driven-development/SKILL.md`        | used by orchestrator           |
| `lib/test-driven-development/SKILL.md`            | used by implementer            |
| `lib/verification-before-completion/SKILL.md`     | used by reviewers              |
| `lib/finishing-a-development-branch/SKILL.md`     | used by `/review`              |
| `lib/plan-retrofitting/SKILL.md`                  | used by retrofitter            |
| `lib/systematic-debugging/SKILL.md`               | useful for stuck implementer   |
| `templates/*`                                     | plan format unchanged          |
| `commands/review.md`, `commands/retrofit.md`      | unchanged                      |

**Versioning:** `.claude-plugin/plugin.json` bumps `version` from `1.0.0` to `1.1.0`. Old version stays in `~/.claude/plugins/cache/codex-marketplace/plan-pro/1.0.0/`; users can roll back by reinstalling.

**Backward compatibility:** Slash command names (`/plan`, `/execute`, `/review`, `/retrofit`) and final artifact paths (`docs/plans/<slug>/implementation-plan.md`, `review-report.md`) are identical. Intermediate artifacts (`research-brief.md`, `design-doc.md`, `decisions/`) just stop being produced. Existing plans on disk remain readable.

## Testing

- **Unit tests** for `validators.py` (placeholder scan, path resolution, acceptance-criteria scan) using sample plan markdown fixtures.
- **Unit test** for the codebase-grounding helpers (`grep_for_topic`, `recent_commits_touching`).
- **Integration test:** run `scripts/plan_pro.py plan "add a hello-world endpoint"` against a small fixture repo, assert that `implementation-plan.md` is produced with non-zero tasks and passes validators.
- **Smoke test:** run end-to-end `/plan` and `/execute` against a 2-task fixture plan; assert per-task commits and `review-report.md` exist.
- **Cost regression test:** instrument the SDK calls to log input/output token counts; assert `/plan` produces ≤25% of v1.0.0's tokens on the same topic.

## Risks and mitigations

| Risk                                                                                    | Mitigation                                                                            |
|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| `claude-agent-sdk` API differs from sketch                                              | Implementation phase reads installed package source first; adjusts before writing     |
| Pydantic structured-output reliability on long plans                                    | Validators run after; on validation failure, retry once with errors fed back          |
| Skill content too large for cached prefix (4 breakpoint cap)                            | Concatenate skill files into one cache block where compatible                         |
| Users on `1.0.0` reach into deleted intermediate artifacts                              | `MIGRATION.md` documents what's gone; final outputs preserved                         |
| Python venv bootstrap fails on a user's system                                          | `run.sh` falls back to system `python3` and prints clear install instructions on fail |

## Expected outcome

- `/plan`: 1 LLM call instead of ~4-6. Estimated 70-85% token reduction on a typical topic.
- `/execute`: ~3 LLM calls per task instead of ~4-6, with 2 of them parallel and the cache hitting after task 1. Estimated 60-75% token reduction on a 10-task plan, 2-3× wall-clock speedup.
- Plugin shrinks from 19 agents / 20 skills / 544KB to 5 agents / 7 skills / ~250KB plus ~500 lines of Python.

## Implementation order

(See implementation plan, written after this design doc.)

1. Scaffold Python package and `run.sh`.
2. Port skill loader and prompt-caching helpers.
3. Build `validators.py` with unit tests.
4. Implement `plan_pro.py plan` end-to-end.
5. Implement `plan_pro.py execute` end-to-end.
6. Replace `commands/plan.md` and `commands/execute.md` with thin wrappers.
7. Delete deprecated agents and lib skills.
8. Write `MIGRATION.md`.
9. Bump version, smoke test against a fixture, commit.
