#!/usr/bin/env bash
# Stop hook: block completion only when the local checklist contract has
# unresolved items without verification evidence or a concrete deferral reason.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
checklist_file="$cwd/.harness/checklist.json"
block_reasons=()

if [ -f "$checklist_file" ]; then
  unresolved=$(
    jq -c '
      def text_nonempty(value):
        ((value // "") | tostring | length) > 0;
      def status:
        ((.status // "open") | tostring | ascii_downcase);
      def deferral:
        (.deferral_reason // .deferral // .blocked_reason // "");
      def verified:
        (.verified == true)
        or (.acceptance_met == true)
        or (status == "verified")
        or (
          (.verification // {}) as $v
          | (($v.status // "") | tostring | test("verified|passed|met|done"; "i"))
            or text_nonempty($v.evidence)
            or text_nonempty($v.how)
            or text_nonempty($v.command)
        )
        or (
          (status == "done")
          and (text_nonempty(.validation) or text_nonempty(.evidence))
        );
      (.items // [])
      | map(
          if verified then
            empty
          elif text_nonempty(deferral) then
            empty
          else
            {
              id: (.id // "?"),
              deliverable: (.deliverable // .task // .title // "?"),
              reason: "not verified and no deferral reason"
            }
          end
        )
    ' "$checklist_file"
  )
  unresolved_count=$(printf '%s' "$unresolved" | jq 'length')
  if [ "$unresolved_count" != "0" ]; then
    unresolved_lines=$(printf '%s' "$unresolved" | jq -r '.[] | "- " + .id + ": " + .deliverable + " (" + .reason + ")"')
    block_reasons+=("Checklist gaps in $checklist_file:
$unresolved_lines")
  fi
fi

if [ "${#block_reasons[@]}" -eq 0 ]; then
  printf '{"continue":true}\n'
  exit 0
fi

reason=$(printf '%s\n\n' "${block_reasons[@]}")
reason="${reason}"$'\n\n''Resolve the listed checklist items with verification evidence, or add a concrete deferral reason to the checklist.'

jq -n --arg reason "$reason" '{
  decision: "block",
  reason: $reason
}'
