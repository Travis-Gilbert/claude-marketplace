#!/usr/bin/env bash
# PostToolUse hook: records the tool result and emits REFERENCED labels.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id=$(theorem_tenant)
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
seq_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.seq"
mkdir -p "$(dirname "$seq_file")"
previous_seq=$(cat "$seq_file" 2>/dev/null || printf '0')
if [[ ! "$previous_seq" =~ ^[0-9]+$ ]]; then
  previous_seq=0
fi
seq=$((previous_seq + 1))
printf '%s' "$seq" > "$seq_file"

atoms_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.injected-atoms.jsonl"
references='{"references":[]}'
if [[ -f "$atoms_file" ]]; then
  references=$(python3 "$(dirname "$0")/detect_references.py" \
    --tool-json - \
    --atoms-file "$atoms_file" \
    --threshold "${THEOREM_REFERENCE_THRESHOLD:-0.4}" \
    --limit "${THEOREM_REFERENCE_LOOKBACK:-20}" \
    <<< "$input" 2>/dev/null || echo '{"references":[]}')
fi

event_body=$(jq -n \
  --arg actor "${THEOREM_ACTOR:-$(theorem_host)}" \
  --arg session_id "$sid" \
  --argjson seq "$seq" \
  --argjson payload "$input" \
  --argjson references "$references" \
  '{
    actor: $actor,
    record_type: "event",
    summary: "ToolResult",
    title: "ToolResult",
    metadata: {
      session_id: $session_id,
      seq: $seq,
      tool_result: $payload,
      references: ($references.references // [])
    }
  }')
theorem_native_call "coordination_record" "$event_body" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
