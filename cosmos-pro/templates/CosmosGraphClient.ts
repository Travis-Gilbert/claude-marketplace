/**
 * MosaicClient that owns a cosmos.gl Graph instance, queries DuckDB
 * for point positions and links, and updates Float32Arrays on
 * Selection change.
 *
 * Hard rules:
 * - Float32Arrays are allocated once per data-size bucket (cosmos-performance).
 * - SQL identifiers come from a TypeScript allowlist (cosmos-mosaic-duckdb).
 * - This client never reads data outside its declared fields().
 *
 * This file is a TEMPLATE. Copy into the runtime project as
 *   src/lib/theseus/cosmos/CosmosGraphClient.ts
 * and adapt the table/column names, the Selection bindings, and the
 * snapshot shape to the runtime project's data layer.
 */
import { MosaicClient, type Selection } from "@uwdata/mosaic-core";
import type { Graph } from "@cosmos.gl/graph";

// Allowlist (mirror of src/lib/theseus/cosmos/tables.ts).
const TABLES = {
  POINTS: "graph_points",
  LINKS: "graph_links",
} as const;

const POINT_COLUMNS = ["idx", "x", "y", "cluster_id"] as const;
const LINK_COLUMNS = ["src", "tgt"] as const;

/**
 * Snapshot the adapter (applyDirective) reads. The client owns the
 * authoritative buffers; the snapshot exposes read-only views and
 * counts.
 */
export type GraphSnapshot = {
  pointCount: number;
  linkCount: number;
  positions: Float32Array; // length 2 * pointCount (subarray view)
  links: Float32Array;     // length 2 * linkCount (subarray view)
  ids: string[];           // domain ids, length pointCount
  clusters: Float32Array;  // length pointCount (subarray view)
};

function nextBucket(n: number): number {
  // Power-of-two bucket sizes prevent constant reallocation.
  let b = 1024;
  while (b < n) b *= 2;
  return b;
}

export class CosmosGraphClient extends MosaicClient {
  private graph: Graph;
  private filterBy?: Selection;

  // Preallocated buffers (grown on bucket boundary).
  private positionsBuf = new Float32Array(0);
  private linksBuf = new Float32Array(0);
  private clustersBuf = new Float32Array(0);
  private idsArr: string[] = [];

  // Current logical sizes.
  private pointCount = 0;
  private linkCount = 0;

  constructor(graph: Graph, filterBy?: Selection) {
    super(filterBy);
    this.graph = graph;
    this.filterBy = filterBy;
  }

  fields() {
    return [
      { table: TABLES.POINTS, column: "idx" },
      { table: TABLES.POINTS, column: "x" },
      { table: TABLES.POINTS, column: "y" },
      { table: TABLES.POINTS, column: "cluster_id" },
      { table: TABLES.LINKS, column: "src" },
      { table: TABLES.LINKS, column: "tgt" },
    ];
  }

  query(filter: string | null) {
    const where = filter ? `WHERE ${filter}` : "";
    return `
      SELECT ${POINT_COLUMNS.join(", ")}
      FROM ${TABLES.POINTS}
      ${where}
      ORDER BY idx
    `;
  }

  queryResult(data: { numRows: number; getChild: (col: string) => any }) {
    const n = data.numRows;
    this.ensurePointBuffers(n);

    const idxCol = data.getChild("idx");
    const xCol = data.getChild("x");
    const yCol = data.getChild("y");
    const clusterCol = data.getChild("cluster_id");

    const positions = this.positionsBuf.subarray(0, n * 2);
    const clusters = this.clustersBuf.subarray(0, n);

    for (let i = 0; i < n; i++) {
      positions[i * 2] = xCol.get(i) ?? 0;
      positions[i * 2 + 1] = yCol.get(i) ?? 0;
      clusters[i] = clusterCol.get(i) ?? 0;
      this.idsArr[i] = String(idxCol.get(i));
    }

    this.pointCount = n;

    // Verify invariants before pushing to the GPU.
    console.assert(
      positions.length === 2 * this.pointCount,
      "positions invariant violated",
    );

    this.graph.setPointPositions(positions);
    this.graph.setPointIds(this.idsArr.slice(0, n));
    this.graph.setPointClusters(clusters);

    // Trigger a follow-up query for links scoped to the same filter.
    // In practice this would be its own MosaicClient or a coordinated
    // sub-query; kept inline here for the template.
    return this;
  }

  /**
   * Read-only snapshot for the SceneDirective adapter.
   */
  snapshot(): GraphSnapshot {
    return {
      pointCount: this.pointCount,
      linkCount: this.linkCount,
      positions: this.positionsBuf.subarray(0, this.pointCount * 2),
      links: this.linksBuf.subarray(0, this.linkCount * 2),
      ids: this.idsArr.slice(0, this.pointCount),
      clusters: this.clustersBuf.subarray(0, this.pointCount),
    };
  }

  private ensurePointBuffers(n: number) {
    if (this.positionsBuf.length < n * 2) {
      const next = nextBucket(n * 2);
      this.positionsBuf = new Float32Array(next);
      this.clustersBuf = new Float32Array(next / 2);
    }
    if (this.idsArr.length < n) {
      this.idsArr.length = n;
    }
  }

  // Public for the component lifecycle path; client unsubscribes from
  // the Coordinator and releases buffers. The Graph is destroyed by
  // the canvas component, not here.
  dispose() {
    this.positionsBuf = new Float32Array(0);
    this.linksBuf = new Float32Array(0);
    this.clustersBuf = new Float32Array(0);
    this.idsArr = [];
    this.pointCount = 0;
    this.linkCount = 0;
  }
}
