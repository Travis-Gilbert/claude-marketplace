#!/usr/bin/env bash
# Generate a small, local peer-review packet and optionally notify the target
# agent through the harness coordination endpoint. The packet points reviewers
# at the live working tree instead of embedding a huge patch in chat.

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib.sh"

usage() {
  cat <<'EOF'
Usage: peer-review-request.sh [options]

Options:
  --actor ACTOR       Actor requesting review. Defaults to host actor.
  --target ACTOR      Peer actor to mention. Defaults to the other main agent.
  --cwd PATH          Git working tree path. Defaults to current directory.
  --base REF          Base ref/commit for committed diff. Defaults to upstream merge-base or HEAD.
  --title TEXT        Review packet title.
  --no-coordinate     Only write the packet; do not call the coordination endpoint.
  -h, --help          Show this help.
EOF
}

actor="${THEOREM_PEER_REVIEW_ACTOR:-$(theorem_host)}"
target="${THEOREM_PEER_REVIEW_TARGET:-}"
cwd="${PWD}"
base_ref="${THEOREM_PEER_REVIEW_BASE:-}"
title="${THEOREM_PEER_REVIEW_TITLE:-Peer review before commit}"
coordinate_enabled="true"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --actor)
      actor="${2:?--actor requires a value}"
      shift 2
      ;;
    --target)
      target="${2:?--target requires a value}"
      shift 2
      ;;
    --cwd)
      cwd="${2:?--cwd requires a value}"
      shift 2
      ;;
    --base)
      base_ref="${2:?--base requires a value}"
      shift 2
      ;;
    --title)
      title="${2:?--title requires a value}"
      shift 2
      ;;
    --no-coordinate)
      coordinate_enabled="false"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$target" ]]; then
  case "$actor" in
    codex) target="claude-code" ;;
    claude-code) target="codex" ;;
    *) target="claude-code" ;;
  esac
fi

if ! git -C "$cwd" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'peer-review-request: not inside a git working tree: %s\n' "$cwd" >&2
  exit 1
fi

repo_root="$(git -C "$cwd" rev-parse --show-toplevel)"
branch="$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'unknown')"
upstream="$(git -C "$repo_root" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"

if [[ -z "$base_ref" ]]; then
  if [[ -n "$upstream" ]]; then
    base_ref="$(git -C "$repo_root" merge-base HEAD "$upstream" 2>/dev/null || true)"
  fi
  if [[ -z "$base_ref" ]]; then
    base_ref="$(git -C "$repo_root" rev-parse HEAD)"
  fi
fi

state_dir="$(theorem_init_state_dir "$repo_root")"
packet_dir="${state_dir}/peer-review"
mkdir -p "$packet_dir"

timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
safe_actor="${actor//[^A-Za-z0-9_.-]/-}"
safe_target="${target//[^A-Za-z0-9_.-]/-}"
packet_path="${packet_dir}/${timestamp}-${safe_actor}-to-${safe_target}.md"

append_command_output() {
  local heading="$1"
  shift
  {
    printf '\n## %s\n\n' "$heading"
    printf '```text\n'
    "$@" 2>&1 || true
    printf '```\n'
  } >> "$packet_path"
}

{
  printf '# Peer Review Packet: %s\n\n' "$title"
  printf '## Request\n\n'
  printf -- '- From: `%s`\n' "$actor"
  printf -- '- To: `@%s`\n' "$target"
  printf -- '- Repo: `%s`\n' "$repo_root"
  printf -- '- Branch: `%s`\n' "$branch"
  printf -- '- Upstream: `%s`\n' "${upstream:-none}"
  printf -- '- Base: `%s`\n' "$base_ref"
  printf -- '- Created: `%s`\n' "$timestamp"
  printf '\n## Review Prompt\n\n'
  printf 'Review this working tree before commit or launch-ready reporting. Lead with correctness findings, cite file and line where possible, then list validation gaps and performance or maintainability notes. Do not make broad rewrite suggestions unless they protect the stated launch goal.\n'
  printf '\n## Suggested Inspection Commands\n\n'
  printf '```bash\n'
  printf 'cd %q\n' "$repo_root"
  printf 'git status --short --branch\n'
  printf 'git diff --stat %q...HEAD\n' "$base_ref"
  printf 'git diff --stat\n'
  printf 'git diff --cached --stat\n'
  printf 'git diff --name-status %q...HEAD\n' "$base_ref"
  printf 'git diff --name-status\n'
  printf '```\n'
} > "$packet_path"

append_command_output "Git Status" git -C "$repo_root" status --short --branch
append_command_output "Changed Files Against Base" git -C "$repo_root" diff --name-status "${base_ref}...HEAD"
append_command_output "Staged Files" git -C "$repo_root" diff --cached --name-status
append_command_output "Unstaged Files" git -C "$repo_root" diff --name-status
append_command_output "Committed Diff Stat Against Base" git -C "$repo_root" diff --stat "${base_ref}...HEAD"
append_command_output "Staged Diff Stat" git -C "$repo_root" diff --cached --stat
append_command_output "Unstaged Diff Stat" git -C "$repo_root" diff --stat

coordinate_status="skipped"
if [[ "$coordinate_enabled" == "true" ]]; then
  if theorem_require_jq >/dev/null 2>&1; then
    message="@${target} Peer review requested by @${actor}. Packet: ${packet_path}. Please review the live working tree before commit or launch-ready reporting."
    body="$(jq -n \
      --arg message "$message" \
      --arg urgency "ask" \
      --arg repo "$repo_root" \
      --arg branch "$branch" \
      --arg base "$base_ref" \
      --arg packet "$packet_path" \
      --arg actor "$actor" \
      --arg target "$target" \
      '{
        actor: $actor,
        message: $message,
        urgency: $urgency,
        mentions: (if $target != "" then [$target] else [] end),
        metadata: {
          repo: $repo,
          branch: $branch,
          base: $base,
          packet: $packet,
          actor: $actor,
          target: $target,
          review_type: "peer-review"
        }
      }')"
    (theorem_native_call "coordinate" "$body" >/dev/null 2>&1 || true) &
    coordinate_status="sent"
  else
    coordinate_status="skipped-jq-missing"
  fi
fi

printf 'Peer review packet: %s\n' "$packet_path"
printf 'Requester: @%s\n' "$actor"
printf 'Target: @%s\n' "$target"
printf 'Base: %s\n' "$base_ref"
printf 'Coordinate message: %s\n' "$coordinate_status"
