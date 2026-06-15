#!/usr/bin/env bash
# PreToolUse hook: records the pending tool call and conditionally injects
# Pairformer-ranked frontier context.

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
  --arg actor "${THEOREM_ACTOR:-$(theorem_host)}" \
  --arg session_id "$sid" \
  --arg tool_name "$tool_name" \
  --argjson seq "$seq" \
  --argjson payload "$input" \
  '{
    actor: $actor,
    record_type: "event",
    summary: "ToolCall",
    title: "ToolCall",
    metadata: {
      session_id: $session_id,
      seq: $seq,
      tool_name: $tool_name,
      tool_input: $payload
    }
  }')
theorem_native_call "coordination_record" "$event_body" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
