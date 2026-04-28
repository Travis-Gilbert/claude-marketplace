# basic-force-graph

The "hello world." A vanilla cosmos.gl `Graph` instance with default
force tuning, taking flat Float32Array inputs. Use as the starting point
when no other recipe applies — but most real Theseus scenes start from
`pinned-layer-positions` or `clustering-force` instead.

## Minimal working code

```ts
import { Graph } from "@cosmos.gl/graph";

const canvas = document.querySelector<HTMLCanvasElement>("#cosmos")!;

const pointCount = 200;
const positions = new Float32Array(pointCount * 2);
for (let i = 0; i < pointCount; i++) {
  positions[i * 2] = Math.random() * 2 - 1;     // x in [-1, 1]
  positions[i * 2 + 1] = Math.random() * 2 - 1; // y in [-1, 1]
}

const linkCount = 280;
const links = new Float32Array(linkCount * 2);
for (let i = 0; i < linkCount; i++) {
  links[i * 2] = Math.floor(Math.random() * pointCount);
  links[i * 2 + 1] = Math.floor(Math.random() * pointCount);
}

const graph = new Graph(canvas, {
  enableSimulation: true,
  initialZoomLevel: 1,
  randomSeed: 42,
  simulationRepulsion: 0.3,
  simulationGravity: 0.1,
  simulationFriction: 0.85,
  simulationLinkSpring: 0.5,
  simulationLinkDistance: 8,
});

graph.setPointPositions(positions);
graph.setLinks(links);
```

## Tuning notes

| Symptom | Knob to adjust |
|---|---|
| Nodes overlap | Increase `simulationRepulsion` (try 0.5) |
| Nodes scatter offscreen | Decrease `simulationRepulsion` or increase `simulationGravity` |
| Layout never settles | Decrease `simulationFriction` (try 0.7), or run warmup ticks |
| Layout settles too fast (sticky) | Increase `simulationFriction` toward 0.95 |
| Links too long | Decrease `simulationLinkDistance` |
| Links too rigid | Decrease `simulationLinkSpring` |

After the layout settles once, drop friction to 0.85 for interactive
exploration (see `recipes/empty-state-and-loading.md` for the warmup
pattern).

## When to use this

- The data is fully synthetic or for a smoke test.
- No upstream `layer_positions` exist yet and the goal is to confirm the
  cosmos.gl + canvas wiring works at all.
- You are debugging a regression and want to confirm cosmos.gl renders
  before reintroducing the real data path.

## When NOT to use this

- Real Theseus scenes — start from `pinned-layer-positions.md` because
  upstream layers (SBERT, KGE) almost always exist for production data.
- When the goal is to show clusters from Leiden / community detection —
  use `clustering-force.md` instead so cluster centers are explicit.
- When the data already lives in DuckDB — never bypass the Mosaic
  Coordinator. Wire through `CosmosGraphClient` even for a "hello world."
