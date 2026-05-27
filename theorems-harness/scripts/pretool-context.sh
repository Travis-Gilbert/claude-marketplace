#!/usr/bin/env bash
# PreToolUse hook: records the pending tool call and conditionally injects
# Pairformer-ranked frontier context.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
workstream_id="${THEOREM_WORKSTREAM_ID:-}"
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
tool_name=$(echo "$input" | jq -r '
  if (.tool | type) == "object" then (.tool.name // "")
  elif (.tool | type) == "string" then .tool
  else (.tool_name // .name // "")
  end
' 2>/dev/null || echo "")

seq_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.seq"
mkdir -p "$(dirname "$seq_file")"
previous_seq=0
if [[ -f "$seq_file" ]]; then
  previous_seq=$(cat "$seq_file" 2>/dev/null || printf '0')
fi
if [[ ! "$previous_seq" =~ ^[0-9]+$ ]]; then
  previous_seq=0
fi
seq=$((previous_seq + 1))
printf '%s' "$seq" > "$seq_file"

event_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg tool_name "$tool_name" \
  --argjson seq "$seq" \
  --argjson payload "$input" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    event_type: "ToolCall",
    seq: $seq,
    payload: { tool_name: $tool_name, tool_input: $payload }
  }')
theorem_post "/pairformer/session-event/" "$event_body" "$sid" >/dev/null 2>&1 || true

score_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg workstream_id "$workstream_id" \
  --argjson current_seq "$seq" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    current_seq: $current_seq,
    candidate_limit: 5,
    workstream_id: $workstream_id
  }')
score_response=$(
  theorem_post "/pairformer/score-frontier/" "$score_body" "$sid" 2>/dev/null || true
)
if [[ -z "$score_response" ]] || ! echo "$score_response" | jq empty 2>/dev/null; then
  printf '{"continue":true}\n'
  exit 0
fi

inject_count=$(echo "$score_response" | jq '(.injectable // []) | length')
if [[ "$inject_count" -eq 0 ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

atoms_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.injected-atoms.jsonl"
echo "$score_response" | jq -c --argjson seq "$seq" '
  (.injectable // [])[] | . + {injected_seq: $seq}
' >> "$atoms_file"

context=$(echo "$score_response" | jq -r '
  [
    "## Pairformer Frontier Context",
    "",
    ((.injectable // []) | map(
      "- " + (.title // .atom_id // "memory")
      + " (`" + (.atom_id // "") + "`, confidence "
      + ((.confidence // 0) | tostring) + ")"
      + (if (.body // "") == "" then "" else ": " + ((.body | gsub("\\s+"; " "))[:240]) end)
    ) | join("\n"))
  ] | join("\n")
')

jq -n --arg ctx "$context" '{
  continue: true,
  suppressOutput: true,
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: $ctx
  }
}'
