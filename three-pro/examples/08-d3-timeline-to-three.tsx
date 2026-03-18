/**
 * Example 08: D3 Timeline Axis in 3D Space
 *
 * WHAT: Maps chronological data onto a 3D scene. Time runs along the
 *       Z axis, object types form Y-axis lanes, and connections are
 *       3D arcs. Camera flies along the timeline driven by scroll.
 *
 * WHEN TO USE: Upgrading CommonPlace TimelineViz from 2D (D3 SVG+Canvas)
 *              to 3D (R3F). This is the Phase 1 integration target.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei, d3 (scaleTime), three
 *
 * KEY CONCEPTS:
 *   - D3 scaleTime maps capturedAt dates to Z-axis positions
 *   - OBJECT_TYPES map to Y-axis vertical lanes (same logic as TimelineViz)
 *   - Connections render as 3D quadratic bezier curves (TubeGeometry or Line)
 *   - Scroll controls camera position along the Z axis
 *   - InstancedMesh for nodes, BufferGeometry for edges
 *   - Hover highlights connected nodes and their edges
 *
 * DATA FLOW:
 *   fetchFeed() -> MockNode[] -> D3 scaleTime(capturedAt) -> Z positions
 *                              -> OBJECT_TYPES index       -> Y positions
 *                              -> edges                    -> 3D arcs
 */

'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, Text } from '@react-three/drei';
import * as d3 from 'd3';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Pre-allocated                                                       */
/* ------------------------------------------------------------------ */

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _v0 = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Types (matching CommonPlace data shape)                             */
/* ------------------------------------------------------------------ */

interface TimelineNode {
  id: string;
  capturedAt: string; // ISO date
  objectType: string;
  title: string;
  edgeCount: number;
  edges: Array<{
    id: string;
    sourceId: string;
    targetId: string;
  }>;
}

const TYPE_LANES: Record<string, { y: number; color: string }> = {
  source:       { y: 2.0,  color: '#8B6FA0' },
  hunch:        { y: 1.4,  color: '#C49A4A' },
  concept:      { y: 0.8,  color: '#2D5F6B' },
  note:         { y: 0.2,  color: '#B45A2D' },
  person:       { y: -0.4, color: '#5A8A5A' },
  place:        { y: -1.0, color: '#6B7A8A' },
  event:        { y: -1.6, color: '#B3443B' },
};

function getLane(type: string) {
  return TYPE_LANES[type] ?? { y: 0, color: '#6B7A8A' };
}

/* ------------------------------------------------------------------ */
/* 3D Timeline Component                                               */
/* ------------------------------------------------------------------ */

interface Timeline3DProps {
  nodes: TimelineNode[];
  onNodeClick?: (id: string) => void;
}

export default function Timeline3D({ nodes, onNodeClick }: Timeline3DProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // D3 scale: map date range to Z axis (most recent = closest to camera)
  const zScale = useMemo(() => {
    const dates = nodes.map((n) => new Date(n.capturedAt));
    const extent = d3.extent(dates) as [Date, Date];
    // Spread nodes across 30 units of Z depth
    return d3.scaleTime().domain(extent).range([0, -30]);
  }, [nodes]);

  // Compute 3D positions for each node
  const positions = useMemo(() => {
    return nodes.map((node) => {
      const lane = getLane(node.objectType);
      const z = zScale(new Date(node.capturedAt));
      // X: slight random jitter to avoid perfect alignment
      const x = (Math.random() - 0.5) * 0.6;
      return { x, y: lane.y, z, color: lane.color };
    });
  }, [nodes, zScale]);

  // Initialize instance transforms and colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    positions.forEach((pos, i) => {
      _dummy.position.set(pos.x, pos.y, pos.z);
      _dummy.scale.setScalar(0.08);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      _color.set(pos.color);
      mesh.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [positions]);

  // Build arc geometry for edges
  const arcLines = useMemo(() => {
    const allPositions: number[] = [];
    const nodeMap = new Map(nodes.map((n, i) => [n.id, i]));

    nodes.forEach((node) => {
      node.edges.forEach((edge) => {
        const srcIdx = nodeMap.get(edge.sourceId);
        const tgtIdx = nodeMap.get(edge.targetId);
        if (srcIdx === undefined || tgtIdx === undefined) return;

        const src = positions[srcIdx];
        const tgt = positions[tgtIdx];

        // Generate points along a quadratic bezier arc
        const midX = (src.x + tgt.x) / 2;
        const midY = Math.max(src.y, tgt.y) + 0.5; // Arc peaks above both nodes
        const midZ = (src.z + tgt.z) / 2;

        const SEGMENTS = 12;
        for (let s = 0; s < SEGMENTS; s++) {
          const t0 = s / SEGMENTS;
          const t1 = (s + 1) / SEGMENTS;

          // Quadratic bezier: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
          for (const t of [t0, t1]) {
            const omt = 1 - t;
            allPositions.push(
              omt * omt * src.x + 2 * omt * t * midX + t * t * tgt.x,
              omt * omt * src.y + 2 * omt * t * midY + t * t * tgt.y,
              omt * omt * src.z + 2 * omt * t * midZ + t * t * tgt.z,
            );
          }
        }
      });
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(allPositions, 3),
    );
    return geo;
  }, [nodes, positions]);

  // Highlighted edge indices for hovered node
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const ids = new Set<string>([hoveredId]);
    const node = nodes.find((n) => n.id === hoveredId);
    node?.edges.forEach((e) => {
      ids.add(e.sourceId);
      ids.add(e.targetId);
    });
    return ids;
  }, [hoveredId, nodes]);

  return (
    <group>
      {/* Rail lines for each type lane */}
      {Object.entries(TYPE_LANES).map(([type, lane]) => (
        <mesh key={type} position={[-2, lane.y, -15]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.005, 0.005, 30]} />
          <meshBasicMaterial color={lane.color} opacity={0.2} transparent />
        </mesh>
      ))}

      {/* Edge arcs */}
      <lineSegments geometry={arcLines}>
        <lineBasicMaterial
          color="#1F1B18"
          opacity={hoveredId ? 0.06 : 0.1}
          transparent
        />
      </lineSegments>

      {/* Node spheres */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, nodes.length]}
        onPointerMove={(e) => {
          if (e.instanceId !== undefined) {
            setHoveredId(nodes[e.instanceId]?.id ?? null);
          }
        }}
        onPointerOut={() => setHoveredId(null)}
        onClick={(e) => {
          if (e.instanceId !== undefined) {
            e.stopPropagation();
            onNodeClick?.(nodes[e.instanceId]?.id ?? '');
          }
        }}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial roughness={0.6} vertexColors />
      </instancedMesh>

      {/* Date labels along the Z axis */}
      <TimelineAxisLabels zScale={zScale} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Axis labels                                                         */
/* ------------------------------------------------------------------ */

function TimelineAxisLabels({
  zScale,
}: {
  zScale: d3.ScaleTime<number, number>;
}) {
  const ticks = useMemo(() => {
    return zScale.ticks(10).map((date) => ({
      z: zScale(date),
      label: d3.timeFormat('%b %d')(date),
    }));
  }, [zScale]);

  return (
    <group position={[-3, -2.5, 0]}>
      {ticks.map((tick, i) => (
        <Text
          key={i}
          position={[0, 0, tick.z]}
          fontSize={0.12}
          color="#1F1B18"
          anchorX="right"
          anchorY="middle"
          font="/fonts/CourierPrime-Regular.ttf"
        >
          {tick.label}
        </Text>
      ))}
    </group>
  );
}
