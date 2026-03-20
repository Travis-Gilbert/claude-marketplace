# Remotion Architecture Reference

## Project Structure

Initialize a Remotion project with `npx create-video@latest`. The resulting structure follows this layout:

```
my-video/
  src/
    Root.tsx              # Entry point: registers all Compositions
    MyComposition.tsx     # A video component
    index.ts              # Calls registerRoot(Root)
  public/                 # Static assets (images, audio, fonts)
  remotion.config.ts      # Build and render configuration
  package.json
```

The `Root` component is the single entry point where all Compositions are registered. Think of it as the table of contents for the entire video project. Import every Composition here and wrap them in a `<Composition>` tag.

```tsx
import { Composition } from 'remotion';
import { Intro } from './Intro';
import { MainContent } from './MainContent';
import { Outro } from './Outro';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MainContent"
        component={MainContent}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

## Composition Definition

Every `<Composition>` requires five properties:

| Property | Type | Purpose |
|----------|------|---------|
| `id` | string | Unique identifier; used in CLI render commands |
| `component` | React.FC | The React component that renders the video |
| `width` | number | Output width in pixels |
| `height` | number | Output height in pixels |
| `fps` | number | Frames per second |
| `durationInFrames` | number | Total frame count |

Calculate `durationInFrames` from desired duration: `seconds * fps`. A 10 second video at 30fps requires `durationInFrames={300}`.

Use `defaultProps` to pass initial data into the component:

```tsx
<Composition
  id="TitleCard"
  component={TitleCard}
  durationInFrames={90}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={{ title: 'Episode One', subtitle: 'Getting Started' }}
/>
```

## Sequence Component

`<Sequence>` places content on the timeline. It offsets and constrains the time window for its children.

```tsx
import { Sequence } from 'remotion';

const MyVideo: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={60} name="Title">
        <TitleSlide />
      </Sequence>
      <Sequence from={60} durationInFrames={120} name="Body">
        <BodyContent />
      </Sequence>
      <Sequence from={180} durationInFrames={60} name="Outro">
        <OutroSlide />
      </Sequence>
    </>
  );
};
```

Key properties:

- `from`: The frame at which this Sequence begins (0-indexed).
- `durationInFrames`: How many frames this Sequence lasts. Omit to extend to the end of the parent.
- `name`: Label shown in the Remotion Studio timeline. Always provide one for debugging clarity.
- `layout`: Set to `"none"` to prevent the Sequence from creating an absolutely positioned container. Useful when children manage their own positioning.

Children of a `<Sequence>` see their local frame count starting at 0. A component inside a Sequence starting at frame 60 will receive `useCurrentFrame() === 0` when the global frame is 60.

## useCurrentFrame and useVideoConfig

These two hooks are the foundation of all animation logic.

```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';

const AnimatedBox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const opacity = Math.min(1, frame / 30);

  return (
    <div style={{ opacity, width: '200px', height: '200px', background: 'blue' }} />
  );
};
```

`useCurrentFrame()` returns the current frame number relative to the innermost `<Sequence>`. This is the primary driver for all animation calculations.

`useVideoConfig()` returns `{ fps, durationInFrames, width, height, id, defaultProps }`. Use `fps` for time calculations, `width` and `height` for responsive positioning.

## interpolate

The workhorse function for mapping frame numbers to animation values. It takes an input value and maps it from one range to another.

```tsx
import { interpolate, Easing } from 'remotion';

const frame = useCurrentFrame();

// Fade in over first 30 frames
const opacity = interpolate(frame, [0, 30], [0, 1]);

// Slide in from left over frames 10 to 40
const translateX = interpolate(frame, [10, 40], [-200, 0], {
  easing: Easing.out(Easing.cubic),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

Signature: `interpolate(input, inputRange, outputRange, options?)`

Options:

- `easing`: An easing function from `Easing`. Default is linear.
- `extrapolateLeft`: What happens when input is below the input range. `'extend'` (default, continues the curve), `'clamp'` (caps at the first output value), `'identity'` (returns the input value).
- `extrapolateRight`: Same options, for when input exceeds the range.

Use multiple range points for multi-step animations:

```tsx
// Fade in, hold, then fade out
const opacity = interpolate(frame, [0, 20, 80, 100], [0, 1, 1, 0], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

Always use `'clamp'` for both extrapolation directions unless there is a specific reason to extend the curve. Unclamped values produce unexpected results when the frame goes outside the defined range.

## spring

Generates physics-based spring animation values. Returns a number progressing from 0 to 1 (or the specified `from`/`to`).

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    fps,
    frame,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.5,
    },
  });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      Hello
    </div>
  );
};
```

Configuration parameters:

- `damping`: Higher values reduce oscillation. Range: 1 to 100+. Default: 10.
- `stiffness`: Higher values make the spring snappier. Range: 1 to 500+. Default: 100.
- `mass`: Heavier objects move slower. Range: 0.1 to 10+. Default: 1.
- `overshootClamping`: Set to `true` to prevent the value from exceeding the target.

Use `from` and `to` to control the output range. The `delay` parameter offsets when the spring begins.

```tsx
const translateY = spring({
  fps,
  frame,
  from: 100,
  to: 0,
  delay: 15,
  config: { damping: 14, stiffness: 180 },
});
```

## AbsoluteFill

A convenience component that renders an absolutely positioned div filling the entire Composition. Use it for layering.

```tsx
import { AbsoluteFill } from 'remotion';

const Scene: React.FC = () => {
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: '#1a1a2e' }}>
        {/* Background layer */}
      </AbsoluteFill>
      <AbsoluteFill>
        {/* Content layer */}
        <h1 style={{ color: 'white', fontSize: 72 }}>Title</h1>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 40 }}>
        {/* Foreground overlay */}
        <p style={{ color: '#aaa' }}>Lower third text</p>
      </AbsoluteFill>
    </>
  );
};
```

`AbsoluteFill` is equivalent to `<div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column' }}>`. Stacking order follows DOM order (later elements render on top).

## Still

Use `<Still>` for single frame outputs like thumbnails, poster images, or social media cards.

```tsx
<Still
  id="Thumbnail"
  component={ThumbnailDesign}
  width={1280}
  height={720}
  defaultProps={{ episodeNumber: 5 }}
/>
```

Render with `npx remotion still Thumbnail --output=thumbnail.png`. Stills share the same component model as videos but have no timeline.

## Data Fetching

### getInputProps

Pass data from the CLI or Remotion Studio into Compositions at render time:

```bash
npx remotion render MyComp --props='{"title":"Hello","items":["a","b","c"]}'
```

Access inside the component:

```tsx
import { getInputProps } from 'remotion';

const props = getInputProps();
// props.title === "Hello"
```

### calculateMetadata

For dynamic Compositions where duration, dimensions, or props depend on external data, use `calculateMetadata`:

```tsx
<Composition
  id="DynamicVideo"
  component={DynamicVideo}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={100} // fallback
  defaultProps={{ dataUrl: '' }}
  calculateMetadata={async ({ props }) => {
    const response = await fetch(props.dataUrl);
    const data = await response.json();
    return {
      durationInFrames: data.items.length * 90,
      props: { ...props, items: data.items },
    };
  }}
/>
```

`calculateMetadata` runs before rendering begins. It can modify `durationInFrames`, `fps`, `width`, `height`, and `props`. Use it to fetch API data, load file metadata, or compute durations based on content length.

## Component Reuse

Remotion components are standard React components. Share them between a web application and video rendering:

```tsx
// Shared component
export const BrandedCard: React.FC<{ title: string; color: string }> = ({ title, color }) => {
  return (
    <div style={{ background: color, padding: 40, borderRadius: 12 }}>
      <h2 style={{ fontSize: 48, color: 'white' }}>{title}</h2>
    </div>
  );
};

// In Remotion Composition
const VideoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity }}>
      <BrandedCard title="Welcome" color="#3b82f6" />
    </AbsoluteFill>
  );
};

// In web app
const WebPage: React.FC = () => {
  return <BrandedCard title="Welcome" color="#3b82f6" />;
};
```

Wrap animation logic (anything that calls `useCurrentFrame`) in the Remotion layer. Keep presentational components pure so they render identically in both contexts. This pattern is especially powerful for design systems where brand consistency matters across video content and web interfaces.

## Configuration File

`remotion.config.ts` controls build and preview behavior:

```ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');    // or 'png' for transparency
Config.setOverwriteOutput(true);       // Overwrite without prompting
Config.setConcurrency(4);              // Parallel frame rendering
```

Override per render with CLI flags: `--image-format`, `--overwrite`, `--concurrency`.

## Best Practices

1. Keep Compositions small and composable. Build scenes as independent components, then assemble them via Sequences in a master Composition.
2. Extract animation constants (durations, delays, easing configs) into a shared `timing.ts` file. This makes it easy to adjust pacing globally.
3. Use `spring` for entrances and UI element animations. Use `interpolate` for continuous motion, opacity, and color transitions.
4. Always clamp interpolation unless the animation intentionally extends beyond its defined range.
5. Prefer `AbsoluteFill` over manual absolute positioning. It handles the common case and reads more clearly.
6. Name every Sequence. The Remotion Studio timeline becomes unreadable without descriptive labels.
7. Test at multiple playback speeds in Remotion Studio before rendering. Timing issues are easier to spot at 0.5x.
