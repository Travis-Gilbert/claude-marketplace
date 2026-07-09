#!/usr/bin/env bash
# Stop hook: the code-KG memory loop (AM10). Batch record_use_receipt for the
# node_ids the context packs offered this session: outcome `useful` when the
# session actually edited files (the agent engaged the neighborhood), else a
# low-weight `ignore`. Capability fitness consumes these receipts so the graph
# learns which neighborhoods matter per task type. Fails open.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }
[ -n "$(theorem_tenant)" ] || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
repo_root=$(theorem_repo_root "$input")
harness_dir=$(theorem_harness_dir "$repo_root")
offered="$harness_dir/offered-nodes.jsonl"
manifest="$harness_dir/code-kg-manifest.json"

[ -f "$offered" ] || { printf '{"continue":true}\n'; exit 0; }
repo_id=""
[ -f "$manifest" ] && repo_id=$(jq -r '.repo_id // empty' "$manifest" 2>/dev/null)
[ -n "$repo_id" ] || { printf '{"continue":true}\n'; exit 0; }

# Distinct node ids offered across this session's packs.
offered_ids=$(jq -r '.[]?' "$offered" 2>/dev/null | sort -u)
[ -n "$offered_ids" ] || { printf '{"continue":true}\n'; exit 0; }

# Did the agent act on the repo this session (uncommitted edits as the proxy)?
touched=$(git -C "$repo_root" status --porcelain 2>/dev/null | awk '{print $NF}')
outcome="ignore"
[ -n "$touched" ] && outcome="useful"

count=0
while IFS= read -r nid; do
  [ -n "$nid" ] || continue
  recv=$(jq -n --arg repo "$repo_id" --arg node "$nid" --arg out "$outcome" \
    '{repo_id: $repo, node_id: $node, action: "context_pack", outcome: $out}')
  (theorem_code_call "record_use_receipt" "$recv" >/dev/null 2>&1 || true) &
  count=$((count + 1))
  [ "$count" -ge 50 ] && break
done <<< "$offered_ids"

theorem_log "code-use-receipt: $count nodes recorded (outcome=$outcome)"
: > "$offered" 2>/dev/null || true   # clear for the next session
printf '{"continue":true}\n'
exit 0
