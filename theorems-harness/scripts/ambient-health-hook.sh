#!/usr/bin/env bash
# Surface pending/degraded ambient delivery without blocking the host session.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }
input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
theorem_ambient_spawn_drain "$cwd" "$sid" >/dev/null 2>&1 || true

status_file=$(theorem_ambient_status_file "$cwd" "$sid")
if [ ! -f "$status_file" ] || ! jq -e '.degraded == true' "$status_file" >/dev/null 2>&1; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

detail=$(jq -r '.detail // "ambient Harness delivery is pending"' "$status_file" 2>/dev/null || printf 'ambient Harness delivery is pending')
pending=$(jq -r '.pending_calls // 0' "$status_file" 2>/dev/null || printf '0')
dead_letter=$(jq -r '.dead_letter_calls // 0' "$status_file" 2>/dev/null || printf '0')
hook_event_name=$(theorem_jq "$input" '.hook_event_name // .hookEventName')
hook_event_name="${hook_event_name:-SessionStart}"
jq -n \
  --arg detail "$detail" \
  --arg pending "$pending" \
  --arg dead_letter "$dead_letter" \
  --arg hook_event_name "$hook_event_name" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: $hook_event_name,
      additionalContext: ("Harness ambient mode is degraded: " + $detail + ". Pending durable calls: " + $pending + "; dead-letter calls: " + $dead_letter + ". The session remains usable; inspect scripts/ambient-status.sh for exact surfaces.")
    }
  }'
