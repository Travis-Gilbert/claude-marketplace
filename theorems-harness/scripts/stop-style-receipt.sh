#!/usr/bin/env bash
# Stop hook: score the final assistant message with prose-check, append a
# StyleReceipt to the current harness run, and feed advisory context forward.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
disabled_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.writing-engineering-disabled"
if [[ -f "$disabled_file" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

run_id=$(theorem_run_id "$sid" || true)
transcript_path=$(echo "$input" | jq -r '.transcript_path // .transcriptPath // empty')
if [[ -z "$run_id" || -z "$transcript_path" || ! -f "$transcript_path" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

repo_root=$(theorem_repo_root "$input")
actor="${THEOREM_ACTOR:-$(theorem_host)}"

find_prose_check() {
  if [[ -n "${THEOREM_PROSE_CHECK_BIN:-}" && -x "${THEOREM_PROSE_CHECK_BIN}" ]]; then
    printf '%s' "$THEOREM_PROSE_CHECK_BIN"
    return
  fi
  if command -v prose-check >/dev/null 2>&1; then
    command -v prose-check
    return
  fi
  local plugin_root
  plugin_root=$(theorem_plugin_root)
  for candidate in \
    "$HOME/.cargo/bin/prose-check" \
    "$plugin_root/bin/prose-check" \
    "$repo_root/rustyredcore_THG/target/release/prose-check" \
    "$repo_root/rustyredcore_THG/target/debug/prose-check" \
    "$repo_root/target/release/prose-check" \
    "$repo_root/target/debug/prose-check"
  do
    if [[ -x "$candidate" ]]; then
      printf '%s' "$candidate"
      return
    fi
  done
}

extract_final_assistant_message() {
  local transcript="$1"
  jq -r -s '
    def text_content($value):
      if ($value | type) == "string" then
        $value
      elif ($value | type) == "array" then
        [
          $value[]
          | if (type == "string") then .
            elif (type == "object") then (.text // "")
            else ""
            end
        ] | join("\n")
      elif ($value | type) == "object" then
        ($value.text // $value.content // "")
      else
        ""
      end;
    [
      .[]
      | if (type == "array") then .[] else . end
      | if (.message? and .message.role? == "assistant") then
          text_content(.message.content)
        elif (.role? == "assistant") then
          text_content(.content // .text)
        elif (.type? == "assistant") then
          text_content(.content // .text // .message.content)
        else
          empty
        end
      | select(length > 0)
    ] | last // ""
  ' "$transcript"
}

prose_check_bin=$(find_prose_check)
if [[ -z "$prose_check_bin" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

final_message=$(extract_final_assistant_message "$transcript_path")
if [[ -z "${final_message//[[:space:]]/}" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

run_args=$(jq -n --arg run_id "$run_id" '{run_id: $run_id}')
run_detail=$(theorem_native_call "harness_run" "$run_args" 2>/dev/null || true)
pack_status=$(printf '%s' "$run_detail" | jq -r '
  .result.structuredContent.detail.run.scope.writing_engineering_status
  // .structuredContent.detail.run.scope.writing_engineering_status
  // empty
' 2>/dev/null || true)
if [[ -z "$pack_status" ]]; then
  pack_status="shadow"
fi

receipt=$(
  printf '%s' "$final_message" \
    | "$prose_check_bin" --register plain --status "$pack_status" 2>/dev/null \
    || printf ''
)
receipt=$(printf '%s' "$receipt" | jq -c 'select(type == "object")' 2>/dev/null || printf '')
if [[ -z "$receipt" ]]; then
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi
hard_axis_failed=$(printf '%s' "$receipt" | jq -r '
  ((.fidelity.preserved // true) | not) or ((.em_dash_count // 0) > 0)
' 2>/dev/null || printf 'false')
case "$hard_axis_failed" in
  true|false) ;;
  *) hard_axis_failed=false ;;
esac
soft_axis_failed=$(printf '%s' "$receipt" | jq -r '
  ((.clutter_hits // []) | length > 0)
  or ((.passive_rate // 0) > 0.10)
  or ((.adverb_rate // 0) > 1.5)
  or ((.sentence_mean // 0) < 12)
  or ((.sentence_mean // 0) > 18)
  or ((.sentence_stdev // 0) < 4)
' 2>/dev/null || printf 'false')
case "$soft_axis_failed" in
  true|false) ;;
  *) soft_axis_failed=false ;;
esac
action="receipt_only"
case "$pack_status:$hard_axis_failed" in
  advisory:true)
    action="advisory_context"
    ;;
  validated:true|canonical:true)
    action="revision_required"
    ;;
  validated:false|canonical:false)
    action="emit"
    ;;
esac

payload=$(jq -n \
  --arg boundary "chat_stop" \
  --arg pack_id "skill-pack:writing-engineering-prose-v0.1" \
  --arg pack_status "$pack_status" \
  --arg action "$action" \
  --argjson hard_axis_failed "$hard_axis_failed" \
  --argjson receipt "$receipt" \
  '{
    event_subtype: "style_receipt",
    boundary: $boundary,
    style_receipts: [{
      boundary: $boundary,
      pack_id: $pack_id,
      pack_status: $pack_status,
      action: $action,
      hard_axis_failed: $hard_axis_failed,
      receipt: $receipt
    }]
  }')
receipt_hash=$(printf '%s' "$receipt" | shasum -a 256 | awk '{print $1}')
append_args=$(jq -n \
  --arg run_id "$run_id" \
  --arg actor "$actor" \
  --arg key "style_receipt:${run_id}:${receipt_hash}" \
  --argjson payload "$payload" \
  '{
    run_id: $run_id,
    event_type: "SESSION.EVENT_RECORDED",
    actor: $actor,
    idempotency_key: $key,
    payload: $payload
  }')
(theorem_native_call "harness_append_transition" "$append_args" >/dev/null 2>&1 || true) &

if [[ "$pack_status" == "advisory" && "$soft_axis_failed" == "true" ]]; then
  violations=$(printf '%s' "$receipt" | jq -r '
    def add($condition; $message): if $condition then [$message] else [] end;
    (
      [(.clutter_hits // [])[] | "clutter: " + .phrase + " -> " + .suggestion]
      + add((.passive_rate // 0) > 0.10; "passive voice: prefer active voice")
      + add((.adverb_rate // 0) > 1.5; "adverbs: remove weak intensifiers")
      + add(((.sentence_mean // 0) < 12) or ((.sentence_mean // 0) > 18); "sentence length: return to plain-register range")
      + add((.sentence_stdev // 0) < 4; "sentence rhythm: vary sentence length")
    )[0:3] | join("\n")
  ')
  if [[ -n "$violations" ]]; then
    context=$(printf '## Writing Engineering advisory\n%s' "$violations")
    jq -n --arg ctx "$context" '{
      continue: true,
      suppressOutput: true,
      hookSpecificOutput: {
        hookEventName: "Stop",
        additionalContext: $ctx
      }
    }'
    exit 0
  fi
fi

printf '{"continue":true,"suppressOutput":true}\n'
