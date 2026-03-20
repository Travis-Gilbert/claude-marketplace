# Theatre.js for Video Reference

## Overview

Theatre.js is a visual animation editor that provides a timeline-based keyframe interface for JavaScript animations. When paired with Remotion, it bridges the gap between code-driven video rendering and visual, designer-friendly timeline editing. Theatre handles the choreography (when and how things move) while Remotion handles the rendering pipeline (frame-by-frame output to video files).

## Core Concepts

Theatre.js organizes animations into three layers:

| Concept | Purpose |
|---------|---------|
| Project | Top-level container. One project per video or animation set. |
| Sheet | A timeline within a project. Contains all animated properties for a scene. |
| Object | A named collection of animatable properties on a sheet. Maps to a visual element. |

```tsx
import { getProject } from '@theatre/core';

// Create or load a project
const project = getProject('MyVideo');

// Get a sheet (a timeline)
const sheet = project.sheet('Scene1');

// Create an object with animatable properties
const titleObj = sheet.object('Title', {
  opacity: 0,
  y: 50,
  scale: 1,
  color: { r: 255, g: 255, b: 255 },
});
```

Each property on an object can be keyframed in Theatre Studio. The object definition specifies the property names, types, and default values.

## Setting Up Theatre with Remotion

### Installation

```bash
npm install @theatre/core @theatre/studio @theatre/r3f
npm install @remotion/theatre
```

### Project Integration

Create a Theatre project and wire it into the Remotion Composition:

```tsx
import { getProject } from '@theatre/core';
import { TheatreComposition } from '@remotion/theatre';

const theatreProject = getProject('VideoProject', {
  state: projectState, // Imported from a saved state JSON file
});

export const Root: React.FC = () => {
  return (
    <TheatreComposition
      id="MainVideo"
      component={MainVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      theatreProject={theatreProject}
      theatreSheet="MainScene"
    />
  );
};
```

The `TheatreComposition` wrapper synchronizes Theatre's playback position with Remotion's current frame. As Remotion advances through frames, Theatre's sheet position advances in lockstep.

### Reading Theatre Values in Components

```tsx
import { useTheatreValue } from '@remotion/theatre';

const AnimatedTitle: React.FC = () => {
  const sheet = useTheatreSheet();
  const titleObj = sheet.object('Title', {
    opacity: 0,
    y: 50,
    fontSize: 48,
  });

  const values = useTheatreValue(titleObj);

  return (
    <div
      style={{
        opacity: values.opacity,
        transform: `translateY(${values.y}px)`,
        fontSize: values.fontSize,
        color: 'white',
      }}
    >
      Welcome
    </div>
  );
};
```

`useTheatreValue` returns the current values of all properties on the object, interpolated according to the keyframes set in Theatre Studio.

## Visual Keyframe Editing in Studio

### Launching Theatre Studio

During development, enable Theatre Studio for visual editing:

```tsx
import studio from '@theatre/studio';

if (process.env.NODE_ENV === 'development') {
  studio.initialize();
}
```

Theatre Studio renders a timeline panel in the browser. This panel shows:

1. A timeline ruler with frame/time markers
2. Rows for each object and its properties
3. Keyframe diamonds at specific time positions
4. Bezier curve handles for easing between keyframes

### Keyframe Workflow

1. Select an object in the Studio outline panel.
2. Scrub the playhead to the desired frame.
3. Click the property value and type the new value. A keyframe is created automatically.
4. Repeat at different time positions to define the animation curve.
5. Adjust easing by dragging the bezier handles between keyframes.

### Property Types

Theatre supports several property types, each with an appropriate editor in Studio:

```tsx
const myObject = sheet.object('Card', {
  // Numeric (slider in Studio)
  opacity: types.number(1, { range: [0, 1] }),
  rotation: types.number(0, { range: [-180, 180] }),

  // Compound (group in Studio)
  position: types.compound({
    x: types.number(0, { range: [-1000, 1000] }),
    y: types.number(0, { range: [-1000, 1000] }),
  }),

  // String (text input in Studio)
  label: types.string('Hello'),

  // Boolean (checkbox in Studio)
  visible: types.boolean(true),

  // Color (color picker in Studio; stored as rgba object)
  color: types.rgba({ r: 1, g: 1, b: 1, a: 1 }),
});
```

Specifying `range` on numeric properties gives Studio a bounded slider, which is much easier to work with than an unbounded number input.

## Exporting Theatre Sequences for Rendering

### Saving Project State

Theatre project state (all keyframes, curves, and values) is stored as a JSON object. Export it from Studio:

1. Open Theatre Studio in the browser.
2. Click the project name in the outline.
3. Select "Export" to download the state as JSON.

Alternatively, programmatically access the state:

```tsx
const state = studio.getState();
// Save to file
```

### Loading State at Render Time

Import the saved state JSON and pass it to `getProject`:

```tsx
import projectState from './theatre-state.json';

const project = getProject('VideoProject', {
  state: projectState,
});
```

This is the critical step for production rendering. Theatre Studio is a development tool; the exported JSON is the production artifact. Remotion reads the JSON state, interpolates values for each frame, and renders without needing Studio.

### State File Version Control

Commit the Theatre state JSON alongside the video source code. Track changes over time:

```
src/
  video/
    MainVideo.tsx
    theatre-state.json    # Committed; tracks all keyframe data
```

When a designer updates keyframes in Studio, they export a new JSON file and commit it. The next render uses the updated timing.

## Combining Theatre Precision with Remotion Rendering

The integration follows this data flow:

```
Theatre Studio (design time)
  -> theatre-state.json (keyframe data)
    -> getProject() loads state
      -> useTheatreValue() reads interpolated values per frame
        -> Remotion renders each frame to video
```

### Hybrid Approach: Theatre + Remotion Code

Not every animation needs Theatre. Use Theatre for complex, timing-sensitive choreography and Remotion's `interpolate`/`spring` for simple procedural animations:

```tsx
const AnimatedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Theatre-driven values (complex choreography)
  const theatreValues = useTheatreValue(sceneObj);

  // Code-driven values (simple procedural animation)
  const backgroundPulse = spring({
    fps,
    frame,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: `rgba(26,26,46,${backgroundPulse})` }}>
      <div
        style={{
          opacity: theatreValues.titleOpacity,
          transform: `translateY(${theatreValues.titleY}px) scale(${theatreValues.titleScale})`,
          fontSize: 64,
          color: 'white',
        }}
      >
        {theatreValues.titleText}
      </div>
    </AbsoluteFill>
  );
};
```

## When to Use Theatre vs Pure Remotion

### Use Theatre When

1. **Multiple elements need coordinated timing.** Staggering 10 elements with specific delays is tedious in code. Theatre's visual timeline makes it intuitive.
2. **Easing curves need fine tuning.** Dragging bezier handles in Studio is faster than iterating on `Easing.bezier()` parameters in code.
3. **A designer is involved.** Theatre Studio provides a familiar timeline interface. No code editing required for timing adjustments.
4. **Timing needs to match audio or voiceover.** Scrubbing the timeline while listening to audio allows frame-accurate sync.
5. **The animation has many keyframes.** A property that changes 8 times across a scene is cleaner as Theatre keyframes than as a multi-point `interpolate` call.

### Use Pure Remotion When

1. **The animation is data-driven.** Generating keyframes programmatically (from an API, CSV, or array) is natural in code and awkward in a visual editor.
2. **The animation is formulaic.** Physics-based springs, sine waves, and mathematical curves are more precise in code.
3. **The project has no designer.** Theatre adds complexity. If a single developer is both animating and rendering, code-only workflows are simpler.
4. **The animation is simple.** A fade-in and a slide need two lines of `interpolate`. Theatre is overkill.
5. **Reproducibility matters.** Code-only animations are fully deterministic from source. Theatre state files are also deterministic but add an extra artifact to manage.

### Decision Guide

| Scenario | Recommendation |
|----------|----------------|
| 3 or fewer animated properties | Remotion `interpolate` or `spring` |
| 4 to 10 animated properties with independent timing | Theatre for the choreography layer |
| Data-driven charts or visualizations | Pure Remotion code |
| Music video with beat sync | Remotion for beat math, Theatre for artistic timing between beats |
| Corporate explainer with voiceover | Theatre for VO sync, Remotion for data graphics |
| Procedural generative art | Pure Remotion code |

## Collaborative Workflow

### Designer in Theatre Studio, Developer in Code

Establish a clear contract between the two roles:

1. **Developer defines objects and properties.** Create all Theatre objects in code with descriptive names and sensible defaults. This defines the "API" the designer animates against.

```tsx
// Developer writes this; designer sees these properties in Studio
const heroTitle = sheet.object('Hero Title', {
  opacity: types.number(0, { range: [0, 1] }),
  y: types.number(60, { range: [-200, 200] }),
  scale: types.number(0.8, { range: [0, 2] }),
  letterSpacing: types.number(0, { range: [-5, 20] }),
});
```

2. **Designer creates keyframes in Studio.** They open the project in a browser, scrub the timeline, and set values at key frames. No code changes needed.

3. **Designer exports state JSON.** After finishing a pass, they export the Theatre state and either commit it directly or hand it to the developer.

4. **Developer integrates and renders.** The updated state JSON is loaded by `getProject()`. The developer runs `npx remotion render` to produce the final video.

### Iteration Cycle

```
Developer: Define new object properties in code -> commit
Designer: Pull, open Studio, animate -> export state JSON -> commit
Developer: Pull, render, review -> request timing changes
Designer: Adjust in Studio -> export -> commit
Developer: Final render
```

### Conflict Resolution

Theatre state JSON files can produce merge conflicts because they contain deeply nested keyframe data. Reduce conflicts by:

1. Assigning separate sheets to different designers (one sheet per scene).
2. Using short iteration cycles with frequent commits.
3. Treating the state JSON as a designer-owned artifact. The developer defines the structure; the designer owns the timing values.

## Advanced Patterns

### Sequence Sheets

Use multiple sheets for multi-scene videos. Each sheet controls one scene's timeline:

```tsx
const introSheet = project.sheet('Intro');
const demoSheet = project.sheet('Demo');
const outroSheet = project.sheet('Outro');
```

Map sheets to Remotion Sequences. Each Sequence uses a different `theatreSheet` prop.

### Parametric Objects

Create Theatre objects from data arrays for repetitive elements:

```tsx
const items = ['Item A', 'Item B', 'Item C', 'Item D'];

const itemObjects = items.map((label, i) =>
  sheet.object(`ListItem_${i}`, {
    opacity: 0,
    x: 0,
    y: i * 60,
  })
);
```

The designer sees `ListItem_0`, `ListItem_1`, etc. in Studio and can keyframe each independently.

### Responsive Properties

Define properties relative to the video dimensions so animations scale across resolutions:

```tsx
const { width, height } = useVideoConfig();
const values = useTheatreValue(cardObj);

// Theatre stores normalized values (0 to 1); scale to actual dimensions
const x = values.normalizedX * width;
const y = values.normalizedY * height;
```

## Best Practices

1. Name Theatre objects descriptively. `Hero Title` is better than `obj1`. Studio becomes unusable with vague names.
2. Set range constraints on every numeric property. Unbounded sliders in Studio are frustrating to use.
3. Keep the state JSON file small by using as few objects as necessary. Each object adds properties that must be stored and interpolated.
4. Export state after every significant editing session. Studio does not auto-save to disk.
5. Use sheets as scene boundaries. One sheet per logical scene keeps the timeline manageable.
6. Test renders after importing new state JSON. Visual preview in Studio can differ slightly from Remotion's pixel-level render.
7. Document the object "API" in a comment block near the object definitions. This helps designers understand what each property controls without reading the rendering code.
8. Pin Theatre Studio to a specific version in `package.json`. Studio UI and state format can change between versions.
