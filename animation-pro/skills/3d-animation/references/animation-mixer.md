# Animation Mixer

Three.js AnimationMixer is the central playback controller for all keyframe animation. Use it to load, play, blend, and sequence skeletal, morph, and property animations on any Object3D.

## Core Architecture

Three.js animation is built on four interlocking classes.

**AnimationClip** holds a named collection of keyframe tracks. Each clip represents one complete animation (a walk cycle, a door opening, a camera path). Clips are immutable data; they describe what changes and when.

**KeyframeTrack** stores the actual keyframe data for a single animated property. Each track targets one property path (like `mesh.position` or `material.opacity`) and holds parallel arrays of times and values. Subclasses exist for different value types: `NumberKeyframeTrack`, `VectorKeyframeTrack`, `QuaternionKeyframeTrack`, `BooleanKeyframeTrack`, `StringKeyframeTrack`, and `ColorKeyframeTrack`.

**AnimationMixer** is the playback engine. Create one mixer per animated object (or per scene root if multiple objects share a timeline). The mixer owns all active actions and advances them each frame.

**AnimationAction** is the runtime link between a clip and a mixer. Actions control playback state: playing, paused, weight, time scale, loop mode, and clamping. Multiple actions can run simultaneously on the same mixer for blending.

```ts
const mixer = new THREE.AnimationMixer(model);
const clip = THREE.AnimationClip.findByName(clips, 'walk');
const action = mixer.clipAction(clip);
action.play();
```

## Loading GLTF Animations

GLTF files carry animations as an array of `AnimationClip` objects. Use `GLTFLoader` (or Drei's `useGLTF`) to load them.

```ts
import { useGLTF } from '@react-three/drei';

function Character({ url }) {
  const { scene, animations } = useGLTF(url);
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  useEffect(() => {
    const action = mixer.clipAction(animations[0]);
    action.play();
    return () => mixer.stopAllAction();
  }, [mixer, animations]);

  useFrame((_, delta) => mixer.update(delta));

  return <primitive object={scene} />;
}
```

Always call `mixer.update(delta)` every frame. Pass the frame delta from `useFrame`, not a fixed timestep, to keep animations in sync with the render loop.

## Action Control

### Play, Pause, Stop

```ts
action.play();          // Start or resume playback
action.paused = true;   // Freeze at current time
action.paused = false;  // Resume from frozen time
action.stop();          // Reset to start, remove from mixer's active list
```

Calling `play()` on an already playing action is a no-op. Calling `stop()` resets the action's time to zero and deactivates it.

### Time Scale

Control playback speed per action.

```ts
action.timeScale = 1.0;   // Normal speed
action.timeScale = 2.0;   // Double speed
action.timeScale = 0.5;   // Half speed
action.timeScale = -1.0;  // Reverse playback
```

Set `mixer.timeScale` to affect all actions on that mixer simultaneously.

### Effective Weight

Weight controls how strongly an action contributes to the final pose. Values range from 0 (no contribution) to 1 (full contribution).

```ts
action.setEffectiveWeight(1.0);  // Full influence
action.setEffectiveWeight(0.0);  // No influence (still ticking, but silent)
```

Use `action.getEffectiveWeight()` to read the current weight, accounting for both the action's weight and the mixer's influence.

### Clamping

When an action reaches the end, `clampWhenFinished` determines behavior.

```ts
action.clampWhenFinished = true;   // Hold on last frame
action.clampWhenFinished = false;  // Reset to default pose (default)
```

Always set `clampWhenFinished = true` for one-shot animations (a door opening, a character dying) to prevent snapping back to the rest pose.

## Looping Modes

Set the loop mode before calling `play()`.

```ts
action.setLoop(THREE.LoopOnce, 1);        // Play once, then stop
action.setLoop(THREE.LoopRepeat, Infinity); // Loop forward forever (default)
action.setLoop(THREE.LoopPingPong, 3);     // Alternate forward/backward, 3 cycles
```

`LoopOnce` fires the `'finished'` event on the mixer when complete. Listen for it to trigger follow-up logic.

```ts
mixer.addEventListener('finished', (e) => {
  console.log('Action finished:', e.action.getClip().name);
});
```

## Blending Between Animations

### Cross-Fade

Smoothly transition from one animation to another over a duration.

```ts
const idleAction = mixer.clipAction(idleClip);
const walkAction = mixer.clipAction(walkClip);

idleAction.play();

function transitionToWalk(duration = 0.5) {
  walkAction.reset();
  walkAction.setEffectiveWeight(1);
  walkAction.play();
  idleAction.crossFadeTo(walkAction, duration, true);
}
```

The third argument (`warpBoolean`) adjusts time scales during the fade to prevent jerky transitions when clips have different durations.

### Additive Blending

Layer animations on top of a base pose. Use this for overlays: a breathing animation on top of idle, or a limp layered onto a walk.

```ts
THREE.AnimationUtils.makeClipAdditive(breatheClip);
const breatheAction = mixer.clipAction(breatheClip);
breatheAction.blendMode = THREE.AdditiveAnimationBlendMode;
breatheAction.setEffectiveWeight(0.5);
breatheAction.play();
```

Call `makeClipAdditive` once during setup. It modifies the clip in place to store deltas from the reference pose (frame 0 by default).

### Manual Weight Blending

For more control, manually interpolate weights each frame.

```ts
useFrame((_, delta) => {
  const t = computeBlendFactor(); // 0..1
  idleAction.setEffectiveWeight(1 - t);
  walkAction.setEffectiveWeight(t);
  mixer.update(delta);
});
```

Ensure all blended actions are playing simultaneously. An action with weight 0 still needs to be active for smooth transitions.

## Drei useAnimations Wrapper

Drei provides `useAnimations` to simplify the mixer lifecycle in R3F.

```tsx
import { useAnimations, useGLTF } from '@react-three/drei';

function Character({ url }) {
  const { scene, animations } = useGLTF(url);
  const { actions, mixer } = useAnimations(animations, scene);

  useEffect(() => {
    actions['idle']?.play();
  }, [actions]);

  return <primitive object={scene} />;
}
```

`useAnimations` returns:
- `actions`: a record mapping clip names to `AnimationAction` instances
- `mixer`: the underlying `AnimationMixer`
- `ref`: a ref to attach to the target object (alternative to passing the object directly)

The hook handles mixer creation, action caching, and cleanup on unmount. Prefer it over manual mixer management in R3F projects.

### Switching Animations with useAnimations

```ts
function switchTo(name: string, fadeDuration = 0.3) {
  const current = actions[currentName];
  const next = actions[name];
  if (!next) return;

  next.reset().setEffectiveWeight(1).play();
  if (current) {
    current.crossFadeTo(next, fadeDuration, true);
  }
  currentName = name;
}
```

## Disposing Animation Resources

Mixers and actions hold references that prevent garbage collection. Clean up on unmount.

```ts
useEffect(() => {
  return () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(scene);
  };
}, [mixer, scene]);
```

`mixer.stopAllAction()` halts all active actions. `mixer.uncacheRoot(object)` removes cached bindings for the object tree. Call both to ensure full cleanup.

For individual clips, use `mixer.uncacheClip(clip)` and `mixer.uncacheAction(clip, root)` to free specific resources without tearing down the entire mixer.

## Advanced Patterns

### Scrubbing (Manual Time Control)

Drive animation time from a slider, scroll position, or other input instead of the frame clock.

```ts
action.play();
action.paused = true; // Prevent automatic advancement

useFrame(() => {
  const t = getExternalTime(); // 0..clip.duration
  mixer.setTime(t);
});
```

Set the action to paused so `mixer.update()` does not advance it. Then call `mixer.setTime()` each frame with the desired time.

### Sub-Clip Playback

Play a portion of a longer clip by creating a sub-clip.

```ts
const subClip = THREE.AnimationUtils.subclip(fullClip, 'attack', 30, 60, 30);
const attackAction = mixer.clipAction(subClip);
attackAction.setLoop(THREE.LoopOnce, 1);
attackAction.clampWhenFinished = true;
attackAction.play();
```

Arguments: source clip, name, start frame, end frame, frames per second. Use this to split a single GLTF animation track into logical segments without re-exporting.

### Synchronized Multi-Mixer Playback

When multiple objects each have their own mixer, synchronize them by passing the same delta.

```ts
useFrame((_, delta) => {
  mixerA.update(delta);
  mixerB.update(delta);
  mixerC.update(delta);
});
```

For tighter sync, share a single external clock and set `mixer.time` directly on each mixer rather than using delta accumulation.
