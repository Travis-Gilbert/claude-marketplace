# Animation-Pro

Claude Code plugin for animation & motion expertise across four domains.

## Domains

| Skill | Domain | Libraries |
|-------|--------|-----------|
| motion-craft | UI transitions, gestures, micro-interactions | Motion, react-spring, Locomotive Scroll, Lottie, anime.js |
| creative-animation | Generative art, canvas, particle systems | p5.js, PixiJS, Matter.js, Vivus, D3 transition |
| 3d-animation | WebGL scene animation, camera, physics | Three.js, React Three Fiber, Drei, Theatre.js, Rapier |
| production-motion | Programmatic video, explainers | Remotion, Motion Canvas |

## What This Is

A context plugin for Claude Code. Nothing here executes in production. It provides:

- **4 skills** with 33 reference documents
- **10 specialist agents** (spring physics, scroll animation, gestures, creative coding, 3D scenes, camera, video, physics, accessibility audit, and a routing architect)
- **8 slash commands** (`/animate`, `/spring`, `/scroll-animate`, `/creative`, `/scene-animate`, `/compose-video`, `/motion-audit`, `/detect-animation`)
- **21 reference source repos** (shallow clones, trimmed of build artifacts)
- **2 utility scripts** (animation stack detection, spring physics playground)

## Installation

```bash
# Option 1: Use with --plugin-dir
claude --plugin-dir /path/to/animation-pro

# Option 2: Run install script (clones refs if tarball not present)
cd animation-pro
./install.sh
```

## Commands

| Command | Purpose |
|---------|---------|
| `/animate <component>` | Add purposeful animation with a11y |
| `/spring <component>` | Tune spring physics parameters |
| `/scroll-animate <section>` | Add scroll-driven animation |
| `/creative <brief>` | Build generative/interactive animation |
| `/scene-animate <component>` | Animate a Three.js/R3F scene |
| `/compose-video <brief>` | Build programmatic video |
| `/motion-audit <file>` | Audit animation quality and a11y |
| `/detect-animation` | Map existing animation stack |

## Core Principles

1. **Purpose Test**: Every animation must serve orientation, feedback, or relationship. If none apply, do not animate.
2. **Right tool for the job**: CSS transitions for simple state changes. Motion for layout/gesture/spring. Check what is already installed first.
3. **Accessibility is non-negotiable**: `prefers-reduced-motion` on every animated component. No exceptions.
4. **Source verification**: Verify library APIs against `refs/` source code, not training data.

## Reference Repos

21 repos totaling ~270MB (trimmed). See `REFS-MANIFEST.md` for the full inventory.

## Size

The `refs/` directory is large (~270MB). Consider excluding it from git with `.gitignore` and distributing via tarball or the install script.
