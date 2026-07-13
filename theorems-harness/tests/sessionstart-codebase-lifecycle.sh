#!/usr/bin/env bash

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
repo="$fixture/private-fixture"
mock_bin="$fixture/bin"
request_log="$fixture/requests.jsonl"
claim_root="$fixture/claims"
cleanup() {
  if [[ "${KEEP_FIXTURE:-0}" == "1" ]]; then
    printf 'fixture preserved at %s\n' "$fixture" >&2
  else
    rm -rf "$fixture"
  fi
}
trap cleanup EXIT

mkdir -p "$repo" "$mock_bin"
git -C "$repo" init -q -b main
git -C "$repo" config user.email "tests@example.com"
git -C "$repo" config user.name "SessionStart Tests"
printf 'fixture\n' > "$repo/README.md"
git -C "$repo" add README.md
git -C "$repo" commit -q -m "test(fixture): initialize repository"
git -C "$repo" remote add origin "git@github.com:Travis-Gilbert/private-fixture.git"
head_sha=$(git -C "$repo" rev-parse HEAD)

cat > "$mock_bin/curl" <<'MOCK_CURL'
#!/usr/bin/env bash
set -euo pipefail

payload=""
while (($#)); do
  case "$1" in
    -d)
      payload="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

compact=$(printf '%s' "$payload" | jq -c '{name: .params.name, operation: .params.arguments.operation, arguments: .params.arguments}')
printf '%s\n' "$compact" >> "$THEOREM_TEST_REQUEST_LOG"
name=$(printf '%s' "$payload" | jq -r '.params.name')
operation=$(printf '%s' "$payload" | jq -r '.params.arguments.operation // ""')

if [[ "$name" == "coordination_record" || "$name" == "coordination_context" ]]; then
  printf '%s\n' '{"jsonrpc":"2.0","result":{"structuredContent":{}}}'
  exit 0
fi

if [[ "$operation" == "kg_status" ]]; then
  case "${THEOREM_TEST_STATUS:-unknown}" in
    unknown) status='{"indexed":false,"head_sha":""}' ;;
    changed) status='{"indexed":true,"head_sha":"older-sha"}' ;;
    current) status=$(jq -cn --arg head "$THEOREM_TEST_HEAD" '{indexed:true,head_sha:$head}') ;;
    unavailable)
      printf '%s\n' '{"jsonrpc":"2.0","error":{"code":-32000,"message":"status unavailable"}}'
      exit 0
      ;;
  esac
  case "${THEOREM_TEST_STATUS_SHAPE:-text}" in
    text) jq -cn --argjson status "$status" '{jsonrpc:"2.0",result:{content:[{type:"text",text:($status|tojson)}]}}' ;;
    structured) jq -cn --argjson status "$status" '{jsonrpc:"2.0",result:{structuredContent:$status}}' ;;
    nested) jq -cn --argjson status "$status" '{jsonrpc:"2.0",result:{structuredContent:{result:{output:$status}}}}' ;;
  esac
  exit 0
fi

if [[ "$operation" == "context_pack" ]]; then
  case "${THEOREM_TEST_PACK_SHAPE:-structured}" in
    structured)
      printf '%s\n' '{"jsonrpc":"2.0","result":{"structuredContent":{"markdown":"## Current map\\n\\n- src/current.rs"}}}'
      ;;
    nested)
      printf '%s\n' '{"jsonrpc":"2.0","result":{"structuredContent":{"result":{"output":{"code_map":"## Nested map\\n\\n- src/nested.rs"}}}}}'
      ;;
  esac
  exit 0
fi

if [[ "$operation" == "ingest" || "$operation" == "reindex" ]]; then
  if [[ "${THEOREM_TEST_SUBMIT:-ok}" == "fail" ]]; then
    printf '%s\n' '{"jsonrpc":"2.0","error":{"code":-32000,"message":"submission rejected"}}'
  else
    jq -cn --arg op "$operation" '{jsonrpc:"2.0",result:{content:[{type:"text",text:({submitted:true,state:"queued",job_id:("job-"+$op)}|tojson)}]}}'
  fi
  exit 0
fi

printf '%s\n' '{"jsonrpc":"2.0","result":{"structuredContent":{}}}'
MOCK_CURL
chmod +x "$mock_bin/curl"

export PATH="$mock_bin:$PATH"
export PLUGIN_ROOT="$plugin_root"
export THEOREM_TENANT_ID="Travis-Gilbert"
export THEOREM_HARNESS_MCP_URL="http://fixture.invalid/mcp"
export THEOREM_CODE_CONTEXT_OWNER="plugin"
export THEOREM_CODE_CONTEXT_CLAIM_ROOT="$claim_root"
export THEOREM_TEST_REQUEST_LOG="$request_log"
export THEOREM_TEST_HEAD="$head_sha"

invoke_hook() {
  local session_id="$1"
  jq -cn --arg cwd "$repo" --arg session_id "$session_id" \
    '{cwd:$cwd,session_id:$session_id,hook_event_name:"SessionStart"}' \
    | "$plugin_root/scripts/sessionstart-codebase.sh"
}

operation_count() {
  local operation="$1"
  jq -r --arg operation "$operation" 'select(.operation == $operation) | .operation' "$request_log" 2>/dev/null | wc -l | tr -d ' '
}

wait_for_manifest_status() {
  local expected="$1"
  local manifest="$repo/.harness/code-kg-manifest.json"
  local attempt
  for attempt in $(seq 1 100); do
    if [[ -f "$manifest" ]] && [[ "$(jq -r '.submission.status // empty' "$manifest")" == "$expected" ]]; then
      return 0
    fi
    sleep 0.05
  done
  printf 'timed out waiting for manifest status %s\n' "$expected" >&2
  return 1
}

reset_case() {
  : > "$request_log"
  rm -rf "$claim_root" "$repo/.harness"
  unset THEOREM_TEST_STATUS_SHAPE THEOREM_TEST_PACK_SHAPE THEOREM_TEST_SUBMIT
}

# Unknown repository: one async ingest receipt, no context read, and the private
# URL is preserved without being promoted to freshness truth.
reset_case
export THEOREM_TEST_STATUS=unknown THEOREM_CODE_CONTEXT_CLAIM_BUCKET=unknown
invoke_hook unknown-session >/dev/null
wait_for_manifest_status accepted
test "$(operation_count ingest)" = "1"
test "$(operation_count context_pack)" = "0"
jq -e --arg head "$head_sha" '
  .repo_id == "private-fixture" and
  .repo_url == "git@github.com:Travis-Gilbert/private-fixture.git" and
  .requested_head_sha == $head and
  .operation == "ingest" and
  .certifies_indexed == false
' "$repo/.harness/code-kg-manifest.json" >/dev/null

# Changed repository: status drives reindex even if an old local manifest says
# the current SHA was previously submitted.
reset_case
mkdir -p "$repo/.harness"
jq -cn --arg head "$head_sha" '{head_sha:$head,certifies_indexed:true}' > "$repo/.harness/code-kg-manifest.json"
export THEOREM_TEST_STATUS=changed THEOREM_TEST_STATUS_SHAPE=structured THEOREM_CODE_CONTEXT_CLAIM_BUCKET=changed
invoke_hook changed-session >/dev/null
wait_for_manifest_status accepted
test "$(operation_count reindex)" = "1"
test "$(jq -r '.operation' "$repo/.harness/code-kg-manifest.json")" = "reindex"

# Current repository: request context without repo_url and inject either public
# response field. Nested wrappers exercise theorem-grpc/facade response shapes.
reset_case
export THEOREM_TEST_STATUS=current THEOREM_TEST_STATUS_SHAPE=nested THEOREM_TEST_PACK_SHAPE=nested
current_output=$(invoke_hook current-session)
printf '%s' "$current_output" | jq -e '.hookSpecificOutput.additionalContext | contains("Nested map")' >/dev/null
jq -e 'select(.operation == "context_pack") | (.arguments | has("repo_url") | not)' "$request_log" >/dev/null
test "$(operation_count ingest)" = "0"
test "$(operation_count reindex)" = "0"

# A failed submission records failure but never certifies indexing. A later
# session-entry bucket retries; co-installed hooks in one bucket submit once.
reset_case
export THEOREM_TEST_STATUS=unknown THEOREM_TEST_SUBMIT=fail THEOREM_CODE_CONTEXT_CLAIM_BUCKET=failed
invoke_hook retry-session >/dev/null
wait_for_manifest_status failed
test "$(jq -r '.certifies_indexed' "$repo/.harness/code-kg-manifest.json")" = "false"

export THEOREM_TEST_SUBMIT=ok THEOREM_CODE_CONTEXT_CLAIM_BUCKET=retry
invoke_hook retry-session >/dev/null
wait_for_manifest_status accepted
test "$(operation_count ingest)" = "2"

reset_case
export THEOREM_TEST_STATUS=unknown THEOREM_TEST_SUBMIT=ok THEOREM_CODE_CONTEXT_CLAIM_BUCKET=dedup
invoke_hook duplicate-session >/dev/null
invoke_hook duplicate-session >/dev/null
wait_for_manifest_status accepted
test "$(operation_count ingest)" = "1"

# Transport/status failures fail open and never guess that "unknown" means an
# ingest is required.
reset_case
export THEOREM_TEST_STATUS=unavailable THEOREM_CODE_CONTEXT_CLAIM_BUCKET=unavailable
invoke_hook unavailable-session >/dev/null
test "$(operation_count ingest)" = "0"
test "$(operation_count reindex)" = "0"

printf 'sessionstart codebase lifecycle: ok\n'
