#!/bin/bash
# install.sh
# Sets up Animation-Pro as a Claude Code skill plugin

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo "${BOLD}Animation-Pro Plugin Installer${NC}"
echo "==============================="
echo ""

# 1. Ensure directory structure
echo "${BOLD}1. Directory structure${NC}"
for dir in agents refs examples commands scripts \
           skills/motion-craft/references \
           skills/creative-animation/references \
           skills/3d-animation/references \
           skills/production-motion/references \
           examples/spring-presets \
           examples/scroll-patterns \
           examples/enter-exit \
           examples/creative-canvas \
           examples/3d-scenes \
           examples/programmatic-video; do
  if [ ! -d "$PLUGIN_DIR/$dir" ]; then
    mkdir -p "$PLUGIN_DIR/$dir"
    echo "   ${GREEN}Created${NC} $dir/"
  else
    echo "   ${GREEN}OK${NC}      $dir/"
  fi
done
echo ""

# 2. Clone reference repos (or extract from tarball)
echo "${BOLD}2. Setting up reference source repos${NC}"

# Check for pre-packaged tarball first
TARBALL=""
for candidate in "$PLUGIN_DIR/animation-pro-refs.tar.gz" \
                 "$HOME/Downloads/animation-pro-refs.tar.gz" \
                 "./animation-pro-refs.tar.gz"; do
  if [ -f "$candidate" ]; then
    TARBALL="$candidate"
    break
  fi
done

if [ -n "$TARBALL" ]; then
  echo "   ${GREEN}Found${NC} pre-packaged refs tarball: $TARBALL"
  echo "   ${YELLOW}Extracting${NC} (this may take a moment)..."
  tar -xzf "$TARBALL" -C "$PLUGIN_DIR/refs/" 2>/dev/null || {
    echo "   ${RED}Failed to extract tarball. Falling back to git clone.${NC}"
    TARBALL=""
  }
  if [ -n "$TARBALL" ]; then
    echo "   ${GREEN}Extracted${NC} reference repos from tarball"
  fi
fi

if [ -z "$TARBALL" ]; then
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
      # Clean caches and build artifacts
      find "$PLUGIN_DIR/refs/$target" -name ".yarn" -type d -exec rm -rf {} + 2>/dev/null
      find "$PLUGIN_DIR/refs/$target" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
      find "$PLUGIN_DIR/refs/$target" -name "dist" -type d -exec rm -rf {} + 2>/dev/null
      echo "   ${GREEN}Cloned${NC}  refs/$target/"
    fi
  }

  # Skill 1: Motion Craft
  echo "   ${BOLD}Motion Craft${NC}"
  clone_ref "motiondivision/motion"            "motion"
  clone_ref "pmndrs/react-spring"              "react-spring"
  clone_ref "formkit/auto-animate"             "auto-animate"
  clone_ref "juliangarnier/anime"              "anime"
  clone_ref "locomotivemtl/locomotive-scroll"  "locomotive-scroll"
  clone_ref "airbnb/lottie-web"                "lottie-web"

  # Skill 2: Creative Animation
  echo "   ${BOLD}Creative Animation${NC}"
  clone_ref "processing/p5.js"                 "p5js"
  clone_ref "pixijs/pixijs"                    "pixijs"
  clone_ref "tweenjs/tween.js"                 "tweenjs"
  clone_ref "d3/d3-transition"                 "d3-transition"
  clone_ref "d3/d3-ease"                       "d3-ease"
  clone_ref "liabru/matter-js"                 "matter-js"
  clone_ref "animate-css/animate.css"          "animate-css"
  clone_ref "maxwellito/vivus"                 "vivus"

  # Skill 3: 3D Animation
  echo "   ${BOLD}3D Animation${NC}"
  clone_ref "mrdoob/three.js"                  "threejs"
  clone_ref "pmndrs/react-three-fiber"         "react-three-fiber"
  clone_ref "pmndrs/drei"                      "drei"
  clone_ref "theatre-js/theatre"               "theatre"
  clone_ref "dimforge/rapier"                  "rapier"

  # Skill 4: Production Motion
  echo "   ${BOLD}Production Motion${NC}"
  clone_ref "remotion-dev/remotion"            "remotion"
  clone_ref "motion-canvas/motion-canvas"      "motion-canvas"

  # Pretext: text measurement without reflow during animation frames
  echo "   ${BOLD}Text Measurement${NC}"
  clone_ref "chenglou/pretext"                 "pretext"
fi

echo ""

# 3. Post-clone trimming
echo "${BOLD}3. Trimming large repos${NC}"

# Three.js: remove heavy asset directories
rm -rf "$PLUGIN_DIR/refs/threejs/manual" "$PLUGIN_DIR/refs/threejs/test" "$PLUGIN_DIR/refs/threejs/editor" 2>/dev/null
rm -rf "$PLUGIN_DIR/refs/threejs/examples/screenshots" "$PLUGIN_DIR/refs/threejs/examples/textures" 2>/dev/null
rm -rf "$PLUGIN_DIR/refs/threejs/examples/models" "$PLUGIN_DIR/refs/threejs/examples/sounds" 2>/dev/null
echo "   ${GREEN}Trimmed${NC} threejs"

# Remotion: remove docs, examples, platform binaries
rm -rf "$PLUGIN_DIR/refs/remotion/packages/docs" "$PLUGIN_DIR/refs/remotion/packages/example" 2>/dev/null
rm -rf "$PLUGIN_DIR/refs/remotion/packages/create-video" "$PLUGIN_DIR/refs/remotion/packages/it-tests" 2>/dev/null
rm -rf "$PLUGIN_DIR/refs/remotion/packages/compositor-"* "$PLUGIN_DIR/refs/remotion/packages/template-"* 2>/dev/null
find "$PLUGIN_DIR/refs/remotion" -type f \( -name "*.dylib" -o -name "*.so" -o -name "*.dll" -o -name "*.wasm" \) -delete 2>/dev/null
echo "   ${GREEN}Trimmed${NC} remotion"

# Global cleanup
find "$PLUGIN_DIR/refs" -name ".yarn" -type d -exec rm -rf {} + 2>/dev/null
find "$PLUGIN_DIR/refs" -name "coverage" -type d -exec rm -rf {} + 2>/dev/null
find "$PLUGIN_DIR/refs" -name ".cache" -type d -exec rm -rf {} + 2>/dev/null
echo "   ${GREEN}Cleaned${NC} caches"
echo ""

# 4. Make scripts executable
echo "${BOLD}4. Setting permissions${NC}"
chmod +x "$PLUGIN_DIR/scripts/"*.sh 2>/dev/null
echo "   ${GREEN}OK${NC}      scripts are executable"
echo ""

# 5. Summary
echo "${BOLD}Summary${NC}"
echo "   Skills:     4 (motion-craft, creative-animation, 3d-animation, production-motion)"
echo "   Agents:     $(ls "$PLUGIN_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')"
echo "   Commands:   $(ls "$PLUGIN_DIR/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')"
echo "   Refs:       $(ls -d "$PLUGIN_DIR/refs/"*/ 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "${GREEN}Animation-Pro plugin installed.${NC}"
echo "Launch Claude Code with: ${CYAN}claude --plugin-dir $PLUGIN_DIR${NC}"
