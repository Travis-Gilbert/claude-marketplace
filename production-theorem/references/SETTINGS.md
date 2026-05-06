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

## Guardrail

Advanced settings may expose direct commands, but Orchestrate remains the default
product surface. Do not change default exposure to direct plugin marketplaces
without a deliberate product decision.
