---
name: vie-system
description: >-
  This skill should be used when working on any Theseus VIE UI code,
  including "theseus components", "VIE styles", "datadot grid",
  "engine heat gradient", "answer construction", "glass-morphism panels",
  "Mantine tokens", "VIE color tokens", "Theseus typography",
  "VIE pipeline", "D3 to R3F", "renderer pipeline",
  "R3F rendering", "force simulation", or any
  design system question about the Theseus visual answer engine. Provides
  the complete VIE design language specification, renderer pipeline contract,
  material token mappings, and component specs.
version: 2.0.0
---

# VIE Design System

Theseus VIE is a visual answer engine. Users ask questions and watch answers
construct themselves as interactive models in real time. The visual answer and
the text answer are co-equal modalities, both grounded in the same GNN-fused
knowledge graph. The experience must be beautiful, visually striking, and fun
to navigate.

## Core Interaction

1. A galaxy of knowledge nodes exists (the user's graph, alive and navigable)
2. User asks a question
3. The galaxy filters down to relevant information as Theseus thinks
4. Disconnected relevant nodes build into a connected answer model in real time
5. The user interacts with nodes to go deeper into reasoning
6. The user can remove or add nodes and see what that does to answer accuracy (TMS-powered what-if)
7. If the graph alone isn't confident enough, Theseus searches the web and constructs a custom data-visualization answer model
8. The interaction itself becomes training data for the scorer, GNN, and relevant engines

## Renderer Pipeline

D3 computes layout (force simulations, hierarchical positioning, geographic projections, data scales). TF.js directs scene intelligence (salience scoring, emphasis, hypothesis styling, construction sequencing, camera placement). R3F renders the 3D interactive experience. This is a pipeline, not alternatives.

**Pipeline flow:** `Backend reasoning -> D3 layout computation -> TF.js scene intelligence -> R3F rendering`

**Fallbacks:**
- Sigma/Graphology: 2D fallback when 3D is inappropriate (mobile, accessibility, dense graphs). D3 still computes layout; only the renderer changes.
- Vega-Lite: Declarative chart path for standard statistical charts. R3F not involved unless the chart needs 3D scene context.
- Observable Framework: Additional layout algorithms and chart patterns for the D3 computation layer.

## Visual Layers

### Layer 1: Substrate (Datadot Grid)
Port from `DotGrid.tsx` (not `TealDotGrid.tsx`). Must include binary data (0s and 1s), mulberry32 PRNG, spring physics with mouse repulsion, ink trail. Background `#0f1012`, dormant dots `rgba(156, 149, 141, 0.04)`, active dots `rgba(74, 138, 150, 0.10-0.15)`. Hidden when R3F is active renderer. See `references/datadot-grid.md`.

### Layer 2: Engine Heat Gradient
Warm gradient from bottom of viewport. Terracotta `rgba(196, 80, 60, 0.06)` and amber `rgba(196, 154, 74, 0.04)`. 30-40% coverage at idle, 60-70% during active reasoning. CSS gradient overlay, 2-3s transitions.

### Layer 3: Borrowed Ink UI Patterns
Spinner (`braille` sequence, teal-blue monospace), progress bar (block characters with percentage), typing effect (search/prompt input). These are polish elements for specific moments.

### Layer 4: Material Surfaces (Mantine tokens)
Mantine theming for tokens (shadows, elevation, z-index, spacing, radii). Radix primitives for behavioral accessibility. Glass-morphism panels: `background: rgba(15,16,18,0.66-0.76)`, `backdrop-filter: blur(18px)`, `border-radius: 18-22px`. See `references/material-tokens.md`.

### Layer 5: Design Primitives
Sonner (toasts, bottom-right), Vaul (bottom-up drawers for detail exploration), CMDK (command palette via Cmd+K). See `references/design-primitives.md`.

## Answer Construction (5 Phases)

1. **Galaxy** — Full knowledge graph visible, nodes glow softly at type colors, gently drifting
2. **Filtering** — Irrelevant nodes dim and recede, relevant brighten, galaxy contracts
3. **Construction** — Edges form, clusters coalesce, D3 simulation + R3F interpolation
4. **Crystallization** — Labels appear, model stabilizes, text answer panel fades in
5. **Exploration** — Click nodes for deeper insight, remove/add nodes for what-if, follow-up questions

See `references/answer-construction.md` for detailed phase specs.

## Typography

| Role | Font | Size | Weight | Tracking |
|------|------|------|--------|----------|
| Title/heading | Vollkorn (serif) | 1.25-1.55rem | 400-600 | normal |
| Body/text answer | IBM Plex Sans | 14px | 400 | normal |
| Labels/status | JetBrains Mono | 11px | 400 | 0.08em |
| Data/code | JetBrains Mono | 13px | 400 | normal |

Monospace labels: uppercase, letter-spaced. Distinguishes system-voice from content-voice. See `references/typography.md`.

## Color Tokens

Apply VIE CSS custom properties exclusively. Never hardcode colors. Key tokens:
- Engine states: `--vie-state-idle`, `--vie-state-thinking`, `--vie-state-constructing`, `--vie-state-exploring`, `--vie-state-error`
- Object types: `--vie-type-source` (#2D5F6B), `--vie-type-concept` (#7B5EA7), `--vie-type-person` (#C4503C), `--vie-type-hunch` (#C49A4A), `--vie-type-note` (#e8e5e0)
- Shadows: `--vie-shadow-xs` through `--vie-shadow-xl` (mapped from Mantine)

Full token reference: `references/color-tokens.md`.

## Reference Files

Consult these for detailed specifications:

- **`references/design-language.md`** — Complete VIE design language (Part 1 of spec)
- **`references/renderer-pipeline.md`** — D3 -> TF.js -> R3F pipeline contract
- **`references/answer-construction.md`** — The five-phase construction sequence
- **`references/datadot-grid.md`** — Porting DotGrid.tsx to Theseus dark theme
- **`references/material-tokens.md`** — Mantine token mapping to VIE CSS vars
- **`references/design-primitives.md`** — Sonner, Vaul, CMDK specs
- **`references/data-viz-answers.md`** — Custom data-visualization answer models (DuckDB, D3, R3F)
- **`references/color-tokens.md`** — Full VIE token reference
- **`references/typography.md`** — Type scale, font stack, usage rules

## Grepping Refs (paths relative to plugin root `vie-design/`)

For Mantine shadow/elevation source: `grep -r "shadow" refs/mantine/packages/mantine-core/src/`
For Sonner API patterns: `grep -r "toast" refs/sonner/src/`
For Vaul drawer patterns: `grep -r "Drawer" refs/vaul/src/`
For CMDK API: `grep -r "Command" refs/cmdk/src/`
For Ink UI spinner/progress: `grep -r "Spinner\|ProgressBar" refs/ink-ui/`
For Vega-Lite specs: `grep -r "mark\|encoding" refs/vega-lite/`
For Observable patterns: `grep -r "Plot\|Framework" refs/observable-framework/`
