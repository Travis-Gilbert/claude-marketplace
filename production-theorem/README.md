# production-theorem

Dual-host plugin: works in both Codex and Claude Code from a single source. The host picks up its own manifest at install time; the rest of the directory is shared content.

## What's shared (both hosts read this)

- `skills/orchestrate/`, `skills/planning-theorem/`, `skills/theorize/`, `skills/execute/`
- All 11 `agents/*.md` (orchestrate-planner, action-rail-specialist, validator-reporter, redis-harness-operator, redis-product-safety, plugin-router, federation-learning-recorder, epistemic-graphrag-specialist, context-artifact-specialist, codex-sdk-harness-product, checklist-manifest)
- All 11 `references/*.md` (ROUTING, CHECKLIST_MANIFESTO, ORCHESTRATE_REPORTING, PRODUCTION_GATES, UI_VISUAL_PROJECT_GATES, SDK_DATABASE_HARNESS, ARTIFACT_SCHEMAS, EPISTEMIC_PRIMITIVES, HOST_REPO_OPT_IN, PLUGIN_INVENTORY, REPORTING, SETTINGS)

A change to any of these flows to both hosts on next install / sync. There is no port to keep up to date.

## Per-host manifests

| File | Read by | Purpose |
|---|---|---|
| `.claude-plugin/plugin.json` | Claude Code | Identity + `mcpServers` registration |
| `.codex-plugin/plugin.json` | Codex | Identity + `interface` block (displayName, capabilities, defaultPrompt) |

## Claude-only files (Codex ignores these)

| Path | Purpose |
|---|---|
| `hooks/hooks.json` | Auto-loaded by Claude Code on plugin enable. Five lifecycle hooks: `SessionStart` begins a harness run, `UserPromptSubmit` calls `/orchestrate/prepare/` and injects the Context Brief before the model turn, `PreToolUse` enforces the Action Rail, `PostToolUse` records each tool call as a `step` event, `Stop` records run outcome and state hash. |
| `scripts/*.sh` | Bash implementations of the hooks. Pure bash + curl + jq. |
| `mcp/server.mjs` + `mcp/package.json` | Slim MCP fallback (Mode 2). Three tools: `orchestrate_refresh`, `harness_replay`, `harness_describe_current`. |

The `mcpServers` field in `.claude-plugin/plugin.json` registers both this slim MCP and the fat Theseus MCP at `theseus-mcp-production.up.railway.app/mcp` (Mode 3 power-user surface, ~50 tools).

## Configuration (Claude side only)

| Env var | Default | Purpose |
|---|---|---|
| `THEOREM_CONTEXT_BASE_URL` | `https://index-api-production-a5f7.up.railway.app/api/v2/theseus` | HTTP API base (must include `/api/v2/theseus`) |
| `THEOREM_CONTEXT_API_KEY` | empty | Bearer token; required to reach `/context/compile/` (PPR-compiled artifact). Without it, the hook falls back to `/orchestrate/prepare/` planning data. |
| `THEOREM_BUDGET_TOKENS` | `4000` | Default Context Artifact budget |
| `THEOREM_ACTION_RAIL` | `record` | One of `off`, `record`, `enforce` |
| `THEOREM_DEBUG` | `0` | Set to `1` to log hook activity to stderr |

## Install (Claude Code)

```bash
# 1. Install MCP deps
cd $(claude plugin path production-theorem)/mcp && npm install

# 2. Enable in ~/.claude/settings.json:
#   "production-theorem@codex-marketplace": true
```

## Backend routes (Claude hooks exercise these)

- `POST /api/v2/theseus/harness/runs/` (begin run)
- `POST /api/v2/theseus/orchestrate/prepare/` (planning preview)
- `POST /api/v2/theseus/context/compile/` (PPR-compiled artifact, auth-gated)
- `POST /api/v2/theseus/harness/runs/{id}/step/` (record tool use)
- `POST /api/v2/theseus/harness/runs/{id}/outcome/` (run outcome)
- `POST /api/v2/theseus/harness/runs/{id}/context-injected/` (mark inject)
- `GET  /api/v2/theseus/harness/runs/{id}/events/` (replay)
- `GET  /api/v2/theseus/harness/runs/{id}/state-hash/` (deterministic replay key)

Failure semantics: every hook fails open. Backend 500, missing jq, malformed responses all result in `{"continue": true}` so the user's session never breaks because the plugin had a bad day.
