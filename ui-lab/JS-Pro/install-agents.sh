#!/bin/bash
# install-agents.sh
# Sets up JS-Pro as a Claude Code skill plugin
#
# What this does:
#   1. Verifies the directory structure matches the spec
#   2. Moves any loose files into the correct subdirectories
#   3. Creates ~/.claude/js-pro symlink (--global only)
#   4. Creates slash command symlinks in .claude/commands/ (or ~/.claude/commands/ with --global)
#   5. Reports what's available
#
# Usage:
#   ./install-agents.sh            # Local install (this project only)
#   ./install-agents.sh --global   # Global install (all projects)

set -e

JS_PRO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo "${BOLD}JS-Pro Plugin Installer${NC}"
echo "────────────────────────"
echo "Directory: ${CYAN}$JS_PRO_DIR${NC}"
echo ""

# ──────────────────────────────────────────────
# 1. Ensure directory structure exists
# ──────────────────────────────────────────────
echo "${BOLD}1. Directory structure${NC}"
for dir in agents refs examples data templates docs/records docs/notes; do
  if [ ! -d "$JS_PRO_DIR/$dir" ]; then
    mkdir -p "$JS_PRO_DIR/$dir"
    echo "   ${GREEN}Created${NC} $dir/"
  else
    echo "   ${GREEN}OK${NC}      $dir/"
  fi
done
echo ""

# ──────────────────────────────────────────────
# 2. Move loose agent files into agents/
# ──────────────────────────────────────────────
echo "${BOLD}2. Organizing agent files${NC}"
moved_agents=0
for pattern in "*-specialist.md" "*-pro.md" "*-developer.md" "*-engineer.md" \
               "*-designer.md" "*-analyst.md" "*-modernizer.md" "*-manager.md" \
               "*-synthesizer.md" "*-integration.md"; do
  for f in "$JS_PRO_DIR"/$pattern; do
    [ -f "$f" ] || continue
    basename=$(basename "$f")
    # Skip CLAUDE.md, AGENTS.md, Secondary agents.md
    [[ "$basename" == "CLAUDE.md" ]] && continue
    [[ "$basename" == "AGENTS.md" ]] && continue
    [[ "$basename" == "Secondary agents.md" ]] && continue
    mv "$f" "$JS_PRO_DIR/agents/"
    echo "   ${GREEN}Moved${NC} $basename → agents/"
    moved_agents=$((moved_agents + 1))
  done
done
# Handle parenthesized duplicates (e.g., "project-manager (1).md")
for f in "$JS_PRO_DIR"/*" ("*").md"; do
  [ -f "$f" ] || continue
  basename=$(basename "$f")
  # Extract clean name: "project-manager (1).md" → "project-manager.md"
  clean=$(echo "$basename" | sed 's/ ([0-9]*)//g')
  if [ ! -f "$JS_PRO_DIR/agents/$clean" ]; then
    mv "$f" "$JS_PRO_DIR/agents/$clean"
    echo "   ${GREEN}Moved${NC} $basename → agents/$clean"
    moved_agents=$((moved_agents + 1))
  else
    echo "   ${YELLOW}Skip${NC}  $basename (agents/$clean already exists)"
  fi
done
if [ $moved_agents -eq 0 ]; then
  echo "   ${GREEN}All agents already in place${NC}"
fi
echo ""

# ──────────────────────────────────────────────
# 3. Move loose source repos into refs/
# ──────────────────────────────────────────────
echo "${BOLD}3. Organizing reference repos${NC}"
moved_refs=0
for d in react-main angular.js-master alpine-main htmx-master d3-main \
         plot-main rough-master base-ui-master material-ui-master \
         ag-grid-latest xyflow-main components-main d3-annotation-master \
         d3-sankey-master framework-main normal-quantile-plot; do
  if [ -d "$JS_PRO_DIR/$d" ] && [ ! -d "$JS_PRO_DIR/refs/$d" ]; then
    mv "$JS_PRO_DIR/$d" "$JS_PRO_DIR/refs/"
    echo "   ${GREEN}Moved${NC} $d/ → refs/"
    moved_refs=$((moved_refs + 1))
  fi
done
# Handle "xyflow-main 2" variant
if [ -d "$JS_PRO_DIR/xyflow-main 2" ] && [ ! -d "$JS_PRO_DIR/refs/xyflow-main" ]; then
  mv "$JS_PRO_DIR/xyflow-main 2" "$JS_PRO_DIR/refs/xyflow-main"
  echo "   ${GREEN}Moved${NC} 'xyflow-main 2/' → refs/xyflow-main/"
  moved_refs=$((moved_refs + 1))
fi
if [ $moved_refs -eq 0 ]; then
  echo "   ${GREEN}All refs already in place${NC}"
fi
echo ""

# ──────────────────────────────────────────────
# 4. Move loose examples into examples/
# ──────────────────────────────────────────────
echo "${BOLD}4. Organizing examples${NC}"
moved_examples=0
for d in D3js-code-examples-I-love plot-rough; do
  if [ -d "$JS_PRO_DIR/$d" ] && [ ! -d "$JS_PRO_DIR/examples/$d" ]; then
    mv "$JS_PRO_DIR/$d" "$JS_PRO_DIR/examples/"
    echo "   ${GREEN}Moved${NC} $d/ → examples/"
    moved_examples=$((moved_examples + 1))
  fi
done
if [ $moved_examples -eq 0 ]; then
  echo "   ${GREEN}All examples already in place${NC}"
fi
echo ""

# ──────────────────────────────────────────────
# 5. Move loose data files into data/
# ──────────────────────────────────────────────
echo "${BOLD}5. Organizing test data${NC}"
moved_data=0
for f in flare-2.json "sfhh@4.json" "sfhh@4 (1).json" mobile-patent-suits.tgz treemap_2.tgz; do
  if [ -f "$JS_PRO_DIR/$f" ]; then
    # Normalize "sfhh@4 (1).json" → "sfhh@4.json"
    target=$(echo "$f" | sed 's/ ([0-9]*)//g')
    if [ ! -f "$JS_PRO_DIR/data/$target" ]; then
      mv "$JS_PRO_DIR/$f" "$JS_PRO_DIR/data/$target"
      echo "   ${GREEN}Moved${NC} $f → data/$target"
      moved_data=$((moved_data + 1))
    fi
  fi
done
if [ $moved_data -eq 0 ]; then
  echo "   ${GREEN}All data files already in place${NC}"
fi
echo ""

# ──────────────────────────────────────────────
# 6. Parse --global flag
# ──────────────────────────────────────────────
GLOBAL_INSTALL=false
for arg in "$@"; do
  [ "$arg" = "--global" ] && GLOBAL_INSTALL=true
done

# ──────────────────────────────────────────────
# 7. Create global symlink (--global only)
# ──────────────────────────────────────────────
if [ "$GLOBAL_INSTALL" = true ]; then
  echo "${BOLD}6. Creating global symlink${NC}"
  SYMLINK="$HOME/.claude/js-pro"
  mkdir -p "$HOME/.claude"
  if [ -L "$SYMLINK" ]; then
    current=$(readlink "$SYMLINK")
    if [ "$current" = "$JS_PRO_DIR" ]; then
      echo "   ${GREEN}OK${NC}      ~/.claude/js-pro → $JS_PRO_DIR"
    else
      ln -sf "$JS_PRO_DIR" "$SYMLINK"
      echo "   ${GREEN}Updated${NC} ~/.claude/js-pro → $JS_PRO_DIR (was $current)"
    fi
  elif [ -e "$SYMLINK" ]; then
    echo "   ${RED}ERROR${NC}   ~/.claude/js-pro exists but is not a symlink"
    echo "         Remove it manually and re-run: rm ~/.claude/js-pro"
    exit 1
  else
    ln -s "$JS_PRO_DIR" "$SYMLINK"
    echo "   ${GREEN}Created${NC} ~/.claude/js-pro → $JS_PRO_DIR"
  fi
  echo ""
fi

# ──────────────────────────────────────────────
# 8. Register skills
# ──────────────────────────────────────────────
echo "${BOLD}$([ "$GLOBAL_INSTALL" = true ] && echo 7 || echo 6). Registering skills${NC}"

if [ -d "$JS_PRO_DIR/skills" ]; then
  SKILLS_DIR="$HOME/.claude/skills"
  mkdir -p "$SKILLS_DIR"
  registered_skills=0
  for skill_dir in "$JS_PRO_DIR/skills/"*/; do
    [ -d "$skill_dir" ] || continue
    [ -f "$skill_dir/SKILL.md" ] || continue
    skill_name=$(basename "$skill_dir")
    target="$SKILLS_DIR/$skill_name"
    if [ -L "$target" ]; then
      current=$(readlink "$target")
      if [ "$current" = "${skill_dir%/}" ]; then
        echo "   ${GREEN}OK${NC}      $skill_name"
      else
        ln -sf "${skill_dir%/}" "$target"
        echo "   ${GREEN}Updated${NC} $skill_name"
      fi
    elif [ -d "$target" ]; then
      echo "   ${YELLOW}Skip${NC}    $skill_name (non-symlink directory exists at $target)"
    else
      ln -s "${skill_dir%/}" "$target"
      echo "   ${GREEN}Created${NC} $skill_name"
    fi
    registered_skills=$((registered_skills + 1))
  done
  if [ $registered_skills -eq 0 ]; then
    echo "   ${YELLOW}No skills found${NC} in skills/"
  fi
else
  echo "   ${YELLOW}No skills/ directory${NC}"
  registered_skills=0
fi
echo ""

# ──────────────────────────────────────────────
# 9. Create slash command symlinks
# ──────────────────────────────────────────────
echo "${BOLD}$([ "$GLOBAL_INSTALL" = true ] && echo 8 || echo 7). Registering slash commands${NC}"

if [ "$GLOBAL_INSTALL" = true ]; then
  COMMANDS_DIR="$HOME/.claude/commands"
  echo "   ${CYAN}Mode: global${NC} (available in all projects)"
else
  COMMANDS_DIR="$JS_PRO_DIR/.claude/commands"
  echo "   ${CYAN}Mode: local${NC} (use --global for all projects)"
fi

mkdir -p "$COMMANDS_DIR"
registered=0
for agent in "$JS_PRO_DIR/agents/"*.md; do
  [ -f "$agent" ] || continue
  # Extract name from YAML frontmatter
  name=$(grep -m1 '^name:' "$agent" 2>/dev/null | sed 's/name: *//' | tr -d '"' | tr -d "'")
  if [ -n "$name" ]; then
    ln -sf "$agent" "$COMMANDS_DIR/$name.md"
    echo "   ${GREEN}/${NC}${BOLD}$name${NC}"
    registered=$((registered + 1))
  fi
done
echo ""

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
agent_count=$(ls "$JS_PRO_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
ref_count=$(ls -d "$JS_PRO_DIR/refs/"*/ 2>/dev/null | wc -l | tr -d ' ')
example_count=$(ls -d "$JS_PRO_DIR/examples/"*/ 2>/dev/null | wc -l | tr -d ' ')
data_count=$(ls "$JS_PRO_DIR/data/" 2>/dev/null | wc -l | tr -d ' ')

skill_count=$(ls -d "$JS_PRO_DIR/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')

echo "────────────────────────"
echo "${BOLD}JS-Pro plugin ready${NC}"
echo ""
echo "  Agents:   ${BOLD}$agent_count${NC} agent definitions"
echo "  Skills:   ${BOLD}$skill_count${NC} context/command skills"
echo "  Refs:     ${BOLD}$ref_count${NC} framework source repos"
echo "  Examples: ${BOLD}$example_count${NC} example collections"
echo "  Data:     ${BOLD}$data_count${NC} test datasets"
echo "  Commands: ${BOLD}$registered${NC} slash commands registered"
if [ "$GLOBAL_INSTALL" = true ]; then
  echo "  Scope:    ${GREEN}global${NC} (available everywhere)"
else
  echo "  Scope:    local (run with --global for everywhere)"
fi
echo ""
