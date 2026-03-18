/**
 * Example 04: Scroll-Driven Camera
 *
 * WHAT: Drei's ScrollControls creates an invisible HTML scroll container
 *       over the Canvas. useScroll().offset gives a 0-to-1 value as the
 *       user scrolls. The camera (or any object) moves along a path
 *       driven by that offset.
 *
 * WHEN TO USE: Timeline fly-throughs, guided narrative experiences,
 *              scroll-animated data exploration. CommonPlace 3D Timeline.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei (ScrollControls, useScroll)
 *
 * KEY CONCEPTS:
 *   - ScrollControls { pages } sets how many "screen heights" of scroll
 *   - useScroll().offset is the dampened scroll position (0 to 1)
 *   - useScroll().range(start, span) maps a sub-range of the scroll
 *   - Camera position is interpolated along a path each frame
 *   - Objects can also animate based on scroll (fade, scale, position)
 *   - The scroll container is HTML, so scroll events work naturally
 *
 * PATTERN SOURCE: Drei ScrollControls docs, Wawa Sensei scroll tutorial
 */

'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, useScroll, Text } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Pre-allocated for lerp (no per-frame allocation)                    */
/* ------------------------------------------------------------------ */

const _targetPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3();

/* ------------------------------------------------------------------ */
/* Camera path definition                                              */
/* ------------------------------------------------------------------ */

// Define camera waypoints along the scroll path.
// The camera interpolates between these as scroll.offset moves 0 to 1.
const CAMERA_PATH = [
  { pos: [0, 3, 8] as const, lookAt: [0, 0, 0] as const },    // Start: overview
  { pos: [3, 2, 4] as const, lookAt: [0, 0, -2] as const },   // Mid: angled
  { pos: [0, 1.5, 0] as const, lookAt: [0, 0, -8] as const }, // End: looking forward
];

/* ------------------------------------------------------------------ */
/* Camera rig that follows scroll                                      */
/* ------------------------------------------------------------------ */

function ScrollCamera() {
  const scroll = useScroll();

  useFrame((state) => {
    const t = scroll.offset; // 0 to 1

    // Find which segment of the path we're in
    const segmentCount = CAMERA_PATH.length - 1;
    const rawSegment = t * segmentCount;
    const segIndex = Math.min(Math.floor(rawSegment), segmentCount - 1);
    const segT = rawSegment - segIndex; // 0 to 1 within segment

    const from = CAMERA_PATH[segIndex];
    const to = CAMERA_PATH[segIndex + 1];

    // Smooth interpolation using smoothstep
    const smooth = segT * segT * (3 - 2 * segT);

    // Target position
    _targetPos.set(
      from.pos[0] + (to.pos[0] - from.pos[0]) * smooth,
      from.pos[1] + (to.pos[1] - from.pos[1]) * smooth,
      from.pos[2] + (to.pos[2] - from.pos[2]) * smooth,
    );

    // Target lookAt
    _targetLookAt.set(
      from.lookAt[0] + (to.lookAt[0] - from.lookAt[0]) * smooth,
      from.lookAt[1] + (to.lookAt[1] - from.lookAt[1]) * smooth,
      from.lookAt[2] + (to.lookAt[2] - from.lookAt[2]) * smooth,
    );

    // Lerp camera toward target (damped for smoothness)
    state.camera.position.lerp(_targetPos, 0.05);

    // Smooth lookAt by lerping a tracked point
    _currentLookAt.lerp(_targetLookAt, 0.05);
    state.camera.lookAt(_currentLookAt);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Scroll-reactive content                                             */
/* ------------------------------------------------------------------ */

function TimelineMarkers() {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);

  // Place markers along the Z axis (the "time" axis)
  const markers = Array.from({ length: 10 }, (_, i) => ({
    z: -i * 2,
    label: `Event ${i + 1}`,
    color: i % 2 === 0 ? '#C1553F' : '#8B6FA0',
  }));

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    // Fade in markers as they come into view
    group.children.forEach((child, i) => {
      const markerZ = -i * 2;
      const scrollZ = scroll.offset * -18; // total scroll depth
      const distance = Math.abs(markerZ - scrollZ);
      const opacity = Math.max(0, 1 - distance / 6);
      child.traverse((obj) => {
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
          mat.opacity = opacity;
          mat.transparent = true;
        }
      });
    });
  });

  return (
    <group ref={groupRef}>
      {markers.map((marker, i) => (
        <group key={i} position={[0, 0.5, marker.z]}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={marker.color} />
          </mesh>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.15}
            color="#1F1B18"
            anchorX="center"
            anchorY="bottom"
            font="/fonts/CourierPrime-Regular.ttf"
          >
            {marker.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Assembled scroll scene                                              */
/* ------------------------------------------------------------------ */

export default function ScrollCameraScene() {
  return (
    <ScrollControls pages={5} damping={0.2}>
      <ScrollCamera />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 3]} intensity={1} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -9]}>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#F7F2EA" roughness={1} />
      </mesh>

      {/* Timeline content */}
      <TimelineMarkers />
    </ScrollControls>
  );
}
