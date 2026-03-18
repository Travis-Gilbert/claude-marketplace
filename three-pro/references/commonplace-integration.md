# CommonPlace 3D Integration

How 3D views map onto existing CommonPlace data models, API endpoints,
and UI components. Every 3D view has a named 2D fallback that is already
deployed and working.

## Data Sources

### fetchFeed() -> MockNode[]

The timeline data source. Returns objects with:
- `id`, `objectSlug`, `objectType`, `objectRef`
- `title`, `summary`, `body`
- `capturedAt` (ISO date string)
- `edgeCount`, `edges[]` (with `sourceId`, `targetId`, `edge_type`, `reason`)

Used by: TimelineView, TimelineViz, and the planned 3D Timeline.

### /graph/ endpoint -> GraphNode[] + GraphLink[]

The network data source. Returns:
- `GraphNode`: `id`, `objectType`, `title`, `edgeCount`, plus optional coords
- `GraphLink`: `source`, `target` (IDs referencing GraphNode.id)

Used by: KnowledgeMap, NetworkView, and the planned 3D Knowledge Map.

### ComposeLiveResult[]

Live research results from the compose endpoint. Returns:
- `id`, `slug`, `title`, `explanation`
- `signal` (sbert, kge, tfidf, ner, shared_entity, keyword, supports, contradicts)
- `score` (0 to 1)
- `type` (object type slug)

Used by: LiveResearchGraph, ComposeDiscoveryDock, and the planned 3D Research Graph.

## Type Color System

CommonPlace uses a consistent color system for object types.
These same colors must be used in 3D views:

| Type | Color | Hex |
|------|-------|-----|
| source | Purple | #8B6FA0 |
| hunch | Amber | #C49A4A |
| concept | Teal | #2D5F6B |
| note | Burnt Orange | #B45A2D |
| person | Green | #5A8A5A |
| place | Slate | #6B7A8A |
| event | Red | #B3443B |
| quote | Blue | #4A7A9A |
| organization | Steel | #6B7A8A |
| script | Charcoal | #4A4A4A |
| task | Olive | #7A8A5A |

These come from `getObjectTypeIdentity()` in `@/lib/commonplace`.

## Signal Color System (for LiveResearchGraph)

| Signal | Color | Line Style |
|--------|-------|-----------|
| sbert | #8B6FA0 | solid |
| kge | #6B7A8A | solid |
| tfidf | #C49A4A | solid |
| ner | #2D5F6B | dashed |
| shared_entity | #4A7A9A | dashed |
| keyword | #B45A2D | dashed |
| supports | #5A8A5A | solid |
| contradicts | #B3443B | solid |

## 3D View to 2D Fallback Mapping

| 3D View | 2D Fallback Component | Data Source |
|---------|----------------------|-------------|
| 3D Timeline | `TimelineViz.tsx` | fetchFeed() |
| 3D Knowledge Map | `KnowledgeMap.tsx` | /graph/ endpoint |
| 3D Research Graph | `LiveResearchGraph.tsx` | ComposeLiveResult[] |
| 3D Project Timeline | `ProjectTimeline.tsx` | Static ProjectEntry[] |

The fallback is always the EXACT existing component. Not a simplified
version or a loading state. The user gets the full 2D experience on
any device that can't run WebGL.

## Integration Pattern

### File Structure

For each 3D view, create three files:

```
src/components/commonplace/
├── Timeline3DScene.tsx       # The 3D scene (lazy-loaded)
├── TimelineWithFallback.tsx  # Wrapper with WebGL check
└── TimelineViz.tsx           # Existing 2D component (unchanged)
```

### Wrapper Component

```tsx
'use client';

import { lazy } from 'react';
import SceneWithFallback from '@/components/three/SceneWithFallback';
import TimelineViz from './TimelineViz';

const Timeline3DScene = lazy(() => import('./Timeline3DScene'));

interface TimelineWithFallbackProps {
  graphNodes: GraphNode[];
  graphLinks: GraphLink[];
  onOpenObject?: (id: string) => void;
}

export default function TimelineWithFallback(props: TimelineWithFallbackProps) {
  return (
    <SceneWithFallback
      scene3D={Timeline3DScene}
      fallback2D={
        <TimelineViz
          graphNodes={props.graphNodes}
          graphLinks={props.graphLinks}
          onOpenObject={props.onOpenObject}
        />
      }
      sceneProps={{
        nodes: props.graphNodes,
        links: props.graphLinks,
        onNodeClick: props.onOpenObject,
      }}
    />
  );
}
```

### Event Handling

3D views must support the same interactions as their 2D counterparts:
- **Click node**: calls `onOpenObject(id)` which opens the ObjectDrawer
- **Right-click node**: calls `openContextMenu(x, y, obj)` for the ObjectContextMenu
- **Hover node**: shows tooltip with title, type, and connection count
- **Filter by type**: respects the same type filter state as 2D views

The event callbacks are identical. Only the rendering changes.

## Shared Utilities

These existing utilities should be reused in 3D views:

| Utility | Location | Purpose |
|---------|----------|---------|
| `getObjectTypeIdentity()` | `@/lib/commonplace` | Type color, label, icon |
| `getNodeColor()` | `@/lib/commonplace-graph` | Graph node color by type |
| `truncateLabel()` | `@/lib/commonplace-graph` | Shorten titles for labels |
| `EDGE_RGB` | `@/lib/graph/colors` | Edge line color constant |
| `OBJECT_TYPES` | `@/lib/commonplace` | Full type registry |
| `groupNodesByDate()` | `@/lib/commonplace-api` | Date grouping for timelines |

## Phase Roadmap

### Phase 1: 3D Timeline
- Replace TimelineViz with a 3D version
- D3 scaleTime on Z axis, type lanes on Y axis
- Scroll-driven camera fly-through
- Sobel edge post-processing for sketch aesthetic
- Existing TimelineViz as fallback

### Phase 2: 3D Knowledge Map
- Replace KnowledgeMap with d3-force-3d version
- InstancedMesh nodes, Line edges
- Orbit camera with click-to-focus
- Same sketch post-processing

### Phase 3: 3D Research Graph
- Replace LiveResearchGraph with 3D version
- Signal-colored edges with dashed/solid distinction
- Animated node entrance (matching framer-motion behavior)
- Center node for the active compose context
