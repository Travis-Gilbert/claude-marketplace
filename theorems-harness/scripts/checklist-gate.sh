#!/usr/bin/env bash
# Stop hook: block completion until the local checklist contract is verified or
# honestly deferred.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
checklist_file="$cwd/.harness/checklist.json"
last_message=$(theorem_jq "$input" '.last_assistant_message')

forbidden_regex='later|future milestone|separate effort|out of scope for now'
block_reasons=()

if [ -f "$checklist_file" ]; then
  unresolved=$(
    jq -c --arg forbidden "$forbidden_regex" '
      def text_nonempty(value):
        ((value // "") | tostring | length) > 0;
      def status:
        ((.status // "open") | tostring | ascii_downcase);
      def deferral:
        (.deferral_reason // .deferral // .blocked_reason // "");
      def forbidden_deferral:
        (deferral | tostring | test($forbidden; "i"));
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
            if forbidden_deferral then
              {
                id: (.id // "?"),
                deliverable: (.deliverable // .task // .title // "?"),
                reason: "verified item still carries a forbidden deferral phrase",
                deferral_reason: deferral
              }
            else empty end
          elif text_nonempty(deferral) then
            if forbidden_deferral then
              {
                id: (.id // "?"),
                deliverable: (.deliverable // .task // .title // "?"),
                reason: "deferral uses a forbidden phrase",
                deferral_reason: deferral
              }
            else empty end
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

if printf '%s' "$last_message" | grep -Eiq "$forbidden_regex|not possible|isn.t possible|would require|cannot be done|can.t be done"; then
  block_reasons+=("Final response contains blocker or forbidden deferral language. Resolve it, or record an honest checklist deferral that does not use forbidden phrasing.")
fi

if [ "${#block_reasons[@]}" -eq 0 ]; then
  printf '{"continue":true}\n'
  exit 0
fi

reason=$(printf '%s\n\n' "${block_reasons[@]}")
reason="${reason}Engineering-mindset directive: search internally, check current external docs when API reality matters, run one bounded reversible experiment, then either verify the checklist item or write a concrete external blocker as the deferral reason."

jq -n --arg reason "$reason" '{
  decision: "block",
  reason: $reason
}'
