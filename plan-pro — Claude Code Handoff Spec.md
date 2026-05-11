# plan-pro — Claude Code Handoff Spec

**Target:** `Travis-Gilbert/codex-plugins/plan-pro/`
**Goal:** One Claude Code plugin. Eight commands. Independent, concise, grounded in the codebase. Auto-chains research through planning with no intermediate gates.

---

## 1. Plugin Identity

```json
{
  "name": "plan-pro",
  "version": "1.0.0",
  "description": "Planning plugin. Turns intent into elegant implementation plans grounded in the codebase, then executes them with domain-plugin delegation and compound learning. Methodology: superpowers + Double Diamond + INCOSE functional decomposition + C4/ADR + Walking Skeleton + mycelium contract-first. Independence-discipline and conciseness-discipline baked into CLAUDE.md.",
  "author": { "name": "Travis Gilbert" },
  "keywords": ["planning", "brainstorming", "spec", "implementation-plan", "compound-learning", "independence", "concise"]
}
```

---

## 2. Directory Structure

```
plan-pro/
├── .claude-plugin/plugin.json
├── CLAUDE.md
├── AGENTS.md
├── install.sh
│
├── commands/
│   ├── research.md
│   ├── brainstorm.md
│   ├── plan.md
│   ├── write-plan.md
│   ├── execute.md
│   ├── review.md
│   ├── learn.md
│   └── retrofit.md
│
├── agents/
│   ├── researcher.md
│   ├── problem-framer.md
│   ├── divergent-thinker.md
│   ├── clarifier.md
│   ├── scope-gatekeeper.md
│   ├── functional-decomposer.md
│   ├── event-mapper.md
│   ├── contract-first-architect.md
│   ├── walking-skeleton-planner.md
│   ├── decision-scribe.md
│   ├── plan-writer.md
│   ├── plan-reviewer.md
│   ├── executor.md
│   ├── domain-router.md
│   ├── spec-reviewer.md
│   ├── quality-reviewer.md
│   ├── retrofitter.md
│   ├── capture-agent.md
│   └── concision-enforcer.md
│
├── skills/
│   ├── research-methodology/SKILL.md
│   ├── brainstorming/SKILL.md
│   ├── writing-plans/SKILL.md
│   ├── planned-execution/SKILL.md
│   ├── codebase-grounding/SKILL.md
│   ├── scope-decomposition/SKILL.md
│   ├── contract-first-design/SKILL.md
│   ├── event-storming-lite/SKILL.md
│   ├── functional-decomposition/SKILL.md
│   ├── walking-skeleton/SKILL.md
│   ├── plan-retrofitting/SKILL.md
│   ├── compound-learning/SKILL.md
│   └── spec-compliance-review/SKILL.md
│
├── knowledge/
│   ├── claims.jsonl
│   ├── solutions/.gitkeep
│   └── session_log/.gitkeep
│
├── patterns/
│   ├── divergent-convergent.md
│   ├── adr-template.md
│   ├── c4-context-sketch.md
│   ├── event-storming-lite.md
│   ├── functional-decomposition.md
│   ├── contract-first-design.md
│   ├── walking-skeleton.md
│   ├── bite-sized-tasks.md
│   ├── no-placeholders.md
│   └── two-stage-review.md
│
├── refs/                  # shallow clones via install.sh
│   ├── superpowers/       # obra/superpowers
│   ├── mycelium/          # mycelium-clj/mycelium
│   └── adr-templates/     # joelparkerhenderson/architecture-decision-record
│
├── references/
│   ├── methodologies/
│   │   ├── superpowers-methodology.md
│   │   ├── double-diamond.md
│   │   ├── incose-functional-decomposition.md
│   │   ├── c4-model.md
│   │   ├── adr-madr.md
│   │   ├── walking-skeleton.md
│   │   └── mycelium-contracts.md
│   ├── principles/
│   │   ├── kiss-dry-yagni.md
│   │   ├── fat-models-thin-views.md
│   │   └── elegance-via-constraint.md
│   └── anti-patterns/
│       ├── spec-deviation-modes.md
│       ├── placeholder-plans.md
│       ├── deferral-spiral.md
│       └── excessive-questioning.md
│
├── templates/
│   ├── research-brief.md
│   ├── problem-statement.md
│   ├── design-doc.md
│   ├── implementation-plan.md
│   ├── adr.md
│   ├── solution-doc.md
│   └── review-report.md
│
└── scripts/
    └── epistemic/
        ├── __init__.py
        └── README.md       # Points to shared pipeline location
```

---

## 3. CLAUDE.md (Full Draft)

```markdown
# plan-pro — Planning Plugin

Turns intent into elegant implementation plans grounded in the codebase, then executes them with domain-plugin delegation. All planning work lives here; domain expertise delegates out to django-engine-pro, next-pro, ml-pro, theseus-pro, js-pro, ui-design-pro, etc.

## Response discipline (HARD RULES)

These apply to every response in every command:

- No preamble. Start with the answer, not with what you're about to do.
- No recap of what the user just said.
- No narration ("Let me...", "I'll...", "First I'll..."). Just do it.
- No closing summaries of what you just did. Work speaks for itself.
- One question per turn, maximum. Multiple choice when possible.
- Questions are expensive. Ask only what cannot be determined by reading code, running a command, or searching the web.
- Never ask about best practices, conventions, tech stack, or anything in CLAUDE.md.
- Lists and bullets only when content is genuinely a list. Prose otherwise.
- When reporting file changes, one line per file.
- No apologizing for gaps. State the gap, move on.
- No meta-commentary about what would be "ideal" vs what you're doing.

## Independence discipline (HARD RULES)

- If the user showed up with an idea, it is worth building. Do not evaluate whether it's a good idea. Build it.
- Do not propose "a simpler version first" unless the user explicitly asked for the full thing and you found a concrete blocker.
- Do not ask "are you sure you want X" about things the user asked for.
- Do not suggest the user reconsider unless you found a specific technical conflict.
- When blocked, name the blocker in one line and propose the fix.
- When uncertain between two implementations, pick one, note it in one line, continue. Stop to ask only if the choice is irreversible.
- Deferring work to the user is a failure mode. Work the user can do is work the plugin failed to complete.
- If a task seems too large, decompose and start on the first piece. Do not ask permission to start.

## The planning pipeline

Eight commands:

| Command | Deliverable | Input |
|---|---|---|
| /research | `docs/plans/<topic>/research-brief.md` | user intent |
| /brainstorm | `docs/plans/<topic>/design-doc.md` | research brief or user intent |
| /plan | full chain: research brief + design doc + implementation plan | user intent |
| /write-plan | `docs/plans/<topic>/implementation-plan.md` | approved design doc |
| /execute | implemented code + review report | approved plan |
| /review | `docs/plans/<topic>/review-report.md` | implemented code + plan |
| /learn | updated `knowledge/claims.jsonl` + review queue | session history |
| /retrofit | improved existing plan | existing plan file |

`/plan` auto-chains `/research` → `/brainstorm` → `/write-plan` with no intermediate gates. Only the final implementation plan requires user approval before `/execute`.

`/execute` auto-runs `/review` at the end.

## Codebase grounding (applies to all commands)

Before producing any planning artifact:
1. Read CLAUDE.md in the working repo if present.
2. List the top-level directory. Identify the stack from config files (package.json, requirements.txt, pyproject.toml, Cargo.toml, etc.).
3. Read one representative file per layer (one model, one view, one component) before proposing changes to that layer.
4. Check recent commits (`git log --oneline -20`) for context about active work.
5. Never ask the user anything resolvable by steps 1-4.

## Domain plugin delegation

When a plan involves domain-specific work, delegate to the specialist:

| Domain | Plugin |
|---|---|
| Django backend | django-engine-pro |
| Next.js frontend | next-pro |
| React components | ui-design-pro |
| ML / GNN / KGE | ml-pro (or theseus-pro for Theseus work) |
| D3 visualization | d3-pro |
| Three.js / R3F | three-pro |
| Animation | animation-pro |
| JavaScript general | js-pro |
| Swift / native | swift-pro |
| Theseus-specific | theseus-pro |
| VIE design | vie-design |

plan-pro never holds domain opinions. It produces plans; specialists produce domain content. The domain-router agent selects the right specialist per task.

## Compound learning layer

plan-pro participates in the same compound learning system as other target plugins. Auto-capture fires on solve signals. /learn runs the full Bayesian pipeline.

The claims this plugin accumulates are meta-claims about planning itself: decomposition patterns that work, signals that predict plan drift, feature shapes that need contract-first design, etc.

Shared pipeline: scripts/epistemic/ in plan-pro is a thin wrapper over the canonical pipeline shared across plugins (django-engine-pro, ml-pro, next-pro, app-forge, app-pro, theseus-pro). See scripts/epistemic/README.md for the shared pipeline location.

Auto-capture triggers (CLAUDE.md instruction, not hook):
- "that worked", "it's fixed", "working now", "problem solved", "that was the issue", "nice, that did it"
- Explicit: "capture this", "document this fix"

On trigger, invoke capture-agent inline. It writes to knowledge/solutions/ and appends to knowledge/claims.jsonl. Budget: under 30 seconds, under 500 tokens visible output.

## Methodology references

Six methodologies inform the agents:
- Superpowers (obra/superpowers) — brainstorm → plan → execute spine
- Double Diamond — divergent-then-convergent ideation
- INCOSE functional decomposition — feature trees
- C4 / ADR — context sketches and decision records
- Walking Skeleton (Cockburn) — thinnest end-to-end slice first
- Mycelium — contracts at every boundary

Load references/methodologies/*.md on demand. Never reproduce methodology content in responses; apply it.
```

---

## 4. AGENTS.md (Routing Table)

```markdown
# plan-pro Agent Registry

## Routing by command

### /research
Primary: researcher
Also: (codebase-grounding skill)

### /brainstorm
Primary sequence: problem-framer (if unclear) → divergent-thinker → clarifier
Conditional: scope-gatekeeper, functional-decomposer, event-mapper, contract-first-architect, walking-skeleton-planner
Always: decision-scribe (captures ADRs during brainstorm)

### /plan
Auto-chains: researcher → (problem-framer → divergent-thinker → clarifier → scope-gatekeeper → optional agents → decision-scribe) → plan-writer → plan-reviewer
No user gates between phases. User approves only the final plan.

### /write-plan
Primary: plan-writer
Post: plan-reviewer (self-review for placeholders, coverage, type consistency)

### /execute
Primary: executor
Per task: domain-router → (delegated specialist plugin) → spec-reviewer → quality-reviewer
Post: auto-invoke /review over full implementation
On solve signals: capture-agent

### /review
Primary: spec-reviewer → quality-reviewer
Deliverable: review-report.md

### /learn
Full compound learning pipeline. See skills/compound-learning/SKILL.md.

### /retrofit
Primary: retrofitter
Post: plan-reviewer

## Post-response check (all commands)

concision-enforcer runs as a final check on responses during early sessions. Reads proposed response, flags bloat, deferral language, unnecessary questions, meta-commentary. Rewrites inline.
```

---

## 5. Agent Specs (One Paragraph Each)

Claude Code: produce `agents/<name>.md` for each. Each file is a slash-command definition with frontmatter (`description`, `allowed-tools`, `argument-hint`) plus an imperative body. Read `refs/superpowers/agents/*.md` and your existing `django-engine-pro/agents/*.md` as format templates before writing.

**researcher** — Web search for similar solutions, existing codebases, implementation strategies. Reads CLAUDE.md and recent commits. Produces `research-brief.md` with: what exists in the wild, what exists in this codebase, relevant prior art, key constraints discovered. No opinions, just findings.

**problem-framer** — Only loads when intent is ambiguous (e.g., "I want something like X but for Y"). Runs a discover/define pass: what is the actual problem, who has it, what does "solved" look like. Produces `problem-statement.md`. Skipped when user arrives with a specific feature request.

**divergent-thinker** — Generates 5-8 rough approaches to the problem in a single pass. Filters to top 2-3 in the same response. Does not pause for user input between generating and filtering. Prevents "first reasonable thing."

**clarifier** — Asks exactly one question if and only if the answer cannot be determined by reading code, running a command, or web search. Maintains a hard-coded ban list: no best-practices questions, no tech-stack questions, no convention questions, no "do you want tests" questions. Default behavior: don't ask.

**scope-gatekeeper** — Detects multi-subsystem requests. If the input describes independent subsystems, breaks them into sub-projects, picks the first, continues with that one. Each sub-project gets its own plan in a later session.

**functional-decomposer** — INCOSE-style feature trees. For multi-surface features ("users can share projects"), produces a tree: top function → sub-functions → leaves. Each leaf becomes a task. Used only when the feature spans three or more surfaces.

**event-mapper** — Event Storming lite. For features with clear event flows, walks the happy path as events (UserSignedUp, ProjectShared, EmailSent). Produces an event list before code decomposition. Useful for Theseus work especially.

**contract-first-architect** — Mycelium-inspired. Optional agent for pipeline/workflow/agent features. Produces schema-annotated design: each stage has explicit input/output types. The plan's tasks mirror the contracts.

**walking-skeleton-planner** — For greenfield projects, inserts a mandatory first task: thinnest possible end-to-end slice touching every architectural layer. Feature tasks come after the skeleton exists.

**decision-scribe** — Runs throughout /brainstorm. When a non-trivial choice is made (framework pick, pattern choice, data model decision), writes a lightweight ADR to `docs/plans/<topic>/decisions/NNNN-<slug>.md`. MADR format. Three fields: Context, Decision, Consequences.

**plan-writer** — Takes the approved design doc and produces the implementation plan. File structure mapped first. Then bite-sized tasks (2-5 minutes each), TDD-shaped: failing test, run it, minimal implementation, run it passing, commit. Exact file paths. Complete code in every step. Zero placeholders. Reads `refs/superpowers/skills/writing-plans/SKILL.md` as the canonical format.

**plan-reviewer** — Post-writing self-review. Checks: spec coverage (every section of the design has a task), placeholder scan (no "TBD", "add error handling", "similar to Task N"), type consistency (method signatures match across tasks), file path exactness. Fixes inline. Reports deltas.

**executor** — Runs the plan task-by-task. For each task: consult domain-router to identify specialist, dispatch implementer with full task text + context (not a file reference, the actual text), receive implementation, trigger spec-reviewer, trigger quality-reviewer, loop on issues, mark complete. Fresh subagent per task.

**domain-router** — Reads the task, picks the right specialist plugin. Django model work → django-engine-pro. Next.js routing → next-pro. GNN architecture → ml-pro. Outputs a two-line routing decision: plugin name + one-line reason.

**spec-reviewer** — Post-implementation per task. Does the code match the spec? Anything missing? Anything extra not requested? Returns approved or issue list. Runs before quality-reviewer.

**quality-reviewer** — Runs after spec-reviewer approval. Does the code follow the codebase's patterns? Any magic numbers, dead code, or smell? DRY/YAGNI violations? Returns approved or issue list.

**retrofitter** — Takes an existing plan file, audits for: placeholder content, scope creep risk, missing decomposition, weak acceptance criteria, absent contracts for data flows. Produces an improved plan with the same goal. Output replaces or supersedes the original.

**capture-agent** — Fires on solve signals. Extracts problem, root cause, solution, prevention, domain tags. Writes solution doc to `knowledge/solutions/`. Calls `scripts/epistemic/capture.py` to dedupe and append claims. Total budget: 30 seconds, 500 tokens.

**concision-enforcer** — Post-response hook during early sessions. Reads the proposed response against the hard rules in CLAUDE.md. Flags: preamble, narration, closing summaries, multiple questions, hedging language, deferral ("you might want to consider"), meta-commentary. Rewrites inline and emits the concise version.

---

## 6. Command Files

Each `commands/<name>.md` is a slash-command. Format: frontmatter (`description`, `allowed-tools`, `argument-hint`) plus imperative body. Read `refs/superpowers/commands/*.md` as templates.

**research.md** — Runs researcher agent. Produces `docs/plans/<slug>/research-brief.md`. Argument: topic. Creates directory, writes file, reports path.

**brainstorm.md** — Runs the brainstorm sequence. If `docs/plans/<slug>/research-brief.md` exists, uses it as input. Otherwise runs researcher first. Produces `design-doc.md` + `decisions/*.md`.

**plan.md** — Auto-chains research → brainstorm → write-plan. No intermediate gates. Final deliverable: `implementation-plan.md`. User approves only the final plan.

**write-plan.md** — Requires `design-doc.md` to exist. Runs plan-writer → plan-reviewer. Produces `implementation-plan.md`.

**execute.md** — Requires `implementation-plan.md`. Runs executor on each task. Auto-invokes /review at the end. Writes implementation to the repo, `review-report.md` to the plan directory.

**review.md** — Standalone review. Works against any implementation. Produces `review-report.md`.

**learn.md** — Runs the compound learning pipeline. Three phases: save session log, run `python -m scripts.epistemic.learn --plugin plan-pro`, present review queue (confidence changes, new tensions, auto-captures, candidate claims).

**retrofit.md** — Argument: path to existing plan file. Runs retrofitter → plan-reviewer. Output replaces input in place.

---

## 7. Skills

Each `skills/<name>/SKILL.md` has frontmatter (`name`, `description` under 1024 chars) plus body under 500 lines. Read `refs/superpowers/skills/brainstorming/SKILL.md` and `refs/superpowers/skills/writing-plans/SKILL.md` as canonical format references before writing.

**research-methodology** — How to search, how to filter SEO noise, how to audit a codebase, what to look for in commit history.

**brainstorming** — Adapted from superpowers. Tighter. Removes the "is this worth building" gate. Enforces one-question-at-a-time with the clarifier ban list.

**writing-plans** — Adapted from superpowers. File structure first, bite-sized TDD tasks, exact paths, no placeholders.

**planned-execution** — Fresh subagent per task, domain-router integration, two-stage review per task.

**codebase-grounding** — The read-before-writing discipline. CLAUDE.md → directory listing → stack detection → representative file read → recent commits. Hard requirement before any planning artifact.

**scope-decomposition** — Multi-subsystem detection. Heuristics: three or more top-level surfaces, two or more data stores, two or more user roles with independent flows.

**contract-first-design** — Mycelium-inspired. When to use it: pipelines, workflows, agent chains, API gateways. What it produces: schema-annotated stages.

**event-storming-lite** — The happy-path event walk.

**functional-decomposition** — INCOSE-derived tree format. Parent-function → sub-functions → leaves.

**walking-skeleton** — Thinnest end-to-end slice for greenfield projects.

**plan-retrofitting** — Audit patterns for upgrading existing plans: placeholder detection, decomposition improvement, contract addition, acceptance criteria tightening.

**compound-learning** — Auto-capture logic, /learn pipeline, claim formats. Pulls from your existing compound-learning-layer-spec. Points to shared `scripts/epistemic/`.

**spec-compliance-review** — Two-stage review: spec first (does it match?), quality second (is it good?).

---

## 8. install.sh

Matches your existing plugin pattern. Verify directory structure, shallow-clone refs, symlink commands.

```bash
#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Ensure directories
for dir in agents commands skills knowledge/solutions knowledge/session_log \
           patterns refs references/methodologies references/principles \
           references/anti-patterns templates scripts/epistemic; do
  mkdir -p "$PLUGIN_DIR/$dir"
done

# 2. Shallow-clone refs
cd "$PLUGIN_DIR/refs"
[ -d superpowers ] || git clone --depth 1 https://github.com/obra/superpowers.git
[ -d mycelium ] || git clone --depth 1 https://github.com/mycelium-clj/mycelium.git
[ -d adr-templates ] || git clone --depth 1 https://github.com/joelparkerhenderson/architecture-decision-record.git adr-templates

# 3. Register slash commands
CMD_DIR="$PLUGIN_DIR/.claude/commands"
mkdir -p "$CMD_DIR"
for cmd in research brainstorm plan write-plan execute review learn retrofit; do
  ln -sf "$PLUGIN_DIR/commands/$cmd.md" "$CMD_DIR/$cmd.md"
done

echo "plan-pro installed. $(ls "$PLUGIN_DIR/agents/" | wc -l | tr -d ' ') agents, $(ls "$PLUGIN_DIR/skills/" | wc -l | tr -d ' ') skills."
```

---

## 9. Build Order for Claude Code

One session, one PR. Build in this order:

1. Read `refs/superpowers/skills/brainstorming/SKILL.md`, `refs/superpowers/skills/writing-plans/SKILL.md`, `refs/superpowers/skills/subagent-driven-development/SKILL.md` before writing any skill.
2. Read one existing plugin's `CLAUDE.md` + `AGENTS.md` (django-engine-pro is good) as format template.
3. Scaffold directory structure via install.sh.
4. Write CLAUDE.md (use section 3 of this spec verbatim).
5. Write AGENTS.md (use section 4).
6. Write all 19 agent files. Keep each under 100 lines. Imperative voice, no preamble.
7. Write all 8 command files. Each under 50 lines.
8. Write all 13 skill files. Reference superpowers skills directly; don't reproduce content, adapt it.
9. Write reference files in `references/`. Each under 200 lines. Cite sources.
10. Write pattern files in `patterns/`. Each under 100 lines, concrete.
11. Write templates in `templates/`. Fill-in-the-blank format.
12. Populate `scripts/epistemic/README.md` pointing to shared pipeline location (coordinate with existing django-engine-pro setup).

---

## 10. Verification

After building, run:

```bash
# Structural
./install.sh
ls agents/ | wc -l          # expect 19
ls skills/ | wc -l           # expect 13
ls commands/ | wc -l         # expect 8

# Content
grep -l "HARD RULE" CLAUDE.md     # conciseness + independence present
grep -c "TBD\|TODO\|placeholder" agents/*.md  # expect 0

# Smoke test in Claude Code:
# /research "add dark mode to travisgilbert.me"
# Expect: research-brief.md produced, under 60 seconds, no clarifying questions
```

---

## 11. Open Handoff Notes

- Shared epistemic pipeline location: coordinate during build. If not yet extracted to a shared location, wire plan-pro to django-engine-pro's copy temporarily and file a follow-up to extract it.
- `scripts/epistemic/__init__.py` should be empty; actual code lives in the shared location.
- The concision-enforcer can be disabled via a flag in CLAUDE.md once the plugin's patterns are stable. Leave it on for the first 20 sessions.


# Amendment: Superpowers 
### Change to section 8 (install.sh):
Replace the shallow-clone of superpowers with a full clone into refs/superpowers/ AND a copy of the three core skills into plan-pro/skills/ as the starting point:
bash# 2. Clone refs
cd "$PLUGIN\_DIR/refs"
[ -d superpowers ] || git clone https://github.com/obra/superpowers.git
[ -d mycelium ] || git clone --depth 1 https://github.com/mycelium-clj/mycelium.git
[ -d adr-templates ] || git clone --depth 1 https://github.com/joelparkerhenderson/architecture-decision-record.git adr-templates

## 3. Seed skills from superpowers (full clone, not shallow)
cd "$PLUGIN\_DIR"
for skill in brainstorming writing-plans executing-plans subagent-driven-development \\
```
         verification-before-completion systematic-debugging test-driven-development \
         requesting-code-review receiving-code-review finishing-a-development-branch; do
```
  [ -d "skills/$skill" ] || cp -r "refs/superpowers/skills/$skill" "skills/$skill"
done
Change to section 9 (build order):
Steps 1 and 8 change:


Run install.sh first. This seeds skills/ with the 10 superpowers skills as the working base.
Skill work is now modification, not creation from scratch. For each seeded superpowers skill:

brainstorming/SKILL.md — remove the "is this worth building" scope check. Remove the visual-companion section (you're not using that browser tool). Add codebase-grounding requirement at top. Add clarifier ban list. Tighten to under 300 lines.
writing-plans/SKILL.md — add the domain-router integration note. Otherwise keep as-is.
executing-plans/SKILL.md + subagent-driven-development/SKILL.md — add domain-router integration. Add auto-invoke /review at the end.
Other seven skills (TDD, debugging, verification, code review, finishing) — keep as-is. These are battle-tested.
Write new skills only for content superpowers doesn't cover: research-methodology, codebase-grounding, scope-decomposition, contract-first-design, event-storming-lite, functional-decomposition, walking-skeleton, plan-retrofitting, compound-learning, spec-compliance-review.




Change to section 5 (agents):
The plan-writer, executor, and subagent review agents should explicitly invoke the copied superpowers skills rather than duplicating their logic. The agent body becomes a thin wrapper: "Load skills/writing-plans/SKILL.md. Apply it. Additionally, after the plan is written, invoke plan-reviewer and domain-router."
Change to section 11 (handoff notes):
Add:

License: obra/superpowers is MIT. Copied skills retain their license header or add attribution at the top of each copied SKILL.md: \> Adapted from obra/superpowers (MIT). Modifications: <list>.
When superpowers updates upstream, refs/superpowers/ can be git pulled. Re-syncing copied skills is a manual merge — don't automate it. The copies in skills/ are yours now.

Benefits of this approach
You get superpowers' battle-tested skill content as the starting point, then layer plan-pro's additions on top. Less work, more proven base. The superpowers skills Travis Gilbert already installed at the user level continue to work; plan-pro's versions override them only within plan-pro sessions.
The spec total stays under 5K words. Ready for Claude Code whenever you want to hand it off.
  
