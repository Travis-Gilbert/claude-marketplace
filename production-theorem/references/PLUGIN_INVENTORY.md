# Plugin Inventory

Inventory generated for the Orchestrate v1 upgrade.

## Skills

| Skill | Public role | Orchestrate role | Compatibility |
|---|---|---|---|
| `orchestrate` | Default public command | Owns observe, plan, delegate, execute, validate, report, learn | New default |
| `theorize` | Compatibility command | Internal `theorize` mode | Keep available |
| `planning-theorem` | Compatibility command | Internal `plan` mode | Keep available |
| `execute` | Compatibility command | Internal `execute` mode | Keep available |

## Agents

| Agent | Role |
|---|---|
| `codex-sdk-harness-product` | Grounds SDK/database harness and product-client claims in shipped code. |
| `orchestrate-planner` | Builds production plans and stable checklists. |
| `plugin-router` | Selects hidden plugins/skills, profiles, validators, and exposure recommendations. |
| `context-artifact-specialist` | Defines Context Artifact, Capsule, Brief, and trust-boundary requirements. |
| `action-rail-specialist` | Produces safe next actions with validators and approval gates. |
| `validator-reporter` | Chooses checks and reconciles validation evidence. |
| `epistemic-graphrag-specialist` | Selects graph retrieval operators, evidence paths, and trace needs. |
| `federation-learning-recorder` | Prepares local learning and safe structural federation candidates. |
| `redis-harness-operator` | Protects Redis harness state, cache/run/event boundaries, and fallback behavior. |
| `redis-product-safety` | Protects tenant THG product service, auth, Redis key isolation, and RESP gates. |

## Commands Exposed

Default product command:

- `/orchestrate`

Compatibility command language:

- `/theorize` -> `/orchestrate mode=theorize`
- `/brainstorm` -> `/orchestrate mode=theorize`
- `/planning-theorem` -> `/orchestrate mode=plan`
- `/plan` -> `/orchestrate mode=plan`
- `/execute` -> `/orchestrate mode=execute`

## Internal Modes

- observe
- theorize
- plan
- delegate
- compile_context
- action_rail
- execute
- validate
- report
- remember
- federation_signal

## References

- `ARTIFACT_SCHEMAS.md`
- `CHECKLIST_MANIFESTO.md`
- `EPISTEMIC_PRIMITIVES.md`
- `ORCHESTRATE_REPORTING.md`
- `PRODUCTION_GATES.md`
- `REPORTING.md`
- `ROUTING.md`
- `SDK_DATABASE_HARNESS.md`
- `SETTINGS.md`

## Compatibility Risks

- Host environments that enumerate all skills may still show the compatibility
  skills. The default prompt and routing docs make `/orchestrate` the preferred
  surface without deleting old commands.
- Redis/harness writeback is environment-sensitive. Orchestrate must report
  writeback as proven or deferred per run.
- The default harness SDK client and tenant-scoped THG product client remain
  separate surfaces and must not be merged in docs or reports.
