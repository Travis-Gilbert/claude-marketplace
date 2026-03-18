/**
 * Example 10: Custom GLSL Shader Material
 *
 * WHAT: Custom vertex and fragment shaders in R3F using shaderMaterial
 *       from Drei or raw THREE.ShaderMaterial. Demonstrates uniforms,
 *       time animation, and vertex displacement.
 *
 * WHEN TO USE: When built-in materials can't produce the visual you
 *              need. Animated gradients, noise-based effects, vertex
 *              wobble for hand-drawn look, custom data-driven coloring.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei (shaderMaterial), three
 *
 * KEY CONCEPTS:
 *   - shaderMaterial from Drei creates a reusable material class
 *   - Uniforms are passed as props and update reactively
 *   - useFrame updates time uniform for animation
 *   - Vertex shader can displace positions (wobble effect)
 *   - Fragment shader controls final pixel color
 *   - Three.js provides built-in uniforms: modelViewMatrix,
 *     projectionMatrix, normalMatrix, cameraPosition
 *   - Three.js provides built-in attributes: position, normal, uv
 *
 * PATTERN SOURCE: Three.js ShaderMaterial docs, Drei shaderMaterial
 */

'use client';

import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Approach 1: Drei shaderMaterial (recommended for reuse)             */
/* ------------------------------------------------------------------ */

/**
 * WobbleMaterial: Adds a gentle vertex displacement that gives
 * geometry a hand-drawn, imprecise feel. The wobble frequency and
 * amplitude are controllable. Color transitions from warm paper
 * to the specified tint based on surface angle.
 */
const WobbleMaterial = shaderMaterial(
  // Uniforms with defaults
  {
    uTime: 0,
    uWobbleFreq: 3.0,
    uWobbleAmp: 0.02,
    uColor: new THREE.Color('#C1553F'),
    uPaperColor: new THREE.Color('#F7F2EA'),
  },

  // Vertex shader
  /* glsl */ `
    uniform float uTime;
    uniform float uWobbleFreq;
    uniform float uWobbleAmp;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDisplacement;

    // Simple 3D noise
    float noise3D(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // Displacement based on position + time
      float wobble = noise3D(position * uWobbleFreq + uTime * 0.5) * uWobbleAmp;
      wobble += sin(position.x * 10.0 + uTime) * uWobbleAmp * 0.5;
      wobble += cos(position.y * 8.0 + uTime * 0.7) * uWobbleAmp * 0.3;

      vDisplacement = wobble;

      // Displace along normal
      vec3 displaced = position + normal * wobble;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,

  // Fragment shader
  /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uPaperColor;

    varying vec3 vNormal;
    varying vec2 vUv;
    varying float vDisplacement;

    void main() {
      // Simple directional light
      vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
      float diffuse = max(dot(vNormal, lightDir), 0.0);

      // Mix between paper color (shadow) and object color (lit)
      vec3 color = mix(uPaperColor * 0.8, uColor, diffuse * 0.7 + 0.3);

      // Add subtle displacement-based variation
      color += vDisplacement * 2.0;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

// Register with R3F so it can be used as <wobbleMaterial />
extend({ WobbleMaterial });

// TypeScript declaration
declare module '@react-three/fiber' {
  interface ThreeElements {
    wobbleMaterial: THREE.ShaderMaterial & {
      uTime?: number;
      uWobbleFreq?: number;
      uWobbleAmp?: number;
      uColor?: THREE.Color;
      uPaperColor?: THREE.Color;
    };
  }
}

/* ------------------------------------------------------------------ */
/* WobbleMesh component                                                */
/* ------------------------------------------------------------------ */

interface WobbleMeshProps {
  position?: [number, number, number];
  color?: string;
  wobbleAmount?: number;
  children: React.ReactNode; // geometry as child
}

export function WobbleMesh({
  position = [0, 0, 0],
  color = '#C1553F',
  wobbleAmount = 0.02,
  children,
}: WobbleMeshProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (matRef.current) {
      (matRef.current as any).uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={position}>
      {children}
      <wobbleMaterial
        ref={matRef}
        uColor={new THREE.Color(color)}
        uWobbleAmp={wobbleAmount}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Approach 2: Raw THREE.ShaderMaterial (for one-offs)                  */
/* ------------------------------------------------------------------ */

/**
 * DataHeatMaterial: Colors a mesh based on a data value uniform.
 * Useful for encoding numeric data as color on 3D geometry.
 * The value interpolates between cool (blue) and warm (terracotta).
 */
export function useDataHeatMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uValue: { value: 0.5 }, // 0 to 1
          uCoolColor: { value: new THREE.Color('#2D5F6B') },
          uWarmColor: { value: new THREE.Color('#C1553F') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uValue;
          uniform vec3 uCoolColor;
          uniform vec3 uWarmColor;
          varying vec3 vNormal;

          void main() {
            vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
            float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.6 + 0.4;

            vec3 dataColor = mix(uCoolColor, uWarmColor, uValue);
            gl_FragColor = vec4(dataColor * diffuse, 1.0);
          }
        `,
      }),
    [],
  );
}

/* ------------------------------------------------------------------ */
/* Demo scene                                                          */
/* ------------------------------------------------------------------ */

export default function ShaderMaterialDemo() {
  return (
    <group>
      {/* Wobble material on various geometries */}
      <WobbleMesh position={[-1.5, 0.5, 0]} color="#8B6FA0">
        <sphereGeometry args={[0.5, 32, 32]} />
      </WobbleMesh>

      <WobbleMesh position={[0, 0.5, 0]} color="#C1553F" wobbleAmount={0.03}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      </WobbleMesh>

      <WobbleMesh position={[1.5, 0.5, 0]} color="#C49A4A" wobbleAmount={0.015}>
        <torusGeometry args={[0.4, 0.15, 16, 32]} />
      </WobbleMesh>
    </group>
  );
}
