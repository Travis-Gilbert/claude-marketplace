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
Pre: spec-coverage-gate (blocks if plan does not cover the source spec and the gap is not waived in deferrals.md)
Per task: domain-router → (delegated specialist plugin) → spec-reviewer → quality-reviewer
Post: drift-auditor (blocks if the diff does not implement every spec requirement and the gap is not waived in deferrals.md)
Then: auto-invoke /review over full implementation
On solve signals: capture-agent

### /review
Primary: spec-reviewer → quality-reviewer
Deliverable: review-report.md

### /learn
Full compound learning pipeline. See lib/compound-learning/SKILL.md.

### /retrofit
Primary: retrofitter
Post: plan-reviewer

## Post-response check (all commands)

concision-enforcer runs as a final check on responses during early sessions. Reads proposed response, flags bloat, deferral language, unnecessary questions, meta-commentary. Rewrites inline.

## Spec-as-floor gates

Two agents frame `/execute` so the source spec is the floor of the work, never silently dropped:

- **spec-coverage-gate** runs before the first task dispatches. It reads the source spec and the draft plan, extracts every requirement-shaped statement from the spec, and verifies each one is either covered by a checklist item with a `§N.Y` backref OR has an explicit waiver row in `deferrals.md`. Uncovered and unwaived requirements return `blocker`; execution stops.
- **drift-auditor** runs after the final task commits and before the review report writes. It reads the source spec and `git diff <plan-start>..HEAD` and classifies every spec requirement as `implemented`, `waived-with-consent`, or `unimplemented-and-unwaived`. Anything in the third bucket returns `blocker`; the review report is withheld.

Both gates read `<plan_dir>/deferrals.md` if it exists. Waivers in that file are user-typed only; the gates and the executor never write to it. See `templates/deferrals.md` for the format.

The gates were added to catch the failure mode the per-task `spec-reviewer` + `quality-reviewer` chain cannot catch: a plan that silently drops spec sections (or an executor that silently drops planned tasks) passes every per-task review because every per-task review checks code-vs-plan, not plan-vs-spec or code-vs-spec. Defense in depth.

### Spec path discovery

The orchestrator looks for the source spec in this order:
1. `spec_path: <path>` line in the plan file (frontmatter or body).
2. `spec.md`, `source-spec.md`, or `SPEC.md` in the plan directory.

If no spec is discoverable, both gates emit `error` (not `blocker`). The orchestrator proceeds with a loud warning. Failing silent on missing input is the worst outcome; the warning surfaces in the final review report header.
