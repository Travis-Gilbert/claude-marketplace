# theorem-context-claude

Claude Code plugin that wires Theorem Context into every session as **out-of-band orchestration**. Most context arrives via a `UserPromptSubmit` hook that runs Theseus' orchestrate pipeline and injects a finished Context Artifact into the prompt before the model turn. The agent does not call retrieval tools to get its working knowledge; it receives the working knowledge as input.

## What it does

| Lifecycle event | Hook | Behavior |
|---|---|---|
| Session start | `SessionStart` | Begin a harness run on the Index-API. Stash `run_id` in `.theorem/runs/<sid>.run_id`. |
| Every prompt | `UserPromptSubmit` | Call `/orchestrate/prepare/` with the user's prompt as `task`. Inject the returned Context Artifact body via `hookSpecificOutput.additionalContext`. Persist `current-artifact.{md,json}` and `current-action-rail.json` for audit. |
| Before tool use | `PreToolUse` | If `THEOREM_ACTION_RAIL=enforce`, evaluate the deny rules in `current-action-rail.json` against the proposed tool call. Block matches; allow everything else. Default mode is `record` (no blocking). |
| After tool use | `PostToolUse` | Record the tool call as a `step` event on the run. Background, fire-and-forget, never blocks. |
| Session stop | `Stop` | Record run outcome. Capture state hash for replay. |

## The three product modes

Borrowed from the Theorem Context spec; the plugin defaults to the strongest one.

**Mode 1: No-tool (default).** Context arrives via the `UserPromptSubmit` hook. The model never sees a retrieval tool. Cheapest token economics: no tool schemas in the model's view, no tool-selection reasoning, no raw tool output to synthesize.

**Mode 2: One-tool fallback.** A slim local MCP server exposes three tools for cases the hook can't cover: `orchestrate_refresh` (recompile mid-session), `harness_replay` (audit timeline), `harness_describe_current` (introspect the active artifact). Surfaced via the skills `/orchestrate`, `/replay-last-run`, `/show-context`.

**Mode 3: Full Theseus surface (opt-in).** The fat Theseus MCP at `https://theseus-mcp-production.up.railway.app/mcp` is registered alongside the slim plugin MCP. Power users get the ~50 graph-operation tools (`theseus_ppr_expand`, `theseus_search_knowledge`, `theseus_find_connections`, etc.). To turn this off, remove the second `mcpServers` entry from `plugin.json`.

## Key URLs

| Surface | URL |
|---|---|
| HTTP API for hooks/MCP-server (orchestrate, harness, context) | `https://index-api-production-a5f7.up.railway.app/api/v2/theseus` |
| Theseus MCP (Mode 3 surface) | `https://theseus-mcp-production.up.railway.app/mcp` |

Override the API base with `THEOREM_CONTEXT_BASE_URL`. The path prefix `/api/v2/theseus` must be included; this matches the Python and TypeScript SDKs' `base_url` contract.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `THEOREM_CONTEXT_BASE_URL` | `https://index-api-production-a5f7.up.railway.app/api/v2/theseus` | HTTP API base |
| `THEOREM_CONTEXT_API_KEY` | empty | Bearer token; required for non-public deployments |
| `THEOREM_BUDGET_TOKENS` | `4000` | Default Context Artifact size for the prompt-time hook |
| `THEOREM_ACTION_RAIL` | `record` | One of `off`, `record`, `enforce` |
| `THEOREM_DEBUG` | `0` | Set to `1` to log hook activity to stderr |

## Audit trail

For every session the plugin writes:

```
.theorem/
  current-context.md           # symlink to last artifact body
  current-artifact.json        # symlink to last raw response
  current-action-rail.json     # symlink to current rail rules
  runs/
    <sid>.run_id               # current harness run id for this session
    <sid>/
      last-artifact.md
      last-artifact.json
      last-action-rail.json
      last-state-hash.txt
```

The `.theorem/` directory should be gitignored. A `.gitignore` is shipped with the plugin; copy or symlink as needed.

## Why no-tool mode wins on cost

When retrieval is a model-visible tool, every turn pays for tool schema tokens, the model's reasoning about which tool to call, raw tool output tokens, and re-synthesis of those outputs into useful working memory. With out-of-band orchestration, the model gets a finished artifact at `~budget_tokens` once per turn. Across a session of 30 turns the multiplicative savings compound substantially.

This is the same architecture the Codex bundle adapter uses, applied through Claude Code's hook surface instead of a CLI bundle. Same backend, same harness, different host.

## Failure semantics

Every hook **fails open**: backend unreachable, jq missing, route 404, malformed response, all return `{"continue":true}` so the user's session never breaks because the plugin had a bad day. Errors are logged to stderr (visible in Claude Code's debug log) without surfacing in the conversation.

## See also

- `INSTALL.md` for setup steps
- `packages/theorem-context-py` and `packages/theorem-context-ts` for the SDKs the MCP server uses internally
- `Index-API/docs/codebase-map.md` is the canonical navigation document for the Django backend that serves the API routes; the plugin assumes it's reachable
