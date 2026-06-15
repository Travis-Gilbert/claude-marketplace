#!/usr/bin/env bash
# SessionStart hook. Begins a native harness run for the current host session.
# Fails open: if the native MCP is unreachable, the session continues.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true,\"suppressOutput\":true}\n"; exit 0' ERR

theorem_require_jq || exit 0

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
actor="${THEOREM_ACTOR:-$(theorem_host)}"
repo_root=$(theorem_repo_root "$input")
repo_label=$(theorem_repo_label "$repo_root")
branch=$(theorem_git_branch "$repo_root")
head_sha=$(theorem_git_head "$repo_root")

existing=$(theorem_run_id "$sid")
if [ -n "$existing" ]; then
  theorem_log "session $sid already has run $existing; reusing"
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

run_id="run:${sid//[\/:]/_}"
payload=$(jq -n \
  --arg sid "$sid" \
  --arg cwd "$cwd" \
  --arg actor "$actor" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg head "$head_sha" \
  '{
    actor: $actor,
    task: ($actor + " session"),
    scope: {
      task_type: "session",
      external_session_id: $sid,
      cwd: $cwd,
      repo: $repo,
      branch: $branch,
      commit_sha: $head,
      permissions: ["graph_read", "code_read", "web_browse"]
    }
  }')

theorem_append_transition "$run_id" "RUN.CREATED" "$actor" "$payload" "session-start:$sid" >/dev/null || {
  theorem_warn "native harness.begin failed; continuing without run binding"
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
}

theorem_set_run_id "$sid" "$run_id"
theorem_log "began run $run_id for session $sid"

printf '{"continue":true,"suppressOutput":true}\n'
