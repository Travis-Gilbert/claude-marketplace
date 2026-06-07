# Theorem's Harness

Dual-host plugin: works in both Codex and Claude Code from a single source. `plugin.manifest.json` is the canonical source for shared metadata and host-specific manifest payloads; the generated host manifests keep each platform's discovery contract intact.

## What's shared (both hosts read this)

- `skills/theorems-harness/`, `skills/context-refresh/`, `skills/harness-coordinate/`, `skills/peer-review/`, `skills/research/`, `skills/planning-theorem/`, `skills/theorize/`, `skills/execute/`, `skills/encode/`, `skills/replay-last-run/`, `skills/show-context/`, `skills/code_theorem/`, `skills/graph_theorem/`, `skills/compute_code/`, `skills/curiosity/`, `skills/session-offload/`
- All 11 `agents/*.md` (orchestrate-planner, action-rail-specialist, validator-reporter, redis-harness-operator, redis-product-safety, plugin-router, federation-learning-recorder, epistemic-graphrag-specialist, context-artifact-specialist, codex-sdk-harness-product, checklist-manifest)
- All 20 `references/*.md`: `ARTIFACT_SCHEMAS.md`, `BRIEF_TEMPLATE.md`, `CHECKLIST_MANIFESTO.md`, `CONCISE_ACTION.md`, `ENGINEERS_MINDSET.md`, `EPISTEMIC_PRIMITIVES.md`, `HOST_REPO_OPT_IN.md`, `LEARNINGS.md`, `ORCHESTRATE_REPORTING.md`, `PLAN_TEMPLATE.md`, `PLUGIN_INVENTORY.md`, `PRODUCTION_GATES.md`, `PROFILES.md`, `REFS_AUDIT.md`, `REFS_MANIFEST.md`, `REPORTING.md`, `ROUTING.md`, `SDK_DATABASE_HARNESS.md`, `SETTINGS.md`, `UI_VISUAL_PROJECT_GATES.md`

A change to any of these flows to both hosts on next install / sync. There is no port to keep up to date.

## Adaptive slash/skill surface

`theorems-harness` packages Theorem's Harness, which is the user-visible
product layer. Slash commands and skills live here; the SDK and MCP surfaces sit
underneath it.

`/harness` is an opt-in to harness behavior for the active task, not a narrow
mode selector. The agent should pick the best capability mix, reroute at
checkpoints, coordinate when another agent may overlap, validate claims, and
encode durable lessons only when they are high signal.

| Layer | Role |
|---|---|
| Slash commands | Human/agent entrypoints such as `/harness`, `/context-refresh`, `/coordinate`, `/peer-review`, `/research`, `/encode`, and `/compute_code` |
| Skills | Behavioral protocols for when and how to use those entrypoints |
| Slim MCP | Local tool bus for adaptive routing, refresh, replay, memory, encode, and coordination |
| Remote MCPs | Theorem-side RustyRed MCP for native graph reads, algorithms, search, harness coordination, memory, and event-log surfaces, reached through a Claude-compatible local proxy |
| SDK | Typed client library used by hooks, scripts, and MCP wrappers; not a separate user-facing command layer |

The older `theorem-context-sdk/claude-code` plugin is legacy host-adapter
plumbing. Its manual refresh behavior now belongs under `/context-refresh`;
grounded agent work belongs to this plugin's `/harness`.

## Manifest source and generated host manifests

| File | Read by | Purpose |
|---|---|---|
| `plugin.manifest.json` | maintainer tooling | Canonical source for shared plugin metadata, Claude manifest payload, and Codex manifest payload |
| `.claude-plugin/plugin.json` | Claude Code | Identity + `mcpServers` registration |
| `.codex-plugin/plugin.json` | Codex | Identity + `interface` block (displayName, capabilities, defaultPrompt) + Codex hook manifest pointer |

Regenerate and verify the host manifests with:

```bash
python3 scripts/sync-plugin-manifests.py theorems-harness --check
python3 scripts/sync-plugin-manifests.py theorems-harness
```

## Hook manifests and shared runtime

| Path | Purpose |
|---|---|
| `hooks/hooks.json` | Claude Code lifecycle hooks. SessionStart begins a harness run, loads codebase/coordination context, and injects the standing harness frame; UserPromptSubmit writes live coordination intent, prepares context, emits checklist contracts, injects ambition/curiosity directives, and suggests subagents; PreToolUse enforces the action rail and loads pre-tool context; PostToolUse records tool/context/coordination events and scans for early deferral language; FileChanged refreshes changed-file context; Stop gates checklist completion, writes a coordination reflection, then Stop and PreCompact flush run/continuity state. Advertised from `.claude-plugin/plugin.json`. |
| `hooks/codex-hooks.json` | Codex lifecycle hooks. Same turn/tool/stop lifecycle as Claude Code where Codex exposes compatible events, packaged in Codex-native hook schema and resolved via `${PLUGIN_ROOT}`. `FileChanged` and `PreCompact` remain Claude-only until Codex exposes those events. Codex also reads the same `.harness/checklist.json` contract and coordination mirror. |
| `scripts/*.sh` | Shared bash implementations of the hooks. Host-aware, fail-open, pure bash + curl + jq. |
| `scripts/peer-review-request.sh` | Creates `.theorem/peer-review/` packets and optionally sends a coordination mention for cross-model review before commit or launch reporting. |
| `mcp/server.mjs` + `mcp/package.json` | Slim MCP fallback (Mode 2). Includes adaptive route selection (`harness_route`), context compile/refresh/replay, code search/crawl, research/fractal expansion, Instant KG status/reingest, provenance trace reads, native skill-pack tools (`skill_list`, `skill_get`, `skill_publish`, `skill_apply`), domain pack list/install, saved-context product tools, memory-patch review tools, headless coordination tools (`coordination_room`, `coordination_intent`, `coordination_reflection`, `coordination_decision`, `coordination_tension`, `coordinate`, `mentions`, `mentions_wait`, `presence`, `subscribe`, `continuity_pack`), multi-head substrate tools (`multihead_run`, `multihead_task`, `multihead_claim`, `multihead_patch`, `multihead_proof`, `multihead_review`) that route to the Rust runtime-backed MCP with the local `.theorem/multihead` spike as compat fallback, memory tools (`recall`, `remember`, `relate`, `self_note`, `self_revise`, `self_archive`, `self_recall_archive`), and `encode` for feedback/solution/postmortem memory. Cross-agent behavior is taught by `skills/harness-coordinate/`. |
| `mcp/rustyred-theorem-proxy.mjs` | Claude compatibility shim for the Theorem-side RustyRed MCP. It forwards tool calls to `rustyredcore-theorem-production.up.railway.app/mcp` and normalizes top-level schema combinators during `tools/list`. |

The `mcpServers` field in `.claude-plugin/plugin.json` registers this slim MCP plus a local `rustyred-thg` proxy for the Theorem-side RustyRed MCP at `rustyredcore-theorem-production.up.railway.app/mcp`. The old Theseus MCP is intentionally not registered by the Claude host manifest; product/context HTTP routes still use `THEOREM_CONTEXT_BASE_URL`.

The slim MCP advertises these launch-facing tools through `listTools`:

- Context and runs: `harness_route`, `context_compile`, `orchestrate_refresh`, `harness_replay`, `harness_describe_current`
- Code and research: `code_search`, `code_crawl`, `harness_fractal_expansion`, `fractal_expand`
- Pairformer/graph readiness: `instant_kg_status`, `instant_kg_reingest`, `provenance_trace`
- Skill packs: `skill_list`, `skill_get`, `skill_publish`, `skill_apply`
- Coordination: `coordination_room`, `coordination_intent`, `coordination_reflection`, `coordination_decision`, `coordination_tension`, `coordinate`, `mentions`, `mentions_wait`, `presence`, `subscribe`, `continuity_pack`
- Multi-head substrate: `multihead_run`, `multihead_task`, `multihead_claim`, `multihead_patch`, `multihead_proof`, `multihead_review`. In compat mode these call the native Rust MCP first and fall back to local `.theorem/multihead/state.json` when the deployed runtime does not yet expose the tool.
- Memory and learning: `recall`, `remember`, `relate`, `self_note`, `self_revise`, `self_archive`, `self_recall_archive`, `encode`
- Product/domain operations: `product_bootstrap`, `saved_contexts_list`, `saved_context_create`, `saved_context_update`, `saved_context_mute`, `saved_context_activate`, `saved_context_delete`, `saved_context_preview_recall`, `memory_patch_review_queue`, `memory_patch_review_update`, `domain_list`, `domain_install`

## Configuration

Codex plugin hooks are off unless the host config enables them:

```toml
[features]
plugin_hooks = true
```

Claude Code uses `hooks/hooks.json`; Codex uses the explicit `hooks` path in `.codex-plugin/plugin.json` so it loads `hooks/codex-hooks.json`.

| Env var | Default | Purpose |
|---|---|---|
| `THEOREM_CONTEXT_BASE_URL` | `https://index-api-production-a5f7.up.railway.app/api/v2/theseus` | HTTP API base (must include `/api/v2/theseus`) |
| `THEOREM_CONTEXT_API_KEY` / `THEOREM_API_KEY` | empty | Bearer token; `THEOREM_API_KEY` is the public product alias and is accepted anywhere `THEOREM_CONTEXT_API_KEY` is accepted. Required to reach authenticated product and context routes. |
| `THEOREM_CONTEXT_TENANT_SLUG` / `THEOREM_TENANT_SLUG` | inferred | Optional product tenant override for direct RustyRed-THG mirrors. If unset, the MCP server infers the API-key tenant from `product_bootstrap.default_tenant_slug`; `public` is ignored because it is a THG default, not a product tenant. |
| `THEOREM_HARNESS_MCP_URL` | `https://rustyredcore-theorem-production.up.railway.app/mcp` | Primary native Theorem RustyRed MCP used by the slim MCP route policy for memory, coordination, run, and skill-pack capability calls. |
| `THEOREM_HARNESS_API_TOKEN` | empty | Optional Bearer token for native Theorem RustyRed MCP writes. |
| `THEOREM_ACTOR` | host actor | Optional actor override for MCP coordination tools. When omitted, the MCP server defaults to `codex` in Codex-hosted plugin runs and `claude-code` otherwise, so mention reads do not fall back to the API-key actor. |
| `THEOREMS_HARNESS_THG_WRITES` | `mirror` | `mirror`, `primary`, or `off` for direct RustyRed-THG graph writes from the slim MCP memory/coordination tools. |
| `THEOREMS_HARNESS_THG_BASE_URL` | `https://thg-product-production.up.railway.app` | RustyRed-THG product REST base URL for direct graph mirrors. This remains separate from the Claude remote MCP registration. |
| `THEOREMS_HARNESS_THG_API_TOKEN` | empty | Optional Bearer token for RustyRed-THG direct graph mirrors. |
| `THEOREMS_HARNESS_RUSTYRED_MCP_URL` / `RUSTYRED_THG_MCP_URL` | `https://rustyredcore-theorem-production.up.railway.app/mcp` | Theorem-side RustyRed MCP URL used by the Claude compatibility proxy. |
| `THEOREM_BUDGET_TOKENS` | `4000` | Default Context Artifact budget |
| `THEOREM_ACTION_RAIL` | `record` | One of `off`, `record`, `enforce` |
| `THEOREM_DEBUG` | `0` | Set to `1` to log hook activity to stderr |
| `THEOREM_PEER_REVIEW_BASE` | empty | Optional base ref/commit used by `scripts/peer-review-request.sh` when preparing a peer-review packet. Defaults to upstream merge-base or `HEAD`. |
| `THEOREM_PEER_REVIEW_ACTOR` | host actor | Optional actor override for peer-review packets. |
| `THEOREM_PEER_REVIEW_TARGET` | other main agent | Optional target override for peer-review packets. |

## Install (Claude Code)

```bash
# 1. Install MCP deps
cd $(claude plugin path theorems-harness)/mcp && npm install

# 2. Enable in ~/.claude/settings.json:
#   "theorems-harness@codex-marketplace": true
```

## Install (Codex)

1. Enable the plugin in Codex.
2. Turn on plugin hooks in repo or user config:

```toml
[features]
plugin_hooks = true
```

3. Restart the session so Codex reviews and trusts the bundled hook commands.

## Backend routes (hooks exercise these)

- `POST /api/v2/theseus/harness/runs/` (begin run)
- `POST /api/v2/theseus/orchestrate/prepare/` (internal prepare route; public command is `/context-refresh`)
- `POST /api/v2/theseus/context/compile/` (PPR-compiled artifact, auth-gated)
- `GET  /api/v2/theseus/code/symbols/` (code graph symbol search)
- `POST /api/v2/theseus/code/ingest/` (operator-approved code graph ingest/crawl)
- `POST /api/v2/theseus/capture/instant-kg/` (enqueue Instant KG reingest/capture)
- `GET  /api/v2/theseus/trace/search/` and `GET /api/v2/theseus/trace/{id}/` (reasoning provenance trace reads)
- `GET  /api/v2/packs/` and `POST /api/v2/pack-installs/` (domain pack list/install)
- `POST /api/v2/theseus/harness/runs/{id}/step/` (record tool use)
- `POST /api/v2/theseus/harness/runs/{id}/outcome/` (run outcome)
- `POST /api/v2/theseus/harness/runs/{id}/context-injected/` (mark inject)
- `GET  /api/v2/theseus/harness/runs/{id}/events/` (replay)
- `GET  /api/v2/theseus/harness/runs/{id}/state-hash/` (deterministic replay key)
- `POST /api/v2/theseus/harness/memory/self-note/` (typed agent memory)
- `POST /api/v2/theseus/harness/memory/self-revise/` (revision-tracked memory)
- `POST /api/v2/theseus/harness/memory/self-archive/` (archive memory out of active recall)
- `POST /api/v2/theseus/harness/memory/self-recall-archive/` (recall archived memory)
- `POST /api/v2/theseus/harness/encode/` (record feedback, solutions, and postmortems with fitness telemetry)
- `POST /api/v2/theseus/harness/coordinate/` (append coordination message and queue mentions)
- `POST /api/v2/theseus/harness/coordination/room/` (join/read/control durable coordination room membership)
- `POST /api/v2/theseus/harness/coordination/intent/` (write live per-actor intent / immediate file claim)
- `POST /api/v2/theseus/harness/coordination/reflection/` (write turn-end working memory for the room digest)
- `POST /api/v2/theseus/harness/coordination/decision/` (append room-scoped choice and rationale)
- `POST /api/v2/theseus/harness/coordination/tension/` (open, resolve, or escalate visible disagreement)
- `POST /api/v2/theseus/harness/mentions/` (load or consume pending mentions)
- `POST /api/v2/theseus/harness/mentions/wait/` (block briefly until mentions arrive)
- `POST /api/v2/theseus/harness/presence/` (refresh or read actor presence)
- `POST /api/v2/theseus/harness/subscribe/` (register mention polling channel)
- `POST /api/v2/theseus/harness/session/continuity-pack/` (write graph-backed and disk-mirrored continuity before compaction or handoff)

Failure semantics: every hook fails open. Backend 500, missing jq, malformed responses all result in `{"continue": true}` so the user's session never breaks because the plugin had a bad day.
