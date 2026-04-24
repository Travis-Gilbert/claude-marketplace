#!/bin/bash
set -e
PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Ensure directories
for dir in agents commands skills knowledge/solutions knowledge/session_log \
           patterns refs references/methodologies references/principles \
           references/anti-patterns templates scripts/epistemic; do
  mkdir -p "$PLUGIN_DIR/$dir"
done

# 2. Clone refs (full clone for superpowers, shallow for others)
cd "$PLUGIN_DIR/refs"
[ -d superpowers ] || git clone https://github.com/obra/superpowers.git
[ -d mycelium ] || git clone --depth 1 https://github.com/mycelium-clj/mycelium.git
[ -d adr-templates ] || git clone --depth 1 https://github.com/joelparkerhenderson/architecture-decision-record.git adr-templates

# 3. Seed skills from superpowers (full clone, not shallow)
cd "$PLUGIN_DIR"
for skill in brainstorming writing-plans executing-plans subagent-driven-development \
             verification-before-completion systematic-debugging test-driven-development \
             requesting-code-review receiving-code-review finishing-a-development-branch; do
  if [ -d "refs/superpowers/skills/$skill" ] && [ ! -d "lib/$skill" ]; then
    cp -r "refs/superpowers/skills/$skill" "lib/$skill"
  fi
done

# 4. Register slash commands
CMD_DIR="$PLUGIN_DIR/.claude/commands"
mkdir -p "$CMD_DIR"
for cmd in research brainstorm plan write-plan execute review learn retrofit; do
  ln -sf "$PLUGIN_DIR/commands/$cmd.md" "$CMD_DIR/$cmd.md"
done

AGENT_COUNT=$(ls "$PLUGIN_DIR/agents/" 2>/dev/null | wc -l | tr -d ' ')
SKILL_COUNT=$(ls -d "$PLUGIN_DIR/lib/"*/ 2>/dev/null | wc -l | tr -d ' ')
echo "plan-pro installed. ${AGENT_COUNT} agents, ${SKILL_COUNT} skills."
