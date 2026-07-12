#!/usr/bin/env bash
# UserPromptSubmit hook: create the local checklist contract from a handoff or
# enumerated deliverable list, then mirror it into native coordination records.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
prompt=$(theorem_jq "$input" '.prompt')
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
actor="${THEOREM_ACTOR:-$(theorem_host)}"
repo_root=$(theorem_repo_root "$input")
repo_label=$(theorem_repo_label "$repo_root")
branch=$(theorem_git_branch "$repo_root")

if ! printf '%s' "$prompt" | grep -Eiq 'handoff|deliverable|acceptance|build|implement|integrat(e|ion)|ship|publish|plan|spec'; then
  printf '{"continue":true}\n'
  exit 0
fi

source_file=$(mktemp)
trap 'rm -f "$source_file"; printf "{\"continue\":true}\n"; exit 0' ERR
printf '%s\n' "$prompt" > "$source_file"

while IFS= read -r path; do
  path=${path%%[),.;:]}
  if [ -r "$path" ]; then
    {
      printf '\n\n'
      sed -n '1,500p' "$path"
    } >> "$source_file"
  fi
done < <(printf '%s\n' "$prompt" | grep -Eo '/[^[:space:])"]+\.md' | sort -u || true)

items_json=$(
  awk '
    function trim(value) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      return value
    }
    function flush() {
      if (title != "") {
        print id "\t" trim(title) "\t" trim(acceptance)
      }
    }
    /^### [0-9]+\.[[:space:]]/ {
      flush()
      count += 1
      id = sprintf("HH-%03d", count)
      title = $0
      sub(/^### [0-9]+\.[[:space:]]*/, "", title)
      acceptance = ""
      in_acceptance = 0
      next
    }
    /^Acceptance:[[:space:]]*/ && id != "" {
      line = $0
      sub(/^Acceptance:[[:space:]]*/, "", line)
      acceptance = line
      in_acceptance = 1
      next
    }
    in_acceptance && /^$/ {
      in_acceptance = 0
      next
    }
    in_acceptance && id != "" {
      acceptance = acceptance " " $0
      next
    }
    END { flush() }
  ' "$source_file" \
    | jq -R -s '
      split("\n")
      | map(select(length > 0))
      | map(split("\t"))
      | map({
          id: .[0],
          deliverable: .[1],
          acceptance_criterion: ((.[2] // "") as $a | if $a == "" then "Verify this deliverable against the handoff acceptance criterion." else $a end),
          status: "open",
          verification: null,
          deferral_reason: ""
        })
    '
)

item_count=$(printf '%s' "$items_json" | jq 'length')
if [ "$item_count" = "0" ]; then
  rm -f "$source_file"
  printf '{"continue":true}\n'
  exit 0
fi

source_hash=$(shasum -a 256 "$source_file" | awk '{print $1}')
created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
session_id=$(theorem_session_id "$input")
plan_id=$(theorem_plan_id "$input")
plan_slug=$(theorem_jq "$input" '.plan_slug // .planSlug // .checklist_slug // .checklistSlug')
if [ -z "$plan_slug" ]; then
  plan_slug=$(printf '%s' "$prompt" | sed -n '/[^[:space:]]/ { s/^[#[:space:]]*//; p; q; }')
fi
checklist_file=$(theorem_named_checklist_path "$cwd" "$plan_slug" "$plan_id" "$source_hash")
mkdir -p "$cwd/.harness/checklists"

checklist_json=$(jq -n \
  --arg created_at "$created_at" \
  --arg task "$prompt" \
  --arg source_hash "$source_hash" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg session_id "$session_id" \
  --arg plan_id "$plan_id" \
  --arg plan_slug "$(theorem_checklist_slug "$plan_slug")" \
  --argjson items "$items_json" \
  '{
    schema_version: 1,
    source: "theorems-harness hook checklist-contract",
    created_at: $created_at,
    task: $task,
    source_hash: $source_hash,
    repo: $repo,
    branch: $branch,
    session_id: $session_id,
    plan_id: $plan_id,
    plan_slug: $plan_slug,
    projection: {
      kind: "plan_checklist",
      plan_bound: ($plan_id != ""),
      canonical_source: (if $plan_id == "" then "handoff source" else "native plan substrate" end)
    },
    items: $items
  }')
checklist_tmp="$checklist_file.tmp.$$"
printf '%s\n' "$checklist_json" > "$checklist_tmp"
mv "$checklist_tmp" "$checklist_file"
theorem_bind_checklist "$cwd" "$session_id" "$checklist_file" "$plan_id"

record_args=$(jq -n \
  --arg actor "$actor" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg path "$checklist_file" \
  --argjson checklist "$checklist_json" \
  '{
    actor: $actor,
    record_type: "decision",
    title: "Checklist contract emitted",
    summary: ("Checklist contract emitted at " + $path),
    metadata: {
      repo: $repo,
      branch: $branch,
      path: $path,
      checklist: $checklist
    }
  }')
(theorem_native_call "coordination_record" "$record_args" >/dev/null 2>&1 || true) &

rm -f "$source_file"

context=$(printf '## Harness checklist contract\nCreated `%s` with %s open deliverables. Complete each item with verification evidence or a concrete deferral reason before reporting done.' "$checklist_file" "$item_count")
jq -n \
  --arg ctx "$context" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: $ctx
    }
  }'
