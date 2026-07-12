# Theorem's Harness

Dual-host plugin: works in both Codex and Claude Code from a single source. `plugin.manifest.json` is the canonical source for shared metadata and host-specific manifest payloads; the generated host manifests keep each platform's discovery contract intact.

## What's shared (both hosts read this)

- `skills/theorems-harness/`, `skills/context-refresh/`, `skills/harness-coordinate/`, `skills/peer-review/`, `skills/research/`, `skills/planning-theorem/`, `skills/theorize/`, `skills/execute/`, `skills/encode/`, `skills/replay-last-run/`, `skills/show-context/`, `skills/code_theorem/`, `skills/graph_theorem/`, `skills/compute_code/`, `skills/graph-version/`, `skills/symbolic/`, `skills/dispatch/`, `skills/browser-web/`, `skills/curiosity/`, `skills/session-offload/`, `skills/writing-engineering/`, `skills/design-engineering/`, `skills/rust-engineering/`, `skills/ponytail/`, `skills/ponytail-review/`, `skills/ponytail-audit/`, `skills/ponytail-debt/`, `skills/ponytail-gain/`, `skills/ponytail-help/`
- Agent profiles under `agents/*.md`.
- Shared references under `references/*.md`.

A change to any of these flows to both hosts on next install / sync. There is no port to keep up to date.

## Adaptive slash/skill surface

`theorems-harness` packages Theorem's Harness, which is the user-visible
product layer. Slash commands and skills live here; the GraphQL MCP API is the
preferred tool bus, and the SDK sits underneath as typed helper plumbing.

`/harness` is an opt-in to harness behavior for the active task, not a narrow
mode selector. The agent should pick the best capability mix, reroute at
checkpoints, coordinate when another agent may overlap, validate claims, and
encode durable lessons only when they are high signal.

| Layer | Role |
|---|---|
| Slash commands | Human/agent entrypoints such as `/harness`, `/context-refresh`, `/coordinate`, `/peer-review`, `/research`, `/encode`, `/compute_code`, `/writing-engineering`, `/design-engineering`, `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, and `/ponytail-help` |
| Skills | Behavioral protocols for when and how to use those entrypoints |
| GraphQL MCP | Single remote HTTP `theorems-harness` server for graph reads, algorithms, code discovery, code ingest, harness run lifecycle, memory, coordination, and skill-pack surfaces |
| SDK | Typed client helpers used by scripts and compatibility utilities; not a separate user-facing command layer |

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
| `hooks/hooks.json` | Claude Code lifecycle hooks. SessionStart begins a harness run, loads codebase/coordination context, arms writing-engineering, loads Ponytail's default mode, and injects the standing harness frame; UserPromptSubmit writes live coordination intent, prepares context, emits checklist contracts, injects ambition/curiosity directives, suggests subagents, and tracks Ponytail mode changes; PreToolUse enforces the action rail and loads pre-tool context; PostToolUse records tool/context/coordination events; FileChanged refreshes changed-file context; Stop gates checklist completion, records repo hygiene, changed-language, writing, and design receipts, writes a coordination reflection, then Stop and PreCompact flush run/continuity state. Advertised from `.claude-plugin/plugin.json`. |
| `hooks/codex-hooks.json` | Codex lifecycle hooks. Same turn/tool/stop lifecycle as Claude Code where Codex exposes compatible events, packaged in Codex-native hook schema and resolved via `${PLUGIN_ROOT}`. Codex `PreToolUse` is limited to auto-authorizing the harness MCP namespace so the plugin never gates Bash/Edit/Write/apply_patch calls. `FileChanged` and `PreCompact` remain Claude-only until Codex exposes those events. Codex reads the session-bound `.harness/checklists/<plan-slug>--<plan-id>.json` projection (with `.harness/checklist.json` as a legacy fallback), records actions after tool use, records repo hygiene plus changed-language Stop receipts, records the same writing/design Stop receipts, and loads/tracks Ponytail mode when Node.js is on the hook PATH. |
| `scripts/*.sh` | Shared bash implementations of the hooks. Host-aware, fail-open, pure bash + curl + jq. |
| `scripts/peer-review-request.sh` | Creates `.theorem/peer-review/` packets and optionally sends a coordination mention for cross-model review before commit or launch reporting. |
| `.mcp.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` | Register the single remote HTTP MCP server named `theorems-harness`. There is no bundled Node MCP server or local proxy. |

Every lifecycle event also writes a local hook-doctor receipt to
`.theorem/hook-doctor/events.jsonl`. Stop review receipts land in
`.theorem/review/latest-repo-hygiene.json` and
`.theorem/review/latest-language-checks.json` before any best-effort remote
append, so a remote MCP outage no longer makes hook execution invisible.

The `mcpServers` field registers one server, `theorems-harness`, pointing at
`https://rustyredcore-theorem-production.up.railway.app/mcp`. The old local
Node MCP and the separate RustyRed proxy are removed; hooks call native tools
through `theorem_native_call`.

## GraphQL MCP surface

Version `0.6.0` is the GraphQL-first plugin contract. When `tools/list` exposes
`graphql_query`, `graphql_mutate`, and `graphql_introspect`, agents should use
`graphql_introspect` to discover the schema and then read or write memory,
coordination, jobs, graph, code, and run surfaces through GraphQL. On servers
with `graphql_default_surface` enabled, flat tools already covered by GraphQL
may be hidden from `tools/list`.

Flat tools remain a compatibility and diagnosis path. Use them only when a
local/dev server does not expose GraphQL yet, a host session is intentionally
testing legacy flat-tool behavior, or GraphQL itself is the suspected failure
surface.

The transport endpoint does not change for hosted users: Claude Code, Claude.ai,
and Codex plugin installs all point at the remote Railway MCP unless a developer
intentionally overrides `THEOREM_HARNESS_MCP_URL` for local work.

The MCP may advertise these launch-facing tools through `tools/list`:

Host UIs may show these tools with a plugin or app prefix, for example
`theorems-harness recall`, `Theorem's Harness Recall`, or
`mcp__codex_apps__theorems_harness._recall`. Treat that prefix as the host's
routing/display label, not as a different memory system. In user-facing reports,
prefer the product language ("Harness recall", "Harness encode", "Harness
memory") and include the wire-level identifier only when it matters.

- Context and runs: `harness_prepare`, `harness_append_transition`, `harness_run`, `harness_kg_status`
- Code: `compute_code` for reads and `code_ingest` for ingest/reindex/session overlay writes. The old `code_search` name is dispatch-compatible only; it is not advertised.
- Graph and reasoning: `rustyred_thg_graph_*`, `rustyred_thg_algorithm_*`, `rustyred_thg_symbolic_*`, and graph-version tools.
- Web: `rustyweb_search_acquisition`, `browse_for_me`, `browse_with_me`, `web_consume`
- Skill packs: `skill_list`, `skill_get`, `skill_publish`, `skill_apply`
- Coordination: `coordination_room`, `coordination_intent`, `write_intent`, `read_intents_for_room`, `coordination_reflection`, `coordination_decision`, `coordination_tension`, `coordinate`, `mentions`, `mentions_wait`, `presence`, `subscribe`, `continuity_pack`
- Multi-head substrate: `multihead_run`, `multihead_task`, `multihead_claim`, `multihead_patch`, `multihead_proof`, `multihead_review`
- Memory and learning: `recall`, `remember`, `relate`, `self_note`, `self_revise`, `self_archive`, `self_recall_archive`, `encode`

## Configuration

Codex plugin hooks are off unless the host config enables them:

```toml
[features]
plugin_hooks = true
```

Claude Code uses `hooks/hooks.json`; Codex uses the explicit `hooks` path in `.codex-plugin/plugin.json` so it loads `hooks/codex-hooks.json`.

| Env var | Default | Purpose |
|---|---|---|
| `THEOREM_API_KEY` | empty | Compatibility bearer token fallback for native MCP calls when `THEOREM_HARNESS_API_TOKEN` is not set. |
| `THEOREM_TENANT_ID` / `THEOREMS_HARNESS_TENANT` / `RUSTYRED_THG_TENANT` / `THEOREM_CONTEXT_TENANT_SLUG` / `THEOREM_TENANT_SLUG` | empty | Tenant slug for native calls and code KG hooks. The production harness tenant is `Travis-Gilbert`. |
| `THEOREM_HARNESS_MCP_URL` | `https://rustyredcore-theorem-production.up.railway.app/mcp` | Primary native Theorem MCP URL used by hook scripts. |
| `THEOREM_HARNESS_API_TOKEN` | empty | Optional Bearer token for native Theorem RustyRed MCP writes. |
| `THEOREM_ACTOR` | host actor | Optional actor override for MCP coordination tools. When omitted, the MCP server defaults to `codex` in Codex-hosted plugin runs and `claude-code` otherwise, so mention reads do not fall back to the API-key actor. |
| `THEOREM_PROSE_CHECK_BIN` / `THEOREM_DESIGN_CHECK_BIN` | empty | Optional explicit checker binary paths for writing and design engineering receipts. When unset, hooks search `PATH`, `~/.cargo/bin`, plugin `bin/`, and repo-local Cargo target paths. |
| `THEOREMS_HARNESS_THG_API_TOKEN` | empty | Optional Bearer token for RustyRed-THG direct graph mirrors. |
| `THEOREMS_HARNESS_RUSTYRED_MCP_URL` / `RUSTYRED_THG_MCP_URL` | `https://rustyredcore-theorem-production.up.railway.app/mcp` | Compatibility fallback URL for hook scripts when `THEOREM_HARNESS_MCP_URL` is unset. |
| `THEOREM_BUDGET_TOKENS` | `4000` | Default Context Artifact budget |
| `THEOREM_ACTION_RAIL` | `record` | One of `off`, `record`, `enforce` |
| `THEOREM_REVIEW_MODE` | `advisory` | Shared Stop review mode for repo hygiene and language checks. Use `enforce` to block on hard failures, or `shadow` for receipt-only mode. |
| `THEOREM_REPO_HYGIENE_MODE` / `THEOREM_LANGUAGE_REVIEW_MODE` | `advisory` | Per-hook overrides when `THEOREM_REVIEW_MODE` is unset. |
| `THEOREM_REVIEW_LANGUAGE_CHECKS` | `1` | Set to `0` to skip changed-language review checks. Defaults cover Rust, JavaScript, TypeScript, CSS, Python, C, C++, Java, SQL, and C#. |
| `THEOREM_REVIEW_RUN_TESTS` | `0` | Set to `1` to include project test commands in the changed-language review pass. |
| `THEOREM_REPO_HYGIENE_LARGE_FILE_BYTES` | `5242880` | Size threshold for large untracked-file hygiene warnings. |
| `THEOREM_DEBUG` | `0` | Set to `1` to log hook activity to stderr |
| `THEOREM_PEER_REVIEW_BASE` | empty | Optional base ref/commit used by `scripts/peer-review-request.sh` when preparing a peer-review packet. Defaults to upstream merge-base or `HEAD`. |
| `THEOREM_PEER_REVIEW_ACTOR` | host actor | Optional actor override for peer-review packets. |
| `THEOREM_PEER_REVIEW_TARGET` | other main agent | Optional target override for peer-review packets. |
| `PONYTAIL_DEFAULT_MODE` | `full` | Optional Ponytail default mode for each new session: `lite`, `full`, `ultra`, or `off`. Config file fallback is `~/.config/ponytail/config.json` (`%APPDATA%\ponytail\config.json` on Windows). |

Ponytail's lifecycle hooks are tiny Node.js scripts imported from
`DietrichGebert/ponytail` at commit
`6da37bfa7d0282522c7785759f4d2f1544015354`. If `node` is not on the
non-interactive hook PATH, the hooks fail open and the skills/commands still
remain available. Attribution and license live in
`references/PONYTAIL-INTEGRATION.md` and `references/PONYTAIL-LICENSE`.

## Install (Claude Code)

```bash
# Enable in ~/.claude/settings.json:
#   "theorems-harness@codex-marketplace": true
```

### Skill-only bootstrap

For a fresh agent that does not have the marketplace plugin enabled yet, install
the harness skill bundle directly into both Claude Code and Codex:

```bash
curl -fsSL https://raw.githubusercontent.com/Travis-Gilbert/claude-marketplace/main/theorems-harness/scripts/install-harness-skills.sh | bash
```

From a local checkout:

```bash
./scripts/install-harness-skills.sh
./scripts/install-harness-skills.sh --bundle full
```

The default `core` bundle installs `/harness`, coordination, context refresh,
code discovery, encode, research, peer review, and execute skills. Use
`--claude-only` or `--codex-only` for one host.

## Install (Codex)

1. Enable the plugin in Codex.
2. Turn on plugin hooks in repo or user config:

```toml
[features]
plugin_hooks = true
```

3. Restart the session so Codex reviews and trusts the bundled hook commands.

## Native MCP calls hooks exercise

- `harness_prepare` (compile the Context Brief from Ensemble selection plus memory recall)
- `harness_append_transition` (append run lifecycle events)
- `harness_run` (read run event ledgers)
- `compute_code` and `code_ingest` (read code graph context and ingest/reindex when needed)
- `coordination_room`, `coordination_intent`, `coordination_record`, `coordination_reflection`, `coordinate`, `mentions`, `presence`
- `remember`, `recall`, `relate`, `self_note`, `self_revise`, `self_archive`, `self_recall_archive`, `encode`

Failure semantics: every hook fails open. Backend 500, missing jq, malformed responses all result in `{"continue": true}` so the user's session never breaks because the plugin had a bad day.
