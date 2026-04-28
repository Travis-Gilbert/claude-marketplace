/**
 * React provider that exposes the shared Mosaic Coordinator + DuckDB
 * connection to descendant cosmos.gl canvases and vgplot charts.
 *
 * Hard rule (M5): exactly one Coordinator per page. This provider is
 * the single writer.
 *
 * This file is a TEMPLATE. Copy into the runtime project as
 *   src/components/theseus/explorer/CosmosMosaicProvider.tsx
 * and wire it into the explorer shell. Wrap children only after
 * `dataReady === true` so that no client subscribes before data is
 * registered.
 */
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { coordinator, wasmConnector } from "@uwdata/mosaic-core";
import type { Coordinator } from "@uwdata/mosaic-core";
import { initDuckDB, registerParquet, loadGraphPoints } from "@/lib/theseus/cosmos/duckdb";

type CosmosMosaicContextValue = {
  coordinator: Coordinator;
  dataReady: boolean;
};

const CosmosMosaicContext = createContext<CosmosMosaicContextValue | null>(null);

export function useCosmosMosaic(): CosmosMosaicContextValue {
  const ctx = useContext(CosmosMosaicContext);
  if (!ctx) {
    throw new Error(
      "useCosmosMosaic must be used inside <CosmosMosaicProvider>",
    );
  }
  return ctx;
}

type Props = {
  children: ReactNode;
  /** URLs of Parquet files to register at mount. */
  pointsParquetUrl: string;
  linksParquetUrl?: string;
  /** Loading visual rendered until dataReady fires. */
  loadingFallback?: ReactNode;
};

export function CosmosMosaicProvider({
  children,
  pointsParquetUrl,
  linksParquetUrl,
  loadingFallback = null,
}: Props) {
  const coord = useMemo(() => coordinator(), []);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { db, conn } = await initDuckDB();

      // Register data files.
      await registerParquet(db, "graph_points.parquet", pointsParquetUrl);
      await loadGraphPoints(conn, "graph_points.parquet", "graph_points");

      if (linksParquetUrl) {
        await registerParquet(db, "graph_links.parquet", linksParquetUrl);
        await conn.query(`
          CREATE OR REPLACE TABLE graph_links AS
          SELECT * FROM read_parquet('graph_links.parquet');
        `);
      }

      // Wire the Coordinator to DuckDB-WASM.
      coord.databaseConnector(wasmConnector({ duckdb: db, connection: conn }));

      if (!cancelled) setDataReady(true);
    })();

    return () => {
      cancelled = true;
      // Note: we do NOT destroy the Coordinator here because it is a
      // module-scoped singleton (per M5). Page unmount lets the next
      // mount reuse it. If your routing requires teardown, call
      // `coord.clear()` instead — never `coord = new Coordinator()`.
    };
  }, [coord, pointsParquetUrl, linksParquetUrl]);

  const value = useMemo<CosmosMosaicContextValue>(
    () => ({ coordinator: coord, dataReady }),
    [coord, dataReady],
  );

  if (!dataReady) return <>{loadingFallback}</>;

  return (
    <CosmosMosaicContext.Provider value={value}>
      {children}
    </CosmosMosaicContext.Provider>
  );
}
