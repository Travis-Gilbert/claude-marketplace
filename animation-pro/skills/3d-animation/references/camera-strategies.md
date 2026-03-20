# Camera Strategies

Camera control determines how users experience a 3D scene. Choose the right strategy based on the interaction model: free exploration, guided narrative, scroll-driven storytelling, or constrained inspection.

## OrbitControls (Free Exploration)

OrbitControls allow the user to rotate, zoom, and pan freely around a target point. Use this for product viewers, model inspectors, and exploratory data visualizations.

### Setup in R3F

```tsx
import { OrbitControls } from '@react-three/drei';

function Scene() {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.5}
      />
      {/* scene contents */}
    </Canvas>
  );
}
```

### Constraints

Limit the camera to prevent disorienting views.

```tsx
<OrbitControls
  minDistance={2}
  maxDistance={20}
  minPolarAngle={0.2}
  maxPolarAngle={Math.PI / 2}
  minAzimuthAngle={-Math.PI / 4}
  maxAzimuthAngle={Math.PI / 4}
/>
```

Set `minPolarAngle` and `maxPolarAngle` to the same value for a fixed vertical angle (turntable mode).

### Damping

Enable `enableDamping` with a low `dampingFactor` (0.03 to 0.08) for smooth, inertial camera movement. This requires the controls to update every frame, which Drei handles automatically.

### Auto-Rotate

```tsx
<OrbitControls autoRotate autoRotateSpeed={1.0} />
```

Auto-rotation stops when the user interacts. Resume it after an idle timeout if desired.

## Fixed-Angle Constrained Orbit

For showcasing objects from a limited perspective (product turntable, architectural walkthrough), lock the polar angle and restrict azimuth.

```tsx
<OrbitControls
  enablePan={false}
  enableZoom={false}
  minPolarAngle={Math.PI / 3}
  maxPolarAngle={Math.PI / 3}
  autoRotate
  autoRotateSpeed={2}
/>
```

This creates a smooth horizontal turntable with no vertical or zoom freedom. Users can still drag to control rotation direction and speed.

## ScrollControls + useScroll (Drei)

Drei's `ScrollControls` wraps the canvas in a scrollable container and exposes scroll progress to the scene. Use this for landing pages and storytelling sequences.

### Setup

```tsx
import { ScrollControls, useScroll } from '@react-three/drei';

function App() {
  return (
    <Canvas>
      <ScrollControls pages={5} damping={0.1}>
        <ScrollScene />
      </ScrollControls>
    </Canvas>
  );
}

function ScrollScene() {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = scroll.offset; // 0 at top, 1 at bottom
    if (groupRef.current) {
      groupRef.current.position.y = t * -10;
      groupRef.current.rotation.y = t * Math.PI * 2;
    }
  });

  return <group ref={groupRef}>{/* scene contents */}</group>;
}
```

`scroll.offset` is a normalized value from 0 to 1. `scroll.range(start, length)` returns a 0..1 value for a specific scroll segment, useful for staggering animations.

### Scroll-Driven Camera Path

```ts
useFrame((state) => {
  const t = scroll.offset;
  state.camera.position.set(
    Math.sin(t * Math.PI) * 5,
    2 + t * 3,
    Math.cos(t * Math.PI) * 5
  );
  state.camera.lookAt(0, t * 2, 0);
});
```

Always call `camera.lookAt()` after updating position to keep the camera oriented correctly.

## GSAP ScrollTrigger + Three.js Integration

For complex scroll-driven sequences with easing, scrubbing, and pin behavior, integrate GSAP ScrollTrigger with Three.js.

### Architecture

GSAP controls the timeline. Three.js reads animated values each frame. Keep GSAP out of the render loop; let it write to a shared state object that `useFrame` reads.

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const cameraState = { x: 0, y: 2, z: 5, lookY: 0 };

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
  },
});

tl.to(cameraState, { x: 5, y: 5, z: 0, lookY: 3, duration: 1 });
tl.to(cameraState, { x: -3, y: 1, z: 8, lookY: 0, duration: 1 });
```

```ts
useFrame((state) => {
  state.camera.position.set(cameraState.x, cameraState.y, cameraState.z);
  state.camera.lookAt(0, cameraState.lookY, 0);
});
```

### Key Considerations

Place the scroll container div outside the Canvas element. The Canvas is absolutely positioned inside it. Set `scrub: 1` for smooth interpolation (higher values add more lag). Clean up ScrollTrigger instances on unmount with `ScrollTrigger.getAll().forEach(t => t.kill())`.

## Cinematic Camera Paths with Keyframes

Define a camera path as a Three.js AnimationClip and play it through an AnimationMixer.

```ts
const times = [0, 2, 4, 6];
const posValues = [
  0, 2, 10,   // t=0
  5, 3, 5,    // t=2
  0, 5, 0,    // t=4
  -5, 2, 8,   // t=6
];

const posTrack = new THREE.VectorKeyframeTrack(
  '.position',
  times,
  posValues,
  THREE.InterpolateSmooth
);

const clip = new THREE.AnimationClip('camera-path', 6, [posTrack]);
const mixer = new THREE.AnimationMixer(camera);
const action = mixer.clipAction(clip);
action.setLoop(THREE.LoopOnce, 1);
action.clampWhenFinished = true;
action.play();
```

Use `InterpolateSmooth` for gentle curves between keyframes. For a look-at target, animate a separate empty Object3D along a parallel path and call `camera.lookAt(target.position)` each frame.

## First-Person with PointerLockControls

Lock the mouse cursor and control the camera with mouse movement. Use this for walkthrough experiences and immersive environments.

```tsx
import { PointerLockControls } from '@react-three/drei';

function Scene() {
  return (
    <Canvas>
      <PointerLockControls />
      {/* WASD movement handled separately */}
    </Canvas>
  );
}
```

PointerLockControls only handles rotation. Implement movement separately by reading keyboard state in `useFrame` and translating the camera along its local axes.

```ts
useFrame((state) => {
  const speed = 0.1;
  const direction = new THREE.Vector3();
  state.camera.getWorldDirection(direction);

  if (keys.w) state.camera.position.addScaledVector(direction, speed);
  if (keys.s) state.camera.position.addScaledVector(direction, -speed);

  const right = new THREE.Vector3();
  right.crossVectors(direction, state.camera.up).normalize();
  if (keys.d) state.camera.position.addScaledVector(right, speed);
  if (keys.a) state.camera.position.addScaledVector(right, -speed);
});
```

## Camera Transitions Between Viewpoints

Smoothly interpolate the camera between preset positions using spring physics or linear interpolation.

### Spring-Based (Recommended)

```tsx
import { useSpring } from '@react-spring/three';

function CameraRig({ target }) {
  const { position } = useSpring({
    position: target,
    config: { mass: 1, tension: 170, friction: 26 },
  });

  useFrame((state) => {
    const [x, y, z] = position.get();
    state.camera.position.set(x, y, z);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}
```

Spring interpolation provides natural, organic transitions. Adjust `tension` (higher = snappier) and `friction` (higher = less bounce) to match the desired feel.

### LERP-Based

```ts
const targetPos = new THREE.Vector3(5, 3, 5);

useFrame((state) => {
  state.camera.position.lerp(targetPos, 0.05);
  state.camera.lookAt(0, 0, 0);
});
```

LERP is simpler but produces exponential ease-out with no overshoot. The factor (0.05) controls speed; lower values are slower and smoother.

### Quaternion SLERP for Rotation

When the camera needs to rotate to a new orientation (not just look at a new target), use quaternion spherical interpolation.

```ts
const targetQuat = new THREE.Quaternion();
targetQuat.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));

useFrame((state) => {
  state.camera.quaternion.slerp(targetQuat, 0.05);
});
```

## Mobile-Friendly Camera Controls

Mobile devices lack hover state and mouse precision. Adapt camera controls accordingly.

### Touch Gestures

OrbitControls handles touch natively: one finger rotates, two fingers pinch-zoom and pan. Increase `rotateSpeed` on mobile (touch movements are smaller). Disable pan if it conflicts with page scrolling.

### Reduced Motion Range

Constrain the orbit more tightly on mobile. Users on small screens lose spatial context easily.

```tsx
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

<OrbitControls
  rotateSpeed={isMobile ? 0.8 : 0.5}
  enablePan={!isMobile}
  maxDistance={isMobile ? 10 : 20}
/>
```

### Gyroscope Controls

Use `DeviceOrientationControls` for phone-tilt camera movement. Request permission on iOS first.

```ts
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls.js';

async function enableGyro(camera) {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== 'granted') return;
  }
  const controls = new DeviceOrientationControls(camera);
  return controls;
}
```

### Performance on Mobile

Use a lower `pixelRatio` (cap at 2) and reduce camera animation complexity. Avoid continuous spring animations that keep the GPU active. Prefer settling to a final state.

```tsx
<Canvas dpr={[1, 2]}>
```

This caps the device pixel ratio at 2, preventing 3x rendering on high-DPI phones.
