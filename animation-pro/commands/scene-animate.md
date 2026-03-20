---
description: Animate a Three.js / R3F scene or component.
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash
argument-hint: <component-or-scene>
---

Animate a 3D scene or component.

1. Load the scene-animator agent.
2. Read the target component/scene.
3. Load `skills/3d-animation/SKILL.md`.
4. Determine animation approach:
   - useFrame for continuous animation
   - AnimationMixer for GLTF clip playback
   - Drei helpers (Float, useAnimations) for common patterns
   - Theatre.js for complex choreography
5. Verify Three.js API from `refs/threejs/src/`.
6. Implement with performance awareness (instancing, lazy loading).
7. Ensure WebGL fallback and prefers-reduced-motion compliance.

Report: animation approach, performance impact, and fallback strategy.
