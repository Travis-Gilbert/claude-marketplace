#!/usr/bin/env bash
# SessionStart hook: warm the code KG for a new workstream without blocking.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
cwd=$(theorem_jq "$input" '.cwd')
[[ -z "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
repo_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")
repo_label=$(basename "$repo_root")

manifest_files='[]'
tracked_files='[]'
if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  manifest_files=$(
    git -C "$repo_root" ls-files \
      package.json Cargo.toml pyproject.toml go.mod requirements.txt \
      README.md README.markdown README.rst \
      2>/dev/null | jq -R . | jq -s '.[0:20]'
  ) || manifest_files='[]'
  tracked_files=$(
    git -C "$repo_root" ls-files 2>/dev/null | jq -R . | jq -s '.[0:200]'
  ) || tracked_files='[]'
fi

event_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg repo "$repo_label" \
  --arg root "$repo_root" \
  --argjson manifests "$manifest_files" \
  --argjson files "$tracked_files" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    event_type: "SessionStart",
    payload: {
      repo: $repo,
      root: $root,
      code_kg_status: "building",
      manifests: $manifests,
      file_tree_sample: $files
    }
  }')
theorem_post "/pairformer/session-event/" "$event_body" "$sid" >/dev/null 2>&1 || true

if [[ "${THEOREM_CODE_KG_AUTO_INGEST:-1}" == "1" ]]; then
  ingest_body=$(jq -n --arg path "$repo_root" '{path: $path}')
  (
    theorem_post "/code/ingest/stream/" "$ingest_body" "$sid" >/dev/null 2>&1 || true
  ) &
fi

# Coordination room: auto-join the room derived from repo+branch, fetch
# pending mentions, and inject both as SessionStart additionalContext.
# Membership persists past heartbeat expiry, so mentions accumulated while
# the agent was idle still land at the next session-start. Fails open: if
# the call errors or returns nothing useful, the session continues unchanged.
branch=""
head_sha=""
changed_files_json='[]'
if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || printf '')
  head_sha=$(git -C "$repo_root" rev-parse HEAD 2>/dev/null || printf '')
  changed_files_json=$(
    git -C "$repo_root" status --porcelain 2>/dev/null \
      | awk '{print $NF}' \
      | jq -R . | jq -s '.[0:50]'
  ) || changed_files_json='[]'
fi

session_start_body=$(jq -n \
  --arg session_id "$sid" \
  --arg actor "${THEOREM_ACTOR}" \
  --arg surface "${THEOREM_ACTOR}" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg worktree "$repo_root" \
  --arg head "$head_sha" \
  --argjson changed_files "$changed_files_json" \
  '{
    actor: $actor,
    surface: $surface,
    branch: $branch,
    worktree: $worktree,
    head: $head,
    changed_files: $changed_files,
    scope: {
      session_id: $session_id,
      repo: $repo,
      branch: $branch,
      worktree: $worktree,
      head: $head,
      changed_files: $changed_files
    }
  }')

session_response=$(theorem_post "/harness/session/start/" "$session_start_body" "$sid" 2>/dev/null || printf '')

additional_context=""
if [[ -n "$session_response" ]]; then
  additional_context=$(printf '%s' "$session_response" | jq -r '
    def fmt_member:
      "- " + (.actor_id // "?") +
      " (" + (.status // "joined") + "/" + (.liveness_status // "inactive") + ")" +
      (if (.lane // "") != "" then " — lane: " + .lane else "" end);
    def fmt_mention:
      "- @" + (.origin_actor_id // "?") +
      " · " + (.captured_at // "") +
      " · " + ((.summary // .content // "") | gsub("\n"; " ") | .[0:240]);
    def fmt_event:
      "- " + (.event_type // "?") +
      " by " + (.actor_id // "?") +
      " · " + (.captured_at // "") +
      (if (.payload // {}) != {} then
        " · " + ((.payload | tostring) | gsub("\n"; " ") | .[0:160])
      else "" end);
    def fmt_decision:
      "- " + (.title // "(untitled)") +
      " — " + ((.choice // "") | gsub("\n"; " ") | .[0:200]) +
      " (by " + (.actor_id // "?") + ")";
    def fmt_tension:
      "- " + (.title // "(untitled)") +
      " (opened by " + (.opening_actor_id // "?") + ")\n" +
      "    observed: " + ((.observed // "") | gsub("\n"; " ") | .[0:200]) + "\n" +
      "    disagreement: " + ((.disagreement // "") | gsub("\n"; " ") | .[0:200]);
    def fmt_peer_intent:
      "- " + (.actor_id // "?") + " (" + (.status // "working") + ")" +
      ": " + ((.summary // "") | gsub("\n"; " ") | .[0:200]) +
      (if ((.claimed_files // []) | length) > 0 then
        " · files: " + ((.claimed_files // []) | join(", "))
      else "" end);
    def fmt_peer_reflection:
      "- " + (.actor_id // "?") + ": " +
      ((.summary // "") | gsub("\n"; " ") | .[0:240]);

    (.coordination_room // {}) as $room
    | (.pending_mentions // {}) as $inbox
    | (($inbox.count // 0) | tonumber) as $mention_count
    | (.coordination_digest // {}) as $digest
    | (($digest.events // []) | length) as $event_count
    | (($digest.decisions // []) | length) as $decision_count
    | (($digest.open_tensions // []) | length) as $tension_count
    | (($digest.peer_intents // []) | length) as $intent_count
    | (($digest.peer_reflections // []) | length) as $reflection_count
    | ($event_count + $decision_count + $tension_count + $intent_count + $reflection_count) as $digest_total
    | if (($room | length) == 0) and ($mention_count == 0) and ($digest_total == 0) then
        ""
      else
        "## Coordination room\n"
        + "**Room:** `" + ($room.room_id // "(none)") + "`\n"
        + "**Mode:** " + ($room.mode // "collaborating") + "\n"
        + "**Status:** " + ($room.status // "active") + "\n"
        + (if (($room.participants // []) | length) > 0 then
            "**Participants:**\n"
            + (($room.participants // []) | map(fmt_member) | join("\n"))
            + "\n"
          else "" end)
        + (if $mention_count > 0 then
            "\n## Pending mentions (" + ($mention_count | tostring) + ")\n"
            + (($inbox.mentions // []) | map(fmt_mention) | join("\n"))
            + "\n\nConsume via the mentions tool when you have read them.\n"
          else "" end)
        + (if $intent_count > 0 then
            "\n## Peer intents (" + ($intent_count | tostring) + ")\n"
            + (($digest.peer_intents // []) | map(fmt_peer_intent) | join("\n"))
            + "\n"
          else "" end)
        + (if $reflection_count > 0 then
            "\n## Peer reflections (" + ($reflection_count | tostring) + ")\n"
            + (($digest.peer_reflections // []) | map(fmt_peer_reflection) | join("\n"))
            + "\n"
          else "" end)
        + (if $tension_count > 0 then
            "\n## Open tensions (" + ($tension_count | tostring) + ")\n"
            + (($digest.open_tensions // []) | map(fmt_tension) | join("\n"))
            + "\n"
          else "" end)
        + (if $decision_count > 0 then
            "\n## Recent decisions (" + ($decision_count | tostring) + ")\n"
            + (($digest.decisions // []) | map(fmt_decision) | join("\n"))
            + "\n"
          else "" end)
        + (if $event_count > 0 then
            "\n## Recent events (" + ($event_count | tostring) + ")\n"
            + (($digest.events // []) | map(fmt_event) | join("\n"))
            + "\n"
          else "" end)
      end
  ' 2>/dev/null || printf '')
fi

if [[ -n "$additional_context" ]]; then
  jq -n \
    --arg ctx "$additional_context" \
    '{
      continue: true,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: $ctx
      }
    }'
else
  printf '{"continue":true}\n'
fi
