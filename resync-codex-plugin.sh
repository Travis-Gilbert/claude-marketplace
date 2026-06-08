#!/usr/bin/env bash
# resync-codex-plugin.sh — force a running Claude Code to load the latest pushed
# version of a GIT-marketplace plugin.
#
# Claude Code loads a marketplace plugin through FOUR independent layers, and a
# "resync" only takes effect if ALL of them advance together:
#
#   1. marketplace clone   ~/.claude/plugins/marketplaces/<mkt>/           (a git checkout)
#   2. version cache       ~/.claude/plugins/cache/<mkt>/<plugin>/<ver>/   (the dir CC reads)
#   3. registry pin        ~/.claude/plugins/installed_plugins.json        (selects the dir)
#   4. hardcoded MCP pins  ~/.claude.json mcpServers[*].args               (abs paths into a
#                                                                           specific cache version)
#
# Layer 4 is the silent killer. A manually-added global MCP server (e.g.
# "rustyred-thg") whose args hardcode .../cache/<mkt>/<plugin>/<OLDVER>/... does
# NOT move when the version bumps, and installed_plugins.json edits never touch
# it. This script reconciles it by overwriting whatever cache dir those pins
# point at with the latest content (safe, takes effect on restart). The clean
# one-time alternative is to repoint those args at a version-stable path with
# Claude Code FULLY QUIT (CC rewrites ~/.claude.json live, so editing it while
# running gets clobbered).
#
# Symptom this fixes: you pushed a fix to the marketplace's origin/main, but a
# running CC keeps loading the old version no matter what you click. That is
# because one or more of the three layers above is stale.
#
# This script: git-pulls (1) ff-only, rebuilds (2) from it, repoints (3) at the
# new version, then tells you to restart. It NEVER force-pushes/pulls and backs
# up installed_plugins.json before editing.
#
# NOTE: this is the GIT-marketplace lane. sync-plugins.sh is a DIFFERENT lane —
# it symlinks dev plugins into the `local-desktop-app-uploads` marketplace and
# will NOT touch a git marketplace like codex-marketplace.
#
# Usage:
#   ./resync-codex-plugin.sh                       # theorems-harness @ codex-marketplace
#   ./resync-codex-plugin.sh <plugin>              # <plugin> @ codex-marketplace
#   ./resync-codex-plugin.sh <plugin> <marketplace>
#
# After it runs: FULLY QUIT and relaunch Claude Code (Cmd+Q / exit the CLI).
# `/clear` does NOT reload plugins — hooks, skills, and commands load at startup.

set -euo pipefail

PLUGIN="${1:-theorems-harness}"
MARKETPLACE="${2:-codex-marketplace}"

PLUGINS_ROOT="$HOME/.claude/plugins"
MKT="$PLUGINS_ROOT/marketplaces/$MARKETPLACE"
SRC="$MKT/$PLUGIN"
REG="$PLUGINS_ROOT/installed_plugins.json"
SETTINGS="$HOME/.claude/settings.json"
KEY="${PLUGIN}@${MARKETPLACE}"

GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
say()  { echo -e "${CYAN}==>${NC} $*"; }
ok()   { echo -e "  ${GREEN}OK${NC} $*"; }
warn() { echo -e "  ${YELLOW}!!${NC} $*"; }
die()  { echo -e "  ${RED}XX${NC} $*" >&2; exit 1; }

# ---- preflight ---------------------------------------------------------------
command -v jq      >/dev/null || die "jq not found"
command -v python3 >/dev/null || die "python3 not found"
command -v git     >/dev/null || die "git not found"
{ [ -d "$MKT/.git" ] || [ -f "$MKT/.git" ]; } || die "marketplace clone is not a git repo: $MKT"
[ -f "$SRC/.claude-plugin/plugin.json" ] || die "plugin not in marketplace: $SRC/.claude-plugin/plugin.json"
[ -f "$REG" ] || die "registry not found: $REG"
jq -e --arg k "$KEY" '.plugins[$k][0]' "$REG" >/dev/null 2>&1 || die \
  "registry has no entry '$KEY'. Matching keys: $(jq -r --arg p "$PLUGIN" '.plugins|keys[]|select(test($p))' "$REG" | paste -sd, -)"

# ---- 1. pull the marketplace clone (ff-only, never force) --------------------
say "Pulling marketplace clone: $MKT"
git -C "$MKT" fetch origin --quiet
UP="$(git -C "$MKT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo origin/main)"
if git -C "$MKT" merge-base --is-ancestor HEAD "$UP"; then
  git -C "$MKT" merge --ff-only "$UP" --quiet
  ok "fast-forwarded to $(git -C "$MKT" rev-parse --short HEAD) ($UP)"
elif git -C "$MKT" merge-base --is-ancestor "$UP" HEAD; then
  warn "clone is ahead of $UP (local commits?) — using current HEAD"
else
  die "clone diverged from $UP — resolve manually (this script will not force)"
fi

SHA="$(git -C "$MKT" rev-parse HEAD)"
VERSION="$(jq -r '.version' "$SRC/.claude-plugin/plugin.json")"
{ [ -n "$VERSION" ] && [ "$VERSION" != "null" ]; } || die "could not read plugin version"
ok "marketplace now at $PLUGIN $VERSION ($(git -C "$MKT" rev-parse --short HEAD))"

# ---- 2. (re)build the version cache dir CC actually loads --------------------
DST="$PLUGINS_ROOT/cache/$MARKETPLACE/$PLUGIN/$VERSION"
say "Building cache: $DST"
mkdir -p "$DST"
if command -v rsync >/dev/null; then
  # mirror SRC into DST; protect node_modules and CC's runtime .in_use marker
  rsync -a --delete --exclude '.git' --exclude 'mcp/node_modules' --exclude '.in_use' "$SRC"/ "$DST"/
else
  rm -rf "$DST"; cp -R "$SRC" "$DST"
fi

# ensure mcp/node_modules exists (it can be gitignored, so absent in the clone)
if [ -f "$DST/mcp/package.json" ] && [ ! -d "$DST/mcp/node_modules" ]; then
  if [ -d "$SRC/mcp/node_modules" ]; then
    cp -R "$SRC/mcp/node_modules" "$DST/mcp/node_modules"; ok "copied mcp/node_modules from clone"
  else
    PREV="$(find "$PLUGINS_ROOT/cache/$MARKETPLACE/$PLUGIN" -maxdepth 3 -type d -path '*/mcp/node_modules' 2>/dev/null | grep -v "/$VERSION/" | head -1)"
    if [ -n "$PREV" ]; then
      cp -R "$PREV" "$DST/mcp/node_modules"; ok "reused mcp/node_modules from a prior cached version"
    elif command -v npm >/dev/null; then
      ( cd "$DST/mcp" && { npm ci --silent 2>/dev/null || npm install --silent 2>/dev/null; } ) \
        && ok "npm install in mcp/" || warn "mcp/node_modules missing; npm install failed — MCP server may not start"
    else
      warn "mcp/node_modules missing and no source to copy from — MCP server may not start"
    fi
  fi
fi

[ -f "$DST/hooks/hooks.json" ] && { jq empty "$DST/hooks/hooks.json" || die "built cache has invalid hooks/hooks.json"; }
ok "cache built (plugin.json reports v$(jq -r '.version' "$DST/.claude-plugin/plugin.json"))"

# ---- 3. repoint the registry (backup first) ---------------------------------
say "Repointing registry entry: $KEY"
cp "$REG" "$REG.bak.resync-$PLUGIN-$VERSION"
python3 - "$REG" "$KEY" "$DST" "$VERSION" "$SHA" <<'PY'
import json, sys, datetime
reg, key, install_path, version, sha = sys.argv[1:6]
d = json.load(open(reg))
entry = d["plugins"][key][0]
entry["installPath"]  = install_path
entry["version"]      = version
entry["gitCommitSha"] = sha
entry["lastUpdated"]  = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
with open(reg, "w") as f:
    json.dump(d, f, indent=2, ensure_ascii=False); f.write("\n")
PY
jq empty "$REG" || die "registry invalid after edit — restore: cp '$REG.bak.resync-$PLUGIN-$VERSION' '$REG'"
ok "pinned to $VERSION ($(git -C "$MKT" rev-parse --short HEAD)); backup: $(basename "$REG").bak.resync-$PLUGIN-$VERSION"

# ---- enabled check ----------------------------------------------------------
if [ -f "$SETTINGS" ]; then
  EN="$(jq -r --arg k "$KEY" '.enabledPlugins[$k] // "absent"' "$SETTINGS" 2>/dev/null || echo '?')"
  case "$EN" in
    true)  ok "enabled in settings.json" ;;
    false) warn "DISABLED in settings.json ($KEY=false) — enable it or CC won't load it" ;;
    *)     warn "no enabledPlugins entry for $KEY in settings.json" ;;
  esac
fi

# ---- 4. reconcile hardcoded MCP pins in ~/.claude.json ----------------------
# Any global mcpServers entry whose args hardcode this plugin's cache/<oldver>/
# would otherwise keep loading the old code forever. Overwrite that dir's
# contents with the new version (safe; restart picks it up). Does NOT edit the
# live ~/.claude.json (CC would clobber it).
CLAUDE_JSON="$HOME/.claude.json"
if [ -f "$CLAUDE_JSON" ]; then
  say "Reconciling hardcoded MCP cache paths in ~/.claude.json (layer 4)"
  while IFS= read -r pinned_dir; do
    [ -z "$pinned_dir" ] && continue
    if [ "$pinned_dir" = "$DST" ]; then ok "~/.claude.json MCP pin already on $VERSION"; continue; fi
    if [ -d "$pinned_dir" ]; then
      rsync -a --delete --exclude '.in_use' "$DST"/ "$pinned_dir"/
      warn "~/.claude.json hardcodes $(basename "$pinned_dir") for an MCP server; overwrote it with $VERSION content"
      warn "  clean one-time fix (with CC fully quit): repoint that args path to a version-stable location"
    else
      warn "~/.claude.json pins a missing dir: $pinned_dir (skipped)"
    fi
  done < <(python3 - "$CLAUDE_JSON" "$MARKETPLACE" "$PLUGIN" <<'PY'
import json, sys
cj, mkt, plugin = sys.argv[1:4]
needle = f"/cache/{mkt}/{plugin}/"
seen = set()
def walk(o):
    if isinstance(o, dict):
        [walk(v) for v in o.values()]
    elif isinstance(o, list):
        [walk(v) for v in o]
    elif isinstance(o, str) and needle in o:
        i = o.find(needle) + len(needle)
        ver = o[i:].split("/", 1)[0]
        seen.add(o[:i] + ver)
walk(json.load(open(cj)))
[print(p) for p in sorted(seen)]
PY
)
fi

# ---- verify load path end-to-end --------------------------------------------
IP="$(jq -r --arg k "$KEY" '.plugins[$k][0].installPath' "$REG")"
echo
say "Done. CC will load $PLUGIN from:"
echo "    $IP  (v$(jq -r '.version' "$IP/.claude-plugin/plugin.json"))"
echo -e "  ${YELLOW}>> Fully quit and relaunch Claude Code (NOT /clear) to load $PLUGIN $VERSION.${NC}"
