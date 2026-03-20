#!/bin/bash
# install.sh
# Sets up UX-Pro as a Claude Code plugin with reference source repos

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo "${BOLD}UX-Pro Plugin Installer${NC}"
echo "======================="
echo ""

# 1. Ensure directory structure
echo "${BOLD}1. Directory structure${NC}"
for dir in agents commands scripts refs \
           skills/ux-expertise/references \
           templates/heuristic-evaluation \
           templates/usability-test-script \
           templates/research-plan \
           templates/journey-map \
           templates/service-blueprint \
           templates/accessibility-audit \
           templates/ux-review; do
  if [ ! -d "$PLUGIN_DIR/$dir" ]; then
    mkdir -p "$PLUGIN_DIR/$dir"
    echo "   ${GREEN}Created${NC} $dir/"
  else
    echo "   ${GREEN}OK${NC}      $dir/"
  fi
done
echo ""

# 2. Clone reference repos
echo "${BOLD}2. Cloning reference source repos${NC}"

clone_ref() {
  local repo="$1"
  local target="$2"
  local depth="${3:-1}"

  if [ -d "$PLUGIN_DIR/refs/$target" ] && [ -n "$(ls -A "$PLUGIN_DIR/refs/$target" 2>/dev/null)" ]; then
    echo "   ${GREEN}OK${NC}      refs/$target/"
  else
    echo "   ${YELLOW}Cloning${NC} $repo -> refs/$target/"
    git clone --depth "$depth" --single-branch \
      "https://github.com/$repo.git" "$PLUGIN_DIR/refs/$target" 2>/dev/null || {
      echo "   ${RED}Failed${NC}  $repo"
      return 1
    }
    rm -rf "$PLUGIN_DIR/refs/$target/.git"
    find "$PLUGIN_DIR/refs/$target" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
    find "$PLUGIN_DIR/refs/$target" -name "dist" -type d -exec rm -rf {} + 2>/dev/null
    find "$PLUGIN_DIR/refs/$target" -name ".yarn" -type d -exec rm -rf {} + 2>/dev/null
    echo "   ${GREEN}Cloned${NC}  refs/$target/"
  fi
}

# Tier 1: Must-Have
echo "   ${BOLD}Tier 1: Must-Have${NC}"
clone_ref "radix-ui/primitives"              "radix-primitives"
clone_ref "alphagov/govuk-design-system"     "govuk-design-system"
clone_ref "alphagov/govuk-frontend"          "govuk-frontend"
clone_ref "Shopify/polaris"                  "polaris"
clone_ref "dequelabs/axe-core"               "axe-core"

# Tier 2: High Value
echo "   ${BOLD}Tier 2: High Value${NC}"
clone_ref "tailwindlabs/headlessui"          "headlessui"
clone_ref "primer/react"                     "primer-react"
clone_ref "carbon-design-system/carbon"      "carbon"
clone_ref "adobe/react-spectrum"             "react-spectrum"

# Tier 3: Selective
echo "   ${BOLD}Tier 3: Selective${NC}"
clone_ref "w3c/aria-practices"               "aria-practices"
clone_ref "w3c/wcag"                         "wcag"
clone_ref "jonyablonski/laws-of-ux"          "laws-of-ux"
clone_ref "18F/accessibility"                "18f-accessibility"
clone_ref "pinterest/gestalt"                "gestalt"
clone_ref "microsoft/fluentui"               "fluentui"

echo ""

# 3. Post-clone trimming (large repos)
echo "${BOLD}3. Trimming large repos${NC}"

# Fluent UI: keep only v9 React components
if [ -d "$PLUGIN_DIR/refs/fluentui/apps" ]; then
  rm -rf "$PLUGIN_DIR/refs/fluentui/apps" "$PLUGIN_DIR/refs/fluentui/scripts" 2>/dev/null
  rm -rf "$PLUGIN_DIR/refs/fluentui/packages/web-components" 2>/dev/null
  echo "   ${GREEN}Trimmed${NC} fluentui"
fi

# React Spectrum: keep only @react-aria and @react-stately
if [ -d "$PLUGIN_DIR/refs/react-spectrum/examples" ]; then
  rm -rf "$PLUGIN_DIR/refs/react-spectrum/examples" "$PLUGIN_DIR/refs/react-spectrum/starters" 2>/dev/null
  echo "   ${GREEN}Trimmed${NC} react-spectrum"
fi

# Carbon: trim docs and examples
if [ -d "$PLUGIN_DIR/refs/carbon/www" ]; then
  rm -rf "$PLUGIN_DIR/refs/carbon/www" "$PLUGIN_DIR/refs/carbon/examples" 2>/dev/null
  echo "   ${GREEN}Trimmed${NC} carbon"
fi

# WCAG: keep only understanding, techniques, guidelines
if [ -d "$PLUGIN_DIR/refs/wcag/working-examples" ]; then
  rm -rf "$PLUGIN_DIR/refs/wcag/working-examples" "$PLUGIN_DIR/refs/wcag/img" 2>/dev/null
  echo "   ${GREEN}Trimmed${NC} wcag"
fi

# Global cleanup
find "$PLUGIN_DIR/refs" -name "coverage" -type d -exec rm -rf {} + 2>/dev/null
find "$PLUGIN_DIR/refs" -name ".cache" -type d -exec rm -rf {} + 2>/dev/null
find "$PLUGIN_DIR/refs" -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null
echo "   ${GREEN}Cleaned${NC} caches and test directories"
echo ""

# 4. Summary
echo "${BOLD}Summary${NC}"
echo "   Skill:      1 (ux-expertise with 11 reference docs)"
echo "   Agents:     $(ls "$PLUGIN_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')"
echo "   Commands:   $(ls "$PLUGIN_DIR/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')"
echo "   Templates:  $(ls -d "$PLUGIN_DIR/templates/"*/ 2>/dev/null | wc -l | tr -d ' ')"
echo "   Refs:       $(ls -d "$PLUGIN_DIR/refs/"*/ 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "${GREEN}UX-Pro plugin installed.${NC}"
echo "Launch Claude Code with: ${CYAN}claude --plugin-dir $PLUGIN_DIR${NC}"
