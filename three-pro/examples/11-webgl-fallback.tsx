/**
 * Example 11: WebGL Capability Check + 2D Fallback
 *
 * WHAT: Detects whether the browser supports WebGL and whether the
 *       device is powerful enough for 3D rendering. Falls back to
 *       the existing 2D component if not.
 *
 * WHEN TO USE: EVERY 3D component on the site. This is the wrapper
 *              pattern that makes 3D an enhancement, not a requirement.
 *              The fallback is always the existing 2D component that
 *              is already deployed and working.
 *
 * KEY DEPS: react (lazy, Suspense)
 *
 * KEY CONCEPTS:
 *   - WebGL detection runs once (not per render)
 *   - Lazy-load the 3D scene so it's not in the bundle for non-WebGL users
 *   - Suspense fallback shows the 2D component while 3D loads
 *   - prefers-reduced-motion check disables animations but keeps static 3D
 *   - Error boundary catches WebGL context loss or GPU crashes
 *   - The 2D fallback is the EXACT existing component, not a simplified version
 *
 * MAPPING (which 3D view falls back to which 2D component):
 *   - 3D Timeline    -> TimelineViz.tsx
 *   - 3D KnowledgeMap -> KnowledgeMap.tsx
 *   - 3D ResearchGraph -> LiveResearchGraph.tsx
 *   - 3D ProjectTimeline -> ProjectTimeline.tsx
 */

'use client';

import { lazy, Suspense, useState, useEffect, Component, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* WebGL capability detection                                          */
/* ------------------------------------------------------------------ */

/**
 * Checks if WebGL is available and functional.
 * Runs once and caches the result.
 */
let _webglResult: boolean | null = null;

function hasWebGL(): boolean {
  if (_webglResult !== null) return _webglResult;
  if (typeof window === 'undefined') {
    _webglResult = false;
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    _webglResult = !!gl;
    // Check for context loss (some devices report WebGL but fail on use)
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // SwiftShader is a software renderer, too slow for our scenes
        if (typeof renderer === 'string' && renderer.includes('SwiftShader')) {
          _webglResult = false;
        }
      }
    }
    return _webglResult;
  } catch {
    _webglResult = false;
    return false;
  }
}

/**
 * Check if user prefers reduced motion.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ------------------------------------------------------------------ */
/* Error boundary for WebGL crashes                                    */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log but don't crash the app; fall back to 2D
    console.warn('[Three-Pro] WebGL error, falling back to 2D:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* SceneWithFallback: the main wrapper component                       */
/* ------------------------------------------------------------------ */

interface SceneWithFallbackProps {
  /** Lazy-loaded 3D scene component */
  scene3D: React.LazyExoticComponent<React.ComponentType<any>>;
  /** The existing 2D fallback component (rendered synchronously) */
  fallback2D: ReactNode;
  /** Props to pass through to both the 3D and the fallback component */
  sceneProps?: Record<string, any>;
}

export default function SceneWithFallback({
  scene3D: Scene3D,
  fallback2D,
  sceneProps = {},
}: SceneWithFallbackProps) {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    setCanRender3D(hasWebGL());
  }, []);

  // SSR and no-WebGL: render 2D
  if (!canRender3D) {
    return <>{fallback2D}</>;
  }

  return (
    <WebGLErrorBoundary fallback={fallback2D}>
      <Suspense fallback={fallback2D}>
        <Scene3D
          {...sceneProps}
          reducedMotion={prefersReducedMotion()}
        />
      </Suspense>
    </WebGLErrorBoundary>
  );
}

/* ------------------------------------------------------------------ */
/* Usage example: wrapping the 3D Timeline                             */
/* ------------------------------------------------------------------ */

/*
import SceneWithFallback from './11-webgl-fallback';
import TimelineViz from '@/components/commonplace/TimelineViz';

// Lazy-load the 3D version (not in main bundle)
const Timeline3DScene = lazy(() => import('./Timeline3DScene'));

export default function TimelineWithFallback(props) {
  return (
    <SceneWithFallback
      scene3D={Timeline3DScene}
      fallback2D={
        <TimelineViz
          graphNodes={props.graphNodes}
          graphLinks={props.graphLinks}
        />
      }
      sceneProps={{
        nodes: props.nodes,
        onNodeClick: props.onNodeClick,
      }}
    />
  );
}
*/
