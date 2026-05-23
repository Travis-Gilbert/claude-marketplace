#!/usr/bin/env bash
# PreCompact hook: preserve high-fidelity memory atoms before compaction.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
workstream_id="${THEOREM_WORKSTREAM_ID:-}"

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
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg workstream_id "$workstream_id" \
  --arg body "$body" \
  --argjson decisions "$decisions" \
  --argjson rules "$rules" \
  --argjson summaries "$summaries" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    workstream_id: $workstream_id,
    body: $body,
    decisions: $decisions,
    rules: $rules,
    working_summaries: $summaries
  }')

theorem_post "/pairformer/precompact-flush/" "$payload" "$sid" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
