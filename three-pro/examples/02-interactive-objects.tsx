/**
 * Example 02: Interactive Objects with Raycasting
 *
 * WHAT: R3F's event system maps pointer events to Three.js raycasting.
 *       onClick, onPointerOver, onPointerOut work on any mesh.
 *       This pattern shows hover highlighting, click selection, and
 *       cursor changes.
 *
 * WHEN TO USE: Any scene with clickable or hoverable objects.
 *              CommonPlace node visualization, interactive timelines.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei (useCursor)
 *
 * KEY CONCEPTS:
 *   - R3F events bubble through the scene graph (like DOM events)
 *   - event.stopPropagation() prevents parent meshes from receiving
 *   - useCursor from Drei swaps the CSS cursor on hover
 *   - Hover state drives material changes (emissive, scale, color)
 *   - event.object gives you the intersected Three.js mesh
 *   - event.point gives you the world-space intersection point
 */

'use client';

import { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Type-colored interactive node                                       */
/* ------------------------------------------------------------------ */

interface InteractiveNodeProps {
  position: [number, number, number];
  color: string;
  label: string;
  onClick?: (label: string) => void;
}

function InteractiveNode({ position, color, label, onClick }: InteractiveNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  // Drei's useCursor swaps CSS cursor when hovered
  useCursor(hovered, 'pointer', 'auto');

  // Smooth scale animation on hover (no allocation in useFrame)
  const targetScale = hovered ? 1.2 : 1.0;
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Lerp toward target scale
    mesh.scale.x += (targetScale - mesh.scale.x) * 0.1;
    mesh.scale.y += (targetScale - mesh.scale.y) * 0.1;
    mesh.scale.z += (targetScale - mesh.scale.z) * 0.1;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation(); // Prevent parent from also receiving
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setActive(!active);
        onClick?.(label);
      }}
    >
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={hovered ? color : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Scene with multiple interactive nodes                               */
/* ------------------------------------------------------------------ */

// CommonPlace object type colors (from getObjectTypeIdentity)
const NODE_DATA = [
  { pos: [-1.5, 0.5, 0] as [number, number, number], color: '#8B6FA0', label: 'Source' },
  { pos: [0, 0.5, -1] as [number, number, number], color: '#C49A4A', label: 'Hunch' },
  { pos: [1.5, 0.5, 0] as [number, number, number], color: '#2D5F6B', label: 'Concept' },
  { pos: [0, 0.5, 1] as [number, number, number], color: '#B45A2D', label: 'Note' },
  { pos: [0, 1.5, 0] as [number, number, number], color: '#5A8A5A', label: 'Person' },
];

export default function InteractiveScene() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      {NODE_DATA.map((node) => (
        <InteractiveNode
          key={node.label}
          position={node.pos}
          color={node.color}
          label={node.label}
          onClick={setSelected}
        />
      ))}

      {/* Connection lines between nodes */}
      <EdgeLines nodes={NODE_DATA} highlightLabel={selected} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Edge lines connecting nodes                                         */
/* ------------------------------------------------------------------ */

function EdgeLines({
  nodes,
  highlightLabel,
}: {
  nodes: typeof NODE_DATA;
  highlightLabel: string | null;
}) {
  // Pre-allocate geometry positions (never re-create per frame)
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    // Connect each node to its neighbors (simple ring topology)
    for (let i = 0; i < nodes.length; i++) {
      const next = nodes[(i + 1) % nodes.length];
      const curr = nodes[i];
      positions.push(curr.pos[0], curr.pos[1], curr.pos[2]);
      positions.push(next.pos[0], next.pos[1], next.pos[2]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geo;
  }, [nodes]);

  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial
        color="#1F1B18"
        opacity={highlightLabel ? 0.15 : 0.3}
        transparent
      />
    </lineSegments>
  );
}
