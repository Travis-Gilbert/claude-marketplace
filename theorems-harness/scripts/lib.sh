#!/usr/bin/env bash
# Shared helpers for Theorem Context lifecycle hooks.
# Sourced by every host-specific hook script. Pure bash; depends only on curl
# and jq.

set -u
set -o pipefail

# Configuration with sensible defaults. Override via env or .theoremrc.
: "${THEOREM_API_KEY:=}"
: "${THEOREM_HARNESS_API_TOKEN:=}"
: "${THEOREM_BUDGET_TOKENS:=4000}"
: "${THEOREM_ACTION_RAIL:=record}"   # one of: record, enforce, off
: "${THEOREM_DEBUG:=0}"

theorem_host() {
  if [ -n "${PLUGIN_ROOT:-}" ]; then
    printf 'codex'
    return
  fi
  printf 'claude-code'
}

theorem_session_prefix() {
  if [ "$(theorem_host)" = "codex" ]; then
    printf 'codex'
    return
  fi
  printf 'claude'
}

theorem_plugin_root() {
  if [ -n "${PLUGIN_ROOT:-}" ]; then
    printf '%s' "$PLUGIN_ROOT"
    return
  fi
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    printf '%s' "$CLAUDE_PLUGIN_ROOT"
    return
  fi
  (
    cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
  )
}

theorem_log() {
  if [ "${THEOREM_DEBUG}" = "1" ]; then
    printf '[theorem] %s\n' "$*" >&2
  fi
}

theorem_warn() {
  printf '[theorem] %s\n' "$*" >&2
}

theorem_now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

theorem_now_stamp() {
  date -u +"%Y%m%dT%H%M%SZ"
}

theorem_review_dir() {
  local repo_root="$1"
  local dir
  dir="$repo_root/.theorem/review"
  mkdir -p "$dir" 2>/dev/null || true
  printf '%s' "$dir"
}

theorem_hook_doctor_dir() {
  local repo_root="$1"
  local dir
  dir="$repo_root/.theorem/hook-doctor"
  mkdir -p "$dir" 2>/dev/null || true
  printf '%s' "$dir"
}

# Read the JSON payload Claude Code writes to stdin for hooks.
# Echoes the JSON; caller can pipe through jq.
theorem_read_stdin() {
  if [ -t 0 ]; then
    echo '{}'
  else
    cat
  fi
}

# Extract a field from a JSON blob; returns empty string if missing.
theorem_jq() {
  local blob="$1"
  local path="$2"
  echo "$blob" | jq -r "$path // empty" 2>/dev/null || echo ""
}

# Get current session id. Hosts pass this on stdin for most hooks.
# Falls back to a derived key based on user + cwd.
theorem_session_id() {
  local stdin_blob="${1:-}"
  local sid
  sid=$(theorem_jq "$stdin_blob" '.session_id')
  if [ -z "$sid" ]; then
    sid="$(theorem_session_prefix):$(whoami)@$(hostname -s):$(theorem_resolve_cwd "$stdin_blob" | shasum | cut -c1-8)"
  fi
  printf '%s' "$sid"
}

theorem_resolve_cwd() {
  local stdin_blob="${1:-}"
  local cwd
  cwd=$(theorem_jq "$stdin_blob" '.cwd')
  if [ -n "$cwd" ]; then
    printf '%s' "$cwd"
    return
  fi
  printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}"
}

theorem_repo_root() {
  local stdin_blob="${1:-}"
  local cwd
  cwd=$(theorem_resolve_cwd "$stdin_blob")
  git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd"
}

theorem_repo_label() {
  local repo_root="$1"
  basename "$repo_root"
}

theorem_git_branch() {
  local repo_root="$1"
  git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || printf ''
}

theorem_git_head() {
  local repo_root="$1"
  git -C "$repo_root" rev-parse HEAD 2>/dev/null || printf ''
}

theorem_changed_files_json() {
  local repo_root="$1"
  if ! git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf '[]'
    return
  fi
  local files_json
  files_json=$(
    git -C "$repo_root" status --porcelain 2>/dev/null \
      | awk '{print $NF}' \
      | jq -R . \
      | jq -s '.[0:50]' 2>/dev/null
  ) || files_json='[]'
  files_json=$(printf '%s' "$files_json" | jq -c 'if type == "array" then . else [] end' 2>/dev/null || printf '[]')
  if [[ -z "$files_json" ]]; then
    files_json='[]'
  fi
  printf '%s' "$files_json"
}

theorem_state_dir() {
  local cwd="${1:-}"
  if [ -z "$cwd" ]; then
    cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
  fi
  printf '%s/.theorem' "$cwd"
}

theorem_init_state_dir() {
  local cwd="${1:-}"
  local state_dir
  state_dir=$(theorem_state_dir "$cwd")
  mkdir -p "$state_dir" 2>/dev/null || true
  printf '%s' "$state_dir"
}

# Read or initialize the current run id for this Claude session.
theorem_run_id() {
  local sid="$1"
  local run_file
  run_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.run_id"
  if [ -f "$run_file" ]; then
    cat "$run_file"
  fi
}

theorem_set_run_id() {
  local sid="$1"
  local run_id="$2"
  local run_dir="$THEOREM_STATE_DIR/runs"
  mkdir -p "$run_dir"
  printf '%s' "$run_id" > "$run_dir/${sid//[\/:]/_}.run_id"
}

# Inject the resolved tenant into a native-call args object when the caller
# omitted it. The coordination + memory tools partition by tenant, so a call
# with no tenant lands in the wrong (or `default`) partition and the heads go
# invisible to each other -- the exact split-brain that hid Codex from Claude
# Code. A no-op when no tenant is resolvable (THEOREM_TENANT_ID unset) or when
# the args already carry a `tenant_slug` / `tenant`.
theorem_inject_tenant() {
  local args="$1"
  local tenant
  tenant=$(theorem_tenant)
  [ -n "$tenant" ] || { printf '%s' "$args"; return; }
  command -v jq >/dev/null 2>&1 || { printf '%s' "$args"; return; }
  printf '%s' "$args" | jq -c --arg t "$tenant" \
    'if (type == "object") and ((has("tenant_slug") or has("tenant")) | not)
       then . + {tenant_slug: $t} else . end' 2>/dev/null \
    || printf '%s' "$args"
}

# Native Theorem RustyRed MCP call (JSON-RPC tools/call). The bash twin of the
# plugin's NativeMcpClient: coordination + memory route here, NOT the Python
# context backend. $1 = native tool name, $2 = arguments JSON object. Returns the
# raw JSON-RPC response on stdout; non-zero exit on HTTP/transport error so
# callers can `|| true` for fire-and-forget receipts.
theorem_native_call() {
  local tool="$1"
  local args="${2-}"
  [ -n "$args" ] || args='{}'
  # Tenant-aware: inject the resolved tenant when the caller omitted it, so no
  # coordination/memory write silently lands in the wrong partition. Single
  # choke point so this never has to be repeated call-by-call in the hooks.
  args=$(theorem_inject_tenant "$args")
  local url="${THEOREM_HARNESS_MCP_URL:-${THEOREMS_HARNESS_RUSTYRED_MCP_URL:-${RUSTYRED_THG_MCP_URL:-https://rustyredcore-theorem-production.up.railway.app/mcp}}}"
  local token="${THEOREM_HARNESS_API_TOKEN:-${RUSTYRED_THG_API_TOKEN:-${THEOREMS_HARNESS_THG_API_TOKEN:-${THEOREM_API_KEY:-}}}}"
  local headers=(-H "Content-Type: application/json" -H "Accept: application/json")
  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer ${token}")
  fi
  command -v jq >/dev/null 2>&1 || return 1
  local payload
  payload=$(jq -n --arg name "$tool" --argjson args "$args" \
    '{jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: $name, arguments: $args}}')
  curl -sS -m 5 "${headers[@]}" -X POST -d "$payload" "$url"
}

theorem_native_json() {
  local tool="$1"
  local args="${2-}"
  local response
  response=$(theorem_native_call "$tool" "$args") || return 1
  printf '%s' "$response" | jq -c '
    if .error then empty
    elif (.result.structuredContent? // null) != null then .result.structuredContent
    elif (.result.content[0].text? // null) != null then (.result.content[0].text | try fromjson catch .)
    else .result
    end
  ' 2>/dev/null
}

theorem_append_transition() {
  local run_id="$1"
  local event_type="$2"
  local actor="$3"
  local payload="${4:-{}}"
  local idempotency_key="${5:-}"
  local args
  args=$(jq -n \
    --arg run_id "$run_id" \
    --arg event_type "$event_type" \
    --arg actor "$actor" \
    --arg idempotency_key "$idempotency_key" \
    --argjson payload "$payload" \
    '{
      run_id: $run_id,
      type: $event_type,
      actor: $actor,
      payload: $payload
    } + (if $idempotency_key == "" then {} else {idempotency_key: $idempotency_key} end)') || return 1
  theorem_native_json "harness_append_transition" "$args"
}

# Detect whether jq is available; fail open with a warning if not.
theorem_require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    theorem_warn "jq not found; install jq to enable Theorem Context hooks. Hook is no-op."
    return 1
  fi
  return 0
}

# --- Ambient code-KG helpers (AM1 / AM7-10) ---

# AM1: canonical tenant resolution. THEOREM_TENANT_ID is canonical; the legacy
# names stay as aliases for one release. There is NO `public`/`theorem` default:
# the absence of a tenant is an explicit skip (the caller logs and continues),
# never a silent fallback into a fixture tenant.
theorem_tenant() {
  printf '%s' "${THEOREM_TENANT_ID:-${THEOREMS_HARNESS_TENANT:-${RUSTYRED_THG_TENANT:-${THEOREM_CONTEXT_TENANT_SLUG:-${THEOREM_TENANT_SLUG:-}}}}}"
}

# The .harness state dir at the repo root (shared with the checklist contract).
# Holds the code-KG manifest, the session-delta queue, and offered-node ledgers.
theorem_harness_dir() {
  local repo_root="$1"
  printf '%s/.harness' "$repo_root"
}

theorem_init_harness_dir() {
  local repo_root="$1"
  local dir
  dir=$(theorem_harness_dir "$repo_root")
  mkdir -p "$dir" 2>/dev/null || true
  printf '%s' "$dir"
}

# Convert a user-facing plan name or content id into a portable checklist file
# component. Checklist paths are never accepted directly from a model response;
# the hook constructs them beneath .harness/checklists.
theorem_checklist_slug() {
  local value="${1:-plan}"
  local slug
  slug=$(printf '%s' "$value" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -cs '[:alnum:]_-' '-' \
    | sed -E 's/^-+//; s/-+$//; s/-+/-/g' \
    | cut -c1-64)
  [ -n "$slug" ] || slug='plan'
  printf '%s' "$slug"
}

theorem_plan_id() {
  local stdin_blob="${1:-}"
  local plan_id
  plan_id=$(theorem_jq "$stdin_blob" '.plan_id // .planId // .plan.id')
  printf '%s' "${plan_id:-${THEOREM_PLAN_ID:-}}"
}

theorem_checklist_binding_file() {
  local cwd="$1"
  local session_id="$2"
  local session_key
  session_key=$(printf '%s' "$session_id" | shasum -a 256 | awk '{print substr($1, 1, 24)}')
  printf '%s/.harness/session-plan-bindings/%s.json' "$cwd" "$session_key"
}

theorem_bind_checklist() {
  local cwd="$1"
  local session_id="$2"
  local checklist_file="$3"
  local plan_id="${4:-}"
  local checklist_dir="$cwd/.harness/checklists"
  case "$checklist_file" in
    *'..'*) theorem_warn "refusing checklist binding with traversal components"; return 1 ;;
    "$checklist_dir"/*.json) ;;
    *) theorem_warn "refusing checklist binding outside $checklist_dir"; return 1 ;;
  esac

  local binding_file binding_dir tmp_file
  binding_file=$(theorem_checklist_binding_file "$cwd" "$session_id")
  binding_dir=$(dirname "$binding_file")
  mkdir -p "$binding_dir"
  tmp_file="$binding_file.tmp.$$"
  jq -n \
    --arg session_id "$session_id" \
    --arg plan_id "$plan_id" \
    --arg checklist "$(basename "$checklist_file")" \
    --arg bound_at "$(theorem_now_iso)" \
    '{session_id: $session_id, plan_id: $plan_id, checklist: $checklist, bound_at: $bound_at}' \
    > "$tmp_file"
  mv "$tmp_file" "$binding_file"
}

theorem_named_checklist_path() {
  local cwd="$1"
  local plan_slug="$2"
  local plan_id="$3"
  local fallback_id="$4"
  local safe_slug safe_id
  safe_slug=$(theorem_checklist_slug "$plan_slug")
  safe_id=$(theorem_checklist_slug "${plan_id:-$fallback_id}")
  safe_id=$(printf '%s' "$safe_id" | cut -c1-40)
  printf '%s/.harness/checklists/%s--%s.json' "$cwd" "$safe_slug" "$safe_id"
}

# Resolve the checklist owned by this hook session. A session binding wins,
# followed by an explicit plan id and finally the legacy global projection.
# This preserves old repositories while preventing active plans from sharing a
# single mutable checklist.
theorem_resolve_checklist() {
  local stdin_blob="${1:-}"
  local cwd session_id checklist_dir binding_file checklist_name candidate plan_id safe_id explicit
  cwd=$(theorem_resolve_cwd "$stdin_blob")
  checklist_dir="$cwd/.harness/checklists"

  explicit=$(theorem_jq "$stdin_blob" '.checklist_path // .checklistPath')
  explicit="${explicit:-${THEOREM_CHECKLIST_PATH:-}}"
  if [ -n "$explicit" ]; then
    case "$explicit" in
      *'..'*) theorem_log "ignoring checklist path with traversal components" ;;
      "$cwd/.harness/checklist.json"|"$checklist_dir"/*.json)
        [ -f "$explicit" ] && { printf '%s' "$explicit"; return; }
        ;;
      *) theorem_log "ignoring checklist path outside this repository's .harness directory" ;;
    esac
  fi

  session_id=$(theorem_session_id "$stdin_blob")
  binding_file=$(theorem_checklist_binding_file "$cwd" "$session_id")
  if [ -f "$binding_file" ]; then
    checklist_name=$(jq -r '.checklist // empty' "$binding_file" 2>/dev/null || true)
    case "$checklist_name" in
      ''|*/*|*'..'*) ;;
      *)
        candidate="$checklist_dir/$checklist_name"
        [ -f "$candidate" ] && { printf '%s' "$candidate"; return; }
        ;;
    esac
    return
  fi

  plan_id=$(theorem_plan_id "$stdin_blob")
  if [ -n "$plan_id" ]; then
    if [ -d "$checklist_dir" ]; then
      safe_id=$(theorem_checklist_slug "$plan_id")
      safe_id=$(printf '%s' "$safe_id" | cut -c1-40)
      candidate=$(find "$checklist_dir" -maxdepth 1 -type f -name "*--$safe_id.json" -print 2>/dev/null | sort | head -n 1)
      [ -n "$candidate" ] && { printf '%s' "$candidate"; return; }
    fi
    return
  fi

  candidate="$cwd/.harness/checklist.json"
  [ -f "$candidate" ] && printf '%s' "$candidate"
}

# Call a compute-code operation over native MCP with the tenant injected. Echoes
# the inner tool-result JSON text (unwrapped from the JSON-RPC envelope), or
# empty on error / missing tenant. $1 = operation, $2 = extra args JSON object.
theorem_code_call() {
  local operation="$1"
  local extra="${2:-{}}"
  local tenant
  tenant=$(theorem_tenant)
  if [ -z "$tenant" ]; then
    theorem_log "code KG disabled: no tenant (set THEOREM_TENANT_ID)"
    return 1
  fi
  command -v jq >/dev/null 2>&1 || return 1
  local args
  args=$(jq -n --arg op "$operation" --arg tenant "$tenant" --argjson extra "$extra" \
    '$extra + {operation: $op, tenant_slug: $tenant}') || return 1
  local tool="compute_code"
  case "$operation" in
    ingest|reindex|session_reingest|record_use_receipt)
      tool="code_ingest"
      ;;
  esac
  theorem_native_json "$tool" "$args"
}
