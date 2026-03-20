# Theatre.js Sequencing

Theatre.js is a visual animation sequencing tool for JavaScript. It provides a studio UI for keyframing 3D object properties, camera paths, and any numeric value. Use it when animations need precise timing, easing curves, and visual editing that goes beyond code-only keyframes.

## Core Concepts

### Project

A project is the top-level container. It holds sheets and their state (all keyframe data). One project per scene or application.

```ts
import { getProject } from '@theatre/core';

const project = getProject('My 3D Scene');
```

### Sheet

A sheet is a timeline. It holds objects and a sequence that plays them. Multiple sheets in one project allow independent timelines.

```ts
const sheet = project.sheet('Intro');
```

### Object

A Theatre object is a named set of animated properties. Each object maps to a 3D mesh, camera, light, or any animatable target.

```ts
const cubeObj = sheet.object('Cube', {
  position: { x: 0, y: 0, z: 0 },
  rotation: { y: 0 },
  scale: 1,
  opacity: 1,
});
```

### Sequence

The sequence is the playback engine for a sheet.

```ts
sheet.sequence.play({ iterationCount: Infinity, range: [0, 4] });
sheet.sequence.pause();
sheet.sequence.position = 2.5;
```

## Setting Up Theatre with R3F

### Installation

```bash
npm install @theatre/core @theatre/studio @theatre/r3f
```

`@theatre/studio` is the visual editing UI (dev only). `@theatre/r3f` provides React bindings.

### Provider Setup

```tsx
import { SheetProvider, editable as e } from '@theatre/r3f';
import { getProject } from '@theatre/core';
import studio from '@theatre/studio';

if (process.env.NODE_ENV === 'development') {
  studio.initialize();
}

const project = getProject('Scene');
const sheet = project.sheet('Main');

function App() {
  return (
    <Canvas>
      <SheetProvider sheet={sheet}>
        <SceneContent />
      </SheetProvider>
    </Canvas>
  );
}
```

### Making Objects Editable

Use the `editable` wrapper (aliased as `e`) to make R3F elements controllable from Theatre's studio.

```tsx
import { editable as e } from '@theatre/r3f';

function SceneContent() {
  return (
    <>
      <e.mesh theatreKey="Cube" position={[0, 1, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="#4488ff" />
      </e.mesh>

      <e.pointLight theatreKey="MainLight" position={[5, 5, 5]} intensity={1} />

      <e.perspectiveCamera theatreKey="Camera" makeDefault position={[0, 2, 5]} />
    </>
  );
}
```

`theatreKey` is the unique name for each object in the Theatre sheet. The `e` wrapper supports `e.mesh`, `e.group`, `e.pointLight`, `e.perspectiveCamera`, `e.directionalLight`, `e.spotLight`, `e.ambientLight`.

## Creating Animated Props on 3D Objects

### Imperative API (Without @theatre/r3f)

```ts
const cubeObj = sheet.object('Cube', {
  position: { x: 0, y: 1, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: { r: 0.2, g: 0.4, b: 1 },
  emissiveIntensity: 0,
});

cubeObj.onValuesChange((values) => {
  mesh.position.set(values.position.x, values.position.y, values.position.z);
  mesh.rotation.set(values.rotation.x, values.rotation.y, values.rotation.z);
  material.color.setRGB(values.color.r, values.color.g, values.color.b);
  material.emissiveIntensity = values.emissiveIntensity;
});
```

### Custom Props with Types

```ts
import { types } from '@theatre/core';

const obj = sheet.object('Config', {
  speed: types.number(1, { range: [0, 10], label: 'Speed' }),
  visible: types.boolean(true, { label: 'Visible' }),
  mode: types.stringLiteral('normal', { options: { normal: 'Normal', fast: 'Fast', slow: 'Slow' } }),
  color: types.rgba({ r: 1, g: 0.5, b: 0, a: 1 }),
});
```

## Keyframe Curves and Interpolation

### Setting Keyframes in the Studio

Open Theatre Studio in the browser (it appears as a panel at the bottom). Select an object, right-click a property, and choose "Sequence this property." Then scrub the timeline, change the value, and a keyframe is created.

### Easing Curves

Theatre provides a curve editor for each keyframed property. Click the curve between two keyframes to adjust the interpolation. Available types: Linear, Bezier (customizable), and Hold (jump with no interpolation).

## Studio UI for Visual Editing

### Studio Workflow

1. Select an object in the scene or the object tree.
2. Right-click a property and choose "Sequence this property."
3. Scrub the timeline to a position.
4. Change the property value.
5. A keyframe is created at the current timeline position.
6. Adjust the curve between keyframes in the graph editor.
7. Export the state when satisfied.

## Exporting and Replaying Sequences Without Studio

### Loading Exported State

```ts
import { getProject } from '@theatre/core';
import state from './theatre-state.json';

const project = getProject('My 3D Scene', { state });
```

Pass the exported JSON as the `state` option. Theatre replays the keyframed sequence exactly as authored, without needing the studio UI.

### Production Build

Exclude `@theatre/studio` from production bundles. It is a dev-only dependency (~300KB). The `@theatre/core` package (required for playback) is ~15KB gzipped.

```ts
if (process.env.NODE_ENV === 'development') {
  import('@theatre/studio').then((studio) => studio.default.initialize());
}
```

### Auto-Playing on Load

```ts
const project = getProject('Scene', { state });
const sheet = project.sheet('Main');

project.ready.then(() => {
  sheet.sequence.play({ iterationCount: 1, range: [0, 6] });
});
```

Wait for `project.ready` before playing.

## Combining Theatre with useFrame for Hybrid Animation

Theatre handles authored keyframe sequences. useFrame handles procedural, per-frame animation. Combine them for effects that mix designed timing with dynamic behavior.

```tsx
function HybridCube() {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <e.mesh ref={meshRef} theatreKey="Cube">
      <boxGeometry />
      <meshStandardMaterial />
    </e.mesh>
  );
}
```

Theatre sets keyframed properties. The useFrame callback adds continuous rotation on top.

## Theatre for Camera Choreography

### Keyframing Camera Movement

```tsx
<e.perspectiveCamera
  theatreKey="Camera"
  makeDefault
  position={[0, 2, 8]}
  fov={50}
/>
```

Sequence the camera's position, rotation, and fov in the studio.

### Camera Look-At with Theatre

Animate a target position and compute the look-at each frame.

```ts
const camTarget = sheet.object('CameraTarget', {
  position: { x: 0, y: 0, z: 0 },
});

camTarget.onValuesChange((values) => {
  camera.lookAt(values.position.x, values.position.y, values.position.z);
});
```

### Sequence Playback Control

```ts
sheet.sequence.play({ iterationCount: 1 });
sheet.sequence.play({ iterationCount: Infinity, range: [2, 5] });
sheet.sequence.play({ rate: -1 });      // Reverse
sheet.sequence.play({ rate: 0.5 });     // Half speed
sheet.sequence.position = 3.0;          // Scrub to time
```

### Scroll-Driven Theatre Playback

```ts
useFrame(() => {
  const scrollProgress = getScrollProgress(); // 0..1
  const duration = sheet.sequence.pointer.length;
  sheet.sequence.position = scrollProgress * duration;
});
```

## State Management

### Multiple Sheets

Use separate sheets for independent timelines.

```ts
const introSheet = project.sheet('Intro');
const loopSheet = project.sheet('Loop');
const outroSheet = project.sheet('Outro');

project.ready.then(async () => {
  await introSheet.sequence.play({ iterationCount: 1 });
  await loopSheet.sequence.play({ iterationCount: 5 });
  await outroSheet.sequence.play({ iterationCount: 1 });
});
```

`sequence.play()` returns a Promise that resolves when playback completes. Chain sequences with `await`.

### Persisting State During Development

Theatre auto-saves to localStorage during development. Exported JSON files persist across sessions. Always export before deploying or switching branches.
