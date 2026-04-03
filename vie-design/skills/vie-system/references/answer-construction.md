# Answer Construction — The Five-Phase Sequence

This is the centerpiece of the product. When a user asks a question, they should see the answer form.

## Phase 1: Galaxy State

The full knowledge graph (or a relevant region of it) is visible as a loose galaxy of nodes in 3D space. Nodes glow softly at their type colors. The graph is alive, gently drifting.

**Visual spec:**
- All nodes visible at low emissive intensity
- Type colors applied: source (#2D5F6B), concept (#7B5EA7), person (#C4503C), hunch (#C49A4A), note (#e8e5e0)
- Gentle Brownian drift (small random forces, low alpha)
- Camera at wide overview position
- Datadot grid visible behind (if not in full R3F mode)
- Engine heat gradient at idle coverage (30-40%)

## Phase 2: Filtering

As Theseus processes the query, irrelevant nodes dim and recede. Relevant nodes brighten. The galaxy contracts around the relevant cluster. This should feel like stars coming into focus, not like items being deleted.

**Visual spec:**
- Irrelevant nodes: reduce emissive intensity to near-zero, reduce opacity to 0.1-0.2
- Relevant nodes: increase emissive intensity, scale up slightly (1.2-1.5x)
- Camera slowly pulls toward the relevant cluster centroid
- Engine heat gradient expands to 50-60%
- Timing: 2-4 seconds
- Easing: ease-in-out for node fading, ease-out for camera movement

**TF.js responsibilities:**
- Score each node's salience (cosine similarity to query embedding)
- Determine relevance threshold
- Classify topology of relevant subgraph
- Plan construction sequence

## Phase 3: Construction

Edges begin to form between relevant nodes. Clusters coalesce. The disconnected nodes become a connected structure. If it's a force-directed graph, D3 runs the force simulation and R3F animates the nodes moving into their computed positions. If it's a different answer type (heatmap, timeline, geographic), the relevant data shapes itself into the visualization form.

**Visual spec — graph answers:**
- Edges draw progressively (line grows from source to target over 200-400ms each)
- Edge order determined by TF.js sequence directive
- D3 force simulation runs, R3F interpolates node positions toward computed targets
- Clusters coalesce visually as force simulation converges
- Engine heat gradient at 60-70%
- Timing: 3-6 seconds total

**Visual spec — data-viz answers:**
- Data points flow into position (geographic heatmap, timeline, chart)
- Surface geometry builds progressively
- Color fills in as data values resolve
- Timing: 3-6 seconds total

**Visual spec — hybrid answers:**
- Graph construction happens first (establishes context)
- Data visualization surfaces build alongside or after
- Connecting elements appear last

## Phase 4: Crystallization

The construction sequence completes. Labels appear. The model stabilizes. The text answer becomes available alongside the visual.

**Visual spec:**
- Labels fade in on key nodes (0.5-1s fade)
- A subtle completion pulse (brief brightness increase across all relevant nodes)
- Force simulation alpha drops to near-zero (model stabilizes)
- Glass-morphism text answer panel fades in at TF.js-determined position
- Engine heat gradient returns to idle (30-40%)
- Timing: 1-2 seconds

**Text answer panel:**
- Position determined by TF.js based on scene composition (typically right side desktop, bottom sheet mobile)
- Glass-morphism: `background: rgba(15,16,18,0.66-0.76)`, `backdrop-filter: blur(18px)`
- Shadow: `--vie-shadow-lg`
- Can be dismissed or expanded
- Text is not narrating the visual; it is the LLM's own reasoning about the same knowledge

## Phase 5: Exploration

The user clicks nodes to go deeper. They can double-click for an immediate deeper insight. They can remove a node and see (via TMS) what that removal does to the answer's confidence. They can ask follow-up questions and watch the model refine itself.

**Interaction spec:**
- **Single click:** Select node, show summary tooltip, highlight connected edges
- **Double click:** Zoom to node, open Vaul drawer with full reasoning chain
- **Long-press / right-click:** Context menu (remove, explore, validate)
- **Remove node:** Node fades out, connected edges dim, confidence display updates (TMS)
- **Follow-up question:** Enter in prompt input, model transitions (back to Phase 2)
- **Drag:** Reposition node in 3D space
- **Scroll/pinch:** Zoom camera

## The Custom Data-Visualization Answer Model

When Theseus's graph isn't confident enough, it searches the web, gathers data, and constructs a custom visualization. The NYC taxi heatmap is an example: the question "What is the traffic pattern of New York taxis?" produces a luminous geographic heatmap built from actual data, animated into existence, interactive.

**Framework:**
- DuckDB for data processing
- D3 for layout/projection
- R3F for rendering
- TF.js for scene intelligence

**Construction shows data acquisition:**
- Graph shows partial answer (what Theseus knows)
- Progress bar appears showing data acquisition stages
- As data arrives, visualization reshapes in real time
- Geographic heatmap surface builds, timeline extends, data points flow into position

## Timing Summary

The canonical timing reference table is in the `vie-motion` agent. Consult `agents/vie-motion.md` for all animation durations and easing functions.
