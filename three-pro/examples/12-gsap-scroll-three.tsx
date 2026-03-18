/**
 * Example 12: GSAP Timeline Driven by Scroll in R3F
 *
 * WHAT: Uses GSAP (already installed in travisgilbert.me) to define
 *       complex animation timelines, then seeks to the current position
 *       based on Drei's useScroll offset. This gives frame-perfect
 *       scroll-linked animations with GSAP's easing and sequencing.
 *
 * WHEN TO USE: Complex multi-step animations driven by scroll.
 *              Object entrances, camera moves, opacity transitions,
 *              material changes, all choreographed as a GSAP timeline
 *              that the user "scrubs" through by scrolling.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei (ScrollControls,
 *           useScroll), gsap (already installed)
 *
 * KEY CONCEPTS:
 *   - GSAP timeline is created once in useLayoutEffect
 *   - useScroll().offset (0 to 1) seeks the timeline each frame
 *   - timeline.seek(offset * duration) maps scroll to animation
 *   - GSAP can animate Three.js object properties directly
 *     (position, rotation, scale, material.opacity, etc.)
 *   - useRef gives stable references for GSAP to target
 *   - prefers-reduced-motion: skip GSAP, show final state
 *
 * PATTERN SOURCE: Wawa Sensei "Scroll animations with R3F and GSAP"
 *
 * WHY GSAP + R3F:
 *   travisgilbert.me already uses GSAP for TimelineView scroll
 *   animations. Reusing it in 3D keeps the animation language
 *   consistent and avoids adding Theatre.js or another tool.
 */

'use client';

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Animated scene content                                              */
/* ------------------------------------------------------------------ */

function AnimatedContent({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const scroll = useScroll();

  // Refs for objects GSAP will animate
  const groupRef = useRef<THREE.Group>(null);
  const box1Ref = useRef<THREE.Mesh>(null);
  const box2Ref = useRef<THREE.Mesh>(null);
  const box3Ref = useRef<THREE.Mesh>(null);
  const cameraGroupRef = useRef<THREE.Group>(null);

  // GSAP timeline ref (stable across renders)
  const tl = useRef<gsap.core.Timeline>(null);

  // Build the GSAP timeline once
  useLayoutEffect(() => {
    if (reducedMotion) return;
    if (!groupRef.current || !box1Ref.current || !box2Ref.current || !box3Ref.current) return;

    const timeline = gsap.timeline({ paused: true });

    // Phase 1 (scroll 0% to 33%): First box enters and rises
    timeline.fromTo(
      box1Ref.current.position,
      { y: -2 },
      { y: 0.5, duration: 1, ease: 'power2.out' },
      0,
    );
    timeline.fromTo(
      box1Ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(1.7)' },
      0,
    );

    // Phase 2 (scroll 33% to 66%): Second box enters, group rotates
    timeline.fromTo(
      box2Ref.current.position,
      { y: -2, x: 2 },
      { y: 0.5, x: 1.5, duration: 1, ease: 'power2.out' },
      1,
    );
    timeline.fromTo(
      box2Ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(1.7)' },
      1,
    );
    timeline.to(
      groupRef.current.rotation,
      { y: Math.PI / 6, duration: 1, ease: 'power1.inOut' },
      1,
    );

    // Phase 3 (scroll 66% to 100%): Third box, rotation, and lift
    timeline.fromTo(
      box3Ref.current.position,
      { y: -2, x: -2 },
      { y: 0.5, x: -1.5, duration: 1, ease: 'power2.out' },
      2,
    );
    timeline.fromTo(
      box3Ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out(1.7)' },
      2,
    );
    timeline.to(
      groupRef.current.rotation,
      { y: -Math.PI / 6, duration: 1, ease: 'power1.inOut' },
      2,
    );
    timeline.to(
      groupRef.current.position,
      { y: 0.5, duration: 1, ease: 'power2.inOut' },
      2,
    );

    tl.current = timeline;

    return () => {
      timeline.kill();
    };
  }, [reducedMotion]);

  // Seek timeline based on scroll position each frame
  useFrame(() => {
    if (!tl.current) return;
    const offset = scroll.offset;
    tl.current.seek(offset * tl.current.duration());
  });

  // Reduced motion: show final state immediately
  if (reducedMotion) {
    return (
      <group>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#C1553F" roughness={0.7} />
        </mesh>
        <mesh position={[1.5, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#8B6FA0" roughness={0.7} />
        </mesh>
        <mesh position={[-1.5, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#C49A4A" roughness={0.7} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <mesh ref={box1Ref} position={[0, -2, 0]} scale={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#C1553F" roughness={0.7} />
      </mesh>

      <mesh ref={box2Ref} position={[2, -2, 0]} scale={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#8B6FA0" roughness={0.7} />
      </mesh>

      <mesh ref={box3Ref} position={[-2, -2, 0]} scale={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#C49A4A" roughness={0.7} />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#F7F2EA" roughness={1} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapped scene with ScrollControls                                   */
/* ------------------------------------------------------------------ */

export default function GsapScrollScene() {
  // Check reduced motion
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <ScrollControls pages={4} damping={0.15}>
      <ambientLight intensity={0.4} color="#E8EAF0" />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#FFF5E6" castShadow />

      <AnimatedContent reducedMotion={reducedMotion} />
    </ScrollControls>
  );
}
