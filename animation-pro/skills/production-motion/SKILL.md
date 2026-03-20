---
name: production-motion
description: >-
  This skill should be used when the user asks to "create a programmatic video",
  "build a video composition", "make an explainer animation", "compose a video
  with code", "render a video", "add audio sync", "build a motion graphics piece",
  "animate for video export", "create a Remotion composition", "build a Motion
  Canvas scene", or mentions Remotion, Motion Canvas, useCurrentFrame, interpolate,
  Sequence, Composition, programmatic video, video rendering, frame-based animation,
  Theatre.js for video, or export pipeline. Covers programmatic video composition,
  frame-based rendering, audio synchronization, and export pipelines.
---

# Production Motion

Programmatic video composition using Remotion and Motion Canvas. This domain
covers animation where the output is a rendered video file rather than a
web interaction.

## Tool Selection

| Need | Tool | Why |
|------|------|-----|
| React-based video with existing components | Remotion | Uses React component library directly |
| Math-heavy explainer animation | Motion Canvas | Generator-based timeline, built for technical content |
| Visual keyframe editing | Theatre.js + either | When a visual timeline editor is needed |
| Quick social media clip | Remotion | Faster setup, more templates available |
| Complex choreographed sequence | Motion Canvas | Precise timing control via generators |

## Remotion Core Concepts

Remotion treats video as a React application rendered frame-by-frame:

- **Composition**: Defines a video (width, height, fps, duration in frames)
- **Sequence**: Time-slices within a composition (like layers with in/out points)
- **`useCurrentFrame()`**: Returns the current frame number (0-indexed)
- **`interpolate(frame, inputRange, outputRange)`**: Maps frame ranges to value ranges
- **`spring({ frame, fps, config })`**: Spring-physics interpolation per frame
- **`<Audio>`**: Audio component with `startFrom` and volume control

```bash
# Verify Remotion API
grep -r "useCurrentFrame\|interpolate\|Sequence\|Composition" refs/remotion/packages/core/src/
```

See `references/remotion-architecture.md` for the full architecture guide.

## Motion Canvas Core Concepts

Motion Canvas uses generator functions for precise timeline control:

- **Scenes**: Generator functions that `yield` animation steps
- **Signals**: Reactive values that drive animation
- **`createRef()`**: Reference to scene elements for animation
- **`all()`**: Run animations in parallel
- **`sequence()`**: Run animations in sequence with optional delay
- **`waitFor(duration)`**: Pause for duration

```bash
# Verify Motion Canvas API
grep -r "makeScene\|createRef\|all\|sequence\|waitFor" refs/motion-canvas/packages/core/src/
```

See `references/motion-canvas-generators.md` for generator patterns.

## Composition Structure

Standard video composition setup:

| Parameter | Typical values | Notes |
|-----------|---------------|-------|
| Width | 1920 (1080p), 3840 (4K) | Match target platform |
| Height | 1080 (1080p), 2160 (4K) | 16:9 for YouTube, 9:16 for vertical |
| FPS | 30 (standard), 60 (smooth motion) | Higher = smoother but larger files |
| Duration | In frames: fps * seconds | 30 fps * 60 sec = 1800 frames |

## Audio Synchronization

For both tools, audio sync is frame-based:

1. Calculate the frame number for each beat/cue:
   `frame = timestamp_seconds * fps`
2. Use `interpolate` (Remotion) or signal keyframes (Motion Canvas)
   to align visual events to audio timestamps
3. For music sync: identify BPM, calculate frames per beat

See `references/audio-sync.md` for frame-accurate alignment patterns.

## Transition Patterns

| Transition | Remotion approach | Motion Canvas approach |
|-----------|-------------------|----------------------|
| Cut | End one Sequence, start next | Yield next scene |
| Dissolve | Overlap Sequences with opacity interpolation | `fadeTransition()` |
| Spring | `spring()` on enter/exit properties | Custom spring signal |
| Slide | `interpolate` on translateX | `slideTransition()` |
| Custom | Any React animation on frame range | Generator-based custom |

## Export Pipeline

**Remotion rendering:**
```bash
npx remotion render src/index.tsx CompositionId output.mp4
```

**Motion Canvas rendering:** Built-in editor exports, or programmatic render API.

Rendering options:
- Local: FFmpeg-based, uses CPU/GPU
- Cloud: Remotion Lambda (AWS), or custom render farm
- Batch: Multiple compositions with different parameters

See `references/export-pipeline.md` for render configuration and optimization.

## Performance Considerations

- Pre-compute expensive calculations outside the render function
- Memoize heavy components (they re-render every frame)
- For data-driven video: load and process data before render, not during
- Image sequences are faster to render than real-time video
- Test at lower resolution first, render final at target resolution

## Reference Files

- **`references/remotion-architecture.md`**: Compositions, Sequences, useCurrentFrame, rendering pipeline
- **`references/motion-canvas-generators.md`**: Generator-based timeline, scenes, signals
- **`references/audio-sync.md`**: Frame-accurate audio alignment, waveform visualization
- **`references/programmatic-editing.md`**: Cuts, transitions, overlays, text animation in video
- **`references/theatre-for-video.md`**: Using Theatre.js studio for video timeline editing
- **`references/export-pipeline.md`**: Rendering to MP4/WebM, cloud rendering, batch processing
