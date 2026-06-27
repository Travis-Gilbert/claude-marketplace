#!/usr/bin/env bash
# Lifecycle hook receipt. Writes a local proof that the host invoked the hook,
# even when the remote MCP path is down or the functional hook fails open.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

finish() {
  printf '{"continue":true,"suppressOutput":true}\n'
}

trap 'finish; exit 0' ERR

event_name="${1:-unknown}"
input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
repo_root=$(theorem_repo_root "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
sid=$(theorem_session_id "$input")
run_id=$(theorem_run_id "$sid" 2>/dev/null || true)
actor="${THEOREM_ACTOR:-$(theorem_host)}"
tenant="$(theorem_tenant)"
doctor_dir=$(theorem_hook_doctor_dir "$repo_root")

tenant_present=false
[ -n "$tenant" ] && tenant_present=true
run_id_present=false
[ -n "$run_id" ] && run_id_present=true
plugin_root="$(theorem_plugin_root)"
mcp_url="${THEOREM_HARNESS_MCP_URL:-${THEOREMS_HARNESS_RUSTYRED_MCP_URL:-${RUSTYRED_THG_MCP_URL:-https://rustyredcore-theorem-production.up.railway.app/mcp}}}"

if command -v jq >/dev/null 2>&1; then
  receipt=$(jq -c -n \
    --arg timestamp "$(theorem_now_iso)" \
    --arg event_name "$event_name" \
    --arg actor "$actor" \
    --arg host "$(theorem_host)" \
    --arg session_id "$sid" \
    --arg cwd "$cwd" \
    --arg repo_root "$repo_root" \
    --arg plugin_root "$plugin_root" \
    --arg run_id "$run_id" \
    --arg mcp_url "$mcp_url" \
    --argjson tenant_present "$tenant_present" \
    --argjson run_id_present "$run_id_present" \
    '{
      timestamp: $timestamp,
      event_name: $event_name,
      actor: $actor,
      host: $host,
      session_id: $session_id,
      cwd: $cwd,
      repo_root: $repo_root,
      plugin_root: $plugin_root,
      run_id: $run_id,
      run_id_present: $run_id_present,
      tenant_present: $tenant_present,
      mcp_url: $mcp_url
    }')
else
  receipt=$(printf '{"timestamp":"%s","event_name":"%s","status":"jq-missing"}' "$(theorem_now_iso)" "$event_name")
fi

printf '%s\n' "$receipt" >> "$doctor_dir/events.jsonl" 2>/dev/null || true
printf '%s\n' "$receipt" > "$doctor_dir/latest.json" 2>/dev/null || true

finish

