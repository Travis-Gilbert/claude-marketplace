#!/usr/bin/env bash
# FileChanged hook: records file-touch provenance for the session graph.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id=$(theorem_tenant)
path=$(echo "$input" | jq -r '.file_path // .path // .file // empty' 2>/dev/null || echo "")

event_body=$(jq -n \
  --arg actor "${THEOREM_ACTOR:-$(theorem_host)}" \
  --arg session_id "$sid" \
  --arg path "$path" \
  --argjson payload "$input" \
  '{
    actor: $actor,
    record_type: "event",
    summary: "FileTouch",
    title: "FileTouch",
    metadata: { session_id: $session_id, path: $path, file_event: $payload }
  }')
theorem_native_call "coordination_record" "$event_body" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
