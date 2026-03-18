/**
 * Example 01: Minimal R3F Scene Setup
 *
 * WHAT: The foundational Canvas/camera/lighting/environment pattern
 *       for every R3F scene on this site. Everything else builds on this.
 *
 * WHEN TO USE: Starting any new 3D component. Copy this skeleton,
 *              then add scene-specific content inside the Suspense.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei
 *
 * NOTES:
 *   - dpr={[1, 2]} gives retina quality without over-rendering on 1x screens
 *   - gl.alpha = true lets the warm paper background show through
 *   - The Environment preset provides physically-based ambient light
 *     without manually placing fill/rim lights
 *   - Suspense fallback can be null (invisible loading) or a spinner
 */

'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Preload } from '@react-three/drei';
import { Suspense } from 'react';

/* ------------------------------------------------------------------ */
/* Scene content (replace with your actual objects)                     */
/* ------------------------------------------------------------------ */

function SceneContent() {
  return (
    <group>
      {/* Key light: warm directional from upper-right */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.2}
        color="#FFF5E6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill light: cool ambient to prevent pure black shadows */}
      <ambientLight intensity={0.3} color="#E8EAF0" />

      {/* Example mesh (replace with your content) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#C1553F" roughness={0.7} />
      </mesh>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#F7F2EA" roughness={1} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas wrapper (the public component)                               */
/* ------------------------------------------------------------------ */

export default function MinimalScene() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
          />
          <SceneContent />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
