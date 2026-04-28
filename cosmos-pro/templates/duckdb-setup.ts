/**
 * Canonical DuckDB-WASM initialization for cosmos-pro.
 *
 * - Pinned to @duckdb/duckdb-wasm 1.32.0 to match the runtime project.
 * - Uses the MVP bundle (smallest WASM); upgrade to EH bundle only if
 *   the runtime needs exception handling features.
 * - Caches the AsyncDuckDB and Connection at module scope so every
 *   page mount reuses them.
 *
 * Usage:
 *   const { db, conn } = await initDuckDB();
 *
 * Then pass `db` and `conn` to a Mosaic Coordinator via a connector
 * (see mosaic-provider.tsx for the React wiring).
 *
 * This file is a TEMPLATE. Copy into the runtime project as
 *   src/lib/theseus/cosmos/duckdb.ts
 * and adapt imports to the project's bundler conventions.
 */
import * as duckdb from "@duckdb/duckdb-wasm";

// Vite / Next.js: the ?url suffix returns the asset URL string.
// Webpack 5 also supports this via asset modules. If your bundler
// differs, replace these imports with the asset-resolution mechanism
// the bundler supports.
import duckdb_wasm_mvp from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdb_worker_mvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";

let cached: Promise<{
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}> | null = null;

export function initDuckDB() {
  if (cached) return cached;

  cached = (async () => {
    const bundle: duckdb.DuckDBBundle = {
      mainModule: duckdb_wasm_mvp,
      mainWorker: duckdb_worker_mvp,
    };
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    const conn = await db.connect();
    return { db, conn };
  })();

  return cached;
}

/**
 * Register a Parquet file from a fetched URL.
 *
 * Prefer Parquet for graph data over 10K nodes — column compression
 * cuts payload by 5-10x vs JSON.
 */
export async function registerParquet(
  db: duckdb.AsyncDuckDB,
  name: string,
  url: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  await db.registerFileBuffer(name, new Uint8Array(buffer));
}

/**
 * Register an inline JSON document. Use only for small fixtures or
 * metadata tables.
 */
export async function registerJSON(
  db: duckdb.AsyncDuckDB,
  name: string,
  json: string,
): Promise<void> {
  await db.registerFileText(name, json);
}

/**
 * Create a graph_points table from a registered Parquet file.
 * The schema is the cosmos-pro canonical points schema. Adapt columns
 * to the runtime project's actual data shape — but keep `idx`, `x`,
 * and `y` as the cosmos.gl-mapped columns.
 */
export async function loadGraphPoints(
  conn: duckdb.AsyncDuckDBConnection,
  registeredFileName: string,
  tableName = "graph_points",
): Promise<void> {
  await conn.query(`
    CREATE OR REPLACE TABLE ${tableName} AS
    SELECT * FROM read_parquet('${registeredFileName}');
  `);
}
