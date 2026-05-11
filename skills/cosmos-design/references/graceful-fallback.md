# Graceful fallback

Two kinds of fallback: pending-state for missing layer data
(per-point), and Sigma 2D for capability gaps (whole-renderer).
Both must be designed in, not bolted on.

## Pending state (per-point)

When a SceneDirective sets `active_position_layer = "sbert_umap_v3"`
but some points don't have `layer_positions["sbert_umap_v3"]`, the
adapter MUST render those points anyway. Dropping silently means the
user sees a smaller graph than they expect and never learns why.

### The pending visual

| Property | Value |
|---|---|
| Position | Cluster center (or graph centroid if no cluster) |
| Color | Desaturated grey, low alpha (e.g., `rgba(160,160,160,0.4)`) |
| Size | 0.6× of the active size for that node |
| Shape | Hollow circle (or whatever the design system has tokenized as "pending") |
| Label | None (pending nodes don't get labels) |

The pending visual communicates "we have this node but not in this
layer yet." It is honest. The user can hover for details ("Pending:
no SBERT embedding for this object yet") and the empty-coverage area
is visible at a glance.

### When pending state applies

- A new layer is being rolled out and not all objects have been
  processed yet.
- A user-defined layer (e.g., from drag-to-reshape) covers only some
  nodes by design.
- A computed layer failed for some objects (e.g., sentences too short
  for SBERT).

In all three cases the renderer behavior is the same; the upstream
job that recomputes the layer is the fix path.

### When pending state does NOT apply

- The layer doesn't exist at all in the runtime — the picker should
  be hidden or disabled, the directive should never select it.
- The active layer covers all points — pending state isn't triggered.

## Sigma 2D fallback (whole-renderer)

When WebGL2 is unavailable or the device is too weak, the entire
cosmos.gl path is replaced by a Sigma 2D rendering. The user sees a
working graph with reduced fidelity, not a black canvas.

### Trigger conditions

- WebGL2 not supported.
- WebGL2 supported but `EXT_float_blend` extension unavailable.
- WebGL2 supported but `OES_texture_float` extension unavailable.
- User explicit preference (a settings toggle).

### What's lost in 2D fallback

- GPU heatmap overlay (the `gpu-heatmap-overlay.md` recipe).
- Smooth animation at very large graph sizes (Sigma can't match
  cosmos.gl at 50K+ points).
- Drag-to-reshape with simulation — Sigma's drag is supported but
  feels different.

### What's preserved

- All seven SceneDirective fields. Sigma has its own adapter
  consuming the same directive type.
- All Mosaic Selection wiring. The data layer is renderer-agnostic.
- All vgplot charts. They render in DOM, not WebGL.
- All construction phases. The visual language is reduced but the
  pacing is the same.

### How to design for fallback

Design the cosmos.gl path first. After it ships, audit each recipe:
"Does the Sigma version of this still answer the user's question?"
If not, simplify the cosmos.gl path until it does (or accept that
the recipe is cosmos.gl-only and gate it behind capability detection).

The goal is functional parity, not visual parity. The user on an old
iPhone should be able to answer the same question as the user on a
desktop, even if the answer looks less impressive.

## Errored state (whole-renderer)

When DuckDB fails to load, or the data files 404, or the network is
out — the renderer must show an explicit error with the actual reason
(not a generic "Something went wrong"). The recipe
`empty-state-and-loading.md` covers this.

## Honest empty states

When a filter returns zero rows, render an empty-state panel that
says "No objects match these filters" and offers a way out (clear
filters button). Never show a blank canvas, never fake content, never
silently rerender stale data.

This is the bridge to the project's broader rule: "No fake UI, no
mock data in shipped surfaces." The pending state, the Sigma fallback,
and the empty state are all variants of being honest about what the
system knows.
