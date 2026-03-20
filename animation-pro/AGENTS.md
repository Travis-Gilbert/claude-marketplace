# Animation-Pro Agents

## Routing

The motion-architect agent is the default entry point. It evaluates the
animation request, runs the Purpose Test, selects the right tool, and
routes to a specialist agent when deeper expertise is needed.

For direct access to specialists, use the slash commands.

## Agent Index

| Agent | Domain | Triggers |
|-------|--------|----------|
| motion-architect | All | Default router. Evaluates purpose, selects tool, routes. |
| spring-engineer | Motion Craft | Spring tuning, Motion/react-spring implementation |
| scroll-animator | Motion Craft | Scroll-triggered, parallax, Locomotive Scroll |
| gesture-engineer | Motion Craft | Drag, swipe, pinch, gesture-driven animation |
| creative-coder | Creative | p5.js, PixiJS, generative art, canvas work |
| physics-simulator | Creative + 3D | Matter.js (2D), Rapier (3D), physics-driven animation |
| scene-animator | 3D | Three.js AnimationMixer, R3F useFrame, morph targets |
| camera-choreographer | 3D | Camera paths, scroll-camera, GSAP in Three.js |
| video-compositor | Production | Remotion compositions, Motion Canvas scenes |
| a11y-motion-auditor | All | prefers-reduced-motion audit, vestibular safety |
