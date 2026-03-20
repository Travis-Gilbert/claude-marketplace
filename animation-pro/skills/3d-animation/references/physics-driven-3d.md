# Physics-Driven 3D Animation

Rapier.js is a high-performance physics engine written in Rust and compiled to WASM. The `@react-three/rapier` package provides React bindings for R3F. Use physics-driven animation for gravity, collisions, ragdolls, projectiles, and any scenario where objects interact through physical forces.

## Setup

### Installation

```bash
npm install @react-three/rapier
```

### Basic Scene Structure

```tsx
import { Physics, RigidBody } from '@react-three/rapier';

function Scene() {
  return (
    <Canvas>
      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody>
          <mesh>
            <boxGeometry />
            <meshStandardMaterial />
          </mesh>
        </RigidBody>

        <RigidBody type="fixed">
          <mesh position={[0, -1, 0]}>
            <boxGeometry args={[20, 0.1, 20]} />
            <meshStandardMaterial />
          </mesh>
        </RigidBody>
      </Physics>
    </Canvas>
  );
}
```

The `<Physics>` component initializes the Rapier world. All `<RigidBody>` components must be descendants of `<Physics>`. The physics world steps automatically each frame.

## RigidBody Types

### Dynamic

Fully simulated. Affected by gravity, forces, collisions. Default type.

```tsx
<RigidBody type="dynamic" mass={1}>
  <mesh>
    <sphereGeometry args={[0.5]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>
```

### Fixed

Immovable. Collides with dynamic bodies but never moves. Use for floors, walls, and static environment geometry.

```tsx
<RigidBody type="fixed">
  <mesh>
    <boxGeometry args={[10, 0.5, 10]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>
```

### Kinematic Position-Based

Controlled by setting position directly. Not affected by forces or gravity. Collides with dynamic bodies and pushes them. Use for moving platforms, doors, and animation-driven physics objects.

```tsx
<RigidBody type="kinematicPosition" ref={platformRef}>
  <mesh>
    <boxGeometry args={[3, 0.3, 3]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>
```

Move kinematic bodies by calling `setNextKinematicTranslation` or `setNextKinematicRotation` each frame.

```ts
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();
  platformRef.current?.setNextKinematicTranslation({
    x: Math.sin(t) * 3,
    y: 2,
    z: 0,
  });
});
```

### Kinematic Velocity-Based

Controlled by setting velocity. Use when velocity-based movement is more natural than position-based (conveyor belts, spinning obstacles).

```tsx
<RigidBody type="kinematicVelocity" ref={conveyorRef}>
```

```ts
conveyorRef.current?.setLinvel({ x: 2, y: 0, z: 0 }, true);
```

## Collider Shapes

### Automatic Colliders

`@react-three/rapier` auto-generates colliders from child mesh geometry by default.

```tsx
<RigidBody colliders="hull">    {/* Convex hull of geometry */}
<RigidBody colliders="cuboid">  {/* Axis-aligned bounding box */}
<RigidBody colliders="ball">    {/* Bounding sphere */}
<RigidBody colliders="trimesh"> {/* Exact triangle mesh (expensive) */}
<RigidBody colliders={false}>   {/* No automatic collider */}
```

### Manual Colliders

For precise or composite collision shapes, disable auto-colliders and add explicit ones.

```tsx
import { CuboidCollider, BallCollider, CylinderCollider } from '@react-three/rapier';

<RigidBody colliders={false}>
  <CuboidCollider args={[1, 0.5, 1]} position={[0, 0.5, 0]} />
  <BallCollider args={[0.5]} position={[0, 1.5, 0]} />
  <mesh>{/* visual geometry */}</mesh>
</RigidBody>
```

Collider `args` define half-extents for cuboids, radius for balls. Combine multiple colliders on one RigidBody for compound shapes.

### Trimesh Collider

Exact triangle mesh collision. Use only for fixed bodies (not dynamic). Performance cost scales with triangle count. Never use trimesh colliders on dynamic bodies. Rapier does not support dynamic-dynamic trimesh collision. Use convex hull or compound shapes instead.

## Forces and Impulses

### Applying Force (Continuous)

Force is applied every frame. Acceleration = force / mass.

```ts
const bodyRef = useRef();

useFrame(() => {
  bodyRef.current?.addForce({ x: 0, y: 10, z: 0 }, true);
});
```

The second argument (`true`) wakes the body if it has gone to sleep.

### Applying Impulse (Instantaneous)

An impulse changes velocity instantly. Use for jumps, explosions, and impacts.

```ts
function jump() {
  bodyRef.current?.applyImpulse({ x: 0, y: 5, z: 0 }, true);
}
```

### Torque and Angular Impulse

```ts
bodyRef.current?.addTorque({ x: 0, y: 1, z: 0 }, true);
bodyRef.current?.applyTorqueImpulse({ x: 0, y: 5, z: 0 }, true);
```

### Linear and Angular Damping

Control how quickly bodies slow down. Higher damping = more resistance. Default is 0 (no damping).

```tsx
<RigidBody linearDamping={0.5} angularDamping={1.0}>
```

## Joints and Constraints

### Fixed Joint

Locks two bodies together rigidly.

```tsx
import { useFixedJoint } from '@react-three/rapier';

function ConnectedBodies() {
  const bodyA = useRef();
  const bodyB = useRef();

  useFixedJoint(bodyA, bodyB, [
    [0, 0.5, 0],
    [0, 0, 0, 1],
    [0, -0.5, 0],
    [0, 0, 0, 1],
  ]);

  return (
    <>
      <RigidBody ref={bodyA}>{/* mesh */}</RigidBody>
      <RigidBody ref={bodyB}>{/* mesh */}</RigidBody>
    </>
  );
}
```

### Spherical Joint (Ball-and-Socket)

Allows rotation around all axes but constrains position.

```tsx
import { useSphericalJoint } from '@react-three/rapier';

useSphericalJoint(bodyA, bodyB, [
  [0, -1, 0],
  [0, 1, 0],
]);
```

### Revolute Joint (Hinge)

Rotation around a single axis. Use for doors, wheels, and pendulums.

```tsx
import { useRevoluteJoint } from '@react-three/rapier';

useRevoluteJoint(bodyA, bodyB, [
  [0, 0, 0],
  [0, 0, 0],
  [0, 1, 0],
]);
```

### Prismatic Joint (Slider)

Translation along a single axis. Use for pistons, sliding doors, and linear actuators.

```tsx
import { usePrismaticJoint } from '@react-three/rapier';

usePrismaticJoint(bodyA, bodyB, [
  [0, 0, 0],
  [0, 0, 0],
  [1, 0, 0],
]);
```

## Collision Events and Sensors

### Collision Events

```tsx
<RigidBody
  onCollisionEnter={({ other }) => {
    console.log('Collided with:', other.rigidBodyObject?.name);
  }}
  onCollisionExit={({ other }) => {
    console.log('Separated from:', other.rigidBodyObject?.name);
  }}
>
```

### Sensors (Trigger Volumes)

Sensors detect overlaps without producing physical collision response. Use for trigger zones, pickup areas, and proximity detection.

```tsx
<CuboidCollider args={[2, 2, 2]} sensor onIntersectionEnter={(payload) => {
  console.log('Entered sensor zone');
}} />
```

### Contact Force Events

Read the force of a collision for damage calculations, sound effects, or particle spawning.

```tsx
<RigidBody
  onContactForce={(payload) => {
    const force = payload.totalForceMagnitude;
    if (force > 100) {
      playImpactSound(force);
    }
  }}
>
```

## Performance Tuning

### Simulation Step

```tsx
<Physics timeStep={1 / 60}>      {/* Default: 60Hz physics */}
<Physics timeStep="vary">        {/* Variable timestep (matches render) */}
<Physics timeStep={1 / 30}>      {/* 30Hz physics (cheaper, less accurate) */}
```

### Continuous Collision Detection (CCD)

Enable CCD for fast-moving objects that might tunnel through thin colliders.

```tsx
<RigidBody ccd>
  {/* Fast projectile */}
</RigidBody>
```

CCD adds computational cost. Enable it only on bodies that need it.

### Body Count Budget

Aim for under 500 active (non-sleeping) rigid bodies for smooth 60fps on desktop. Mobile budget is ~100 active bodies. Use collision groups to limit which bodies interact.

```tsx
<RigidBody collisionGroups={interactionGroups(0, [1])}>
  {/* Group 0, collides only with group 1 */}
</RigidBody>
```

## Combining Physics with Animation

### Animation to Physics Handoff

Play a keyframed animation, then switch to physics simulation.

```ts
function enablePhysics() {
  bodyRef.current?.setBodyType(1); // 1 = dynamic
  bodyRef.current?.setLinvel({ x: 0, y: -2, z: 0 }, true);
}
```

### Physics to Animation Handoff

Read the body's position and velocity, disable physics, and continue with a scripted animation from that state.

```ts
function disablePhysics() {
  const pos = bodyRef.current?.translation();
  const vel = bodyRef.current?.linvel();
  bodyRef.current?.setBodyType(2); // 2 = kinematicPosition
}
```

### Ragdoll

Create a ragdoll by connecting multiple dynamic RigidBody parts with joints. Each limb is a separate RigidBody with a spherical or revolute joint at each joint point. Transition from animated skeleton to ragdoll by reading each bone's world position and rotation, creating corresponding RigidBody parts at those positions, and activating the joints.
