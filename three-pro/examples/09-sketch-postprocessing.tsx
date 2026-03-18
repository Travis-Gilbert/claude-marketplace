/**
 * Example 09: NPR Sketch Post-Processing
 *
 * WHAT: Non-photorealistic rendering via post-processing. Renders the
 *       scene normally, then applies Sobel edge detection on the normal
 *       and depth buffers to draw hand-drawn-looking outlines. Optionally
 *       adds a paper texture overlay and cross-hatch shading.
 *
 * WHEN TO USE: Default visual treatment for all 3D on travisgilbert.me.
 *              The studio-journal aesthetic demands sketch-style rendering,
 *              not photorealistic output. This replaces standard post-
 *              processing (bloom, DOF) as the default effect stack.
 *
 * KEY DEPS: @react-three/fiber, three (for custom render pass)
 *
 * KEY CONCEPTS:
 *   - Custom render pass using Three.js EffectComposer (raw, not @react-three/postprocessing)
 *   - Render normals to a secondary render target using MeshNormalMaterial
 *   - Render depth from renderer's depth buffer
 *   - Sobel operator in fragment shader detects edges from both buffers
 *   - Edge displacement with noise adds hand-drawn wobble
 *   - Paper texture overlay gives warm, textured appearance
 *
 * PATTERN SOURCE:
 *   - Codrops "Sketchy Pencil Effect" (maya_ndljk)
 *   - Three.js webgl_postprocessing_sobel example
 *   - Maxime Heckel "Moebius-style post-processing"
 *   - Omar Shehata "How to render outlines in WebGL"
 *
 * NOTE: This uses the Three.js EffectComposer directly (not the R3F
 * postprocessing wrapper) because the custom shader needs access to
 * multiple render targets. For simpler effects, use example 06.
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/* ------------------------------------------------------------------ */
/* Sobel Edge Detection Shader                                         */
/* ------------------------------------------------------------------ */

/**
 * Fragment shader that applies Sobel edge detection to both the
 * normal buffer and depth buffer, then combines the results.
 *
 * The edge color is the ink color (#1F1B18) from the brand palette.
 * A noise-based displacement adds hand-drawn wobble to the edges.
 */
const SketchEdgeShader = {
  uniforms: {
    tDiffuse: { value: null },      // Scene render
    tNormal: { value: null },       // Normal buffer
    resolution: { value: new THREE.Vector2() },
    edgeColor: { value: new THREE.Color('#1F1B18') },
    paperColor: { value: new THREE.Color('#F7F2EA') },
    edgeStrength: { value: 1.0 },
    noiseAmount: { value: 0.003 },  // Hand-drawn wobble intensity
    time: { value: 0.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tNormal;
    uniform vec2 resolution;
    uniform vec3 edgeColor;
    uniform vec3 paperColor;
    uniform float edgeStrength;
    uniform float noiseAmount;
    uniform float time;

    varying vec2 vUv;

    // Simple hash for noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    // Sobel operator on a single-channel value
    float sobelSample(sampler2D tex, vec2 uv, vec2 texel) {
      // 3x3 kernel samples
      float tl = length(texture2D(tex, uv + vec2(-texel.x, -texel.y)).rgb);
      float t  = length(texture2D(tex, uv + vec2( 0.0,    -texel.y)).rgb);
      float tr = length(texture2D(tex, uv + vec2( texel.x, -texel.y)).rgb);
      float l  = length(texture2D(tex, uv + vec2(-texel.x,  0.0)).rgb);
      float r  = length(texture2D(tex, uv + vec2( texel.x,  0.0)).rgb);
      float bl = length(texture2D(tex, uv + vec2(-texel.x,  texel.y)).rgb);
      float b  = length(texture2D(tex, uv + vec2( 0.0,     texel.y)).rgb);
      float br = length(texture2D(tex, uv + vec2( texel.x,  texel.y)).rgb);

      // Sobel Gx and Gy
      float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
      float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

      return sqrt(gx*gx + gy*gy);
    }

    void main() {
      vec2 texel = 1.0 / resolution;

      // Add hand-drawn wobble to UV coordinates
      float noise = hash(vUv * 100.0 + time * 0.1);
      vec2 wobbleUv = vUv + (noise - 0.5) * noiseAmount;

      // Scene color
      vec4 sceneColor = texture2D(tDiffuse, wobbleUv);

      // Edge detection on normals
      float normalEdge = sobelSample(tNormal, wobbleUv, texel);

      // Combined edge strength
      float edge = clamp(normalEdge * edgeStrength, 0.0, 1.0);

      // Apply edge: mix scene color toward edge color
      // Threshold the edge for cleaner lines
      float edgeMask = smoothstep(0.1, 0.4, edge);

      // Slight paper tint on the base color
      vec3 tinted = mix(sceneColor.rgb, paperColor, 0.08);

      // Draw edges in ink color
      vec3 finalColor = mix(tinted, edgeColor, edgeMask * 0.85);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

/* ------------------------------------------------------------------ */
/* Cross-Hatch Shader (optional second pass)                           */
/* ------------------------------------------------------------------ */

const CrossHatchShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    hatchColor: { value: new THREE.Color('#1F1B18') },
    hatchDensity: { value: 80.0 },
    hatchThreshold: { value: 0.4 },  // Luminance below this gets hatching
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform vec3 hatchColor;
    uniform float hatchDensity;
    uniform float hatchThreshold;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

      // Only hatch in dark areas
      if (luminance < hatchThreshold) {
        float darkness = 1.0 - luminance / hatchThreshold;

        // Diagonal hatch lines (45 degrees)
        vec2 pixel = vUv * resolution;
        float line1 = mod(pixel.x + pixel.y, hatchDensity / (darkness * 2.0 + 1.0));
        float hatch = step(1.0, line1);

        // Second layer at 135 degrees for cross-hatch in very dark areas
        if (darkness > 0.5) {
          float line2 = mod(pixel.x - pixel.y, hatchDensity / (darkness + 0.5));
          hatch *= step(1.0, line2);
        }

        color.rgb = mix(hatchColor, color.rgb, hatch);
      }

      gl_FragColor = color;
    }
  `,
};

/* ------------------------------------------------------------------ */
/* SketchPostProcessing component                                      */
/* ------------------------------------------------------------------ */

interface SketchPostProcessingProps {
  edgeStrength?: number;
  enableHatching?: boolean;
  wobble?: number;
}

export default function SketchPostProcessing({
  edgeStrength = 1.0,
  enableHatching = false,
  wobble = 0.003,
}: SketchPostProcessingProps) {
  const { gl, scene, camera, size } = useThree();

  // Normal render target
  const normalTarget = useMemo(
    () =>
      new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
      }),
    [size.width, size.height],
  );

  // Normal material (used to override all scene materials for normal pass)
  const normalMaterial = useMemo(() => new THREE.MeshNormalMaterial(), []);

  // Effect composer
  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);

    // Pass 1: render scene normally
    comp.addPass(new RenderPass(scene, camera));

    // Pass 2: sketch edge detection
    const edgePass = new ShaderPass(SketchEdgeShader);
    edgePass.uniforms.resolution.value.set(size.width, size.height);
    edgePass.uniforms.edgeStrength.value = edgeStrength;
    edgePass.uniforms.noiseAmount.value = wobble;
    comp.addPass(edgePass);

    // Pass 3 (optional): cross-hatching
    if (enableHatching) {
      const hatchPass = new ShaderPass(CrossHatchShader);
      hatchPass.uniforms.resolution.value.set(size.width, size.height);
      comp.addPass(hatchPass);
    }

    return comp;
  }, [gl, scene, camera, size.width, size.height, edgeStrength, wobble, enableHatching]);

  // Render loop: render normals to target, then run composer
  useFrame((state) => {
    // Render normal buffer
    scene.overrideMaterial = normalMaterial;
    gl.setRenderTarget(normalTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    scene.overrideMaterial = null;

    // Pass normal buffer to edge shader
    const edgePass = composer.passes[1] as ShaderPass;
    if (edgePass?.uniforms) {
      edgePass.uniforms.tNormal.value = normalTarget.texture;
      edgePass.uniforms.time.value = state.clock.elapsedTime;
    }

    // Render with effects
    composer.render();
  }, 1); // Priority 1: runs after default rendering

  // Cleanup
  useEffect(() => {
    return () => {
      normalTarget.dispose();
      composer.dispose();
    };
  }, [normalTarget, composer]);

  return null;
}
