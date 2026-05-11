#!/usr/bin/env bash
# UserPromptSubmit hook. The headline of this plugin.
# Calls Theseus' orchestrate/prepare before the model turn, synthesizes a
# Context Brief from the structured response (decision/memory/recall/report),
# and injects the brief into the prompt via hookSpecificOutput.additionalContext.
#
# Body matches OrchestrateRunRequest schema:
#   { task, mode='plan', actor='claude-code', repo, budget_tokens, scope }
# Response keys consumed:
#   .decision.task_signature, .decision.selected_profile_id,
#   .decision.selected_tool_ids, .decision.why_selected, .decision.context_plan,
#   .memory_recall.read_first, .memory_recall.risks, .memory_recall.do_not,
#   .report.next_actions, .report.checklist
#
# Falls open on every error: backend 500, route 404, jq missing, malformed
# body. The session never breaks because the hook had a bad day.

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
prompt=$(theorem_jq "$input" '.prompt')
cwd=$(theorem_jq "$input" '.cwd')
[ -z "$cwd" ] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"

# Skip preflight on trivial prompts (acks, single-word replies).
trimmed=$(echo "$prompt" | tr -d '[:space:]')
if [ "${#trimmed}" -lt 12 ]; then
  theorem_log "prompt too short for preflight (${#trimmed} chars); skipping"
  printf '{"continue":true}\n'
  exit 0
fi

# Ensure we have a run id; if SessionStart didn't fire, begin lazily.
run_id=$(theorem_run_id "$sid")
if [ -z "$run_id" ]; then
  begin_body=$(jq -n --arg sid "$sid" --arg cwd "$cwd" '{
    actor: "claude-code",
    task: "claude-code session",
    scope: { task_type: "session", external_session_id: $sid, cwd: $cwd, permissions: ["graph_read","code_read","web_browse"] }
  }')
  begin_resp=$(theorem_post "/harness/runs/" "$begin_body" 2>/dev/null) || {
    theorem_warn "harness.begin (lazy) failed; passing prompt through"
    printf '{"continue":true}\n'
    exit 0
  }
  run_id=$(echo "$begin_resp" | jq -r '.run.run_id // .run_id // empty')
  [ -z "$run_id" ] && { theorem_warn "no run_id from begin; passing through"; printf '{"continue":true}\n'; exit 0; }
  theorem_set_run_id "$sid" "$run_id"
fi

# Compile context for this prompt via orchestrate/prepare.
# Body MUST match OrchestrateRunRequest schema (see apps/orchestrate/api/harness.py).
# run_id is NOT a field on the schema; we bind injection to the run via the
# follow-up /harness/runs/{run_id}/context-injected/ call below.
prepare_body=$(jq -n \
  --arg task "$prompt" \
  --arg cwd "$cwd" \
  --argjson budget "${THEOREM_BUDGET_TOKENS}" \
  '{
    task: $task,
    mode: "plan",
    actor: "claude-code",
    repo: $cwd,
    budget_tokens: $budget
  }')

artifact_response=$(theorem_post "/orchestrate/prepare/" "$prepare_body" 2>/dev/null)
if [ -z "$artifact_response" ] || ! echo "$artifact_response" | jq empty 2>/dev/null; then
  theorem_warn "orchestrate.prepare returned empty or non-JSON; passing prompt through"
  printf '{"continue":true}\n'
  exit 0
fi

# Synthesize a Context Brief from the structured response.
# The endpoint returns a planning artifact (decision + memory contract +
# recall + report), not a pre-rendered markdown body, so we render it here.
artifact_body=$(echo "$artifact_response" | jq -r '
  def safe_arr(p): (p // []) | map(tostring);
  def list_or_dash(arr): if arr == [] then "(none)" else (arr | map("- " + .) | join("\n")) end;

  [
    "## Theorem Context Brief",
    "",
    "**Task:** " + (.decision.task // ""),
    "**Signature:** `" + (.decision.task_signature // "(none)") + "`",
    "**Profile:** " + (.decision.selected_profile_id // "(default)"),
    "",
    "### Read first",
    list_or_dash(safe_arr(.memory_recall.read_first)),
    "",
    "### Risks",
    list_or_dash(safe_arr(.memory_recall.risks)),
    "",
    "### Do not",
    list_or_dash(safe_arr(.memory_recall.do_not)),
    "",
    "### Next actions",
    list_or_dash(safe_arr(.report.next_actions)),
    "",
    "### Selected tools and rationale",
    (
      if (.decision.why_selected // {}) == {} then "(none)"
      else (.decision.why_selected | to_entries | map("- **" + .key + "**: " + .value) | join("\n"))
      end
    ),
    "",
    "### Token plan",
    (
      if (.decision.context_plan // {}) == {} then "(unspecified)"
      else (.decision.context_plan | to_entries | map(.key + ": " + (.value|tostring)) | join(" · "))
      end
    )
  ] | join("\n")
')

if [ -z "$artifact_body" ]; then
  theorem_warn "synthesis produced empty brief; passing prompt through"
  printf '{"continue":true}\n'
  exit 0
fi

# Append baseline orchestration profile postures (engineers-mindset +
# concise-action). Both are registry-level defaults, on for every run unless
# the user explicitly opts out. Specs live in references/ENGINEERS_MINDSET.md
# and references/CONCISE_ACTION.md. The block here is the short form: deferral
# rules + output shape, kept compact so it does not bloat the brief.
posture_block=$(cat <<'POSTURE'


### Engineering posture (engineers-mindset)
- Search internal first (codebase map, tests, traces, prior runs, ADRs).
- Search external if reality may live outside the repo (GitHub > SO > docs > web).
- Run one bounded reversible experiment before declaring blocked.
- Pick the safest useful default unless a true blocker exists.
- Two bugs in the same module = stop and ask "right layer?" before patch 3.
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

# The task signature is the closest thing to an immutable artifact id for a
# planning prepare; use it as the artifact identifier in the audit trail.
artifact_id=$(echo "$artifact_response" | jq -r '.decision.task_signature // ""')

# Persist audit-trail bundle.
runs_dir="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}"
mkdir -p "$runs_dir"
echo "$artifact_response" > "$runs_dir/last-artifact.json"
echo "$artifact_body" > "$runs_dir/last-artifact.md"
echo "$artifact_response" | jq '.action_rail // {}' > "$runs_dir/last-action-rail.json"
ln -sf "$runs_dir/last-artifact.md" "$THEOREM_STATE_DIR/current-context.md" 2>/dev/null || true
ln -sf "$runs_dir/last-artifact.json" "$THEOREM_STATE_DIR/current-artifact.json" 2>/dev/null || true
ln -sf "$runs_dir/last-action-rail.json" "$THEOREM_STATE_DIR/current-action-rail.json" 2>/dev/null || true

# Mark the artifact as injected on the run timeline. ContextInjectedRequest
# accepts artifact_id, adapter, target. Skip if we don't have an artifact id.
if [ -n "$artifact_id" ]; then
  inject_body=$(jq -n \
    --arg artifact_id "$artifact_id" \
    '{ artifact_id: $artifact_id, adapter: "claude-code", target: "cli" }')
  theorem_post "/harness/runs/${run_id}/context-injected/" "$inject_body" >/dev/null 2>&1 || true
fi

# Emit hookSpecificOutput so Claude Code prepends the brief to the user's
# prompt before the model sees it. This is the inject-first pattern.
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
