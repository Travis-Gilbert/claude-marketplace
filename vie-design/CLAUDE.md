# VIE Design Plugin

Theseus VIE (Visual Intelligence Engine) design system plugin.

## Product truth

Theseus is a visual answer engine. Users ask questions and watch answers
construct themselves as interactive 3D models in real time. The visual
answer and the text answer are co-equal: the LLM is the voice, the
graphics are doing sign language, both grounded in the same GNN-fused
knowledge graph via GL Fusion. TF.js runs in browser as the visual
cortex. The experience should be beautiful and fun to navigate.

## Renderer pipeline

D3 computes layout. TF.js directs scene intelligence. R3F renders.
This is a pipeline, not a choice between alternatives. Sigma is the
2D fallback when 3D is inappropriate. Vega-Lite handles declarative
charts when custom D3 layout is overkill. Observable Framework provides
additional layout and chart patterns.

## When to use this plugin

Any work on the Theseus UI in travisgilbert.me: components in
`src/components/theseus/`, pages in `src/app/theseus/`, styles in
`src/styles/theseus.css`, visualization code in `src/lib/theseus-viz/`.

## Architectural rules

- ALWAYS consult vie-architect before building new Theseus screens
- ALWAYS consult vie-pipeline-advisor before configuring D3/TF.js/R3F
- ALWAYS run vie-critic after completing any Theseus UI work
- ALWAYS use VIE CSS custom properties; never hardcode colors
- ALWAYS ensure visual answers construct themselves (animated, not static)
- ALWAYS use Mantine tokens for shadow/elevation (see skills/vie-system/references/material-tokens.md)
- ALWAYS consider Vega-Lite for declarative charts and Observable Framework for layout patterns
- NEVER make the UI feel like a research control panel
- ALWAYS use pretext for text measurement in construction sequences, datadot
  labels, and any canvas/R3F text positioning. Never trigger DOM reflow
  during answer construction animations.
- NEVER bypass the D3 -> TF.js -> R3F pipeline
- NEVER treat text as subordinate to visual or visual as subordinate to text; they are co-equal modalities
- NEVER render the datadot grid without binary data (0s and 1s)

## Cross-plugin delegation

- For 3D scene creation and rendering: R3F MCP
- For D3 chart grammar and Observable patterns: D3-Pro
- For backend reasoning, epistemic model, scene intelligence: Theseus-Pro
- For React internals and Next.js routing: JS-Pro
- For animation implementation (springs, Motion API): Animation-Pro
- For DOM-free text measurement in renderers: Pretext (refs/pretext/)
- This plugin owns: visual design judgment, design tokens, material
  vocabulary (Mantine + Radix + custom), construction animation design,
  datadot grid, engine heat gradient, and the overall visual identity

## Material stack

- Mantine: shadow/elevation/spacing/z-index tokens, Paper surfaces
- Radix: behavioral primitives (dialog, tooltip, dropdown)
- Sonner: toasts
- Vaul: bottom drawers
- CMDK: command palette
- Ink UI patterns: spinner (loading screen), progress bar (construction),
  typing effect (search input). Reference only, not runtime dependency.

## Key file locations

- Theseus pages: `src/app/theseus/`
- Theseus components: `src/components/theseus/`
- Renderer components: `src/components/theseus/renderers/`
- Scene directive types: `src/lib/theseus-viz/SceneDirective.ts`
- VIE styles: `src/styles/theseus.css`
- Original DotGrid (port source): `src/components/DotGrid.tsx`
- TealDotGrid (to be replaced): `src/app/theseus/TealDotGrid.tsx`
