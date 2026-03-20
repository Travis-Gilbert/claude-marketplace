#!/bin/bash
# detect_animation_stack.sh
# Detects installed animation libraries and usage patterns in a project.
# Run from project root.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo "${BOLD}Animation Stack Detection${NC}"
echo "========================="
echo ""

# 1. Check package.json for animation libraries
echo "${BOLD}1. Installed Animation Libraries${NC}"
if [ -f "package.json" ]; then
  LIBS=(
    "motion" "framer-motion" "react-spring" "@react-spring"
    "anime" "animejs" "gsap" "@gsap"
    "lottie-web" "lottie-react" "@lottiefiles"
    "p5" "pixi.js" "@pixi" "pixijs"
    "three" "@react-three/fiber" "@react-three/drei"
    "remotion" "@remotion"
    "@theatre/core" "@theatre/studio" "@theatre/r3f"
    "locomotive-scroll" "auto-animate" "@formkit/auto-animate"
    "vivus" "matter-js"
    "tween.js" "@tweenjs/tween.js"
  )
  FOUND=0
  for lib in "${LIBS[@]}"; do
    VERSION=$(grep -o "\"$lib\": *\"[^\"]*\"" package.json 2>/dev/null | head -1)
    if [ -n "$VERSION" ]; then
      echo "   ${GREEN}Found${NC} $VERSION"
      FOUND=$((FOUND + 1))
    fi
  done
  if [ "$FOUND" -eq 0 ]; then
    echo "   ${YELLOW}No animation libraries found in package.json${NC}"
  fi
else
  echo "   ${RED}No package.json found${NC}"
fi
echo ""

# 2. Count animation usage in source
echo "${BOLD}2. Animation Usage in Source${NC}"
SRC_DIR="src"
if [ ! -d "$SRC_DIR" ]; then
  SRC_DIR="."
fi

CSS_COUNT=$(grep -rn "@keyframes\|animation:\|transition:" "$SRC_DIR" --include="*.css" --include="*.scss" --include="*.module.css" 2>/dev/null | wc -l | tr -d ' ')
echo "   CSS animations/transitions:  ${CYAN}$CSS_COUNT${NC} occurrences"

JS_COUNT=$(grep -rn "motion\.\|useSpring\|useTrail\|AnimatePresence\|useFrame\|anime(\|useLottie\|useAnimations" "$SRC_DIR" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l | tr -d ' ')
echo "   JS animation API calls:      ${CYAN}$JS_COUNT${NC} occurrences"

A11Y_COUNT=$(grep -rn "prefers-reduced-motion\|useReducedMotion\|shouldReduceMotion" "$SRC_DIR" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.css" 2>/dev/null | wc -l | tr -d ' ')
echo "   Reduced-motion handling:      ${CYAN}$A11Y_COUNT${NC} occurrences"
echo ""

# 3. Accessibility coverage
echo "${BOLD}3. Accessibility Coverage${NC}"
TOTAL=$((CSS_COUNT + JS_COUNT))
if [ "$TOTAL" -gt 0 ] && [ "$A11Y_COUNT" -eq 0 ]; then
  echo "   ${RED}WARNING: $TOTAL animation usages found but 0 reduced-motion handlers${NC}"
elif [ "$TOTAL" -gt 0 ]; then
  RATIO=$((A11Y_COUNT * 100 / TOTAL))
  if [ "$RATIO" -lt 50 ]; then
    echo "   ${YELLOW}Low coverage: $A11Y_COUNT reduced-motion handlers for $TOTAL animation usages ($RATIO%)${NC}"
  else
    echo "   ${GREEN}Reasonable coverage: $A11Y_COUNT reduced-motion handlers for $TOTAL animation usages ($RATIO%)${NC}"
  fi
else
  echo "   ${GREEN}No animation found (nothing to audit)${NC}"
fi
echo ""

# 4. Overlap detection
echo "${BOLD}4. Library Overlap Check${NC}"
HAS_MOTION=$(grep -c '"motion"\|"framer-motion"' package.json 2>/dev/null || echo 0)
HAS_SPRING=$(grep -c '"react-spring"\|"@react-spring"' package.json 2>/dev/null || echo 0)
if [ "$HAS_MOTION" -gt 0 ] && [ "$HAS_SPRING" -gt 0 ]; then
  echo "   ${YELLOW}WARNING: Both Motion and react-spring installed. These overlap significantly.${NC}"
  echo "   ${YELLOW}Consider consolidating to one spring animation library.${NC}"
else
  echo "   ${GREEN}No overlapping animation libraries detected${NC}"
fi

echo ""
echo "${BOLD}Detection complete.${NC}"
