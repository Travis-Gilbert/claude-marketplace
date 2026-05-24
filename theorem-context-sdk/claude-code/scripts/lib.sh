#!/usr/bin/env bash
# Shared helpers for Theorem Context Claude Code hooks.
# Sourced by every hook script. Pure bash; depends only on curl and jq.

set -u
set -o pipefail

# Configuration with sensible defaults. Override via env or .theoremrc.
# THEOREM_CONTEXT_BASE_URL must include the /api/v2/theseus prefix; this
# matches the Python and TypeScript SDKs' base_url contract.
: "${THEOREM_CONTEXT_BASE_URL:=https://index-api-production-a5f7.up.railway.app/api/v2/theseus}"
: "${THEOREM_CONTEXT_API_KEY:=}"
: "${THEOREM_BUDGET_TOKENS:=4000}"
: "${THEOREM_ACTION_RAIL:=record}"   # one of: record, enforce, off
: "${THEOREM_DEBUG:=0}"

# Per-project state directory (gitignored by INSTALL.md instructions).
THEOREM_STATE_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.theorem"
mkdir -p "$THEOREM_STATE_DIR" 2>/dev/null || true

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

# Get current session id. Claude Code passes this on stdin for most hooks.
# Falls back to a derived key based on user + cwd.
theorem_session_id() {
  local stdin_blob="${1:-}"
  local sid
  sid=$(theorem_jq "$stdin_blob" '.session_id')
  if [ -z "$sid" ]; then
    sid="claude:$(whoami)@$(hostname -s):$(echo "${CLAUDE_PROJECT_DIR:-$PWD}" | shasum | cut -c1-8)"
  fi
  printf '%s' "$sid"
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

# Detect whether jq is available; fail open with a warning if not.
theorem_require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    theorem_warn "jq not found; install jq to enable Theorem Context hooks. Hook is no-op."
    return 1
  fi
  return 0
}
