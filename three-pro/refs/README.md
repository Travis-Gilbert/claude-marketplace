# Reference Source Files

These directories contain curated source files extracted from upstream
repositories. They are populated by `install.sh`.

## What's in each directory

### three-core/
Selected files from `mrdoob/three.js/src/`:
- `WebGLRenderer.js` - Render loop, state machine, draw calls
- `Object3D.js` - Scene graph base class
- `Raycaster.js` - Intersection algorithm
- `InstancedMesh.js` - Instanced rendering (critical for data viz)
- `ShaderMaterial.js` - Custom shader patterns
- `BufferGeometry.js` - Geometry API
- `PerspectiveCamera.js` - Camera math
- `AnimationMixer.js` - Animation system

### r3f-core/
Selected files from `pmndrs/react-three-fiber/packages/fiber/src/`:
- `renderer.ts` - JSX-to-Three reconciler
- `hooks.ts` - useFrame, useThree, useLoader
- `events.ts` - Raycasting event system
- `Canvas.tsx` - Canvas component setup
- `store.ts` - Internal state management

### drei-components/
Selected files from `pmndrs/drei/src/`:
- `OrbitControls.tsx` - Camera orbit
- `ScrollControls.tsx` - Scroll-driven scenes
- `Html.tsx` - HTML projected into 3D space
- `Environment.tsx` - IBL environment maps
- `useGLTF.tsx` - GLTF model loading
- `Instances.tsx` - Instanced rendering helper
- `Float.tsx` - Floating animation
- `Text.tsx` - 3D text rendering
- `ContactShadows.tsx` - Ground contact shadows
- `CameraControls.tsx` - Advanced camera controls
- `Preload.tsx` - Asset preloading

### d3-force-3d/
Full source from `vasturiano/d3-force-3d/`:
- Drop-in replacement for d3-force with 3D support
- Adds forceZ, octree-based collision detection
- Small library, full source is < 50KB

## Populating the refs

Run `install.sh` to clone upstream repos and extract the relevant files.
Or manually copy files from the listed paths.
