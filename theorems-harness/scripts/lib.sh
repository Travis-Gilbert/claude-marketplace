#!/usr/bin/env bash
# Shared helpers for Theorem Context lifecycle hooks.
# Sourced by every host-specific hook script. Pure bash; depends only on curl
# and jq.

set -u
set -o pipefail

# Configuration with sensible defaults. Override via env or .theoremrc.
# THEOREM_CONTEXT_BASE_URL must include the /api/v2/theseus prefix; this
# matches the Python and TypeScript SDKs' base_url contract.
: "${THEOREM_CONTEXT_BASE_URL:=https://index-api-production-a5f7.up.railway.app/api/v2/theseus}"
: "${THEOREM_CONTEXT_API_KEY:=}"
: "${THEOREM_API_KEY:=}"
: "${THEOREM_BUDGET_TOKENS:=4000}"
: "${THEOREM_ACTION_RAIL:=record}"   # one of: record, enforce, off
: "${THEOREM_DEBUG:=0}"

if [ -z "${THEOREM_CONTEXT_API_KEY}" ] && [ -n "${THEOREM_API_KEY}" ]; then
  THEOREM_CONTEXT_API_KEY="${THEOREM_API_KEY}"
fi

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
  git -C "$repo_root" status --porcelain 2>/dev/null \
    | awk '{print $NF}' \
    | jq -R . \
    | jq -s '.[0:50]' 2>/dev/null || printf '[]'
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

# Authoritative POST helper. Returns body on stdout; non-zero exit on HTTP error.
theorem_post() {
  local path="$1"
  local body="$2"
  local url="${THEOREM_CONTEXT_BASE_URL}${path}"
  local headers=(-H "Content-Type: application/json" -H "Accept: application/json")
  if [ -n "${THEOREM_CONTEXT_API_KEY}" ]; then
    headers+=(-H "Authorization: Bearer ${THEOREM_CONTEXT_API_KEY}")
  fi
  curl -sS -m 25 "${headers[@]}" -X POST -d "$body" "$url"
}

theorem_get() {
  local path="$1"
  local url="${THEOREM_CONTEXT_BASE_URL}${path}"
  local headers=(-H "Accept: application/json")
  if [ -n "${THEOREM_CONTEXT_API_KEY}" ]; then
    headers+=(-H "Authorization: Bearer ${THEOREM_CONTEXT_API_KEY}")
  fi
  curl -sS -m 25 "${headers[@]}" "$url"
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
  local url="${THEOREM_HARNESS_MCP_URL:-${THEOREMS_HARNESS_RUSTYRED_MCP_URL:-${RUSTYRED_THG_MCP_URL:-https://rustyredcore-theorem-production.up.railway.app/mcp}}}"
  local token="${THEOREM_HARNESS_API_TOKEN:-${RUSTYRED_THG_API_TOKEN:-${THEOREMS_HARNESS_THG_API_TOKEN:-}}}"
  local headers=(-H "Content-Type: application/json" -H "Accept: application/json")
  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer ${token}")
  fi
  command -v jq >/dev/null 2>&1 || return 1
  local payload
  payload=$(jq -n --arg name "$tool" --argjson args "$args" \
    '{jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: $name, arguments: $args}}')
  curl -sS -m 25 "${headers[@]}" -X POST -d "$payload" "$url"
}

# Detect whether jq is available; fail open with a warning if not.
theorem_require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    theorem_warn "jq not found; install jq to enable Theorem Context hooks. Hook is no-op."
    return 1
  fi
  return 0
}
