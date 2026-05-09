# production-theorem-claude

Claude Code port of [`production-theorem`](../production-theorem/). The skills, agents, and references are **copied verbatim** from the codex parent. The additions on top are Claude-specific UI integrations.

## What's identical to `production-theorem`

- `skills/orchestrate/`, `skills/planning-theorem/`, `skills/theorize/`, `skills/execute/`
- All 11 `agents/*.md` (orchestrate-planner, action-rail-specialist, validator-reporter, redis-harness-operator, redis-product-safety, plugin-router, federation-learning-recorder, epistemic-graphrag-specialist, context-artifact-specialist, codex-sdk-harness-product, checklist-manifest)
- All 11 `references/*.md` (ROUTING, CHECKLIST_MANIFESTO, ORCHESTRATE_REPORTING, PRODUCTION_GATES, UI_VISUAL_PROJECT_GATES, SDK_DATABASE_HARNESS, ARTIFACT_SCHEMAS, EPISTEMIC_PRIMITIVES, HOST_REPO_OPT_IN, PLUGIN_INVENTORY, REPORTING, SETTINGS)

The behavioral specification is the canonical Production-Theorem one. If `production-theorem` updates its skill bodies or references, this plugin should be re-synced from it.

## What's added for Claude Code

| Layer | Files | Purpose |
|---|---|---|
| **Hooks** | `hooks/hooks.json`, `scripts/*.sh` | `SessionStart` begins a harness run; `UserPromptSubmit` calls `/orchestrate/prepare/` and injects the Context Brief before the model turn (out-of-band orchestration); `PreToolUse` enforces the Action Rail; `PostToolUse` records each tool call as a `step` event; `Stop` records run outcome and state hash. |
| **Slim MCP** | `mcp/server.mjs`, `mcp/package.json` | Mode 2 fallback. Three tools: `orchestrate_refresh` (recompile context mid-session), `harness_replay` (event timeline), `harness_describe_current` (introspect active artifact). |
| **Fat Theseus MCP** | registered in `plugin.json` | Mode 3 power-user surface. ~50 tools (`theseus_ppr_expand`, `theseus_search_knowledge`, `theseus_find_connections`, `theseus_orchestrator_status`, etc.). |

## Install

```bash
# 1. Install MCP deps
cd $(claude plugin path production-theorem-claude)/mcp && npm install

# 2. Make hook scripts executable (rsync usually preserves, verify)
chmod +x ../scripts/*.sh

# 3. Enable in Claude Code
# Add to ~/.claude/settings.json enabledPlugins:
#   "production-theorem-claude@codex-marketplace": true
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `THEOREM_CONTEXT_BASE_URL` | `https://index-api-production-a5f7.up.railway.app/api/v2/theseus` | HTTP API base (must include `/api/v2/theseus`) |
| `THEOREM_CONTEXT_API_KEY` | empty | Bearer token; required to reach `/context/compile/` (PPR-compiled artifact). Without it, the hook falls back to `/orchestrate/prepare/` planning data. |
| `THEOREM_BUDGET_TOKENS` | `4000` | Default Context Artifact budget |
| `THEOREM_ACTION_RAIL` | `record` | One of `off`, `record`, `enforce` |
| `THEOREM_DEBUG` | `0` | Set to `1` to log hook activity to stderr |

## Coexistence with `theorem-context-claude`

If you have both `theorem-context-claude` and `production-theorem-claude` enabled, both register hooks on `UserPromptSubmit` and the brief gets compiled twice per turn. Disable one. The recommended layering:

- **Both layers needed:** keep only `production-theorem-claude`. It's the workflow plugin and includes the same hook/MCP wiring.
- **SDK-level only (no Orchestrate workflow):** keep only `theorem-context-claude`.

## Backend routes (Claude additions exercise these)

- `POST /api/v2/theseus/harness/runs/` (begin run)
- `POST /api/v2/theseus/orchestrate/prepare/` (planning preview)
- `POST /api/v2/theseus/context/compile/` (PPR-compiled artifact, auth-gated)
- `POST /api/v2/theseus/harness/runs/{id}/step/` (record tool use)
- `POST /api/v2/theseus/harness/runs/{id}/outcome/` (run outcome)
- `POST /api/v2/theseus/harness/runs/{id}/context-injected/` (mark inject)
- `GET  /api/v2/theseus/harness/runs/{id}/events/` (replay)
- `GET  /api/v2/theseus/harness/runs/{id}/state-hash/` (deterministic replay key)

Failure semantics: every hook fails open. Backend 500, missing jq, malformed responses all result in `{"continue": true}` so the user's session never breaks because the plugin had a bad day.
