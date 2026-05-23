#!/usr/bin/env bash
# SessionStart hook. Begins a new harness run for the current host session.
# Stashes the run_id in the per-session state file so subsequent hooks can read it.
# Fails open: backend unreachable means we still let the session continue.

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || exit 0

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
actor=$(theorem_host)

# If we already have a run for this session, don't begin a new one.
existing=$(theorem_run_id "$sid")
if [ -n "$existing" ]; then
  theorem_log "session $sid already has run $existing; reusing"
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

body=$(jq -n \
  --arg sid "$sid" \
  --arg cwd "$cwd" \
  --arg actor "$actor" \
  '{
    actor: $actor,
    task: ($actor + " session"),
    scope: {
      task_type: "session",
      external_session_id: $sid,
      cwd: $cwd,
      permissions: ["graph_read", "code_read", "web_browse"]
    }
  }')

response=$(theorem_post "/harness/runs/" "$body" 2>/dev/null) || {
  theorem_warn "harness.begin failed; continuing without run binding"
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
}

run_id=$(echo "$response" | jq -r '.run.run_id // .run_id // empty')
if [ -z "$run_id" ]; then
  theorem_warn "harness.begin response missing run_id; continuing without run binding"
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

theorem_set_run_id "$sid" "$run_id"
theorem_log "began run $run_id for session $sid"

printf '{"continue":true,"suppressOutput":true}\n'
