#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugin=${1:-}
[[ -n "$plugin" && $# -eq 1 ]] || {
  printf 'usage: scripts/check-plugin-release-parity.sh PLUGIN\n' >&2
  exit 2
}

readonly PLUGIN_ROOT="$REPO_ROOT/$plugin"
[[ -f "$PLUGIN_ROOT/plugin.manifest.json" ]] || {
  printf 'plugin release parity failed: unknown plugin %s\n' "$plugin" >&2
  exit 1
}

fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
home="$fixture/home"
cache="$fixture/cache"
backups="$fixture/backups"
mkdir -p "$home/.claude"

local_override='http://127.0.0.1:48173/mcp'
cat >"$home/.claude/settings.json" <<JSON
{
  "sentinel": "preserve-me",
  "mcpServers": {
    "theorems-harness": {
      "type": "http",
      "url": "$local_override"
    }
  }
}
JSON
settings_before=$(shasum -a 256 "$home/.claude/settings.json" | awk '{print $1}')

python3 "$REPO_ROOT/scripts/sync-plugin-manifests.py" "$plugin" --check >/dev/null
python3 "$REPO_ROOT/scripts/validate_plugin.py" "$plugin" >/dev/null
python3 "$REPO_ROOT/scripts/plugin_release.py" inspect "$plugin" \
  --receipt "$fixture/source-receipt.json" >/dev/null

version=$(python3 -c \
  'import json,sys; print(json.load(open(sys.argv[1]))["plugin"]["version"])' \
  "$PLUGIN_ROOT/plugin.manifest.json")

HOME="$home" "$REPO_ROOT/sync-plugins.sh" \
  --preserve-user-config "$plugin" >/dev/null
HOME="$home" "$REPO_ROOT/sync-plugins.sh" \
  --preserve-user-config "$plugin" >/dev/null

settings_after=$(shasum -a 256 "$home/.claude/settings.json" | awk '{print $1}')
[[ "$settings_before" == "$settings_after" ]] || {
  printf 'plugin release parity failed: sync changed user settings\n' >&2
  exit 1
}

python3 - "$home" "$plugin" "$version" "$PLUGIN_ROOT" "$local_override" <<'PY'
import json
import os
import sys
from pathlib import Path

home, plugin, version, plugin_root, local_override = sys.argv[1:]
home = Path(home)
registry = json.loads((home / ".claude/plugins/installed_plugins.json").read_text())
key = f"{plugin}@local-desktop-app-uploads"
entry = registry["plugins"][key][0]
if entry["version"] != version:
    raise SystemExit("plugin registry version drift")
install_path = Path(entry["installPath"])
if not install_path.is_symlink() or Path(os.readlink(install_path)) != Path(plugin_root):
    raise SystemExit("plugin registry install path is not the expected source symlink")
settings = json.loads((home / ".claude/settings.json").read_text())
if settings["sentinel"] != "preserve-me":
    raise SystemExit("user settings sentinel changed")
if settings["mcpServers"][plugin]["url"] != local_override:
    raise SystemExit("local MCP override changed")
PY

python3 "$REPO_ROOT/scripts/plugin_release.py" install "$plugin" \
  "$cache/$version" --receipt "$fixture/install-receipt.json" >/dev/null
python3 "$REPO_ROOT/scripts/plugin_release.py" verify "$plugin" \
  "$cache/$version" --receipt "$fixture/cache-receipt.json" >/dev/null
python3 "$REPO_ROOT/scripts/validate_plugin.py" "$plugin" \
  --installed-cache "$cache/$version" >/dev/null

# A resync replaces stale bytes and emits a concrete backup/rollback receipt.
printf 'stale cache bytes\n' >>"$cache/$version/README.md"
printf 'retired artifact\n' >"$cache/$version/retired-interface.md"
if python3 "$REPO_ROOT/scripts/plugin_release.py" verify "$plugin" \
    "$cache/$version" >"$fixture/stale-cache.log" 2>&1; then
  printf 'plugin release parity failed: stale cache unexpectedly verified\n' >&2
  exit 1
fi
grep -Eq 'artifact (file-set|content_sha256) drift' "$fixture/stale-cache.log" || {
  printf 'plugin release parity failed: stale cache refusal was not typed\n' >&2
  exit 1
}
python3 "$REPO_ROOT/scripts/plugin_release.py" install "$plugin" \
  "$cache/$version" --backup-dir "$backups" \
  --receipt "$fixture/resync-receipt.json" >/dev/null
[[ ! -e "$cache/$version/retired-interface.md" ]] || {
  printf 'plugin release parity failed: resync retained stale artifact\n' >&2
  exit 1
}
python3 "$REPO_ROOT/scripts/plugin_release.py" verify "$plugin" \
  "$cache/$version" >/dev/null

python3 - "$fixture" "$PLUGIN_ROOT" "$cache/$version" "$plugin" "$version" "$local_override" <<'PY'
import hashlib
import json
import sys
from pathlib import Path

fixture, source, cache, plugin, version, local_override = sys.argv[1:]
fixture = Path(fixture)
source = Path(source)
cache = Path(cache)

source_receipt = json.loads((fixture / "source-receipt.json").read_text())
cache_receipt = json.loads((fixture / "cache-receipt.json").read_text())
resync_receipt = json.loads((fixture / "resync-receipt.json").read_text())
for receipt in (source_receipt, cache_receipt, resync_receipt):
    if receipt["version"] != version:
        raise SystemExit("receipt version drift")
if source_receipt["artifact_content_sha256"] != cache_receipt["artifact_content_sha256"]:
    raise SystemExit("source/cache artifact content hash drift")
if source_receipt["artifact_content_sha256"] != resync_receipt["artifact_content_sha256"]:
    raise SystemExit("source/resynced artifact content hash drift")
if not resync_receipt.get("backup_path") or not resync_receipt.get("rollback_command"):
    raise SystemExit("resync receipt omitted backup or rollback instructions")

marketplace = json.loads((source.parent / ".claude-plugin/marketplace.json").read_text())
entry = next(item for item in marketplace["plugins"] if item["name"] == plugin)
if entry["version"] != version:
    raise SystemExit("marketplace version drift")
expected_catalog_hash = "artifact-sha256:" + source_receipt["artifact_content_sha256"]
if expected_catalog_hash not in entry.get("keywords", []):
    raise SystemExit("marketplace artifact content hash drift")

required = [
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "hooks/hooks.json",
    "hooks/codex-hooks.json",
    "skills/theorems-harness/SKILL.md",
    "skills/execute/SKILL.md",
    "skills/planning-theorem/SKILL.md",
]
for relative in required:
    if not (cache / relative).is_file():
        raise SystemExit(f"standalone artifact missing {relative}")

manifest = json.loads((cache / "plugin.manifest.json").read_text())
mcp = json.loads((cache / ".mcp.json").read_text())["mcpServers"]
claude_mcp = json.loads((cache / ".claude-plugin/plugin.json").read_text())["mcpServers"]
if mcp != manifest["mcpServers"] or claude_mcp != manifest["mcpServers"]:
    raise SystemExit("standalone artifact MCP fingerprint drift")
fingerprint = hashlib.sha256(
    json.dumps(mcp, sort_keys=True, separators=(",", ":")).encode()
).hexdigest()
if fingerprint != source_receipt["mcp_fingerprint_sha256"]:
    raise SystemExit("standalone artifact MCP fingerprint receipt drift")

for path in cache.rglob("*"):
    if path.is_file() and local_override.encode() in path.read_bytes():
        raise SystemExit(f"local MCP override leaked into release artifact: {path}")
PY

artifact_hash=$(python3 -c \
  'import json,sys; print(json.load(open(sys.argv[1]))["artifact_content_sha256"])' \
  "$fixture/resync-receipt.json")
mcp_hash=$(python3 -c \
  'import json,sys; print(json.load(open(sys.argv[1]))["mcp_fingerprint_sha256"])' \
  "$fixture/resync-receipt.json")
rollback=$(python3 -c \
  'import json,sys; print(json.load(open(sys.argv[1]))["rollback_command"])' \
  "$fixture/resync-receipt.json")

printf 'plugin release parity passed: %s %s\n' "$plugin" "$version"
printf 'artifact_content_sha256=%s\n' "$artifact_hash"
printf 'mcp_fingerprint_sha256=%s\n' "$mcp_hash"
printf 'fixture_rollback=%s\n' "$rollback"
printf 'release rollback: retain the prior version directory and installed_plugins.json backup; restore both, then restart the host in a new session.\n'
