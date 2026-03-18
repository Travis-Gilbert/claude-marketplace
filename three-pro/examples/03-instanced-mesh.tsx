/**
 * Example 03: Instanced Mesh for Many Objects
 *
 * WHAT: InstancedMesh renders hundreds or thousands of identical
 *       geometries in a single draw call. Essential for data
 *       visualization where each data point is a sphere/box/etc.
 *
 * WHEN TO USE: Any visualization with > 20 identical shapes.
 *              CommonPlace KnowledgeMap nodes, timeline dots,
 *              force graph particles.
 *
 * KEY DEPS: @react-three/fiber, three
 *
 * KEY CONCEPTS:
 *   - InstancedMesh takes [geometry, material, count]
 *   - Each instance has its own transform via setMatrixAt()
 *   - Each instance can have its own color via setColorAt()
 *   - Pre-allocate a dummy Object3D for computing matrices
 *   - After updating matrices/colors, set .needsUpdate = true
 *   - CRITICAL: never allocate in useFrame. Dummy and tempColor
 *     are created once in useMemo/useRef, reused every frame.
 *
 * PERFORMANCE:
 *   - 500 individual meshes: ~500 draw calls, possibly < 30fps
 *   - 500 instanced meshes: 1 draw call, solid 60fps
 *   - Scales to 10,000+ instances on decent hardware
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Pre-allocated objects (module scope, zero per-frame allocation)      */
/* ------------------------------------------------------------------ */

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

/* ------------------------------------------------------------------ */
/* Data point type                                                     */
/* ------------------------------------------------------------------ */

interface DataPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  size: number;
}

/* ------------------------------------------------------------------ */
/* InstancedNodes component                                            */
/* ------------------------------------------------------------------ */

interface InstancedNodesProps {
  data: DataPoint[];
  onHover?: (index: number | null) => void;
  onClick?: (index: number) => void;
}

export default function InstancedNodes({ data, onHover, onClick }: InstancedNodesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = data.length;

  // Initialize instance transforms and colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    data.forEach((point, i) => {
      // Position and scale
      _dummy.position.set(point.x, point.y, point.z);
      _dummy.scale.setScalar(point.size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      // Color
      _color.set(point.color);
      mesh.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  // Optional: animate a gentle float on all instances
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = state.clock.elapsedTime;

    data.forEach((point, i) => {
      _dummy.position.set(
        point.x,
        point.y + Math.sin(time * 0.5 + i * 0.3) * 0.02,
        point.z,
      );
      _dummy.scale.setScalar(point.size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onPointerMove={(e) => {
        // e.instanceId gives the index of the hovered instance
        if (e.instanceId !== undefined) {
          onHover?.(e.instanceId);
        }
      }}
      onPointerOut={() => onHover?.(null)}
      onClick={(e) => {
        if (e.instanceId !== undefined) {
          e.stopPropagation();
          onClick?.(e.instanceId);
        }
      }}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial roughness={0.6} vertexColors />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/* Usage example: generate random data points                          */
/* ------------------------------------------------------------------ */

export function InstancedNodesDemo() {
  const data = useMemo<DataPoint[]>(() => {
    const COLORS = ['#8B6FA0', '#C49A4A', '#2D5F6B', '#B45A2D', '#5A8A5A'];
    return Array.from({ length: 200 }, (_, i) => ({
      id: `node-${i}`,
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      color: COLORS[i % COLORS.length],
      size: 0.05 + Math.random() * 0.1,
    }));
  }, []);

  return <InstancedNodes data={data} />;
}
