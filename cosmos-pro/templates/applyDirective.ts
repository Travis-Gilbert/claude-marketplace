/**
 * SceneDirective -> cosmos.gl adapter.
 *
 * The single entry point that translates a Theseus SceneDirective into
 * a sequence of cosmos.gl setter calls. UI components NEVER call
 * cosmos.gl setters directly (M6); they hand a directive to this
 * function.
 *
 * This file is a TEMPLATE. Copy into the runtime project as
 *   src/lib/theseus/cosmos/applyDirective.ts
 * and add handlers as the SceneDirective contract grows. Sync
 * SceneDirective from the runtime project's
 *   src/lib/theseus-viz/SceneDirective.ts
 * into refs/theseus-viz-types/ before extending this adapter.
 */
import type { Graph } from "@cosmos.gl/graph";
import type { GraphSnapshot } from "./CosmosGraphClient";

// ---------------------------------------------------------------------------
// Type stubs.
//
// Replace these with imports from the runtime project's SceneDirective:
//   import type { SceneDirective, ConstructionPhase } from "@/lib/theseus-viz/SceneDirective";
// ---------------------------------------------------------------------------
type ConstructionPhase =
  | "galaxy"
  | "filter"
  | "build"
  | "crystallize"
  | "explore";

export type SceneDirective = {
  construction_phase: ConstructionPhase;
  active_position_layer: string;
  active_weight_layer?: string;
  active_edge_layers?: string[];
  focus_node_ids?: string[];
  highlight_node_ids?: string[];
  dim_node_ids?: string[];
  camera_target?: [number, number];
  camera_zoom?: number;
  annotations?: Array<{ id: string; text: string; node_id: string }>;
};

// ---------------------------------------------------------------------------
// Color tokens.
//
// All colors come from VIE CSS variables. Never hardcode (M4).
// ---------------------------------------------------------------------------
function cssVarToRgba(name: string): [number, number, number, number] {
  if (typeof window === "undefined") return [1, 1, 1, 1];
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return parseColor(value);
}

function parseColor(value: string): [number, number, number, number] {
  // Minimal parser: handles "#rrggbb", "rgb(r, g, b)", "rgba(r, g, b, a)".
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return [r, g, b, 1];
  }
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [
      (parts[0] ?? 0) / 255,
      (parts[1] ?? 0) / 255,
      (parts[2] ?? 0) / 255,
      parts[3] ?? 1,
    ];
  }
  return [1, 1, 1, 1];
}

// ---------------------------------------------------------------------------
// Reusable color buffers (allocated once per data-size bucket).
// ---------------------------------------------------------------------------
let colorsBuf = new Float32Array(0);
let sizesBuf = new Float32Array(0);

function ensureColors(n: number): Float32Array {
  if (colorsBuf.length < n * 4) {
    let b = 1024;
    while (b < n * 4) b *= 2;
    colorsBuf = new Float32Array(b);
  }
  return colorsBuf.subarray(0, n * 4);
}

function ensureSizes(n: number): Float32Array {
  if (sizesBuf.length < n) {
    let b = 1024;
    while (b < n) b *= 2;
    sizesBuf = new Float32Array(b);
  }
  return sizesBuf.subarray(0, n);
}

// ---------------------------------------------------------------------------
// Pending visual.
//
// Any point missing data for active_position_layer renders desaturated
// at 0.6x size (M7). Never drop points.
// ---------------------------------------------------------------------------
const PENDING_COLOR: [number, number, number, number] = [
  160 / 255,
  160 / 255,
  160 / 255,
  0.4,
];
const PENDING_SIZE_FACTOR = 0.6;

// ---------------------------------------------------------------------------
// applyDirective entry point.
// ---------------------------------------------------------------------------
export function applyDirective(
  graph: Graph,
  directive: SceneDirective,
  data: GraphSnapshot,
): void {
  switch (directive.construction_phase) {
    case "galaxy":
      return applyGalaxy(graph, directive, data);
    case "filter":
      return applyFilter(graph, directive, data);
    case "build":
      return applyBuild(graph, directive, data);
    case "crystallize":
      return applyCrystallize(graph, directive, data);
    case "explore":
      return applyExplore(graph, directive, data);
    default: {
      // Unknown phase. Log and fall back to galaxy with full pending.
      console.warn(
        "[applyDirective] unknown construction_phase, falling back to galaxy",
        directive.construction_phase,
      );
      return applyGalaxy(graph, directive, data);
    }
  }
}

// ---------------------------------------------------------------------------
// Phase: galaxy.
// ---------------------------------------------------------------------------
function applyGalaxy(
  graph: Graph,
  _directive: SceneDirective,
  data: GraphSnapshot,
): void {
  const accent = cssVarToRgba("--cp-accent");
  const colors = ensureColors(data.pointCount);
  const sizes = ensureSizes(data.pointCount);

  for (let i = 0; i < data.pointCount; i++) {
    const off = i * 4;
    colors[off] = accent[0];
    colors[off + 1] = accent[1];
    colors[off + 2] = accent[2];
    colors[off + 3] = 0.4;
    sizes[i] = 4;
  }

  graph.setConfigPartial({
    simulationFriction: 0.85,
    simulationGravity: 0.05,
    pointGreyoutOpacity: 0.4,
  });

  // Setter order: positions -> shapes -> sizes -> colors -> links -> camera.
  graph.setPointPositions(data.positions);
  graph.setPointSizes(sizes);
  graph.setPointColors(colors);
  graph.setLinks(data.links);
}

// ---------------------------------------------------------------------------
// Phase: filter.
// ---------------------------------------------------------------------------
function applyFilter(
  graph: Graph,
  directive: SceneDirective,
  data: GraphSnapshot,
): void {
  const accent = cssVarToRgba("--cp-accent");
  const colors = ensureColors(data.pointCount);
  const sizes = ensureSizes(data.pointCount);
  const highlight = new Set(directive.highlight_node_ids ?? []);
  const dim = new Set(directive.dim_node_ids ?? []);

  for (let i = 0; i < data.pointCount; i++) {
    const id = data.ids[i];
    const off = i * 4;
    if (highlight.has(id)) {
      colors[off] = accent[0];
      colors[off + 1] = accent[1];
      colors[off + 2] = accent[2];
      colors[off + 3] = 1.0;
      sizes[i] = 6;
    } else if (dim.has(id)) {
      colors[off] = PENDING_COLOR[0];
      colors[off + 1] = PENDING_COLOR[1];
      colors[off + 2] = PENDING_COLOR[2];
      colors[off + 3] = 0.1;
      sizes[i] = 3;
    } else {
      colors[off] = accent[0];
      colors[off + 1] = accent[1];
      colors[off + 2] = accent[2];
      colors[off + 3] = 0.15;
      sizes[i] = 3;
    }
  }

  graph.setConfigPartial({ pointGreyoutOpacity: 0.15 });
  graph.setPointSizes(sizes);
  graph.setPointColors(colors);
}

// ---------------------------------------------------------------------------
// Phase: build.
// ---------------------------------------------------------------------------
function applyBuild(
  graph: Graph,
  directive: SceneDirective,
  data: GraphSnapshot,
): void {
  // Build phase assumes the underlying CosmosGraphClient has already
  // narrowed the row set via the active filter. positions/links in
  // `data` are the subgraph.
  graph.setPointPositions(data.positions);
  graph.setLinks(data.links);

  if (directive.focus_node_ids && directive.focus_node_ids.length > 0) {
    // cosmos.gl exposes fitViewOfPoints in v2. Verify in
    // refs/cosmos-gl/ for the exact signature.
    (graph as unknown as { fitViewOfPoints: (ids: string[], opts?: { duration?: number }) => void })
      .fitViewOfPoints(directive.focus_node_ids, { duration: 600 });
  }
}

// ---------------------------------------------------------------------------
// Phase: crystallize.
// ---------------------------------------------------------------------------
function applyCrystallize(
  graph: Graph,
  directive: SceneDirective,
  _data: GraphSnapshot,
): void {
  graph.setConfigPartial({ simulationFriction: 0.3 });
  graph.onSimulationEnd = () => {
    // Caller wires this to reveal the text-answer panel.
    window.dispatchEvent(
      new CustomEvent("cosmos:answer-ready", { detail: { directive } }),
    );
  };
  // Labels for top-K focus nodes belong here; capped at 5000 globally
  // by the host renderer (cosmos-performance N4).
}

// ---------------------------------------------------------------------------
// Phase: explore.
// ---------------------------------------------------------------------------
function applyExplore(
  graph: Graph,
  _directive: SceneDirective,
  _data: GraphSnapshot,
): void {
  graph.setConfigPartial({ simulationFriction: 1.0 }); // damp fully
  graph.onClick = (pointIndex: number | null) => {
    if (pointIndex == null) return;
    const [id] = graph.getPointIdsByIndices([pointIndex]);
    if (!id) return;
    window.dispatchEvent(
      new CustomEvent("cosmos:point-click", { detail: { id } }),
    );
  };
  // onPointDrag, rectangle-select, etc. wire similarly. See
  // recipes/drag-to-reshape.md and recipes/selection-rectangle.md.
}
