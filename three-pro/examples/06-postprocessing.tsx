/**
 * Example 06: Post-Processing Effects
 *
 * WHAT: @react-three/postprocessing wraps Three.js EffectComposer
 *       in a declarative R3F API. Effects stack in order and share
 *       a single render pipeline for performance.
 *
 * WHEN TO USE: Adding visual polish to any scene. Bloom for glowing
 *              elements, SSAO for depth, DOF for focus, vignette for
 *              framing. Use the recipes from 3d-scene-designer.md.
 *
 * KEY DEPS: @react-three/fiber, @react-three/postprocessing
 *
 * KEY CONCEPTS:
 *   - EffectComposer renders the scene once, then applies effects
 *   - Effects are applied in the order they appear as children
 *   - Bloom: makes bright areas glow (luminanceThreshold controls cutoff)
 *   - SSAO: adds soft shadows in crevices (ambient occlusion)
 *   - DepthOfField: blurs objects far from focus distance
 *   - Vignette: darkens edges of the screen for framing
 *   - Each effect has a performance cost. Profile before shipping.
 *   - For NPR/sketch rendering, see example 09 instead.
 *
 * RECIPES (from 3d-scene-designer.md):
 *   - Studio-Journal: Sobel edges only (see example 09)
 *   - Clean Data Viz: subtle SSAO + light vignette
 *   - Atmospheric: subtle bloom + fog + vignette
 */

'use client';

import {
  EffectComposer,
  Bloom,
  Vignette,
  SSAO,
  DepthOfField,
  N8AO,
} from '@react-three/postprocessing';

/* ------------------------------------------------------------------ */
/* Recipe: Clean Data Visualization                                    */
/* ------------------------------------------------------------------ */

export function CleanDataVizEffects() {
  return (
    <EffectComposer>
      <N8AO
        aoRadius={0.15}
        intensity={0.5}
        distanceFalloff={0.5}
      />
      <Vignette offset={0.3} darkness={0.3} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------ */
/* Recipe: Atmospheric (for hero sections)                             */
/* ------------------------------------------------------------------ */

export function AtmosphericEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        mipmapBlur
      />
      <Vignette offset={0.2} darkness={0.5} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------ */
/* Recipe: Full Stack (for demos/special pages)                        */
/* ------------------------------------------------------------------ */

export function FullEffectsStack() {
  return (
    <EffectComposer multisampling={4}>
      <N8AO
        aoRadius={0.1}
        intensity={0.4}
        distanceFalloff={0.3}
      />
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.02}
        mipmapBlur
      />
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.025}
        bokehScale={3}
      />
      <Vignette offset={0.25} darkness={0.45} />
    </EffectComposer>
  );
}

/* ------------------------------------------------------------------ */
/* Usage notes                                                         */
/* ------------------------------------------------------------------ */

/**
 * PERFORMANCE NOTES:
 *
 * - N8AO is the recommended SSAO implementation (faster than SSAO)
 * - Bloom with mipmapBlur is faster than the default
 * - DepthOfField is expensive; use only when the focal effect matters
 * - On low-end hardware, skip SSAO and DOF, keep only Bloom + Vignette
 * - Test on target devices before shipping
 *
 * INTEGRATION:
 *
 * Place EffectComposer as a sibling of your scene content inside Canvas:
 *
 * <Canvas>
 *   <Suspense fallback={null}>
 *     <SceneContent />
 *     <CleanDataVizEffects />
 *   </Suspense>
 * </Canvas>
 *
 * For the studio-journal NPR look, use example 09 (sketch post-processing)
 * instead of these photorealistic effects. These recipes are for pages
 * that call for a more polished, less sketchy appearance.
 */
