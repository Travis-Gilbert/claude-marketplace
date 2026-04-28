# hover-detail-panel

Hover a node, resolve `pointIndex` to a domain id, fetch the domain
object, populate the detail panel. Handles the async correctness issue:
hover events fire faster than any fetch the id triggers, so cancellation
matters.

## Minimal working code

```ts
import { Graph } from "@cosmos.gl/graph";

let hoverSeq = 0;

graph.onPointMouseOver = (pointIndex: number | null) => {
  if (pointIndex == null) {
    hideDetailPanel();
    return;
  }

  // Resolve index -> domain id synchronously.
  const [id] = graph.getPointIdsByIndices([pointIndex]);
  if (!id) return;

  // Issue the fetch with a sequence number; ignore stale results.
  const seq = ++hoverSeq;
  fetchObject(id).then((obj) => {
    if (seq !== hoverSeq) return; // a newer hover supersedes
    populateDetailPanel(obj);
  }).catch((err) => {
    if (seq !== hoverSeq) return;
    showDetailError(err);
  });
};

graph.onPointMouseOut = () => {
  hideDetailPanel();
};
```

The `hoverSeq` counter is the cancellation primitive. Every hover
increments it; resolved fetches check whether their seq is still the
latest. AbortController works too if the fetch supports it.

## Tuning notes

- DO NOT call cosmos.gl setters from the hover handler. Hover is a
  pure-DOM concern. Mutating the graph on hover means GPU pressure on
  every mouse move (cosmos-performance anti-pattern).
- The detail panel position should follow the cursor with a small
  offset so it doesn't occlude the hovered node. Position the panel
  with absolute / fixed CSS, not by re-rendering React on every move.
- Debounce the FETCH only if requests are expensive. Don't debounce
  the index resolution — that's free.
- For nodes with rich detail (full claim text, evidence chains, etc.),
  show a teaser on hover and full detail on click. Click can route to
  a side panel; hover is preview only.

## When to use this

- Each node represents a domain object the user might want to inspect.
- The detail content is small and fast to fetch (or already in the
  Mosaic-loaded data).
- Hover is the right level of commitment for the user's intent.

## When NOT to use this

- The detail content is large or slow to fetch. Use click-to-open-panel
  instead; hover-fetch produces visual stutter.
- Mobile / touch devices. Hover doesn't exist; route to long-press or
  click instead.
- The graph is so dense that hovers fire constantly as the cursor moves
  through the layout. Render labels-on-hover instead of a detail panel.
- The panel content depends on multiple selected nodes — that's a
  click-to-multiselect interaction, not a hover.
