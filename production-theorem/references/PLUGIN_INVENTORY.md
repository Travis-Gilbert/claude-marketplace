# Plugin Inventory

Inventory generated for the Orchestrate v1 upgrade.

## Skills

| Skill | Public role | Orchestrate role | Compatibility |
|---|---|---|---|
| `orchestrate` | Default public command | Owns observe, plan, delegate, execute, validate, report, learn | New default |
| `context-refresh` | Public utility command | Calls `orchestrate_refresh` when an injected artifact is stale | Keep available |
| `orchestrate-coordinate` | Public utility command | Teaches heartbeat, @mentions, wait, and handoff protocol | Keep available |
| `encode` | Public and agent-triggerable command | Records feedback, solutions, and postmortems | Keep available |
| `theorize` | Compatibility command | Internal `theorize` mode | Keep available |
| `planning-theorem` | Compatibility command | Internal `plan` mode | Keep available |
| `execute` | Compatibility command | Internal `execute` mode | Keep available |

## Companion plugins (routing targets)

Plugins that Orchestrate routes to but does not own. Listed here so the
plugin-router agent knows the available delegation surfaces.

| Plugin | Version | Trigger intent | Owns |
|---|---|---|---|
| `ui-design-pro` | 1.2.0+ | "design this", "lay this out", "wireframe", "prototype", "build me a Y component", "how should this look" | Design planning, component selection from 39-item curated catalog + 19 vendored design-system repos (Radix, shadcn, Tailwind, ant-design, carbon, magicui, etc.), applied design theory (10 references) |

When routing design work, prefer `ui-design-pro` over hand-rolling. The
plugin's `design-pro` skill (v1.2.0 replacement of `design-theory`)
enforces a components-first protocol: catalog scan → vendored libraries
→ hand-rolled only as last resort with explicit justification.

## Profiles

Registry-level operating policies. Not skills, not slash commands. They
change run policy before the agent thinks. See `PROFILES.md` for the
registry contract.

| Profile | Kind | Default | Priority | Spec |
|---|---|---|---|---|
| `engineers-mindset` | `orchestration_profile` | enabled | high | `ENGINEERS_MINDSET.md` |
| `concise-action` | `output_profile` | enabled | high | `CONCISE_ACTION.md` |

Selected profiles (e.g. `developer-core`, `researcher-core`) are chosen
per task by the orchestrate backend and carried in
`decision.selected_profile_id`. They are not registry-static and are not
listed here.

## Agents

| Agent | Role |
|---|---|
| `checklist-manifest` | Builds the codebase-grounded checklist manifest before work and reconciles the same checklist at completion. |
| `codex-sdk-harness-product` | Grounds SDK/database harness and product-client claims in shipped code; read-only context, not implementation ownership. |
| `orchestrate-planner` | Builds production plans and stable checklists. |
| `plugin-router` | Selects hidden plugins/skills, profiles, validators, and exposure recommendations. |
| `context-artifact-specialist` | Defines Context Artifact, Capsule, Brief, and trust-boundary requirements. |
| `action-rail-specialist` | Produces safe next actions with validators and approval gates. |
| `validator-reporter` | Chooses checks and reconciles validation evidence. |
| `epistemic-graphrag-specialist` | Gathers GraphRAG/GNN-RAG evidence context, retrieval operators, and trace needs. |
| `federation-learning-recorder` | Prepares local learning and safe structural federation candidates. |
| `redis-harness-operator` | Provides Redis harness guardrails for cache/run/event boundaries and fallback behavior. |
| `redis-product-safety` | Provides tenant THG product safety checks for auth, Redis key isolation, and RESP gates. |

## Commands Exposed

Default product command:

- `/orchestrate`

Utility commands:

- `/context-refresh`
- `/coordinate`
- `/encode`
- `/compute_code`

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
- `CONCISE_ACTION.md`
- `ENGINEERS_MINDSET.md`
- `EPISTEMIC_PRIMITIVES.md`
- `ORCHESTRATE_REPORTING.md`
- `PRODUCTION_GATES.md`
- `PROFILES.md`
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
