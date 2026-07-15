# Plugin Inventory

Inventory generated for the Theorem's Harness upgrade.

The public model is now adaptive: `/harness` is the session/task opt-in and the
agent selects capability mixes as the work evolves. Utility commands remain for
narrow entrypoints, but they are not separate products.

## Skills

| Skill | Public role | Orchestrate role | Compatibility |
|---|---|---|---|
| `theorems-harness` | Default adaptive command | Owns observe, route, plan, coordinate, delegate, execute, validate, report, learn | Canonical |
| `practice-system` | Ambient practice graph | Binds planning, execution, verification, review, and run-to-run learning to the active Harness run | Canonical |
| `harness-coordinate` | Public utility command | Teaches room digest, intent/reflection writes, presence, @mentions-as-interrupts, waits, and handoff protocol | Keep available |
| `peer-review` | Public and agent-triggerable command | Requests cross-frontier-model review before commit, PR, or launch-ready reporting | Keep available |
| `research` | Public utility command | Runs fractal expansion, gap-frontier discovery, and code-symbol discovery | Keep available |
| `encode` | Public and agent-triggerable command | Records feedback, solutions, and postmortems | Keep available |
| `replay-last-run` | Public audit utility | Selects the latest eligible run, deterministically replays it, and returns typed integrity evidence | Canonical |
| `writing-engineering` | Public writing utility | Applies Writing Engineering with the 1918 Elements rules integrated into one ruleset and receipt | Canonical |
| `theorize` | Internal phase skill | Internal `theorize` mode | Keep available |
| `planning-theorem` | Internal phase skill | Internal `plan` mode | Keep available |
| `execute` | Compatibility command / internal capability | Bounded implementation loop with validation and rerouting | Keep available |

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
| `plugin-router` | Selects capability mixes, hidden plugins/skills, profiles, validators, and exposure recommendations. |
| `context-artifact-specialist` | Defines Context Artifact, Capsule, Brief, and trust-boundary requirements. |
| `action-rail-specialist` | Produces safe next actions with validators and approval gates. |
| `validator-reporter` | Chooses checks and reconciles validation evidence. |
| `epistemic-graphrag-specialist` | Gathers GraphRAG/GNN-RAG evidence context, retrieval operators, and trace needs. |
| `federation-learning-recorder` | Prepares local learning and safe structural federation candidates. |
| `redis-harness-operator` | Provides Redis harness guardrails for cache/run/event boundaries and fallback behavior. |
| `redis-product-safety` | Provides tenant THG product safety checks for auth, Redis key isolation, and RESP gates. |

## Commands Exposed

Default adaptive product command:

- `/harness`

Utility commands:

- `/coordinate`
- `/peer-review`
- `/research`
- `/encode`
- `/compute_code`
- `/replay-last-run`
- `/writing-engineering`

`/compute_code` teaches the complete code capability: GraphQL-first
ingest/reindex/status/search/context/explain/spec/drift/features/obligations,
with the consolidated flat MCP fallbacks documented in `CODE_CAPABILITY.md`.

Harness memory teaching is GraphQL-first across `memory`, `memoryDoc`, nested
`links`/`related`, `memoryArchive`, `rememberMemory`, `reviseMemory`,
`forgetMemory`, and `createHandoff`. It preserves ranked episode provenance and
keeps actor-memory/Data API tools, retro-import, opt-out, deduplication,
reentrancy, and practice promotion in their real boundaries. See
`MEMORY_CAPABILITY.md`.

Internal capability language:

- `theorize` -> `/harness mode=theorize`
- `planning-theorem` -> `/harness mode=plan`
- `execute` -> `/harness mode=execute`

## Internal Modes

- observe
- route
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
- `BRIEF_TEMPLATE.md`
- `CHECKLIST_MANIFESTO.md`
- `CODE_CAPABILITY.md`
- `CONCISE_ACTION.md`
- `ENGINEERS_MINDSET.md`
- `EPISTEMIC_PRIMITIVES.md`
- `HOST_REPO_OPT_IN.md`
- `LEARNINGS.md`
- `MEMORY_CAPABILITY.md`
- `ORCHESTRATE_REPORTING.md`
- `PLAN_TEMPLATE.md`
- `PLANNED-CAPABILITY-PLUGIN-IDEAS.md`
- `PRODUCTION_GATES.md`
- `PROFILES.md`
- `REFS_AUDIT.md`
- `REFS_MANIFEST.md`
- `REPORTING.md`
- `ROUTING.md`
- `SDK_DATABASE_HARNESS.md`
- `SETTINGS.md`
- `UI_VISUAL_PROJECT_GATES.md`

## Compatibility Risks

- Host environments may retain an installed-cache copy of removed skills until
  the plugin is refreshed. Source and generated manifests intentionally omit
  `show-context`, `context-refresh`, `code_theorem`, and Ponytail; none has an
  alias.
- Redis/harness writeback is environment-sensitive. Orchestrate must report
  writeback as proven or deferred per run.
- The default harness SDK client and tenant-scoped THG product client remain
  separate surfaces and must not be merged in docs or reports.
