#!/usr/bin/env bash
# HCM-032 plugin oracle. Fixture mode proves hook ordering, idempotent retries,
# degraded visibility, and exact registered tool names. Local/live modes use a
# real admitted MCP host and refuse to call fixture evidence live proof.

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
tenant=""
mode="fixture"
mcp_url=""
while (($#)); do
  case "$1" in
    --tenant)
      tenant="${2:-}"
      shift 2
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --mcp-url)
      mcp_url="${2:-}"
      shift 2
      ;;
    *)
      printf 'unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
done

[ -n "$tenant" ] || { printf '%s\n' '--tenant is required' >&2; exit 2; }
case "$mode" in fixture|local|live) ;; *) printf 'invalid mode: %s\n' "$mode" >&2; exit 2 ;; esac
if [ "$mode" = "live" ]; then
  [ "${THEOREM_AMBIENT_LIVE:-0}" = "1" ] || {
    printf '%s\n' 'live oracle skipped: set THEOREM_AMBIENT_LIVE=1 explicitly' >&2
    exit 3
  }
  [ -n "${THEOREM_HARNESS_API_TOKEN:-}" ] || {
    printf '%s\n' 'live oracle blocked: THEOREM_HARNESS_API_TOKEN is required for an admitted session' >&2
    exit 3
  }
fi

fixture=$(mktemp -d)
cleanup() {
  if [ "${KEEP_FIXTURE:-0}" = "1" ]; then
    printf 'fixture preserved at %s\n' "$fixture" >&2
  else
    rm -rf "$fixture"
  fi
}
trap cleanup EXIT

repo="$fixture/repo"
mkdir -p "$repo"
git -C "$repo" init -q -b main
git -C "$repo" config user.email tests@example.com
git -C "$repo" config user.name "Ambient Session Tests"
printf 'ambient fixture\n' > "$repo/README.md"
git -C "$repo" add README.md
git -C "$repo" commit -q -m 'test(ambient): initialize fixture'

export PLUGIN_ROOT="$plugin_root"
export THEOREM_TENANT_ID="$tenant"
export THEOREM_AMBIENT_SYNC=1
export THEOREM_NATIVE_TIMEOUT_SECONDS="${THEOREM_NATIVE_TIMEOUT_SECONDS:-5}"

if [ "$mode" = "fixture" ]; then
  mock_bin="$fixture/bin"
  mkdir -p "$mock_bin"
  export THEOREM_AMBIENT_FIXTURE_STATE="$fixture/server"
  mkdir -p "$THEOREM_AMBIENT_FIXTURE_STATE"
  : > "$THEOREM_AMBIENT_FIXTURE_STATE/requests.jsonl"
  cat > "$mock_bin/curl" <<'MOCK_CURL'
#!/usr/bin/env bash
set -euo pipefail
payload=""
while (($#)); do
  case "$1" in
    -d) payload="$2"; shift 2 ;;
    -m) shift 2 ;;
    *) shift ;;
  esac
done
state=${THEOREM_AMBIENT_FIXTURE_STATE:?}
printf '%s\n' "$(printf '%s' "$payload" | jq -cS .)" >> "$state/requests.jsonl"
if [ "${THEOREM_AMBIENT_FIXTURE_FAIL:-0}" = "1" ]; then
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"fixture unavailable"}}'
  exit 0
fi
tool=$(printf '%s' "$payload" | jq -r '.params.name')
args=$(printf '%s' "$payload" | jq -c '.params.arguments // {}')
if [ "${THEOREM_AMBIENT_FIXTURE_TOOL_ERROR:-0}" = "1" ]; then
  printf '%s\n' '{"jsonrpc":"2.0","id":1,"result":{"isError":true,"structuredContent":{"code":"fixture_refusal","message":"fixture tool refusal"}}}'
  exit 0
fi
case "$tool" in
  harness_append_transition)
    key=$(printf '%s' "$args" | jq -r '.idempotency_key')
    digest=$(printf '%s' "$key" | shasum -a 256 | awk '{print $1}')
    receipt="$state/transition-$digest.json"
    if [ -f "$receipt" ]; then
      cat "$receipt"
      exit 0
    fi
    type=$(printf '%s' "$args" | jq -r '.type')
    run_id=$(printf '%s' "$args" | jq -r '.run_id')
    event=$(printf '%s' "$args" | jq -c '{type:.type,payload:.payload,idempotency_key:.idempotency_key}')
    printf '%s\n' "$event" >> "$state/events.jsonl"
    count=$(wc -l < "$state/events.jsonl" | tr -d ' ')
    case "$type" in
      RUN.CREATED)
        status=created
        printf '%s' "$args" | jq -c '.payload.scope + {superpowers_practice_graph_status:"canonical",superpowers_practice_graph_id:"theorem-superpowers"}' > "$state/scope.json"
        ;;
      CONTEXT.INJECTED) status=context_injected ;;
      AGENT.ACTING|SESSION.EVENT_RECORDED) status=agent_acting ;;
      OUTCOME.RECORDED) status=outcome_recorded ;;
      RUN.CLOSED)
        status=closed
        jq -n '{oracle_class:"deterministic_fixture",close_hook_invocations:1,practice_outcome_attributions:1,episode_captures:1}' > "$state/runtime-observer.json"
        ;;
      *) status=$(cat "$state/status" 2>/dev/null || printf created) ;;
    esac
    printf '%s' "$status" > "$state/status"
    scope=$(cat "$state/scope.json" 2>/dev/null || printf '{}')
    response=$(jq -cn --arg run_id "$run_id" --arg status "$status" --argjson scope "$scope" --argjson event "$event" --argjson count "$count" '{jsonrpc:"2.0",id:1,result:{structuredContent:{result:{run:{run_id:$run_id,status:$status,scope:$scope,last_event_seq:$count},event:$event,state_hash_after:("fixture-state-"+($count|tostring))}}}}')
    printf '%s\n' "$response" > "$receipt"
    printf '%s\n' "$response"
    ;;
  harness_prepare)
    task=$(printf '%s' "$args" | jq -r '.task // ""')
    if [[ "$task" == Reuse* ]]; then
      jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{brief_id:"brief:fixture",context_action:"reuse",inject_context:false,retrieval_performed:false,context_lease:{lease_id:"lease:fixture",generation_id:"generation:fixture",brief_id:"brief:fixture"}}}}'
    else
      jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{signature:"fixture-context-signature",brief_id:"brief:fixture",rendered_markdown:"## Fixture Context",context_action:"compile",selected_capabilities:[],context_lease:{lease_id:"lease:fixture",generation_id:"generation:fixture",brief_id:"brief:fixture"},context_generation:{generation_id:"generation:fixture"},context_compile_receipt:{receipt_id:"compile:fixture",token_budget:2000,candidate_tokens:40,used_tokens:20,dispositions:[{disposition:"included"},{disposition:"excluded"}]}}}}'
    fi
    ;;
  remember)
    jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{status:"remembered",content_address:"fixture-memory"}}}'
    ;;
  harness_run)
    status=$(cat "$state/status" 2>/dev/null || printf unknown)
    scope=$(cat "$state/scope.json" 2>/dev/null || printf '{}')
    events=$(jq -s . "$state/events.jsonl" 2>/dev/null || printf '[]')
    run_id=$(printf '%s' "$args" | jq -r '.run_id')
    jq -cn --arg run_id "$run_id" --arg status "$status" --argjson scope "$scope" --argjson events "$events" '{jsonrpc:"2.0",id:1,result:{structuredContent:{found:true,run_id:$run_id,detail:{run:{run_id:$run_id,status:$status,scope:$scope,last_event_seq:($events|length)},events:$events}}}}'
    ;;
  context_status)
    jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{status:"active",scope:{project_slug:"repo"},generation_id:"generation:fixture",lease_id:"lease:fixture"}}}'
    ;;
  context_explain)
    jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{status:"active",compile_receipt:{receipt_id:"compile:fixture"},dispositions:[]}}}'
    ;;
  coordination_intent|coordination_record)
    jq -cn '{jsonrpc:"2.0",id:1,result:{structuredContent:{status:"recorded"}}}'
    ;;
  *)
    jq -cn --arg tool "$tool" '{jsonrpc:"2.0",id:1,error:{code:-32601,message:("fixture has no tool "+$tool)}}'
    ;;
esac
MOCK_CURL
  chmod +x "$mock_bin/curl"
  export PATH="$mock_bin:$PATH"
  export THEOREM_HARNESS_MCP_URL="http://ambient-fixture.invalid/mcp"
else
  [ -n "$mcp_url" ] || mcp_url="${THEOREM_HARNESS_MCP_URL:-http://127.0.0.1:8787/mcp}"
  export THEOREM_HARNESS_MCP_URL="$mcp_url"
fi

session_id="ambient-${mode}-session"
hook_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"SessionStart"}')
prompt_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"UserPromptSubmit",prompt:"Implement and verify the ambient Harness fixture."}')
reuse_prompt_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"UserPromptSubmit",prompt:"Reuse the admitted context without reinjecting it."}')
tool_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"PostToolUse",tool_use_id:"tool:fixture:1",tool_name:"Bash",tool_input:{command:"git status --short"},tool_response:{exit_code:0}}')
compact_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"PreCompact",compact_id:"compact:fixture:1",summary:"Preserve the ambient fixture decision.",decision:"Use stable delivery keys."}')
stop_json=$(jq -cn --arg cwd "$repo" --arg sid "$session_id" '{cwd:$cwd,session_id:$sid,hook_event_name:"Stop",summary:"Ambient fixture completed."}')

printf '%s' "$hook_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
printf '%s' "$hook_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
printf '%s' "$prompt_json" | "$plugin_root/scripts/prepare-context.sh" >/dev/null
printf '%s' "$reuse_prompt_json" | "$plugin_root/scripts/prepare-context.sh" >/dev/null
printf '%s' "$tool_json" | "$plugin_root/scripts/record-action.sh" >/dev/null
printf '%s' "$tool_json" | "$plugin_root/scripts/record-action.sh" >/dev/null
printf '%s' "$compact_json" | "$plugin_root/scripts/precompact-flush.sh" >/dev/null
printf '%s' "$compact_json" | "$plugin_root/scripts/precompact-flush.sh" >/dev/null
printf '%s' "$stop_json" | "$plugin_root/scripts/finalize-run.sh" >/dev/null
printf '%s' "$stop_json" | "$plugin_root/scripts/finalize-run.sh" >/dev/null

diagnostic=$("$plugin_root/scripts/ambient-status.sh" --cwd "$repo" --session "$session_id" --refresh)
printf '%s' "$diagnostic" | jq -e '
  .delivery.degraded == false and
  .delivery.pending_calls == 0 and
  .run.value.detail.run.status == "closed" and
  .context.status.status == "active" and
  .context.explain.status == "active" and
  .practice.graph_status == "canonical"
' >/dev/null

if [ "$mode" != "fixture" ]; then
  printf '%s\n' "$diagnostic" | jq .
  printf '%s\n' 'real ambient session is structurally closed, but HCM-032 live acceptance remains blocked: practice_status, practice_explain, and direct episode/close-harvest diagnostics are not registered.' >&2
  exit 3
fi

events="$THEOREM_AMBIENT_FIXTURE_STATE/events.jsonl"
test "$(jq -r 'select(.type == "RUN.CREATED") | .type' "$events" | wc -l | tr -d ' ')" = 1
test "$(jq -r 'select(.type == "OUTCOME.RECORDED") | .type' "$events" | wc -l | tr -d ' ')" = 1
test "$(jq -r 'select(.type == "RUN.CLOSED") | .type' "$events" | wc -l | tr -d ' ')" = 1
test "$(jq -r 'select(.type == "SESSION.EVENT_RECORDED" and .payload.event_subtype == "tool_use") | .type' "$events" | wc -l | tr -d ' ')" = 1
test "$(jq -r 'select(.type == "SESSION.EVENT_RECORDED" and .payload.event_subtype == "context_compaction") | .type' "$events" | wc -l | tr -d ' ')" = 1
test "$(jq -r 'select(.type == "SESSION.EVENT_RECORDED" and .payload.event_subtype == "context_boundary" and .payload.context_action == "reuse") | .type' "$events" | wc -l | tr -d ' ')" = 1
jq -e '.oracle_class == "deterministic_fixture" and .close_hook_invocations == 1 and .practice_outcome_attributions == 1 and .episode_captures == 1' "$THEOREM_AMBIENT_FIXTURE_STATE/runtime-observer.json" >/dev/null

# A refused transport stays queued and visible, then the identical SessionStart
# retries the same request key once the host recovers.
degraded_repo="$fixture/degraded-repo"
git clone -q "$repo" "$degraded_repo"
degraded_sid="ambient-degraded-session"
degraded_json=$(jq -cn --arg cwd "$degraded_repo" --arg sid "$degraded_sid" '{cwd:$cwd,session_id:$sid,hook_event_name:"SessionStart"}')
export THEOREM_AMBIENT_FIXTURE_FAIL=1
printf '%s' "$degraded_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
degraded_status=$("$plugin_root/scripts/ambient-status.sh" --cwd "$degraded_repo" --session "$degraded_sid")
printf '%s' "$degraded_status" | jq -e '.delivery.degraded == true and .delivery.pending_calls == 1' >/dev/null
health_output=$(printf '%s' "$degraded_json" | "$plugin_root/scripts/ambient-health-hook.sh")
printf '%s' "$health_output" | jq -e '.hookSpecificOutput.additionalContext | contains("Harness ambient mode is degraded")' >/dev/null
unset THEOREM_AMBIENT_FIXTURE_FAIL
printf '%s' "$degraded_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
recovered_status=$("$plugin_root/scripts/ambient-status.sh" --cwd "$degraded_repo" --session "$degraded_sid")
printf '%s' "$recovered_status" | jq -e '.delivery.degraded == false and .delivery.pending_calls == 0' >/dev/null

# MCP tool-level refusals are delivery failures, not acknowledgements. The
# identical request remains queued until the host accepts it.
tool_error_repo="$fixture/tool-error-repo"
git clone -q "$repo" "$tool_error_repo"
tool_error_sid="ambient-tool-error-session"
tool_error_json=$(jq -cn --arg cwd "$tool_error_repo" --arg sid "$tool_error_sid" '{cwd:$cwd,session_id:$sid,hook_event_name:"SessionStart"}')
export THEOREM_AMBIENT_FIXTURE_TOOL_ERROR=1
printf '%s' "$tool_error_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
tool_error_status=$("$plugin_root/scripts/ambient-status.sh" --cwd "$tool_error_repo" --session "$tool_error_sid")
printf '%s' "$tool_error_status" | jq -e '.delivery.degraded == true and .delivery.pending_calls == 1 and .delivery.acknowledged_calls == 0' >/dev/null
unset THEOREM_AMBIENT_FIXTURE_TOOL_ERROR
printf '%s' "$tool_error_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
tool_recovered_status=$("$plugin_root/scripts/ambient-status.sh" --cwd "$tool_error_repo" --session "$tool_error_sid")
printf '%s' "$tool_recovered_status" | jq -e '.delivery.degraded == false and .delivery.pending_calls == 0 and .delivery.acknowledged_calls == 1' >/dev/null

# A malformed head record is quarantined instead of permanently blocking the
# next valid call. Dead letters remain explicit degraded-state diagnostics.
poison_repo="$fixture/poison-repo"
git clone -q "$repo" "$poison_repo"
poison_sid="ambient-poison-session"
poison_json=$(jq -cn --arg cwd "$poison_repo" --arg sid "$poison_sid" '{cwd:$cwd,session_id:$sid,hook_event_name:"SessionStart"}')
poison_dir=$(PLUGIN_ROOT="$plugin_root" bash -c 'source "$1/scripts/lib.sh"; THEOREM_STATE_DIR=$(theorem_init_state_dir "$2"); theorem_ambient_dir "$2" "$3"' _ "$plugin_root" "$poison_repo" "$poison_sid")
mkdir -p "$poison_dir/queue"
printf '%s\n' '{"schema_version":1,"request_key":"malformed-fixture"}' > "$poison_dir/queue/000-000000000000-malformed.json"
printf '%s' "$poison_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
poison_status=$("$plugin_root/scripts/ambient-status.sh" --cwd "$poison_repo" --session "$poison_sid")
printf '%s' "$poison_status" | jq -e '.delivery.degraded == true and .delivery.pending_calls == 0 and .delivery.acknowledged_calls == 1 and .delivery.dead_letter_calls == 1' >/dev/null
test "$(find "$poison_dir/dead-letter" -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ')" = 1

# Same-phase events retain host enqueue order during an outage. Their content
# hashes deliberately sort in the opposite order, so this fails if filenames
# regress to hash ordering instead of using the durable sequence.
ordered_repo="$fixture/ordered-repo"
git clone -q "$repo" "$ordered_repo"
ordered_sid="ambient-ordered-session"
ordered_json=$(jq -cn --arg cwd "$ordered_repo" --arg sid "$ordered_sid" '{cwd:$cwd,session_id:$sid,hook_event_name:"SessionStart"}')
export THEOREM_AMBIENT_FIXTURE_FAIL=1
printf '%s' "$ordered_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
ordered_run_id="run:${ordered_sid}"
for marker in first second; do
  PLUGIN_ROOT="$plugin_root" bash -c '
    source "$1/scripts/lib.sh"
    THEOREM_STATE_DIR=$(theorem_init_state_dir "$2")
    payload=$(jq -n --arg marker "$5" "{event_subtype:\"ordering_fixture\",marker:\$marker}")
    theorem_ambient_queue_transition "$2" "$3" "500" "$4" "SESSION.EVENT_RECORDED" "fixture" "$payload" "ordering:$3:$5"
  ' _ "$plugin_root" "$ordered_repo" "$ordered_sid" "$ordered_run_id" "$marker" >/dev/null
done
ordered_dir=$(PLUGIN_ROOT="$plugin_root" bash -c 'source "$1/scripts/lib.sh"; THEOREM_STATE_DIR=$(theorem_init_state_dir "$2"); theorem_ambient_dir "$2" "$3"' _ "$plugin_root" "$ordered_repo" "$ordered_sid")
test "$(find "$ordered_dir/queue" -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ')" = 3
test "$(jq -s -r 'sort_by(.sequence) | map(select(.arguments.payload.marker != null) | .arguments.payload.marker) | join(",")' "$ordered_dir"/queue/*.json)" = "first,second"
unset THEOREM_AMBIENT_FIXTURE_FAIL
printf '%s' "$ordered_json" | "$plugin_root/scripts/begin-run.sh" >/dev/null
test "$(jq -s -r '[.[] | select(.payload.event_subtype == "ordering_fixture") | .payload.marker] | join(",")' "$events")" = "first,second"

printf 'ambient session fixture: ok (tenant=%s; live_evidence=false)\n' "$tenant"
