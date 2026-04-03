---
name: vie-design
description: >-
  Visual design partner for Theseus VIE. This skill should be used when the
  user asks about "theseus UI", "VIE design", "answer construction",
  "galaxy view", "node interaction", "datadot grid", "engine heat",
  "how should this answer look", "make this beautiful", "what-if interaction",
  "data-visualization answer", "custom model", "heatmap answer", or any
  request to design a Theseus visual experience. Also triggers on questions
  about how Theseus should visually present a specific type of answer.
  Takes precedence over design-pro for all Theseus visual work.
  Produces handoff documents for Claude Code with the vie-design plugin.
version: 2.0.0
---

# VIE Design Partner

Plan screens, answer construction sequences, and interactive experiences for
Theseus VIE using the VIE design language.

## Design Process

For every design request, work through these questions in order:

1. **Answer type** — Is this a graph-native answer, a data-visualization answer, or a hybrid?
2. **Construction sequence** — How does the answer build itself? (galaxy filter, data shape, progressive build)
3. **Text panel position** — Where does the LLM's text answer sit? (TF.js determines position based on scene composition)
4. **Exploration affordances** — How does the user go deeper? (node click, drawer, follow-up prompt)
5. **Datadot grid state** — Visible, hidden behind R3F, or pulsing?
6. **Engine heat gradient** — Coverage and intensity per phase?
7. **Feel check** — Is this beautiful and fun, not clinical?

## Pipeline Configuration

For each answer type, specify all three pipeline stages:

### Graph-Native Answers
- **D3:** Force simulation parameters (charge strength, link distance, force model)
- **TF.js:** Salience scoring, topology classification, construction sequence, camera placement
- **R3F:** Node materials, edge rendering, lighting, interaction handlers

### Data-Visualization Answers
- **D3:** Data scales, projections, binning, layout computation
- **TF.js:** Emphasis decisions, animation pacing, camera framing
- **R3F:** Surface geometry (heatmap), point clouds (scatter), mesh (geographic)
- **Vega-Lite:** Consider for standard statistical charts where custom D3 is overkill
- **Observable Framework:** Consider for additional layout algorithms

### Hybrid Answers
- **D3:** Both graph layout and data scales
- **TF.js:** Composition of graph context with data visualization
- **R3F:** Scene composition with both graph nodes and data surfaces

### 2D Fallback
- When to use Sigma/Graphology instead of R3F (mobile, accessibility, very dense graphs)
- D3 still computes layout; only the renderer changes

## Handoff Document Format

Produce this structure for every design:

```
## Answer Type: [graph-native / data-viz / hybrid]
## Construction Sequence:
  - Phase 1 (Galaxy): [what the user sees initially]
  - Phase 2 (Filter): [how irrelevant nodes recede]
  - Phase 3 (Build): [how the answer model forms]
  - Phase 4 (Crystallize): [completion state]
  - Phase 5 (Explore): [interaction affordances]
## Pipeline Configuration:
  - D3: [layout algorithm, force model, scales]
  - TF.js: [salience rules, topology, camera intent]
  - R3F: [materials, lighting, interaction handlers]
## Text Answer Panel:
  - Position: [TF.js-determined or specified]
  - Content: [what the LLM's reasoning contributes]
## Datadot Grid: [visible / hidden / pulsing]
## Engine Heat Gradient: [coverage and intensity per phase]
## Design Primitives Used: [Sonner / Vaul / CMDK]
## Mantine Tokens Applied: [shadow levels, Paper usage]
## Feel Check: [is this fun? is this beautiful? would you want to play with it?]
## Claude Code Instructions: [what to build, in what order]
```

## Material Stack Reference

- **Mantine:** Shadow/elevation/spacing/z-index tokens, Paper surfaces
- **Radix:** Behavioral primitives (dialog, tooltip, dropdown)
- **Sonner:** Toasts (bottom-right, dark theme, VIE tokens)
- **Vaul:** Bottom-up slide drawers for detail exploration
- **CMDK:** Command palette (Cmd+K)
- **Ink UI patterns:** Spinner (loading), progress bar (construction), typing effect (input). Reference only.

## Anti-Patterns

Flag and reject these in any design:

- Static answers that appear all at once with no construction animation
- Research control panel aesthetic (tabs, modes, technical labels)
- Text answer dominating visual or visual dominating text
- Hardcoded colors instead of VIE tokens
- Missing shadow/elevation on floating surfaces
- Datadot grid without binary data
- Bypassing the D3 -> TF.js -> R3F pipeline
- Sans-serif where monospace system-voice is needed

## Cross-Plugin Coordination

Delegate implementation to specialized plugins:
- 3D scene creation and rendering: **R3F MCP**
- D3 chart grammar and Observable patterns: **D3-Pro**
- Backend reasoning and scene intelligence: **Theseus-Pro**
- React internals and Next.js routing: **JS-Pro**
- Animation springs and Motion API: **Animation-Pro**

This skill owns visual design judgment, design tokens, material vocabulary,
construction animation design, and overall visual identity.
