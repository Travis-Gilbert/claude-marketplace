#!/usr/bin/env bash
# Stop hook: repository hygiene pass. This is intentionally local-first: it
# always writes a receipt under .theorem/review, then best-effort appends to the
# harness run when a run binding exists.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

cleanup() {
  for f in ${tmp_files:-}; do
    [ -n "$f" ] && [ -f "$f" ] && rm -f "$f"
  done
}
finish() {
  cleanup
  printf '{"continue":true,"suppressOutput":true}\n'
}
trap cleanup EXIT

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

tmp_files=""
new_tmp() {
  local f
  f=$(mktemp)
  tmp_files="${tmp_files} ${f}"
  printf '%s' "$f"
}

input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
repo_root=$(theorem_repo_root "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
sid=$(theorem_session_id "$input")
run_id=$(theorem_run_id "$sid" 2>/dev/null || true)
actor="${THEOREM_ACTOR:-$(theorem_host)}"
mode="${THEOREM_REVIEW_MODE:-${THEOREM_REPO_HYGIENE_MODE:-advisory}}"
review_dir=$(theorem_review_dir "$repo_root")
reports_file=$(new_tmp)

append_report() {
  local checker="$1"
  local status="$2"
  local severity="$3"
  local message="$4"
  local command_text="$5"
  local exit_code="$6"
  local output="$7"
  jq -c -n \
    --arg checker "$checker" \
    --arg status "$status" \
    --arg severity "$severity" \
    --arg message "$message" \
    --arg command "$command_text" \
    --arg output "$output" \
    --argjson exit_code "$exit_code" \
    '{
      checker: $checker,
      status: $status,
      severity: $severity,
      message: $message,
      command: $command,
      exit_code: $exit_code,
      output: $output
    }' >> "$reports_file"
}

run_shell_check() {
  local checker="$1"
  local severity="$2"
  local pass_message="$3"
  local fail_message="$4"
  local command_text="$5"
  local output code status message
  set +e
  output=$(cd "$repo_root" && /bin/bash -lc "$command_text" 2>&1)
  code=$?
  set -u
  output=$(printf '%s' "$output" | head -c 12000)
  if [ "$code" -eq 0 ]; then
    status="passed"
    message="$pass_message"
  else
    status="failed"
    message="$fail_message"
  fi
  append_report "$checker" "$status" "$severity" "$message" "$command_text" "$code" "$output"
}

if ! git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  receipt=$(jq -n \
    --arg timestamp "$(theorem_now_iso)" \
    --arg mode "$mode" \
    --arg repo_root "$repo_root" \
    '{
      kind: "repo_hygiene_receipt",
      timestamp: $timestamp,
      mode: $mode,
      repo_root: $repo_root,
      status: "skipped",
      reason: "not a git worktree",
      reports: []
    }')
  printf '%s\n' "$receipt" > "$review_dir/latest-repo-hygiene.json" 2>/dev/null || true
  printf '{"continue":true,"suppressOutput":true}\n'
  exit 0
fi

status_output=$(git -C "$repo_root" status --short --branch -- . ':!.theorem' ':!.harness' 2>&1 || true)
status_body=$(printf '%s\n' "$status_output" | sed '1{/^## /d;}')
if [ -n "${status_body//[[:space:]]/}" ]; then
  append_report "git_status" "warning" "medium" "Worktree has uncommitted changes outside hook-local state." "git status --short --branch" 0 "$(printf '%s' "$status_output" | head -c 12000)"
else
  append_report "git_status" "passed" "info" "Worktree is clean outside hook-local state." "git status --short --branch" 0 "$(printf '%s' "$status_output" | head -c 12000)"
fi

run_shell_check "diff_check_unstaged" "error" \
  "No whitespace or patch hygiene errors in unstaged changes." \
  "Unstaged changes contain whitespace or patch hygiene errors." \
  "git diff --check -- . ':!.theorem' ':!.harness'"

run_shell_check "diff_check_staged" "error" \
  "No whitespace or patch hygiene errors in staged changes." \
  "Staged changes contain whitespace or patch hygiene errors." \
  "git diff --cached --check -- . ':!.theorem' ':!.harness'"

set +e
conflict_output=$(git -C "$repo_root" grep --untracked -n -I -E '^(<<<<<<< .+|=======|>>>>>>> .+)$' -- . ':!.git' ':!.theorem' ':!.harness' ':!node_modules' ':!target' ':!dist' ':!build' ':!coverage' ':!package-lock.json' ':!pnpm-lock.yaml' ':!yarn.lock' 2>&1)
conflict_code=$?
set -u
conflict_output=$(printf '%s' "$conflict_output" | head -c 12000)
if [ "$conflict_code" -eq 0 ]; then
  append_report "conflict_markers" "failed" "critical" "Conflict markers are present in the worktree." "git grep --untracked conflict markers" "$conflict_code" "$conflict_output"
elif [ "$conflict_code" -eq 1 ]; then
  append_report "conflict_markers" "passed" "info" "No conflict markers found." "git grep --untracked conflict markers" "$conflict_code" ""
else
  append_report "conflict_markers" "warning" "medium" "Conflict marker scan could not complete." "git grep --untracked conflict markers" "$conflict_code" "$conflict_output"
fi

suspicious_tmp=$(new_tmp)
secret_tmp=$(new_tmp)
large_tmp=$(new_tmp)
while IFS= read -r -d '' path; do
  [ -n "$path" ] || continue
  case "$path" in
    .theorem/*|.harness/*|node_modules/*|target/*)
      continue
      ;;
  esac
  lower=$(printf '%s' "$path" | tr '[:upper:]' '[:lower:]')
  case "$lower" in
    .env.example|*.env.example|*.example.env|*.sample|*.template)
      ;;
    .env|.env.*|*.pem|*.key|*id_rsa*|*id_ed25519*|*.p12|*.pfx)
      printf '%s\n' "$path" >> "$secret_tmp"
      ;;
  esac
  case "$lower" in
    .ds_store|*.log|*.jsonl|*.sqlite|*.sqlite3|*.db|.vercel/*|coverage/*|dist/*|build/*)
      printf '%s\n' "$path" >> "$suspicious_tmp"
      ;;
  esac
  if [ -f "$repo_root/$path" ]; then
    size=$(wc -c < "$repo_root/$path" 2>/dev/null | tr -d ' ' || printf '0')
    case "$size" in
      ''|*[!0-9]*) size=0 ;;
    esac
    if [ "$size" -gt "${THEOREM_REPO_HYGIENE_LARGE_FILE_BYTES:-5242880}" ]; then
      printf '%s (%s bytes)\n' "$path" "$size" >> "$large_tmp"
    fi
  fi
done < <(git -C "$repo_root" ls-files --others --exclude-standard -z 2>/dev/null || true)

if [ -s "$secret_tmp" ]; then
  append_report "untracked_secrets" "failed" "critical" "Untracked secret-like files are present." "git ls-files --others --exclude-standard" 1 "$(head -n 30 "$secret_tmp")"
else
  append_report "untracked_secrets" "passed" "info" "No untracked secret-like files found." "git ls-files --others --exclude-standard" 0 ""
fi

if [ -s "$suspicious_tmp" ]; then
  append_report "untracked_artifacts" "warning" "medium" "Untracked generated or local artifacts are present." "git ls-files --others --exclude-standard" 0 "$(head -n 40 "$suspicious_tmp")"
else
  append_report "untracked_artifacts" "passed" "info" "No suspicious untracked artifacts found." "git ls-files --others --exclude-standard" 0 ""
fi

if [ -s "$large_tmp" ]; then
  append_report "large_untracked_files" "warning" "medium" "Large untracked files are present." "git ls-files --others --exclude-standard" 0 "$(head -n 30 "$large_tmp")"
else
  append_report "large_untracked_files" "passed" "info" "No large untracked files found." "git ls-files --others --exclude-standard" 0 ""
fi

tracked_tmp=$(new_tmp)
while IFS= read -r -d '' path; do
  lower=$(printf '%s' "$path" | tr '[:upper:]' '[:lower:]')
  case "$lower" in
    .env|.env.*|*.pem|*.key|*id_rsa*|*id_ed25519*|*.p12|*.pfx|*.sqlite|*.sqlite3|*.db|*.log)
      case "$lower" in
        .env.example|*.env.example|*.example.env|*.sample|*.template) ;;
        *) printf '%s\n' "$path" >> "$tracked_tmp" ;;
      esac
      ;;
  esac
done < <(git -C "$repo_root" ls-files -z 2>/dev/null || true)
if [ -s "$tracked_tmp" ]; then
  append_report "tracked_sensitive_artifacts" "failed" "critical" "Tracked secret-like, database, or log artifacts are present." "git ls-files" 1 "$(head -n 30 "$tracked_tmp")"
else
  append_report "tracked_sensitive_artifacts" "passed" "info" "No tracked secret-like, database, or log artifacts found." "git ls-files" 0 ""
fi

if [ -x "$repo_root/scripts/check-doc-drift.sh" ]; then
  set +e
  doc_output=$(cd "$repo_root" && scripts/check-doc-drift.sh --new-only 2>&1)
  doc_code=$?
  set -u
  doc_output=$(printf '%s' "$doc_output" | head -c 12000)
  if printf '%s' "$doc_output" | grep -q 'DOC DRIFT:'; then
    append_report "doc_drift" "failed" "error" "Repository doc map has new undocumented directories." "scripts/check-doc-drift.sh --new-only" "$doc_code" "$doc_output"
  elif [ "$doc_code" -eq 0 ]; then
    append_report "doc_drift" "passed" "info" "Repository doc drift check is clean." "scripts/check-doc-drift.sh --new-only" "$doc_code" "$doc_output"
  else
    append_report "doc_drift" "warning" "medium" "Repository doc drift check returned a non-zero status." "scripts/check-doc-drift.sh --new-only" "$doc_code" "$doc_output"
  fi
fi

reports=$(jq -s -c '.' "$reports_file" 2>/dev/null || printf '[]')
failed_count=$(printf '%s' "$reports" | jq '[.[] | select(.status == "failed")] | length')
warning_count=$(printf '%s' "$reports" | jq '[.[] | select(.status == "warning")] | length')
hard_axis_failed=false
if printf '%s' "$reports" | jq -e '.[] | select(.status == "failed" and (.severity == "error" or .severity == "critical"))' >/dev/null; then
  hard_axis_failed=true
fi

receipt=$(jq -n \
  --arg kind "repo_hygiene_receipt" \
  --arg timestamp "$(theorem_now_iso)" \
  --arg repo_root "$repo_root" \
  --arg branch "$(theorem_git_branch "$repo_root")" \
  --arg head "$(theorem_git_head "$repo_root")" \
  --arg mode "$mode" \
  --argjson failed_count "$failed_count" \
  --argjson warning_count "$warning_count" \
  --argjson hard_axis_failed "$hard_axis_failed" \
  --argjson reports "$reports" \
  '{
    kind: $kind,
    timestamp: $timestamp,
    repo_root: $repo_root,
    branch: $branch,
    commit_sha: $head,
    mode: $mode,
    failed_count: $failed_count,
    warning_count: $warning_count,
    hard_axis_failed: $hard_axis_failed,
    reports: $reports
  }')

stamp=$(theorem_now_stamp)
receipt_file="$review_dir/repo-hygiene-${stamp}.json"
printf '%s\n' "$receipt" > "$receipt_file" 2>/dev/null || true
printf '%s\n' "$receipt" > "$review_dir/latest-repo-hygiene.json" 2>/dev/null || true

if [ -n "$run_id" ]; then
  payload=$(jq -n --argjson receipt "$receipt" '{
    event_subtype: "repo_hygiene_receipt",
    boundary: "repo_stop",
    repo_hygiene_receipts: [$receipt]
  }')
  receipt_hash=$(printf '%s' "$receipt" | shasum -a 256 | awk '{print $1}')
  append_args=$(jq -n \
    --arg run_id "$run_id" \
    --arg actor "$actor" \
    --arg key "repo_hygiene_receipt:${run_id}:${receipt_hash}" \
    --argjson payload "$payload" \
    '{
      run_id: $run_id,
      event_type: "SESSION.EVENT_RECORDED",
      actor: $actor,
      idempotency_key: $key,
      payload: $payload
    }')
  (theorem_native_call "harness_append_transition" "$append_args" >/dev/null 2>&1 || true) &
fi

if [ "$hard_axis_failed" = "true" ] && [ "$mode" = "enforce" ]; then
  reason=$(printf '%s' "$reports" | jq -r '
    [.[] | select(.status == "failed") | "- " + .checker + ": " + .message + (if (.output // "") != "" then "\n" + (.output | split("\n")[0:8] | join("\n")) else "" end)][0:5] | join("\n")
  ')
  jq -n --arg reason "Repo hygiene failed:\n${reason}" '{continue: false, decision: "block", reason: $reason}'
  exit 0
fi

if [ "$hard_axis_failed" = "true" ] || { [ "$warning_count" -gt 0 ] && [ "$mode" = "advisory" ]; }; then
  context=$(printf '%s' "$reports" | jq -r '
    [.[] | select(.status == "failed" or .status == "warning") | "- " + .checker + " [" + .severity + "]: " + .message + (if (.output // "") != "" then "\n  " + ((.output | split("\n")[0:3] | join("\n  "))) else "" end)][0:6] | join("\n")
  ')
  if [ -n "$context" ]; then
    jq -n --arg ctx "## Repo hygiene review\n${context}" '{
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
