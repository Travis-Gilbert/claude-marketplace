#!/usr/bin/env bash
# UserPromptSubmit hook. Compose a native Theorem Context Brief and inject it.
# Fails open: backend errors, missing jq, malformed responses, or missing tokens
# pass the prompt through unchanged.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
prompt=$(theorem_jq "$input" '.prompt')
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
actor="${THEOREM_ACTOR:-$(theorem_host)}"
repo_root=$(theorem_repo_root "$input")
repo_label=$(theorem_repo_label "$repo_root")
branch=$(theorem_git_branch "$repo_root")
changed_files_json=$(theorem_changed_files_json "$repo_root")
tenant=$(theorem_tenant)

trimmed=$(printf '%s' "$prompt" | tr -d '[:space:]')
if [ "${#trimmed}" -lt 12 ]; then
  theorem_log "prompt too short for preflight (${#trimmed} chars); skipping"
  printf '{"continue":true}\n'
  exit 0
fi

intent_body=$(jq -n \
  --arg actor "$actor" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg task "$prompt" \
  --argjson footprint "$changed_files_json" \
  '{
    actor: $actor,
    repo: $repo,
    branch: $branch,
    task: $task,
    summary: $task,
    status: "working",
    claimed_files: $footprint,
    expected_completion: "end of current model turn"
  }')
(theorem_native_call "coordination_intent" "$intent_body" >/dev/null 2>&1 || true) &

run_id=$(theorem_run_id "$sid")
if [ -z "$run_id" ]; then
  run_id="run:${sid//[\/:]/_}"
  create_payload=$(jq -n \
    --arg sid "$sid" \
    --arg cwd "$cwd" \
    --arg actor "$actor" \
    --arg repo "$repo_label" \
    --arg branch "$branch" \
    --arg tenant "$tenant" \
    '{
      task: ($actor + " session"),
      actor: $actor,
      scope: {
        task_type: "session",
        external_session_id: $sid,
        cwd: $cwd,
        repo: $repo,
        branch: $branch,
        tenant_slug: $tenant,
        permissions: ["graph_read", "code_read", "web_browse"]
      }
    }')
  theorem_set_run_id "$sid" "$run_id"
  theorem_ambient_queue_transition \
    "$cwd" "$sid" "010" "$run_id" "RUN.CREATED" "$actor" "$create_payload" "session-start:$sid" \
    >/dev/null 2>&1 || true
fi

prepare_body=$(jq -n \
  --arg task "$prompt" \
  --arg actor "$actor" \
  --arg repo "$cwd" \
  --arg tenant "$tenant" \
  --argjson budget "${THEOREM_BUDGET_TOKENS}" \
  '{
    task: $task,
    actor: $actor,
    repo: $repo,
    budget_units: $budget
  }
  + (if $tenant == "" then {} else {tenant: $tenant, tenant_slug: $tenant} end)')

artifact_response=$(theorem_native_json "harness_prepare" "$prepare_body" 2>/dev/null || printf '')
if [ -z "$artifact_response" ] || ! printf '%s' "$artifact_response" | jq empty 2>/dev/null; then
  theorem_warn "harness_prepare returned empty or non-JSON; passing prompt through"
  printf '{"continue":true}\n'
  exit 0
fi

artifact_id=$(printf '%s' "$artifact_response" | jq -r '.brief_id // .context_lease.brief_id // .signature // .decision_content_hash // .brief.signature // ""')
context_action=$(printf '%s' "$artifact_response" | jq -r '.context_action // "compile"')
prompt_event_id=$(printf '%s' "$prompt" | shasum -a 256 | awk '{print $1}')
artifact_body=$(printf '%s' "$artifact_response" | jq -r '.rendered_markdown // .brief_markdown // .markdown // empty')
if [ -z "$artifact_body" ]; then
  if [ "$context_action" = "reuse" ] && [ -n "$artifact_id" ]; then
    acting_payload=$(jq -n --arg actor "$actor" '{adapter: $actor, started_at: (now | todate)}')
    theorem_ambient_queue_transition "$cwd" "$sid" "090" "$run_id" "AGENT.ACTING" "$actor" "$acting_payload" "agent-acting:$sid" >/dev/null 2>&1 || true
    context_boundary=$(jq -n \
      --arg brief_id "$artifact_id" \
      --arg generation_id "$(printf '%s' "$artifact_response" | jq -r '.context_generation.generation_id // .context_lease.generation_id // empty')" \
      --arg lease_id "$(printf '%s' "$artifact_response" | jq -r '.context_lease.lease_id // empty')" \
      '{event_subtype:"context_boundary",brief_id:$brief_id,context_action:"reuse",generation_id:$generation_id,lease_id:$lease_id}')
    theorem_ambient_queue_transition \
      "$cwd" "$sid" "500" "$run_id" "SESSION.EVENT_RECORDED" "$actor" "$context_boundary" \
      "context-boundary:$sid:$artifact_id:$prompt_event_id" >/dev/null 2>&1 || true
    printf '{"continue":true,"suppressOutput":true}\n'
    exit 0
  fi
  theorem_warn "harness_prepare response missing rendered markdown; passing prompt through"
  printf '{"continue":true}\n'
  exit 0
fi

posture_block=$(cat <<'POSTURE'


### Engineering posture (engineers-mindset)
- Search internal first (codebase map, tests, traces, prior runs, ADRs).
- Search external if reality may live outside the repo (GitHub > SO > docs > web).
- Run one bounded reversible experiment before declaring blocked.
- Pick the safest useful default unless a true blocker exists.
- Two bugs in the same module = stop and ask "right layer?" before patch 3.
- Every option you present must fully achieve the goal. Strike partial
  fixes. If only one path completes the goal, take it without asking.
- Deferral allowed only for: access, destructive op, product preference,
  legal/privacy/safety, env outage after recovery, no safe sandbox, explicit
  user request. NOT for ambiguity, complexity, unfamiliarity, missing docs,
  multiple approaches, test failure, or vague risk.

### Output posture (concise-action)
- Default shape: Action / Finding / Next / Need.
- No narration of internal turns. No generic caveats or apology boilerplate.
- Specific narrow questions OK; broad clarifications not.
- Plans cap at the smallest useful checklist.
POSTURE
)
artifact_body="${artifact_body}${posture_block}"

runs_dir="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}"
mkdir -p "$runs_dir"
printf '%s' "$artifact_response" > "$runs_dir/last-artifact.json"
printf '%s' "$artifact_body" > "$runs_dir/last-artifact.md"
ln -sf "$runs_dir/last-artifact.md" "$THEOREM_STATE_DIR/current-context.md" 2>/dev/null || true
ln -sf "$runs_dir/last-artifact.json" "$THEOREM_STATE_DIR/current-artifact.json" 2>/dev/null || true

if [ -n "$artifact_id" ]; then
  selected_tools=$(printf '%s' "$artifact_response" | jq -c '[.selected_capabilities[]? | select(.kind == "tool") | (.tool // .name // empty)] | unique' 2>/dev/null || printf '[]')
  host_payload=$(jq -n \
    --arg repo "$repo_label" \
    --arg branch "$branch" \
    --arg commit_sha "$(theorem_git_head "$repo_root")" \
    --arg cwd "$cwd" \
    '{repo: $repo, branch: $branch, commit_sha: $commit_sha, cwd: $cwd}')
  task_payload=$(jq -n --arg sig "$artifact_id" '{task_signature: $sig}')
  profile_payload=$(jq -n \
    --arg sig "$artifact_id" \
    '{profile_id: "harness_prepare", profile_version: "native", policy_hash: $sig}')
  toolkit_payload=$(jq -n \
    --argjson selected_tools "$selected_tools" \
    '{
      selected_tools: ($selected_tools + ["harness_prepare", "harness_append_transition", "harness_run"] | unique),
      selected_plugins: ["theorems-harness"],
      excluded_tools: [],
      permission_reasons: {}
    }')
  context_plan_payload=$(jq -n \
    --arg sig "$artifact_id" \
    --argjson budget "$(printf '%s' "$artifact_response" | jq '.context_compile_receipt.token_budget // 1')" \
    --argjson candidate_tokens "$(printf '%s' "$artifact_response" | jq '.context_compile_receipt.candidate_tokens // 0')" \
    '{budget_tokens: $budget, plan_hash: $sig, candidate_token_count: $candidate_tokens}')
  context_compiled_payload=$(jq -n \
    --arg sig "$artifact_id" \
    --argjson budget "$(printf '%s' "$artifact_response" | jq '.context_compile_receipt.token_budget // 1')" \
    --argjson used_tokens "$(printf '%s' "$artifact_response" | jq '.context_compile_receipt.used_tokens // 0')" \
    --argjson included_count "$(printf '%s' "$artifact_response" | jq '[.context_compile_receipt.dispositions[]? | select(.disposition == "included")] | length')" \
    --argjson excluded_count "$(printf '%s' "$artifact_response" | jq '[.context_compile_receipt.dispositions[]? | select(.disposition != "included")] | length')" \
    --argjson token_ledger "$(printf '%s' "$artifact_response" | jq '.context_compile_receipt // {}')" \
    '{
      artifact_id: $sig,
      capsule_tokens: $used_tokens,
      budget_tokens: $budget,
      included_atom_count: $included_count,
      excluded_atom_count: $excluded_count,
      token_ledger: $token_ledger
    }')
  injected_payload=$(jq -n \
    --arg artifact_id "$artifact_id" \
    --arg actor "$actor" \
    '{ artifact_id: $artifact_id, adapter: $actor, target: "cli" }')
  acting_payload=$(jq -n --arg actor "$actor" '{adapter: $actor, started_at: (now | todate)}')
  theorem_ambient_queue_transition "$cwd" "$sid" "020" "$run_id" "HOST.OBSERVED" "$actor" "$host_payload" "host-observed:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "030" "$run_id" "TASK.RESOLVED" "$actor" "$task_payload" "task-resolved:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "040" "$run_id" "PROFILE.SELECTED" "$actor" "$profile_payload" "profile-selected:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "050" "$run_id" "TOOLKIT.COMPILED" "$actor" "$toolkit_payload" "toolkit-compiled:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "060" "$run_id" "CONTEXT.PLANNED" "$actor" "$context_plan_payload" "context-planned:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "070" "$run_id" "CONTEXT.COMPILED" "$actor" "$context_compiled_payload" "context-compiled:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "080" "$run_id" "CONTEXT.INJECTED" "$actor" "$injected_payload" "context-injected:$sid" >/dev/null 2>&1 || true
  theorem_ambient_queue_transition "$cwd" "$sid" "090" "$run_id" "AGENT.ACTING" "$actor" "$acting_payload" "agent-acting:$sid" >/dev/null 2>&1 || true

  context_boundary=$(jq -n \
    --arg brief_id "$artifact_id" \
    --arg context_action "$context_action" \
    --arg generation_id "$(printf '%s' "$artifact_response" | jq -r '.context_generation.generation_id // .context_lease.generation_id // empty')" \
    --arg lease_id "$(printf '%s' "$artifact_response" | jq -r '.context_lease.lease_id // empty')" \
    '{
      event_subtype: "context_boundary",
      brief_id: $brief_id,
      context_action: $context_action,
      generation_id: $generation_id,
      lease_id: $lease_id
    }')
  theorem_ambient_queue_transition \
    "$cwd" "$sid" "500" "$run_id" "SESSION.EVENT_RECORDED" "$actor" "$context_boundary" \
    "context-boundary:$sid:$artifact_id:$prompt_event_id" >/dev/null 2>&1 || true
fi

jq -n \
  --arg ctx "$artifact_body" \
  --arg run "$run_id" \
  --arg sig "$artifact_id" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: ($ctx + "\n\n---\n_theorem run " + $run + " · signature " + $sig + "_")
    }
  }'
