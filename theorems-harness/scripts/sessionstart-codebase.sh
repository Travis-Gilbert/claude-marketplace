#!/usr/bin/env bash
# SessionStart hook: warm the code KG for a new workstream without blocking.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
# AM1: canonical tenant resolution; no `public` fallback. Empty means the code
# KG is disabled for this session (logged at Loop 1), never a fixture tenant.
tenant_id=$(theorem_tenant)
actor="${THEOREM_ACTOR:-$(theorem_host)}"
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
  --arg actor "$actor" \
  --arg session_id "$sid" \
  --arg repo "$repo_label" \
  --arg root "$repo_root" \
  --argjson manifests "$manifest_files" \
  --argjson files "$tracked_files" \
  '{
    actor: $actor,
    record_type: "event",
    summary: "SessionStart",
    title: "SessionStart",
    metadata: {
      session_id: $session_id,
      repo: $repo,
      root: $root,
      code_kg_status: "building",
      manifests: $manifests,
      file_tree_sample: $files
    }
  }')
(theorem_native_call "coordination_record" "$event_body" >/dev/null 2>&1 || true) &
# --- AM7: code-KG base sync (Loop 1) ---
# Server kg_status is the sole freshness authority. Local receipts record a
# submission route/job only and are never read to certify that a graph exists.
code_context=""
if theorem_code_context_is_managed; then
  theorem_log "code context owned by installed Theorem SessionStart hook"
elif [[ -n "$tenant_id" && "${THEOREM_CODE_KG_AUTO_INGEST:-1}" == "1" ]]; then
  origin_url=$(git -C "$repo_root" remote get-url origin 2>/dev/null || printf '')
  head_now=$(theorem_git_head "$repo_root")
  repo_id="$repo_label"
  raw_session_id=$(theorem_jq "$input" '.session_id')

  if [[ -z "$origin_url" || -z "$head_now" ]]; then
    theorem_log "local-only or uncommitted repo, code KG base sync skipped"
  else
    status_extra=$(jq -n --arg repo_id "$repo_id" --arg sha "$head_now" \
      '{repo_id: $repo_id, sha: $sha}')
    status_response=$(THEOREM_NATIVE_TIMEOUT_SECONDS=3 theorem_code_call "kg_status" "$status_extra" 2>/dev/null || printf '')
    status_payload=$(printf '%s' "$status_response" | theorem_code_payload || printf '{}')
    status_known=$(printf '%s' "$status_payload" | jq -r 'has("indexed")' 2>/dev/null || printf 'false')
    indexed=$(printf '%s' "$status_payload" | jq -r 'if .indexed == true then "true" else "false" end' 2>/dev/null || printf 'false')
    indexed_head=$(printf '%s' "$status_payload" | jq -r '.head_sha // .headSha // empty' 2>/dev/null || printf '')

    op=""
    if [[ "$status_known" != "true" ]]; then
      theorem_log "code KG status unavailable; failing open without submission"
    elif [[ "$indexed" != "true" ]]; then
      op="ingest"
    elif [[ -z "$indexed_head" || "$indexed_head" != "$head_now" ]]; then
      op="reindex"
    fi

    if [[ -n "$op" ]]; then
      if theorem_code_submit_claim "$tenant_id" "$raw_session_id" "$repo_id" "$head_now"; then
        harness_dir=$(theorem_init_harness_dir "$repo_root")
        manifest="$harness_dir/code-kg-manifest.json"
        (
          submit_extra=$(jq -n \
            --arg repo_id "$repo_id" \
            --arg repo_url "$origin_url" \
            --arg sha "$head_now" \
            '{repo_id: $repo_id, repo_url: $repo_url, sha: $sha, confirmed: true}')
          submitted_at=$(theorem_now_iso)
          submit_response=$(THEOREM_NATIVE_TIMEOUT_SECONDS=3 theorem_code_call "$op" "$submit_extra" 2>/dev/null || printf '')
          submit_payload=$(printf '%s' "$submit_response" | theorem_code_payload || printf '{}')
          if printf '%s' "$submit_payload" | jq -e '
            .submitted == true or
            (.state? | IN("queued", "submitted", "running")) or
            (.status? == "ok" and (.job_id? // "") != "")
          ' >/dev/null 2>&1; then
            jq -n \
              --arg repo_id "$repo_id" \
              --arg repo_url "$origin_url" \
              --arg head "$head_now" \
              --arg operation "$op" \
              --arg submitted_at "$submitted_at" \
              --arg job_id "$(printf '%s' "$submit_payload" | jq -r '.job_id // .job.id // empty')" \
              --arg state "$(printf '%s' "$submit_payload" | jq -r '.state // .job.state // "submitted"')" \
              '{
                schema_version: 2,
                repo_id: $repo_id,
                repo_url: $repo_url,
                requested_head_sha: $head,
                operation: $operation,
                submission: {status: "accepted", submitted_at: $submitted_at, job_id: $job_id, state: $state},
                certifies_indexed: false
              }' > "$manifest.tmp.$$" 2>/dev/null \
              && mv "$manifest.tmp.$$" "$manifest" 2>/dev/null || true
          else
            jq -n \
              --arg repo_id "$repo_id" \
              --arg repo_url "$origin_url" \
              --arg head "$head_now" \
              --arg operation "$op" \
              --arg submitted_at "$submitted_at" \
              '{
                schema_version: 2,
                repo_id: $repo_id,
                repo_url: $repo_url,
                requested_head_sha: $head,
                operation: $operation,
                submission: {status: "failed", submitted_at: $submitted_at},
                certifies_indexed: false
              }' > "$manifest.tmp.$$" 2>/dev/null \
              && mv "$manifest.tmp.$$" "$manifest" 2>/dev/null || true
          fi
        ) &
      else
        theorem_log "code KG $op already claimed for this session entry"
      fi
    elif [[ "$status_known" == "true" ]]; then
      budget_tokens="${THEOREM_CONTEXT_BUDGET_TOKENS:-2000}"
      [[ "$budget_tokens" =~ ^[0-9]+$ ]] || budget_tokens=2000
      pack_extra=$(jq -n \
        --arg repo_id "$repo_id" \
        --arg sha "$head_now" \
        --arg session_id "$raw_session_id" \
        --arg prompt_text "${THEOREM_CONTEXT_TASK:-}" \
        --argjson budget_tokens "$budget_tokens" \
        '{
          repo_id: $repo_id,
          sha: $sha,
          session_id: $session_id,
          prompt_text: $prompt_text,
          task: $prompt_text,
          budget_tokens: $budget_tokens
        }')
      pack_response=$(THEOREM_NATIVE_TIMEOUT_SECONDS=3 theorem_code_call "context_pack" "$pack_extra" 2>/dev/null || printf '')
      pack_payload=$(printf '%s' "$pack_response" | theorem_code_payload || printf '{}')
      code_context=$(printf '%s' "$pack_payload" | jq -r '.markdown // .code_map // empty' 2>/dev/null || printf '')
    fi
  fi
elif [[ -z "$tenant_id" ]]; then
  theorem_log "code KG disabled: no tenant (set THEOREM_TENANT_ID)"
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
  --arg actor "$actor" \
  --arg surface "$actor" \
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

session_response=$(theorem_native_json "coordination_context" "$session_start_body" 2>/dev/null || printf '')

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
    def fmt_salient_node:
      "- " + (((.title // .id // "?") | tostring) | gsub("\n"; " ") | .[0:160]) +
      (if (.kind // "") != "" then " [" + .kind + "]" else "" end) +
      (if (.why_relevant // "") != "" then
        "\n    why: " + ((.why_relevant // "") | gsub("\n"; " ") | .[0:220])
      else "" end) +
      (if (.hydration_handle // "") != "" then
        "\n    hydrate: `" + ((.hydration_handle // "") | gsub("\n"; " ") | .[0:160]) + "`"
      else "" end);
    def fmt_validation_receipt:
      "- " + ((.kind // "validation") | tostring) +
      (if (.status // "") != "" then " (" + .status + ")" else "" end) +
      ": " + ((.summary // "") | gsub("\n"; " ") | .[0:220]);

    (.room // {}) as $room
    | (.pending_mentions // []) as $mentions
    | (($mentions // []) | length) as $mention_count
    | (.records // []) as $records
    | (.intents // []) as $intents
    | (($records | map(select((.record_type // "") == "event"))) | length) as $event_count
    | (($records | map(select((.record_type // "") == "decision"))) | length) as $decision_count
    | (($records | map(select((.record_type // "") == "tension"))) | length) as $tension_count
    | (($intents // []) | length) as $intent_count
    | (($records | map(select((.record_type // "") == "reflection"))) | length) as $reflection_count
    | ($event_count + $decision_count + $tension_count + $intent_count + $reflection_count) as $digest_total
    | if (($room | length) == 0) and ($mention_count == 0) and ($digest_total == 0) then
        ""
      else
        "## Coordination room\n"
        + "**Room:** `" + ($room.room_id // "(none)") + "`\n"
        + "**Mode:** " + ($room.mode // "collaborating") + "\n"
        + "**Status:** " + ($room.status // "active") + "\n"
        + (if (($room.members // [] | if type == "object" then to_entries | map(.value) else . end) | length) > 0 then
            "**Participants:**\n"
            + (($room.members // [] | if type == "object" then to_entries | map(.value) else . end) | map(fmt_member) | join("\n"))
            + "\n"
          else "" end)
        + (if $mention_count > 0 then
            "\n## Pending mentions (" + ($mention_count | tostring) + ")\n"
            + (($mentions // []) | map(fmt_mention) | join("\n"))
            + "\n\nConsume via the mentions tool when you have read them.\n"
          else "" end)
        + (if $intent_count > 0 then
            "\n## Peer intents (" + ($intent_count | tostring) + ")\n"
            + (($intents // []) | map(fmt_peer_intent) | join("\n"))
            + "\n"
          else "" end)
        + (if $reflection_count > 0 then
            "\n## Peer reflections (" + ($reflection_count | tostring) + ")\n"
            + (($records | map(select((.record_type // "") == "reflection"))) | map(fmt_peer_reflection) | join("\n"))
            + "\n"
          else "" end)
        + (if $tension_count > 0 then
            "\n## Open tensions (" + ($tension_count | tostring) + ")\n"
            + (($records | map(select((.record_type // "") == "tension"))) | map(fmt_tension) | join("\n"))
            + "\n"
          else "" end)
        + (if $decision_count > 0 then
            "\n## Recent decisions (" + ($decision_count | tostring) + ")\n"
            + (($records | map(select((.record_type // "") == "decision"))) | map(fmt_decision) | join("\n"))
            + "\n"
          else "" end)
        + (if $event_count > 0 then
            "\n## Recent events (" + ($event_count | tostring) + ")\n"
            + (($records | map(select((.record_type // "") == "event"))) | map(fmt_event) | join("\n"))
            + "\n"
          else "" end)
      end
  ' 2>/dev/null || printf '')
fi

if [[ -n "$code_context" ]]; then
  if [[ -n "$additional_context" ]]; then
    additional_context="$code_context

$additional_context"
  else
    additional_context="$code_context"
  fi
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
