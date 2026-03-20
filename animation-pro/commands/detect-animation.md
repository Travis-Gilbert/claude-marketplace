---
description: Map the existing animation stack in a project.
allowed-tools: Read, Grep, Glob, LS, Bash
argument-hint: (none)
---

Detect and map all animation in the current project.

1. Run detection scans:
   ```bash
   # Installed libraries
   grep -E '"(motion|framer-motion|react-spring|@react-spring|anime|animejs|gsap|lottie|p5|pixi|three|@react-three|remotion|@theatre|locomotive-scroll|auto-animate)"' package.json

   # CSS animation
   grep -rn "@keyframes\|animation:\|transition:" src/ --include="*.css" --include="*.scss" --include="*.module.css" | wc -l

   # JS animation usage
   grep -rn "motion\.\|useSpring\|useTrail\|AnimatePresence\|useFrame\|anime(" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" | wc -l

   # Reduced motion handling
   grep -rn "prefers-reduced-motion\|useReducedMotion" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.css" | wc -l
   ```
2. Inventory each animation library found, its version, and usage count.
3. Identify any duplicate/overlapping libraries (e.g., Motion + react-spring).
4. Count animated components vs. reduced-motion-aware components.
5. Flag any animation without accessibility handling.

Report: installed libraries, usage counts, overlap warnings, a11y coverage.
