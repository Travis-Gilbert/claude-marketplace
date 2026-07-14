#!/usr/bin/env bash

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
repo="$fixture/repo"
mock_bin="$fixture/bin"
request_log="$fixture/requests.jsonl"
transcript="$fixture/transcript.jsonl"
session_id="style-refusal-session"
run_id="style-refusal-run"

cleanup() {
  rm -rf "$fixture"
}
trap cleanup EXIT

mkdir -p "$repo/.theorem/runs" "$mock_bin"
printf '%s' "$run_id" >"$repo/.theorem/runs/${session_id}.run_id"
printf '%s\n' '{"role":"assistant","content":"This is a complete assistant response for receipt testing."}' >"$transcript"

printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'payload=""' \
  'while (($#)); do' \
  '  case "$1" in' \
  '    -d) payload=$2; shift 2 ;;' \
  '    *) shift ;;' \
  '  esac' \
  'done' \
  'printf "%s\n" "$payload" >>"$THEOREM_TEST_REQUEST_LOG"' \
  'name=$(printf "%s" "$payload" | jq -r ".params.name")' \
  'if [[ "$name" == "harness_run" ]]; then' \
  '  printf "%s\n" '\''{"jsonrpc":"2.0","result":{"structuredContent":{"detail":{"run":{"scope":{"writing_engineering_status":"advisory"}}}}}}'\''' \
  'else' \
  '  printf "%s\n" '\''{"jsonrpc":"2.0","result":{"structuredContent":{}}}'\''' \
  'fi' \
  >"$mock_bin/curl"
chmod +x "$mock_bin/curl"

printf '%s\n' \
  '#!/usr/bin/env bash' \
  'printf "%s\n" "not-json"' \
  >"$mock_bin/prose-check-invalid"
chmod +x "$mock_bin/prose-check-invalid"

export PATH="$mock_bin:$PATH"
export PLUGIN_ROOT="$plugin_root"
export THEOREM_TENANT_ID="Travis-Gilbert"
export THEOREM_HARNESS_MCP_URL="http://fixture.invalid/mcp"
export THEOREM_TEST_REQUEST_LOG="$request_log"

invoke_hook() {
  jq -cn \
    --arg cwd "$repo" \
    --arg session_id "$session_id" \
    --arg transcript_path "$transcript" \
    '{cwd:$cwd,session_id:$session_id,transcript_path:$transcript_path,hook_event_name:"Stop"}' \
    | "$plugin_root/scripts/stop-style-receipt.sh"
}

last_append_arguments() {
  jq -sc '
    [
      .[]
      | select(.params.name == "harness_append_transition")
      | .params.arguments
    ]
    | last
  ' "$request_log"
}

disabled_file="$repo/.theorem/runs/${session_id}.writing-engineering-disabled"
touch "$disabled_file"
disabled_output=$(invoke_hook)
jq -e '.continue == true and .suppressOutput == true' <<<"$disabled_output" >/dev/null
disabled_append=$(last_append_arguments)
jq -e '
  .run_id == "style-refusal-run"
  and .payload.event_subtype == "style_receipt_refused"
  and .payload.style_receipts[0].status == "refused"
  and .payload.style_receipts[0].refusal.code == "writing_engineering_disabled"
  and (.payload.style_receipts[0].receipt_hash | length == 64)
' <<<"$disabled_append" >/dev/null

rm "$disabled_file"
: >"$request_log"
export THEOREM_PROSE_CHECK_BIN="$mock_bin/prose-check-invalid"
malformed_output=$(invoke_hook)
jq -e '.continue == true and .suppressOutput == true' <<<"$malformed_output" >/dev/null
malformed_append=$(last_append_arguments)
jq -e '
  .run_id == "style-refusal-run"
  and .payload.event_subtype == "style_receipt_refused"
  and .payload.style_receipts[0].pack_status == "advisory"
  and .payload.style_receipts[0].refusal.code == "prose_check_invalid_output"
  and (.payload.style_receipts[0].receipt_hash | length == 64)
' <<<"$malformed_append" >/dev/null

printf 'stop-style refusal receipts passed\n'
