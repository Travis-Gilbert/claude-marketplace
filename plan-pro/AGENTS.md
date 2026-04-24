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
Full compound learning pipeline. See lib/compound-learning/SKILL.md.

### /retrofit
Primary: retrofitter
Post: plan-reviewer

## Post-response check (all commands)

concision-enforcer runs as a final check on responses during early sessions. Reads proposed response, flags bloat, deferral language, unnecessary questions, meta-commentary. Rewrites inline.
