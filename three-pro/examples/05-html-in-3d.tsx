/**
 * Example 05: HTML Projected into 3D Space
 *
 * WHAT: Drei's Html component renders DOM elements positioned in 3D
 *       space. The HTML tracks a 3D position and can be occluded by
 *       geometry. This is how Heffernan-style monitor screens, tooltips,
 *       and info panels work in R3F scenes.
 *
 * WHEN TO USE: Displaying rich content (text, forms, iframes) inside
 *              a 3D scene. CommonPlace object detail panels, research
 *              thread previews, embedded compose editors.
 *
 * KEY DEPS: @react-three/fiber, @react-three/drei (Html)
 *
 * KEY CONCEPTS:
 *   - Html { transform } makes the element a 3D plane (perspectived)
 *   - Html { occlude } hides the element when geometry is in front
 *   - Html { distanceFactor } scales the element based on camera distance
 *   - The HTML content is real DOM, so all CSS/React works inside it
 *   - Performance: avoid many Html instances (each is a separate DOM node)
 *   - For iframe content: wrap in a div with overflow, set pointer-events
 *
 * PATTERN SOURCE: Drei Html docs, Heffernan portfolio (monitor screens)
 */

'use client';

import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Screen component: a monitor mesh with HTML content on its face       */
/* ------------------------------------------------------------------ */

interface ScreenProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  children: React.ReactNode;
}

function Screen({
  position,
  rotation = [0, 0, 0],
  width = 2.4,
  height = 1.5,
  children,
}: ScreenProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Screen bezel dimensions
  const bezelDepth = 0.08;
  const bezelPadding = 0.06;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Monitor body */}
      <mesh castShadow>
        <boxGeometry args={[width + bezelPadding * 2, height + bezelPadding * 2, bezelDepth]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Screen surface (slightly in front of body) */}
      <mesh position={[0, 0, bezelDepth / 2 + 0.001]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#111111" />
      </mesh>

      {/* HTML content projected onto the screen */}
      <Html
        transform
        occlude
        position={[0, 0, bezelDepth / 2 + 0.01]}
        distanceFactor={1.5}
        style={{
          width: `${width * 200}px`,
          height: `${height * 200}px`,
          overflow: 'auto',
          borderRadius: '2px',
          background: '#1F1B18',
          color: '#F7F2EA',
          fontFamily: "'Courier Prime', monospace",
          fontSize: '11px',
          padding: '12px',
          pointerEvents: 'auto',
        }}
      >
        {children}
      </Html>

      {/* Monitor stand */}
      <mesh position={[0, -(height / 2 + 0.3), -0.1]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, -(height / 2 + 0.6), 0]}>
        <boxGeometry args={[0.8, 0.04, 0.4]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating info card (non-transform mode for tooltips)                */
/* ------------------------------------------------------------------ */

interface InfoCardProps {
  position: [number, number, number];
  title: string;
  body: string;
  visible: boolean;
}

function InfoCard({ position, title, body, visible }: InfoCardProps) {
  if (!visible) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      style={{
        background: '#F7F2EA',
        border: '1px solid #D4CBC0',
        borderRadius: '4px',
        padding: '8px 12px',
        fontFamily: "'Courier Prime', monospace",
        fontSize: '11px',
        color: '#1F1B18',
        maxWidth: '200px',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(31, 27, 24, 0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
      <div style={{ opacity: 0.7 }}>{body}</div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Demo scene with monitor and tooltip                                 */
/* ------------------------------------------------------------------ */

export default function HtmlIn3DScene() {
  const [hoveredNode, setHoveredNode] = useState(false);

  return (
    <>
      {/* Monitor showing CommonPlace-style content */}
      <Screen position={[0, 1.8, -1]} width={2.8} height={1.8}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '14px', color: '#C1553F' }}>
            CommonPlace
          </h3>
          <p style={{ margin: '0 0 6px', lineHeight: 1.5 }}>
            Research thread: Urban Form and Social Outcomes
          </p>
          <div style={{ borderTop: '1px solid #333', paddingTop: 6, marginTop: 6 }}>
            <span style={{ color: '#8B6FA0' }}>3 sources</span>{' '}
            <span style={{ color: '#C49A4A' }}>2 hunches</span>{' '}
            <span style={{ color: '#5A8A5A' }}>5 connections</span>
          </div>
        </div>
      </Screen>

      {/* Interactive node with tooltip */}
      <mesh
        position={[2, 0.5, 0]}
        onPointerOver={() => setHoveredNode(true)}
        onPointerOut={() => setHoveredNode(false)}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#8B6FA0" />
      </mesh>

      <InfoCard
        position={[2, 1.2, 0]}
        title="Source: Jane Jacobs"
        body="4 connections"
        visible={hoveredNode}
      />
    </>
  );
}
