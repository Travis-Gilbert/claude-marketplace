# VIE Design Language — Complete Reference

## What This Product Actually Is

Theseus is a visual answer engine. A user asks a question and watches the answer construct itself as an interactive model in real time. Sometimes that model is a 3D force-directed graph that crystallizes out of a galaxy of nodes. Sometimes it is a heatmap built from data Theseus gathered from the web. Sometimes it is a timeline, a geographic overlay, a custom data visualization, or a hybrid.

**The visual answer and the text answer are two halves of a whole.** The LLM is the voice. The graphics are doing sign language. Both articulate the response, both grounded in the same knowledge graph embeddings (KGEs), which are themselves a GNN. The LLMs are trained with GNN-LLM GL Fusion, so the text and visual are tightly coupled at the model level. The LLM is not narrating graph structure; it is reasoning and drawing inferences with (or sometimes against) the graph. TF.js runs in the browser as Theseus's visual cortex, interpreting the same graph intelligence that the LLM reasons over. Sometimes the two modalities say the same thing in different ways. Sometimes the LLM draws an inference the visual hasn't surfaced. Sometimes the visual reveals a structural pattern the text can't easily articulate. They are co-equal channels, not a hierarchy.

The experience should be beautiful, visually striking, and fun to navigate. Theseus can be used as a research instrument, and that may be its highest use, but that is one use among many. The UI should not feel like a control panel for researchers. It should feel like a place where asking questions is rewarding because the answers come alive.

## What This Is Not

- A chatbot with a graph decoration
- A research control panel with tabs (ASK / ANALYZE / LOG / STRESS / CANDIDATES)
- A terminal interface
- A product where every answer looks the same

## The Core Interaction

1. A galaxy of knowledge nodes exists (the user's graph, alive and navigable)
2. User asks a question
3. The galaxy filters down to relevant information as Theseus thinks
4. Disconnected relevant nodes build into a connected answer model in real time
5. The user can interact with nodes to go deeper into reasoning for that specific part
6. The user can remove or add nodes and see what that does to the answer's accuracy (TMS-powered what-if)
7. If the graph alone isn't confident enough, Theseus searches the web, gathers data, and constructs a custom data-visualization answer model
8. The interaction itself becomes training data for the scorer, GNN, and relevant engines

## Visual Layers

### Layer 1: Substrate (The Datadot Grid)

The spatial ground truth. Adapted from the existing `DotGrid.tsx` component (not the stripped-down `TealDotGrid.tsx`). The original DotGrid has everything needed: mulberry32 PRNG for deterministic binary scatter, spring physics with mouse repulsion, ink trail, configurable density, and the `inverseVignette` mode.

**Behavioral rules:**
- The grid is present behind non-3D content (homepage, text panels)
- When R3F is the active renderer, the grid is hidden; the 3D scene is the substrate
- During thinking states, teal-blue dots can pulse subtly (breathing, not strobing)
- The grid never scrolls; it is fixed to the viewport

### Layer 2: Engine Heat Gradient

A warm gradient that rises from the bottom of the viewport. This signals engine activity below the visible surface.

- Base: transparent at top, transitioning through terracotta and amber at bottom
- Coverage: 30-40% of viewport at idle, expanding to 60-70% during active reasoning
- Transition timing: 2-3 seconds, ease-in-out
- Implementation: CSS gradient overlay, not a canvas layer

### Layer 3: Borrowed Interaction Patterns (from Ink UI)

Theseus is not a terminal. But three specific Ink UI interaction patterns translate well to the browser:

**Spinner.** For the loading screen before the answer constructs. A character-sequence spinner in monospace, teal-blue. Loading screen animation, not persistent UI.

**Progress bar.** For showing actual pipeline progress during construction. Block characters with percentage. Shows real stages: searching graph, assembling evidence, gathering external data.

**Typing effect.** For the search/prompt input bars. Characters appear as if being typed. Not for text answer content.

### Layer 4: Material Surfaces (Mantine token layer)

Mantine's theming system for tokens mapped to VIE CSS variables. Radix primitives for behavioral accessibility. Custom components for everything Theseus-specific.

### Layer 5: Design Primitive Infrastructure

Sonner (toasts), Vaul (drawer), CMDK (command palette).

## Interaction Model

The UI should be easy to navigate and fun. Not a control panel.

**Homepage.** Simple and inviting. A search input. The datadot grid breathing behind it. Maybe a few recent queries or suggested starting points. The galaxy of nodes can be ambient in the background.

**Answer workspace.** Full-viewport. The R3F scene fills the screen. The LLM's text answer floats in a glass-morphism panel (positioned by TF.js). Both visual and text are expressing the same underlying intelligence through different modalities.

**Detail exploration.** Clicking a node opens a Vaul drawer with the full reasoning chain, evidence, related objects. The visual stays on screen above.

**Follow-up.** A persistent but unobtrusive prompt input. User types a follow-up, presses enter, and the current model refines or transitions.

**What-if.** User long-presses or right-clicks a node to get options: remove, explore, validate. Removing triggers TMS to explain the impact on confidence. This should feel playful, not clinical.
