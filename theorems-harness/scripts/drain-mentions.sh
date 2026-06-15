#!/usr/bin/env bash
# Stop hook -- level-1 active-turn wake catch (coordination rhythm, v0.4.8).
#
# If this head has unconsumed wake/ask/block mentions, block the stop ONCE so it
# drains them and acts before sleeping. The point: a live head consumes a wake at
# its own checkpoint, so the courier (theorem-receiver wake mode) only has to
# spawn genuinely-asleep heads. This is the LIGHT residue of the original rhythm
# gate: no poll counter, no clean-park, no worktrees. Frequency over fences,
# mechanics in transport, judgment in the model. Degrades to allow on any error
# (jq missing, substrate unreachable) so the failure mode is exactly today.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
actor=$(theorem_host)

# Read (do NOT consume) this head's pending mentions from the native substrate.
resp=$(theorem_native_call "mentions" "$(jq -n --arg a "$actor" '{actor: $a, consume: false, limit: 20}')" 2>/dev/null || printf '')
[ -n "$resp" ] || { printf '{"continue":true}\n'; exit 0; }

# Unwrap the JSON-RPC tools/call envelope (result.content[].text is a JSON string),
# falling back through structuredContent / result / the raw body.
payload=$(printf '%s' "$resp" | jq -c '
  (.result.content[0].text | fromjson?)
  // .result.structuredContent?
  // .result?
  // .
' 2>/dev/null || printf '{}')

# Only wake/ask/block mentions gate the stop; passive info mentions never block,
# so a stale info backlog does not cry wolf at every turn end.
relevant=$(printf '%s' "$payload" | jq -c '
  [ (.mentions // [])[]
    | select((.delivery == "wake") or (.urgency == "ask") or (.urgency == "block")) ]
' 2>/dev/null || printf '[]')
count=$(printf '%s' "$relevant" | jq 'length' 2>/dev/null || echo 0)
[ "${count:-0}" != "0" ] || { printf '{"continue":true}\n'; exit 0; }

# Block once per unconsumed-set: a head that reads and chooses not to act is never
# trapped, but a genuinely new wake (new message ids) blocks again.
sig=$(printf '%s' "$relevant" | jq -r '[.[].message_id] | sort | join(",")' 2>/dev/null || printf '')
sighash=$(printf '%s' "$sig" | shasum -a 256 | awk '{print substr($1,1,24)}')
marker="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.mentions-drained"
mkdir -p "$(dirname "$marker")"
if [ -f "$marker" ] && [ "$(cat "$marker" 2>/dev/null)" = "$sighash" ]; then
  printf '{"continue":true}\n'
  exit 0
fi
printf '%s' "$sighash" > "$marker"

lines=$(printf '%s' "$relevant" | jq -r '
  .[] | "- @" + (.actor_id // "?") + " [" + (.delivery // "passive") + "/" + (.urgency // "info") + "]: "
        + ((.message // "") | gsub("\\s+"; " ") | .[0:180])
' 2>/dev/null || printf '')

reason=$(printf 'Before this turn ends you have %s unconsumed wake/ask/block mention(s) addressed to %s:\n%s\n\nDrain them now: call the mentions tool with consume=true, read the room (recall / coordination_context), then act on what arrived or fork it as a coordination_tension. A live head consumes its wakes at its own checkpoint instead of being re-spawned. If after reading nothing needs action, stopping again is fine.' "$count" "$actor" "$lines")

jq -n --arg r "$reason" '{decision: "block", reason: $r}'
