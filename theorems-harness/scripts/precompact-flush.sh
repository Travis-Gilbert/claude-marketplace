#!/usr/bin/env bash
# PreCompact hook: preserve high-fidelity memory atoms before compaction.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id=$(theorem_tenant)
workstream_id="${THEOREM_WORKSTREAM_ID:-}"
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
run_id=$(theorem_run_id "$sid" || true)

body=$(echo "$input" | jq -r '
  .transcript // .conversation // .summary // .content // .text // ""
' 2>/dev/null || echo "")

string_values_filter='map(select(type == "string" and length > 0))'
decisions=$(
  echo "$input" | jq -c "[.. | objects | .decision? // empty] | ${string_values_filter}" \
    2>/dev/null || echo '[]'
)
rules=$(
  echo "$input" | jq -c "[.. | objects | .rule? // .instruction? // empty] | ${string_values_filter}" \
    2>/dev/null || echo '[]'
)
summaries=$(
  echo "$input" | jq -c "[.. | objects | .working_summary? // .summary? // empty] | ${string_values_filter}" \
    2>/dev/null || echo '[]'
)

payload=$(jq -n \
  --arg actor "${THEOREM_ACTOR:-$(theorem_host)}" \
  --arg session_id "$sid" \
  --arg workstream_id "$workstream_id" \
  --arg body "$body" \
  --argjson decisions "$decisions" \
  --argjson rules "$rules" \
  --argjson summaries "$summaries" \
  '{
    actor: $actor,
    kind: "precompact_flush",
    content: $body,
    context: {
      session_id: $session_id,
      workstream_id: $workstream_id,
      decisions: $decisions,
      rules: $rules,
      working_summaries: $summaries
    }
  }')

compact_event_id=$(echo "$input" | jq -r '.compact_id // .compactId // .event_id // .eventId // empty' 2>/dev/null || echo "")
if [ -z "$compact_event_id" ]; then
  compact_event_id=$(printf '%s' "$input" | jq -cS . 2>/dev/null | shasum -a 256 | awk '{print $1}')
fi
remember_key="precompact-memory:$sid:$compact_event_id"
theorem_ambient_queue_call \
  "$cwd" "$sid" "240" "compaction_memory" "remember" "$payload" "$remember_key" \
  >/dev/null 2>&1 || true

if [ -n "$run_id" ]; then
  boundary_payload=$(jq -n \
    --arg compact_event_id "$compact_event_id" \
    --arg workstream_id "$workstream_id" \
    --argjson decision_count "$(printf '%s' "$decisions" | jq 'length')" \
    --argjson rule_count "$(printf '%s' "$rules" | jq 'length')" \
    --argjson summary_count "$(printf '%s' "$summaries" | jq 'length')" \
    '{
      event_subtype: "context_compaction",
      compact_event_id: $compact_event_id,
      workstream_id: $workstream_id,
      decision_count: $decision_count,
      rule_count: $rule_count,
      working_summary_count: $summary_count
    }')
  theorem_ambient_queue_transition \
    "$cwd" "$sid" "250" "$run_id" "SESSION.EVENT_RECORDED" \
    "${THEOREM_ACTOR:-$(theorem_host)}" "$boundary_payload" \
    "precompact-boundary:$sid:$compact_event_id" >/dev/null 2>&1 || true
fi

printf '{"continue":true}\n'
