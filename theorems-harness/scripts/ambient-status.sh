#!/usr/bin/env bash
# Report local delivery health plus the real ambient read surfaces currently
# registered by RustyRed MCP.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

cwd="$PWD"
sid=""
refresh=0
while (($#)); do
  case "$1" in
    --cwd)
      cwd="${2:-}"
      shift 2
      ;;
    --session)
      sid="${2:-}"
      shift 2
      ;;
    --refresh)
      refresh=1
      shift
      ;;
    *)
      theorem_warn "ambient status: unknown argument $1"
      exit 2
      ;;
  esac
done

[ -n "$sid" ] || { theorem_warn "ambient status requires --session"; exit 2; }
theorem_require_jq || exit 1
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
status_file=$(theorem_ambient_status_file "$cwd" "$sid")
local_status='{}'
if [ -f "$status_file" ]; then
  local_status=$(jq -c . "$status_file" 2>/dev/null || printf '{}')
fi
run_id=$(theorem_run_id "$sid" 2>/dev/null || printf '')

catalog="$(theorem_plugin_root)/capabilities/source-surfaces.json"
practice_status_registered=false
practice_explain_registered=false
practice_close_registered=false
if [ -f "$catalog" ]; then
  jq -e '.flat_mcp | index("practice_status") != null' "$catalog" >/dev/null 2>&1 && practice_status_registered=true
  jq -e '.flat_mcp | index("practice_explain") != null' "$catalog" >/dev/null 2>&1 && practice_explain_registered=true
  jq -e '.flat_mcp | index("practice_close_receipt") != null' "$catalog" >/dev/null 2>&1 && practice_close_registered=true
fi

run_json='null'
context_status_json='null'
context_explain_json='null'
practice_status_json='null'
practice_explain_json='null'
practice_close_json='null'
if [ "$refresh" = "1" ] && [ -n "$run_id" ]; then
  run_json=$(theorem_native_json "harness_run" "$(jq -n --arg run_id "$run_id" '{run_id:$run_id}')" 2>/dev/null || printf 'null')
  context_status_json=$(theorem_native_json "context_status" '{}' 2>/dev/null || printf 'null')
  context_explain_json=$(theorem_native_json "context_explain" '{}' 2>/dev/null || printf 'null')
  diagnostic_args=$(jq -n --arg run_id "$run_id" '{run_id:$run_id}')
  if [ "$practice_status_registered" = "true" ]; then
    practice_status_json=$(theorem_native_json "practice_status" "$diagnostic_args" 2>/dev/null || printf 'null')
  fi
  if [ "$practice_explain_registered" = "true" ]; then
    practice_explain_json=$(theorem_native_json "practice_explain" "$diagnostic_args" 2>/dev/null || printf 'null')
  fi
  if [ "$practice_close_registered" = "true" ]; then
    practice_close_json=$(theorem_native_json "practice_close_receipt" "$diagnostic_args" 2>/dev/null || printf 'null')
  fi
fi

jq -n \
  --arg session_id "$sid" \
  --arg run_id "$run_id" \
  --argjson local "$local_status" \
  --argjson run "$run_json" \
  --argjson context_status "$context_status_json" \
  --argjson context_explain "$context_explain_json" \
  --argjson practice_status_registered "$practice_status_registered" \
  --argjson practice_explain_registered "$practice_explain_registered" \
  --argjson practice_close_registered "$practice_close_registered" \
  --argjson practice_status "$practice_status_json" \
  --argjson practice_explain "$practice_explain_json" \
  --argjson practice_close "$practice_close_json" \
  '{
    schema_version: 1,
    session_id: $session_id,
    run_id: $run_id,
    delivery: $local,
    run: {
      surface: "harness_run",
      refreshed: ($run != null),
      value: $run
    },
    context: {
      status_surface: "context_status",
      explain_surface: "context_explain",
      status: $context_status,
      explain: $context_explain
    },
    practice: {
      ambient_runtime_binding: "RUN lifecycle -> PRACTICE.SELECTED receipts -> terminal outcome attribution",
      graph_status_path: "harness_run.detail.run.scope.superpowers_practice_graph_status",
      graph_status: ($run.detail.run.scope.superpowers_practice_graph_status // null),
      status_surface_registered: $practice_status_registered,
      explain_surface_registered: $practice_explain_registered,
      status: $practice_status,
      explain: $practice_explain,
      degraded_reason: (
        if (($practice_status_registered and $practice_explain_registered) | not) then
          "practice_status and practice_explain are not registered by the current MCP catalog"
        elif ($practice_status == null or $practice_explain == null) then
          "registered practice diagnostics did not return a successful result"
        else null end
      )
    },
    close_harvest: {
      trigger: "RUN.CLOSED",
      runtime_contract: "theorem-harness-runtime event_log invokes one compound close hook and idempotent practice outcome attribution",
      direct_diagnostic_surface_registered: $practice_close_registered,
      compound_close_receipt: $practice_close,
      degraded_reason: (
        if ($practice_close_registered | not) then
          "practice_close_receipt is not registered by the current MCP catalog"
        elif $practice_close == null then
          "registered practice_close_receipt did not return a successful result"
        else null end
      )
    }
  }'
