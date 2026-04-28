# empty-state-and-loading

What the canvas shows while DuckDB boots, while a query is in flight,
and when the filter returns zero rows. This is where Theseus's "feel"
comes from — the system is honest about its state and never lies with
fake content.

## States to handle

| State | Visual | Trigger |
|---|---|---|
| Booting | Pulsing datadot grid + "Loading universe…" | DuckDB not yet instantiated |
| Hydrating | Datadot grid faded; "Loading <N> objects" progress | DuckDB ready, data registration in flight |
| Warmup | Cosmos canvas visible; simulation running hot for 1.5s | Data ready, first 200 sim ticks |
| Idle | Galaxy phase from `applyDirective` | Warmup complete |
| Querying | Canvas held still; subtle progress shimmer | Mosaic Selection update in flight |
| Empty | Canvas dimmed; "No objects match this filter" panel | Query returned 0 rows |
| Errored | Canvas dimmed; "Failed to load: <reason>" panel | DuckDB or network error |

## Minimal working code

The provider gates rendering on `dataReady`:

```tsx
{!dataReady && <BootingFallback />}
{dataReady && (
  <CosmosMosaicProvider {/* ... */}>
    <CosmosGraphCanvas directive={directive} />
    {pointCount === 0 && <EmptyFilterMessage />}
  </CosmosMosaicProvider>
)}
```

Warmup pattern in the canvas component:

```ts
useEffect(() => {
  if (!graph) return;
  graph.setConfigPartial({
    simulationAlpha: 1.0,
    simulationFriction: 0.5,
  });
  const t = setTimeout(() => {
    graph.setConfigPartial({ simulationFriction: 0.85 });
  }, 1500);
  return () => clearTimeout(t);
}, [graph, dataVersion]);
```

Empty filter message (rendered as a DOM overlay):

```tsx
function EmptyFilterMessage() {
  return (
    <div className="cosmos-empty-overlay">
      <p>No objects match these filters.</p>
      <button onClick={clearAllFilters}>Clear filters</button>
    </div>
  );
}
```

## Tuning notes

- The booting pulse should use the same datadot vocabulary as the rest
  of the site. vie-design owns the visual; cosmos-pro just decides
  when to render it.
- "Loading <N> objects" is honest only if N is known. If you don't
  know yet, "Loading universe…" is fine; "Loading 1000 objects" is a
  lie if the count was made up.
- Warmup duration 1500ms covers most graph sizes. For very large graphs
  (>100K points), extend to 2500ms; the layout needs longer to settle.
- Empty state must offer a way out (clear filter button). Otherwise
  the user is stuck.
- Errored state must show the actual reason. Generic "Something went
  wrong" is hostile; "Failed to fetch graph_points.parquet (404)" is
  actionable.

## When to use this

- Always. Every cosmos.gl integration MUST handle these states.

## When NOT to use this

- This is one of the few recipes that has no "when not to use." The
  states will happen; the only choice is whether to handle them
  honestly or let the user see broken UI.

  (Acceptable variant: in a static demo with no fetch, you can skip
  the booting/hydrating/errored states. But filter empty-state still
  applies.)
