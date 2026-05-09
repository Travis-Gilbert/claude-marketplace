# Orchestrate Settings

Default settings should make Orchestrate the visible product and keep specialist
plugins internal unless the host explicitly exposes them.

```yaml
exposure_mode: orchestrate_only
show_delegated_plugins: true
allow_direct_plugin_commands: false
use_federated_priors: true
learning_mode: supervised
risk_mode: balanced
default_budget_tokens: 6000
redis_harness_mode: auto
harness_writeback_mode: best_effort_reported
plan_handoff_mode: manual
honor_repo_opt_in: true
repo_opt_in_files:
  - AGENTS.md
  - CLAUDE.md
repo_opt_in_scope: complex_only
```

## Exposure Modes

| Mode | Meaning |
|---|---|
| `orchestrate_only` | Default. The user sees `/orchestrate`; internals remain delegated. |
| `profile_tools` | Orchestrate may expose selected profile tools for advanced users. |
| `full_marketplace` | Direct plugin commands may be exposed by host settings. |

## Redis Harness Modes

| Mode | Meaning |
|---|---|
| `auto` | Use Redis/THG/harness surfaces when available; report deferral otherwise. |
| `report_only` | Preserve lifecycle facts in markdown without writeback. |
| `require_writeback` | Treat missing harness writeback as a blocking validation failure. |

## Learning Modes

| Mode | Meaning |
|---|---|
| `off` | Do not propose learning candidates. |
| `supervised` | Propose learning/writeback candidates for human review. |
| `automatic` | Reserved for hosts with explicit trust and review gates. |

## Plan Handoff Modes

| Mode | Meaning |
|---|---|
| `manual` | Default. Use handoff only when the user explicitly asks for it. |
| `suggested` | Suggest `handoff=spark` when a plan resolves into bounded implementation slices. |
| `always_for_complex` | Use `handoff=spark` by default for complex multi-file work unless the user prefers otherwise. |

## Repo Opt-In

| Setting | Meaning |
|---|---|
| `honor_repo_opt_in` | If true, read AGENTS.md and CLAUDE.md as host preference signals for Orchestrate/harness usage. |
| `repo_opt_in_files` | Host files that may contain the opt-in note. |
| `repo_opt_in_scope` | Limits opt-in behavior to `complex_only` by default so trivial tasks are not over-orchestrated. |

## Guardrail

Advanced settings may expose direct commands, but Orchestrate remains the default
product surface. Do not change default exposure to direct plugin marketplaces
without a deliberate product decision.
