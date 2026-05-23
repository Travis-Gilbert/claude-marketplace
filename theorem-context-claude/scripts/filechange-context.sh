#!/usr/bin/env bash
# FileChanged hook: records file-touch provenance for the session graph.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
path=$(echo "$input" | jq -r '.file_path // .path // .file // empty' 2>/dev/null || echo "")

event_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg path "$path" \
  --argjson payload "$input" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    event_type: "FileTouch",
    payload: { path: $path, file_event: $payload }
  }')
theorem_post "/pairformer/session-event/" "$event_body" "$sid" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
