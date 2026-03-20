# Morph Targets and Skeletal Animation

Morph targets (blend shapes) and skeletal animation (bones and skinning) are the two primary techniques for deforming mesh geometry at runtime. Morph targets interpolate between predefined vertex positions. Skeletal animation transforms vertices through a hierarchy of bones.

## Morph Targets

### Concept

A morph target stores an alternate set of vertex positions for a mesh. Blending between the base geometry and one or more targets creates facial expressions, shape deformations, and procedural effects. Each target has an influence value from 0 (no effect) to 1 (fully applied). Multiple targets can be active simultaneously.

### Creating Morph Targets Programmatically

```ts
const baseGeometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
const positionAttribute = baseGeometry.getAttribute('position');

// Create a morph target that inflates the box into a sphere-like shape
const morphPositions = new Float32Array(positionAttribute.count * 3);
const tempVec = new THREE.Vector3();

for (let i = 0; i < positionAttribute.count; i++) {
  tempVec.fromBufferAttribute(positionAttribute, i);
  tempVec.normalize().multiplyScalar(1.0);
  morphPositions[i * 3] = tempVec.x;
  morphPositions[i * 3 + 1] = tempVec.y;
  morphPositions[i * 3 + 2] = tempVec.z;
}

baseGeometry.morphAttributes.position = [
  new THREE.BufferAttribute(morphPositions, 3),
];
```

Set `geometry.morphAttributes.position` to an array of `BufferAttribute` objects. Each entry is one morph target. The vertex count must match the base geometry exactly.

### Loading Morph Targets from GLTF

GLTF files encode morph targets automatically. The loader populates `geometry.morphAttributes` and exposes target names through `mesh.morphTargetDictionary`.

```ts
const { scene } = useGLTF('/model.glb');

useEffect(() => {
  scene.traverse((child) => {
    if (child.isMesh && child.morphTargetDictionary) {
      console.log('Morph targets:', Object.keys(child.morphTargetDictionary));
      // Example: { smile: 0, blink: 1, surprise: 2 }
    }
  });
}, [scene]);
```

### morphTargetInfluences Array

Control morph target blending through the `morphTargetInfluences` array on the mesh.

```ts
const mesh = scene.getObjectByName('Face');

// Set by index
mesh.morphTargetInfluences[0] = 0.5; // 50% of first target

// Set by name (using the dictionary)
const blinkIndex = mesh.morphTargetDictionary['blink'];
mesh.morphTargetInfluences[blinkIndex] = 1.0; // Full blink
```

### Animating Morph Targets

#### Direct useFrame Animation

```ts
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();
  const mesh = meshRef.current;
  if (!mesh) return;

  // Breathing effect
  mesh.morphTargetInfluences[0] = (Math.sin(t * 2) + 1) / 2;

  // Periodic blink
  const blinkCycle = t % 4; // Every 4 seconds
  mesh.morphTargetInfluences[1] = blinkCycle < 0.15 ? 1 : 0;
});
```

#### AnimationMixer for Morph Sequences

Three.js `NumberKeyframeTrack` can animate `morphTargetInfluences` values.

```ts
const track = new THREE.NumberKeyframeTrack(
  'mesh.morphTargetInfluences[0]',
  [0, 0.5, 1.0, 1.5],
  [0, 1, 1, 0],
);

const clip = new THREE.AnimationClip('smile', 1.5, [track]);
const action = mixer.clipAction(clip);
action.play();
```

GLTF animations that target morph targets are loaded as standard clips. Use them directly with `mixer.clipAction()`.

### Blending Between Morph States

Multiple morph targets can be active simultaneously. The final vertex position is:

`finalPos = basePos + influence[0] * (target0 - basePos) + influence[1] * (target1 - basePos) + ...`

Influences are additive. Setting two targets to 1.0 each produces a combined deformation. Clamp individual influences between 0 and 1 unless intentionally exaggerating.

```ts
function blendMorphTargets(mesh, targetInfluences, lerpFactor) {
  for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
    const target = targetInfluences[i] ?? 0;
    mesh.morphTargetInfluences[i] = THREE.MathUtils.lerp(
      mesh.morphTargetInfluences[i],
      target,
      lerpFactor,
    );
  }
}
```

Call this each frame with `lerpFactor` around 0.05 to 0.1 for smooth transitions between expressions.

## Skeletal Animation

### Core Concepts

**Bone**: a `THREE.Bone` object representing one joint in the skeleton hierarchy. Bones form a parent-child tree (spine > chest > shoulder > arm > hand).

**Skeleton**: holds the array of bones and their inverse bind matrices. The inverse bind matrix transforms vertices from world space to bone-local space.

**SkinnedMesh**: a mesh whose vertices are influenced by bones. Each vertex stores up to 4 bone indices and 4 bone weights (how much each bone affects it).

### Loading Skinned Models from GLTF

GLTF is the standard format for skinned models. The loader sets up the skeleton automatically.

```tsx
import { useGLTF, useAnimations } from '@react-three/drei';

function Character({ url }) {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    actions['idle']?.play();
  }, [actions]);

  return <primitive object={scene} />;
}
```

The scene graph contains `SkinnedMesh` objects with their bound `Skeleton`. Animations target bone transforms (position, rotation, scale) through keyframe tracks.

### Inspecting the Skeleton

```ts
scene.traverse((child) => {
  if (child.isSkinnedMesh) {
    console.log('Skeleton bones:', child.skeleton.bones.map(b => b.name));
    console.log('Bind matrix count:', child.skeleton.boneInverses.length);
  }
});
```

Use bone names to target specific joints for procedural animation or IK.

### Programmatic Bone Manipulation

Override or augment skeletal animation by directly setting bone transforms.

```ts
useFrame(() => {
  const headBone = skeleton.getBoneByName('Head');
  if (headBone) {
    headBone.rotation.y = THREE.MathUtils.lerp(
      headBone.rotation.y,
      targetRotationY,
      0.1,
    );
    headBone.rotation.x = THREE.MathUtils.lerp(
      headBone.rotation.x,
      targetRotationX,
      0.1,
    );
  }
});
```

Apply programmatic bone rotation after `mixer.update(delta)` in the frame loop. Otherwise the mixer overwrites the manual values.

### Animation Blending with Skeletal Animation

Skeletal animation blending works through `AnimationAction` weights, exactly as described in the Animation Mixer reference. Cross-fading between walk and run clips blends the bone transforms proportionally.

```ts
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);

walkAction.play();
runAction.play();

useFrame(() => {
  const t = speed / maxSpeed; // 0..1
  walkAction.setEffectiveWeight(1 - t);
  runAction.setEffectiveWeight(t);
  mixer.update(delta);
});
```

### Additive Skeletal Animation

Layer animations additively for effects like breathing, looking around, or flinching on top of a base locomotion animation.

```ts
THREE.AnimationUtils.makeClipAdditive(breatheClip);
const breatheAction = mixer.clipAction(breatheClip);
breatheAction.blendMode = THREE.AdditiveAnimationBlendMode;
breatheAction.setEffectiveWeight(1);
breatheAction.play();
```

The breathing deltas are added on top of whatever the base animation produces.

## Performance Considerations

### Morph Targets

Each active morph target adds a full vertex buffer read to the GPU computation. Limit active targets to 4 to 8 simultaneously. Modern GPUs handle this efficiently, but mobile GPUs may struggle with more than 4.

Morph target memory scales linearly: each target stores a full copy of the position attribute (and optionally normal and tangent attributes). A 50K vertex mesh with 20 morph targets stores 20 position buffers.

### Skeletal Animation

Bone count affects performance. Each bone requires a matrix multiplication per influenced vertex. Keep bone counts under 60 for mobile, under 150 for desktop.

Skin weight count per vertex (default 4 in GLTF) determines how many bones influence each vertex. Reducing to 2 improves performance with minimal visual quality loss for low-poly models.

```ts
skinnedMesh.skeleton.bones.length; // Check bone count
```

### Shared Skeletons

Multiple SkinnedMesh objects can share a single Skeleton (common for characters with separate head, body, and equipment meshes). Use `mesh.bind(sharedSkeleton)` after cloning.

### Frame Budget

One skeletal character with 60 bones and blended animations: ~0.5ms CPU per frame. Plan for this when budgeting frame time. Ten characters with skeletal animation need ~5ms, which is significant on a 16ms frame budget.

## Drei useAnimations for Morph Targets

Drei's `useAnimations` works with both skeletal and morph target animations. If the GLTF contains morph target keyframe tracks, they appear as named actions alongside skeletal clips.

```ts
const { actions } = useAnimations(animations, scene);

// Morph target animation named in the GLTF
actions['facial_expression']?.play();
```

The hook handles mixer creation and cleanup. Access `actions` by the clip name defined in the 3D authoring tool.

## Combining Morph and Skeletal Animation

Many character models use both: skeletal animation for body movement and morph targets for facial expressions. Both systems operate on the same mesh simultaneously without conflict.

```ts
const { actions } = useAnimations(animations, scene);

// Skeletal: body animation
actions['walk']?.play();

// Morph: facial expression (if a separate clip)
actions['smile']?.play();

// Or drive morph targets manually while skeletal animation plays
useFrame(() => {
  mixer.update(delta);
  faceMesh.morphTargetInfluences[smileIndex] = smileAmount;
});
```

Set morph influences after `mixer.update()` if the mixer is not controlling them, to prevent the mixer from resetting manual values.

## Disposal

Dispose skinned meshes and their skeletons on unmount.

```ts
useEffect(() => {
  return () => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh) {
        child.geometry.dispose();
        child.material.dispose();
        child.skeleton.dispose();
      }
    });
  };
}, [scene]);
```

Call `skeleton.dispose()` to free the bone texture (used for GPU skinning). Without this, bone matrices remain in GPU memory.
