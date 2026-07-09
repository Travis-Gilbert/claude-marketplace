#!/usr/bin/env bash
# Stop hook: score changed design artifacts with design-check, append a
# DesignReceipt to the current harness run, and feed advisory context forward.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

cleanup() {
  if [[ -n "${reports_file:-}" && -f "$reports_file" ]]; then
    rm -f "$reports_file"
  fi
}
trap 'cleanup; printf "{\"continue\":true}\n"; exit 0' ERR
trap cleanup EXIT

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
run_id=$(theorem_run_id "$sid" || true)
if [[ -z "$run_id" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

repo_root=$(theorem_repo_root "$input")
if ! git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '{"continue":true}\n'
  exit 0
fi

actor="${THEOREM_ACTOR:-$(theorem_host)}"
reports_file=$(mktemp)

find_design_check() {
  if [[ -n "${THEOREM_DESIGN_CHECK_BIN:-}" && -x "${THEOREM_DESIGN_CHECK_BIN}" ]]; then
    printf '%s' "$THEOREM_DESIGN_CHECK_BIN"
    return
  fi
  if command -v design-check >/dev/null 2>&1; then
    command -v design-check
    return
  fi
  local plugin_root
  plugin_root=$(theorem_plugin_root)
  for candidate in \
    "$HOME/.cargo/bin/design-check" \
    "$plugin_root/bin/design-check" \
    "$repo_root/rustyredcore_THG/target/release/design-check" \
    "$repo_root/rustyredcore_THG/target/debug/design-check" \
    "$repo_root/target/release/design-check" \
    "$repo_root/target/debug/design-check"
  do
    if [[ -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return
    fi
  done
}

is_css_file() {
  case "$1" in
    *.css) return 0 ;;
    *) return 1 ;;
  esac
}

is_token_file() {
  local path_lower
  path_lower=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case "$path_lower" in
    *token*.json | *tokens*.json | *design-token*.json | *design-tokens*.json) return 0 ;;
    *) return 1 ;;
  esac
}

is_apg_file() {
  local path_lower
  path_lower=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case "$path_lower" in
    *apg*.json | *aria*.json | *a11y*.json) return 0 ;;
    *) return 1 ;;
  esac
}

is_design_artifact() {
  is_css_file "$1" || is_token_file "$1" || is_apg_file "$1"
}

append_report() {
  local path="$1"
  local report="$2"
  printf '%s' "$report" | jq -c --arg path "$path" '
    select(type == "object") + {path: $path}
  ' >> "$reports_file" 2>/dev/null || true
}

append_synthetic_report() {
  local path="$1"
  local checker="$2"
  local status="$3"
  local message="$4"
  jq -c -n \
    --arg path "$path" \
    --arg checker "$checker" \
    --arg status "$status" \
    --arg message "$message" \
    '{
      checker: $checker,
      path: $path,
      pack_id: "skill-pack:design-engineering-general-v0.1",
      pack_hash: "",
      findings: [{
        rule_id: $checker,
        checker: $checker,
        status: $status,
        message: $message
      }],
      passed: (if $status == "passed" then 1 else 0 end),
      failed: (if $status == "failed" then 1 else 0 end),
      pending: (if $status == "pending" then 1 else 0 end),
      unsupported: (if $status == "unsupported" then 1 else 0 end)
    }' >> "$reports_file"
}

design_files=()
while IFS= read -r -d '' path; do
  [[ -n "$path" ]] || continue
  [[ -f "$repo_root/$path" ]] || continue
  if is_design_artifact "$path"; then
    design_files+=("$path")
  fi
done < <(
  git -C "$repo_root" diff --name-only -z HEAD -- 2>/dev/null || true
  git -C "$repo_root" ls-files --others --exclude-standard -z 2>/dev/null || true
)

if [[ "${#design_files[@]}" -eq 0 ]]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

design_check_bin=$(find_design_check)
if [[ -z "$design_check_bin" ]]; then
  for path in "${design_files[@]}"; do
    append_synthetic_report "$path" "design_check_available" "failed" "design-check binary not found"
  done
else
  for path in "${design_files[@]}"; do
    abs_path="$repo_root/$path"
    if is_css_file "$path"; then
      report=$("$design_check_bin" --css-static < "$abs_path" 2>/dev/null || printf '')
      append_report "$path" "$report"
      report=$("$design_check_bin" --token-lint < "$abs_path" 2>/dev/null || printf '')
      append_report "$path" "$report"
    elif is_token_file "$path"; then
      if "$design_check_bin" --lower-tokens < "$abs_path" >/dev/null 2>&1; then
        append_synthetic_report "$path" "lower_tokens" "passed" "token JSON lowered successfully"
      else
        append_synthetic_report "$path" "lower_tokens" "failed" "token JSON failed to lower"
      fi
    elif is_apg_file "$path"; then
      append_synthetic_report "$path" "apg_behavioral" "pending" "render-backed APG behavioral checker is not wired in this hook"
    fi
  done
fi

reports=$(jq -s -c '.' "$reports_file" 2>/dev/null || printf '[]')
if [[ "$reports" == "[]" ]]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

run_args=$(jq -n --arg run_id "$run_id" '{run_id: $run_id}')
run_detail=$(theorem_native_call "harness_run" "$run_args" 2>/dev/null || true)
pack_status=$(printf '%s' "$run_detail" | jq -r '
  .result.structuredContent.detail.run.scope.design_engineering_status
  // .structuredContent.detail.run.scope.design_engineering_status
  // empty
' 2>/dev/null || true)
if [[ -z "$pack_status" ]]; then
  pack_status="shadow"
fi

failed_count=$(printf '%s' "$reports" | jq '[.[] | (.failed // 0)] | add // 0')
pending_count=$(printf '%s' "$reports" | jq '[.[] | (.pending // 0)] | add // 0')
hard_axis_failed=false
if [[ "$failed_count" -gt 0 ]]; then
  hard_axis_failed=true
fi

action="receipt_only"
case "$pack_status:$hard_axis_failed" in
  advisory:true)
    action="advisory_context"
    ;;
  validated:true|canonical:true)
    action="revision_required"
    ;;
  validated:false|canonical:false)
    action="emit"
    ;;
esac

receipt=$(jq -n \
  --arg boundary "artifact_stop" \
  --arg pack_id "skill-pack:design-engineering-general-v0.1" \
  --arg pack_status "$pack_status" \
  --arg action "$action" \
  --argjson hard_axis_failed "$hard_axis_failed" \
  --argjson failed_count "$failed_count" \
  --argjson pending_count "$pending_count" \
  --argjson files "$(printf '%s\n' "${design_files[@]}" | jq -R . | jq -s .)" \
  --argjson reports "$reports" \
  '{
    boundary: $boundary,
    pack_id: $pack_id,
    pack_status: $pack_status,
    action: $action,
    hard_axis_failed: $hard_axis_failed,
    failed_count: $failed_count,
    pending_count: $pending_count,
    files: $files,
    reports: $reports
  }')

payload=$(jq -n \
  --arg boundary "artifact_stop" \
  --argjson receipt "$receipt" \
  '{
    event_subtype: "design_receipt",
    boundary: $boundary,
    design_receipts: [$receipt]
  }')
receipt_hash=$(printf '%s' "$receipt" | shasum -a 256 | awk '{print $1}')
append_args=$(jq -n \
  --arg run_id "$run_id" \
  --arg actor "$actor" \
  --arg key "design_receipt:${run_id}:${receipt_hash}" \
  --argjson payload "$payload" \
  '{
    run_id: $run_id,
    event_type: "SESSION.EVENT_RECORDED",
    actor: $actor,
    idempotency_key: $key,
    payload: $payload
  }')
(theorem_native_call "harness_append_transition" "$append_args" >/dev/null 2>&1 || true) &

if [[ "$pack_status" == "advisory" && "$hard_axis_failed" == "true" ]]; then
  violations=$(printf '%s' "$reports" | jq -r '
    [
      .[]
      | . as $report
      | (.findings // [])[]
      | select(.status == "failed")
      | "\($report.path): \(.rule_id): \(.message)"
    ][0:5] | join("\n")
  ')
  if [[ -n "$violations" ]]; then
    context=$(printf '## Design Engineering advisory\n%s' "$violations")
    jq -n --arg ctx "$context" '{
      continue: true,
      suppressOutput: true,
      hookSpecificOutput: {
        hookEventName: "Stop",
        additionalContext: $ctx
      }
    }'
    exit 0
  fi
fi

printf '{"continue":true,"suppressOutput":true}\n'
