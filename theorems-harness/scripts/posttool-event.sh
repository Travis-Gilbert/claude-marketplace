#!/usr/bin/env bash
# PostToolUse hook: emit semantic event receipts to the coordination
# substrate so the OTHER agent's next session-start digest shows what
# this agent has been doing.
#
# Slice 4 of the agent-coordination-substrate plan tree. This hook is
# the admission filter for what becomes a coordination_event MemoryAtom:
# the substrate stores receipts, not transcripts. Read-only tools (Read,
# Glob, Grep), internal-state tools (TodoWrite), and noisy commands (ls,
# cat, grep, find) are silently filtered out. Edit / Write / Bash with
# high-signal command prefixes (git commit, git push, test runners,
# deploy commands) emit a compact receipt.
#
# Fails open: any error in this hook MUST NOT block tool execution. A
# missed event becomes a missed digest entry next turn (recoverable);
# blocking the tool would break the user's session (unrecoverable).

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

# Failures past this point must never propagate — emit {"continue":true}
# and exit 0 on any error so the tool execution always succeeds.
trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
actor="${THEOREM_ACTOR:-$(theorem_host)}"

tool_name=$(echo "$input" | jq -r '
  if (.tool | type) == "object" then (.tool.name // "")
  elif (.tool | type) == "string" then .tool
  else (.tool_name // .name // "")
  end
' 2>/dev/null || echo "")
[[ -z "$tool_name" ]] && { printf '{"continue":true}\n'; exit 0; }

# Repo context for room inference (matches SessionStart hook).
cwd=$(theorem_jq "$input" '.cwd')
[[ -z "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
repo_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")
repo_label=$(basename "$repo_root")
branch=""
if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || printf '')
fi

# Admission filter: classify the tool call into (event_type, payload).
# Mirrors apps/orchestrate/runtime/coordination.py classify_tool_call_to_event
# server-side helper. Keeping the client-side classifier here lets the
# hook short-circuit (zero network call) on filtered-out tools.
event_type=""
event_payload="{}"
canonical_tool="$tool_name"
case "$tool_name" in
  exec_command|functions.exec_command)
    canonical_tool="Bash"
    ;;
  apply_patch|functions.apply_patch)
    canonical_tool="Patch"
    ;;
esac

case "$canonical_tool" in
  Edit)
    file_path=$(echo "$input" | jq -r '.tool_input.file_path // .input.file_path // .arguments.file_path // empty' 2>/dev/null || echo "")
    if [[ -n "$file_path" ]]; then
      event_type="file.edit"
      replace_all=$(echo "$input" | jq -r '.tool_input.replace_all // .input.replace_all // .arguments.replace_all // false' 2>/dev/null || echo "false")
      event_payload=$(jq -n --arg path "$file_path" --argjson replace_all "${replace_all:-false}" '{path: $path, replace_all: $replace_all}')
    fi
    ;;
  Write)
    file_path=$(echo "$input" | jq -r '.tool_input.file_path // .input.file_path // .arguments.file_path // empty' 2>/dev/null || echo "")
    if [[ -n "$file_path" ]]; then
      event_type="file.write"
      content=$(echo "$input" | jq -r '.tool_input.content // .input.content // .arguments.content // empty' 2>/dev/null || echo "")
      content_bytes=${#content}
      content_lines=$(printf '%s' "$content" | grep -c '' 2>/dev/null || echo 0)
      event_payload=$(jq -n \
        --arg path "$file_path" \
        --argjson bytes "$content_bytes" \
        --argjson lines "$content_lines" \
        '{path: $path, bytes: $bytes, lines: $lines}')
    fi
    ;;
  Patch)
    patch_text=$(echo "$input" | jq -r '.tool_input.patch // .input.patch // .arguments.patch // .tool_input // .input // .arguments // empty' 2>/dev/null || echo "")
    if [[ -n "$patch_text" ]]; then
      touched_paths=$(
        printf '%s\n' "$patch_text" \
          | awk '/^\*\*\* (Update|Add|Delete) File: / { sub(/^\*\*\* (Update|Add|Delete) File: /, ""); print }' \
          | jq -R . | jq -s '.[0:20]'
      ) || touched_paths='[]'
      patch_bytes=${#patch_text}
      event_type="file.patch"
      event_payload=$(jq -n \
        --argjson paths "$touched_paths" \
        --argjson bytes "$patch_bytes" \
        '{paths: $paths, bytes: $bytes}')
    fi
    ;;
  Bash)
    command=$(echo "$input" | jq -r '.tool_input.command // .tool_input.cmd // .input.command // .input.cmd // .arguments.command // .arguments.cmd // empty' 2>/dev/null || echo "")
    if [[ -n "$command" ]]; then
      # Truncate the command for the payload — we want a receipt, not
      # a transcript. Match the BASH_COMMAND_PREFIXES_ADMITTED allowlist
      # from coordination.py.
      truncated="${command:0:200}"
      case "$command" in
        "git commit"*)
          event_type="commit"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "git push"*)
          event_type="push"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "git merge"*|"git rebase"*)
          event_type="command"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "pytest"*|"npm test"*|"pnpm test"*|"yarn test"*|"cargo test"*|"python manage.py test"*|"python3 manage.py test"*)
          event_type="test.run"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "cargo build"*|"cargo check"*|"python manage.py migrate"*|"python3 manage.py migrate"*)
          event_type="command"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "railway up"*|"railway deploy"*|"fly deploy"*|"vercel deploy"*)
          event_type="deploy"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        "docker build"*|"docker push"*)
          event_type="command"
          event_payload=$(jq -n --arg c "$truncated" '{command: $c}')
          ;;
        *)
          # Bash command not on the allowlist; filter out.
          :
          ;;
      esac
    fi
    ;;
  *)
    # All other tool names (Read, Glob, Grep, TodoWrite, etc.) filter
    # out by absence here. Adding a new admitted tool means adding a
    # case above AND updating classify_tool_call_to_event in
    # apps/orchestrate/runtime/coordination.py to match.
    :
    ;;
esac

if [[ -z "$event_type" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

event_body=$(jq -n \
  --arg actor "$actor" \
  --arg event_type "$event_type" \
  --argjson payload "$event_payload" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  '{
    actor: $actor,
    event_type: $event_type,
    payload: $payload,
    repo: $repo,
    branch: $branch
  }')

# Fire-and-forget POST. We do NOT block the tool result on substrate
# write success; this is a coordination receipt, not a transaction.
theorem_post "/harness/coordination/event/" "$event_body" "$sid" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
