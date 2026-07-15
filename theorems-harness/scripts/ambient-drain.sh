#!/usr/bin/env bash
# Drain one session's durable ambient-call queue. This worker is deliberately
# short lived: hook processes enqueue and return, while retries remain visible
# in .theorem/ambient/<session>/status.json.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

cwd=""
sid=""
while (($#)); do
  case "$1" in
    --cwd)
      cwd="${2:-}"
      shift 2
      ;;
    --session)
      sid="${2:-}"
      shift 2
      ;;
    *)
      theorem_warn "ambient drain: unknown argument $1"
      exit 2
      ;;
  esac
done

[ -n "$cwd" ] && [ -n "$sid" ] || exit 2
theorem_require_jq || exit 0

THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
ambient_dir=$(theorem_ambient_dir "$cwd" "$sid")
queue_dir="$ambient_dir/queue"
receipt_dir="$ambient_dir/receipts"
lock_dir="$ambient_dir/drain.lock"
mkdir -p "$queue_dir" "$receipt_dir" 2>/dev/null || exit 0

acquire_lock() {
  if mkdir "$lock_dir" 2>/dev/null; then
    printf '%s\n' "$$" > "$lock_dir/pid"
    return 0
  fi
  local owner=""
  owner=$(cat "$lock_dir/pid" 2>/dev/null || printf '')
  case "$owner" in
    ''|*[!0-9]*) ;;
    *)
      if kill -0 "$owner" 2>/dev/null; then
        return 1
      fi
      ;;
  esac
  rm -rf "$lock_dir" 2>/dev/null || return 1
  mkdir "$lock_dir" 2>/dev/null || return 1
  printf '%s\n' "$$" > "$lock_dir/pid"
}

acquire_lock || exit 0
trap 'rm -rf "$lock_dir" 2>/dev/null || true' EXIT

while :; do
  queue_file=$(find "$queue_dir" -maxdepth 1 -type f -name '*.json' -print 2>/dev/null | sort | head -n 1)
  [ -n "$queue_file" ] || break

  tool=$(jq -r '.tool // empty' "$queue_file" 2>/dev/null || printf '')
  args=$(jq -c '.arguments // {}' "$queue_file" 2>/dev/null || printf '')
  request_key=$(jq -r '.request_key // empty' "$queue_file" 2>/dev/null || printf '')
  capability=$(jq -r '.capability // "ambient"' "$queue_file" 2>/dev/null || printf 'ambient')
  if [ -z "$tool" ] || [ -z "$args" ] || [ -z "$request_key" ]; then
    theorem_ambient_refresh_local_status "$cwd" "$sid" degraded "malformed ambient queue record: $(basename "$queue_file")" || true
    exit 0
  fi

  response=$(theorem_native_json "$tool" "$args" 2>/dev/null || printf '')
  if [ -z "$response" ] || ! printf '%s' "$response" | jq -e . >/dev/null 2>&1; then
    attempts=$(jq -r '.attempts // 0' "$queue_file" 2>/dev/null || printf '0')
    case "$attempts" in ''|*[!0-9]*) attempts=0 ;; esac
    tmp_file="$queue_file.tmp.$$"
    jq \
      --arg attempted_at "$(theorem_now_iso)" \
      --arg error "native MCP call returned no usable result" \
      --argjson attempts "$((attempts + 1))" \
      '.attempts = $attempts | .last_attempt_at = $attempted_at | .last_error = $error' \
      "$queue_file" > "$tmp_file" 2>/dev/null && mv "$tmp_file" "$queue_file"
    theorem_ambient_refresh_local_status "$cwd" "$sid" degraded "$capability delivery pending after transport or MCP refusal" || true
    exit 0
  fi

  digest=$(printf '%s' "$request_key" | shasum -a 256 | awk '{print $1}')
  receipt_file="$receipt_dir/${digest}.json"
  tmp_file="$receipt_file.tmp.$$"
  jq -n \
    --arg capability "$capability" \
    --arg tool "$tool" \
    --arg request_key "$request_key" \
    --arg acknowledged_at "$(theorem_now_iso)" \
    --argjson response "$response" \
    '{
      schema_version: 1,
      capability: $capability,
      tool: $tool,
      request_key: $request_key,
      acknowledged_at: $acknowledged_at,
      response: $response
    }' > "$tmp_file" || exit 0
  mv "$tmp_file" "$receipt_file"
  rm -f "$queue_file"
done

theorem_ambient_refresh_local_status "$cwd" "$sid" ready "all queued ambient calls acknowledged" || true
