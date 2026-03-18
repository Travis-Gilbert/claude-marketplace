/**
 * Example 07: D3 Force Layout in Three.js
 *
 * WHAT: D3's forceSimulation (via d3-force-3d for native 3D support)
 *       computes node positions. R3F InstancedMesh renders spheres at
 *       those positions. Edges render as line segments updated per frame.
 *
 * WHEN TO USE: Any graph/network visualization that benefits from
 *              spatial depth. CommonPlace KnowledgeMap upgrade,
 *              LiveResearchGraph 3D mode.
 *
 * KEY DEPS: d3-force-3d, @react-three/fiber, three
 *
 * PATTERN SOURCE: vasturiano/3d-force-graph (adapted to R3F/declarative)
 *
 * KEY CONCEPTS:
 *   - d3-force-3d extends d3-force with forceZ and octree collision
 *   - Simulation runs via .tick() inside useFrame (each render frame
 *     advances the simulation one step)
 *   - Nodes rendered as InstancedMesh (one draw call for all nodes)
 *   - Edges rendered as LineSegments with a shared BufferGeometry
 *     whose position attribute is updated per frame
 *   - CARDINAL RULE: D3 computes positions. Three.js renders geometry.
 *     Never re-implement force layout in Three.js.
 *
 * PERFORMANCE: InstancedMesh handles 500+ nodes at 60fps. Edge lines
 *              use a single BufferGeometry with position attribute
 *              updated per frame (no geometry recreation).
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
// d3-force-3d is a drop-in replacement for d3-force with 3D support
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force-3d';

/* ------------------------------------------------------------------ */
/* Pre-allocated objects (zero per-frame allocation)                    */
/* ------------------------------------------------------------------ */

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/* ------------------------------------------------------------------ */
/* Types matching CommonPlace graph API                                 */
/* ------------------------------------------------------------------ */

interface GraphNode {
  id: string;
  objectType: string;
  title: string;
  edgeCount: number;
  // d3-force-3d will add x, y, z, vx, vy, vz
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

/* ------------------------------------------------------------------ */
/* Color map (matches CommonPlace type colors)                         */
/* ------------------------------------------------------------------ */

const TYPE_COLORS: Record<string, string> = {
  source: '#8B6FA0',
  hunch: '#C49A4A',
  concept: '#2D5F6B',
  note: '#B45A2D',
  person: '#5A8A5A',
  place: '#6B7A8A',
  event: '#B3443B',
  quote: '#4A7A9A',
};

function getNodeColor(type: string): string {
  return TYPE_COLORS[type] ?? '#6B7A8A';
}

/* ------------------------------------------------------------------ */
/* Force Graph Component                                               */
/* ------------------------------------------------------------------ */

interface ForceGraph3DProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

export default function ForceGraph3D({
  nodes,
  links,
  onNodeClick,
  onNodeHover,
}: ForceGraph3DProps) {
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);

  // Scale factor: D3 positions can be large, scale down for Three.js
  const SCALE = 0.01;

  // Create simulation (d3-force-3d with 3 dimensions)
  const simulation = useMemo(() => {
    const sim = forceSimulation(nodes, 3) // 3 = three dimensions
      .force('link', forceLink(links).id((d: any) => d.id).distance(30))
      .force('charge', forceManyBody().strength(-80))
      .force('center', forceCenter(0, 0, 0))
      .force('collision', forceCollide().radius(5))
      .alphaDecay(0.01)
      .velocityDecay(0.3);

    // Warm up: run 100 ticks to settle initial layout
    for (let i = 0; i < 100; i++) sim.tick();

    return sim;
  }, [nodes, links]);

  // Edge geometry: pre-allocate buffer for all edge segments
  const edgeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // 2 vertices per edge (start + end), 3 floats per vertex
    const positions = new Float32Array(links.length * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [links.length]);

  // Initialize node colors
  useEffect(() => {
    const mesh = nodeMeshRef.current;
    if (!mesh) return;

    nodes.forEach((node, i) => {
      _color.set(getNodeColor(node.objectType));
      mesh.setColorAt(i, _color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [nodes]);

  // Per-frame: advance simulation, update instanced positions and edge lines
  useFrame(() => {
    simulation.tick();

    // Update node positions
    const nodeMesh = nodeMeshRef.current;
    if (nodeMesh) {
      nodes.forEach((node, i) => {
        _dummy.position.set(
          (node.x ?? 0) * SCALE,
          (node.y ?? 0) * SCALE,
          (node.z ?? 0) * SCALE,
        );
        const size = 0.06 + Math.min(node.edgeCount * 0.01, 0.08);
        _dummy.scale.setScalar(size);
        _dummy.updateMatrix();
        nodeMesh.setMatrixAt(i, _dummy.matrix);
      });
      nodeMesh.instanceMatrix.needsUpdate = true;
    }

    // Update edge positions
    const edgeMesh = edgeRef.current;
    if (edgeMesh) {
      const posAttr = edgeGeometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      links.forEach((link, i) => {
        const src = typeof link.source === 'string'
          ? nodes.find((n) => n.id === link.source)
          : link.source;
        const tgt = typeof link.target === 'string'
          ? nodes.find((n) => n.id === link.target)
          : link.target;

        if (src && tgt) {
          const offset = i * 6;
          arr[offset] = (src.x ?? 0) * SCALE;
          arr[offset + 1] = (src.y ?? 0) * SCALE;
          arr[offset + 2] = (src.z ?? 0) * SCALE;
          arr[offset + 3] = (tgt.x ?? 0) * SCALE;
          arr[offset + 4] = (tgt.y ?? 0) * SCALE;
          arr[offset + 5] = (tgt.z ?? 0) * SCALE;
        }
      });

      posAttr.needsUpdate = true;
      edgeGeometry.computeBoundingSphere();
    }
  });

  return (
    <group>
      {/* Edge lines */}
      <lineSegments ref={edgeRef} geometry={edgeGeometry}>
        <lineBasicMaterial color="#1F1B18" opacity={0.12} transparent />
      </lineSegments>

      {/* Node spheres (instanced) */}
      <instancedMesh
        ref={nodeMeshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={(e) => {
          if (e.instanceId !== undefined) {
            onNodeHover?.(nodes[e.instanceId]?.id ?? null);
          }
        }}
        onPointerOut={() => onNodeHover?.(null)}
        onClick={(e) => {
          if (e.instanceId !== undefined) {
            e.stopPropagation();
            onNodeClick?.(nodes[e.instanceId]?.id ?? '');
          }
        }}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial roughness={0.65} vertexColors />
      </instancedMesh>
    </group>
  );
}
