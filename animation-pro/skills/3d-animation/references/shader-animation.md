# Shader Animation

Shader animation moves computation from the CPU to the GPU. Vertex shaders displace geometry; fragment shaders animate color, opacity, and visual effects. Use shaders when animating thousands of vertices uniformly, when achieving effects impossible with transform animation (waves, dissolve, glow), or when CPU-side per-instance loops become a bottleneck.

## ShaderMaterial and RawShaderMaterial

### ShaderMaterial

Extends built-in uniforms (projectionMatrix, modelViewMatrix, etc.) automatically. Start here for most use cases.

```ts
const material = new THREE.ShaderMaterial({
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.y += sin(pos.x * 3.0 + uTime) * 0.3;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      float r = sin(vUv.x * 6.28 + uTime) * 0.5 + 0.5;
      float g = sin(vUv.y * 6.28 + uTime * 0.7) * 0.5 + 0.5;
      gl_FragColor = vec4(r, g, 0.3, 1.0);
    }
  `,
  uniforms: {
    uTime: { value: 0 },
  },
});
```

### RawShaderMaterial

Does not inject any built-in uniforms or attributes. All declarations must be explicit. Use when precise control over the shader code is needed or when targeting specific GLSL versions.

```ts
const material = new THREE.RawShaderMaterial({
  vertexShader: `
    precision highp float;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    attribute vec3 position;
    attribute vec2 uv;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;

    void main() {
      gl_FragColor = vec4(vUv, 0.5, 1.0);
    }
  `,
});
```

## Uniform Types for Animation

### float (time, progress, intensity)

```ts
uniforms: {
  uTime: { value: 0 },
  uProgress: { value: 0 },
  uIntensity: { value: 1.0 },
}
```

### vec2 (resolution, mouse position)

```ts
uniforms: {
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uMouse: { value: new THREE.Vector2(0, 0) },
}
```

### vec3 (color, position offset)

```ts
uniforms: {
  uColor: { value: new THREE.Color('#ff4444') },
  uOffset: { value: new THREE.Vector3(0, 0, 0) },
}
```

### sampler2D (texture)

```ts
uniforms: {
  uTexture: { value: texture },
  uNoiseMap: { value: noiseTexture },
}
```

### Passing Time from useFrame

```ts
const uniforms = useMemo(() => ({
  uTime: { value: 0 },
}), []);

useFrame(({ clock }) => {
  uniforms.uTime.value = clock.getElapsedTime();
});
```

Mutate the uniform's `value` property directly. Do not replace the uniform object. Three.js watches the `value` property and uploads it to the GPU each frame.

## Vertex Displacement Animation

### Wave Effect

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  vec3 pos = position;
  pos.y += sin(pos.x * uFrequency + uTime) * uAmplitude;
  pos.y += cos(pos.z * uFrequency * 0.7 + uTime * 1.3) * uAmplitude * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

Increase geometry subdivision (`planeGeometry args={[4, 4, 128, 128]}`) for smoother displacement. Low-poly geometry produces visible faceting.

### Explosion / Scatter

Displace vertices along their normals for an expanding effect.

```glsl
uniform float uProgress; // 0 = closed, 1 = fully exploded

void main() {
  vec3 pos = position + normal * uProgress * 3.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

## Fragment Shader Color Animation

### Color Cycling

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  float r = sin(uTime) * 0.5 + 0.5;
  float g = sin(uTime + 2.094) * 0.5 + 0.5;
  float b = sin(uTime + 4.189) * 0.5 + 0.5;
  gl_FragColor = vec4(r, g, b, 1.0);
}
```

### Pulsing Opacity

```glsl
uniform float uTime;

void main() {
  float alpha = sin(uTime * 2.0) * 0.3 + 0.7;
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
```

Set `transparent: true` on the material for alpha to take effect.

## Common Shader Patterns

### Dissolve Effect

Use a noise texture or procedural noise to dissolve a mesh based on a threshold.

```glsl
uniform float uProgress;
uniform sampler2D uNoiseMap;
varying vec2 vUv;

void main() {
  float noise = texture2D(uNoiseMap, vUv).r;
  if (noise < uProgress) discard;

  float edge = smoothstep(uProgress, uProgress + 0.05, noise);
  vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0), edge);
  gl_FragColor = vec4(color, 1.0);
}
```

### Glow / Fresnel

```glsl
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = 1.0 - dot(normalize(vNormal), normalize(vViewDir));
  fresnel = pow(fresnel, 3.0);
  vec3 color = mix(vec3(0.0), vec3(0.3, 0.6, 1.0), fresnel);
  gl_FragColor = vec4(color, fresnel);
}
```

Compute `vViewDir` in the vertex shader: `vViewDir = cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz;`

### Scan Line

```glsl
uniform float uTime;
varying vec3 vWorldPos;

void main() {
  float scanY = mod(uTime * 2.0, 10.0) - 5.0;
  float line = 1.0 - smoothstep(0.0, 0.3, abs(vWorldPos.y - scanY));
  vec3 color = mix(vec3(0.05), vec3(0.0, 1.0, 0.5), line);
  gl_FragColor = vec4(color, 1.0);
}
```

## onBeforeCompile for Extending Built-in Materials

Modify Three.js built-in materials (MeshStandardMaterial, MeshPhysicalMaterial) without rewriting the entire shader.

```ts
const material = new THREE.MeshStandardMaterial({ color: '#4488ff' });

material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };

  shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
    #include <begin_vertex>
    transformed.y += sin(transformed.x * 3.0 + uTime) * 0.2;
    `,
  );

  materialRef.current = shader;
};

useFrame(({ clock }) => {
  if (materialRef.current) {
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  }
});
```

### Common Injection Points

| Marker | Location | Use |
|--------|----------|-----|
| `#include <begin_vertex>` | After `transformed = position` | Vertex displacement |
| `#include <project_vertex>` | After projection | Screen-space effects |
| `#include <color_fragment>` | After base color | Color modification |
| `#include <output_fragment>` | Before final output | Post-processing per fragment |

## Drei shaderMaterial Helper

Drei provides a `shaderMaterial` factory for creating reusable shader materials as R3F components.

```tsx
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#4488ff'), uAmplitude: 0.3 },
  // Vertex shader
  `
    uniform float uTime;
    uniform float uAmplitude;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.y += sin(pos.x * 3.0 + uTime) * uAmplitude;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      float brightness = sin(vUv.y * 6.28 + uTime) * 0.2 + 0.8;
      gl_FragColor = vec4(uColor * brightness, 1.0);
    }
  `,
);

extend({ WaveMaterial });

function WavePlane() {
  const ref = useRef();

  useFrame(({ clock }) => {
    ref.current.uTime = clock.getElapsedTime();
  });

  return (
    <mesh>
      <planeGeometry args={[4, 4, 64, 64]} />
      <waveMaterial ref={ref} uColor="#ff6644" uAmplitude={0.5} transparent />
    </mesh>
  );
}
```

The `shaderMaterial` helper handles uniform type inference and makes uniforms available as JSX props and as properties on the ref. This is the recommended approach for shader materials in R3F projects.

## Performance Notes

Shader animation runs entirely on the GPU. The only CPU cost is uploading uniform values (a handful of floats per frame). This makes it vastly cheaper than CPU-side per-vertex or per-instance animation for large meshes.

Keep fragment shaders simple on mobile. Complex noise functions, multiple texture samples, and deep branching reduce frame rate on mobile GPUs. Profile with `renderer.info` to monitor draw calls and program switches.

Material compilation happens once when the shader is first used. Avoid creating new ShaderMaterial instances at runtime, as each triggers a compile. Reuse materials across meshes when possible. Change behavior through uniforms, not by swapping materials.
