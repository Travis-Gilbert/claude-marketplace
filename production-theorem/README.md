# production-theorem

Dual-host plugin: works in both Codex and Claude Code from a single source. `plugin.manifest.json` is the canonical source for shared metadata and host-specific manifest payloads; the generated host manifests keep each platform's discovery contract intact.

## What's shared (both hosts read this)

- `skills/orchestrate/`, `skills/planning-theorem/`, `skills/theorize/`, `skills/execute/`
- All 11 `agents/*.md` (orchestrate-planner, action-rail-specialist, validator-reporter, redis-harness-operator, redis-product-safety, plugin-router, federation-learning-recorder, epistemic-graphrag-specialist, context-artifact-specialist, codex-sdk-harness-product, checklist-manifest)
- All 11 `references/*.md` (ROUTING, CHECKLIST_MANIFESTO, ORCHESTRATE_REPORTING, PRODUCTION_GATES, UI_VISUAL_PROJECT_GATES, SDK_DATABASE_HARNESS, ARTIFACT_SCHEMAS, EPISTEMIC_PRIMITIVES, HOST_REPO_OPT_IN, PLUGIN_INVENTORY, REPORTING, SETTINGS)

A change to any of these flows to both hosts on next install / sync. There is no port to keep up to date.

## Manifest source and generated host manifests

| File | Read by | Purpose |
|---|---|---|
| `plugin.manifest.json` | maintainer tooling | Canonical source for shared plugin metadata, Claude manifest payload, and Codex manifest payload |
| `.claude-plugin/plugin.json` | Claude Code | Identity + `mcpServers` registration |
| `.codex-plugin/plugin.json` | Codex | Identity + `interface` block (displayName, capabilities, defaultPrompt) + Codex hook manifest pointer |

Regenerate and verify the host manifests with:

```bash
python3 scripts/sync-plugin-manifests.py production-theorem --check
python3 scripts/sync-plugin-manifests.py production-theorem
```

## Hook manifests and shared runtime

| Path | Purpose |
|---|---|
| `hooks/hooks.json.disabled` | Claude Code lifecycle hooks kept disabled by default until the Claude hook auto-load path is explicitly re-enabled. Five events: `SessionStart` begins a harness run, `UserPromptSubmit` calls `/orchestrate/prepare/` and injects the Context Brief before the model turn, `PreToolUse` enforces the Action Rail, `PostToolUse` records each tool call as a `step` event, `Stop` records run outcome and state hash. |
| `hooks/codex-hooks.json` | Codex lifecycle hooks. Same five events, but packaged in Codex-native hook schema and resolved via `${PLUGIN_ROOT}`. |
| `scripts/*.sh` | Shared bash implementations of the hooks. Host-aware, fail-open, pure bash + curl + jq. |
| `mcp/server.mjs` + `mcp/package.json` | Slim MCP fallback (Mode 2). Includes context refresh/replay, saved-context product tools, memory-patch review tools, and headless coordination tools (`self_note`, `coordinate`, `mentions`, `presence`, etc.). |

The `mcpServers` field in `.claude-plugin/plugin.json` registers both this slim MCP and the fat Theseus MCP at `theseus-mcp-production.up.railway.app/mcp` (Mode 3 power-user surface, ~50 tools).

## Configuration

Codex plugin hooks are off unless the host config enables them:

```toml
[features]
plugin_hooks = true
```

Some hosts look for `hooks/hooks.json` by convention when hook support is enabled. This plugin keeps the Claude-specific manifest disabled and sets an explicit `hooks` path in `.codex-plugin/plugin.json` so Codex uses `hooks/codex-hooks.json`.

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

## Install (Codex)

1. Enable the plugin in Codex.
2. Turn on plugin hooks in repo or user config:

```toml
[features]
plugin_hooks = true
```

3. Restart the session so Codex reviews and trusts the bundled hook commands.

## Backend routes (Claude hooks exercise these)

- `POST /api/v2/theseus/harness/runs/` (begin run)
- `POST /api/v2/theseus/orchestrate/prepare/` (planning preview)
- `POST /api/v2/theseus/context/compile/` (PPR-compiled artifact, auth-gated)
- `POST /api/v2/theseus/harness/runs/{id}/step/` (record tool use)
- `POST /api/v2/theseus/harness/runs/{id}/outcome/` (run outcome)
- `POST /api/v2/theseus/harness/runs/{id}/context-injected/` (mark inject)
- `GET  /api/v2/theseus/harness/runs/{id}/events/` (replay)
- `GET  /api/v2/theseus/harness/runs/{id}/state-hash/` (deterministic replay key)
- `POST /api/v2/theseus/harness/memory/self-note/` (typed agent memory)
- `POST /api/v2/theseus/harness/memory/self-revise/` (revision-tracked memory)
- `POST /api/v2/theseus/harness/memory/self-archive/` (archive memory out of active recall)
- `POST /api/v2/theseus/harness/memory/self-recall-archive/` (recall archived memory)
- `POST /api/v2/theseus/harness/coordinate/` (append coordination message and queue mentions)
- `POST /api/v2/theseus/harness/mentions/` (load or consume pending mentions)
- `POST /api/v2/theseus/harness/presence/` (refresh or read actor presence)
- `POST /api/v2/theseus/harness/subscribe/` (register mention polling channel)

Failure semantics: every hook fails open. Backend 500, missing jq, malformed responses all result in `{"continue": true}` so the user's session never breaks because the plugin had a bad day.
