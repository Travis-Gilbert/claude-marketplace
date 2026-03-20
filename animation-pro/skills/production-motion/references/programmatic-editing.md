# Programmatic Editing Reference

## Cut Transitions

The simplest transition: one Sequence ends and the next begins at the same frame. No overlap, no blending.

```tsx
<Sequence from={0} durationInFrames={90} name="Scene A">
  <SceneA />
</Sequence>
<Sequence from={90} durationInFrames={120} name="Scene B">
  <SceneB />
</Sequence>
```

The cut happens at frame 90. Scene A vanishes and Scene B appears instantly. Use cuts for high energy edits, dialogue back-and-forth, or when the visual context change is self-evident.

## Dissolve / Crossfade

Overlap two Sequences and animate opacity on each. The outgoing scene fades out while the incoming scene fades in.

```tsx
const transitionDuration = 30; // 1 second at 30fps
const sceneAEnd = 120;

<Sequence from={0} durationInFrames={sceneAEnd} name="Scene A">
  <DissolveOut startFrame={sceneAEnd - transitionDuration} duration={transitionDuration}>
    <SceneA />
  </DissolveOut>
</Sequence>
<Sequence from={sceneAEnd - transitionDuration} durationInFrames={150} name="Scene B">
  <DissolveIn duration={transitionDuration}>
    <SceneB />
  </DissolveIn>
</Sequence>
```

Build the dissolve wrappers:

```tsx
const DissolveOut: React.FC<{
  startFrame: number;
  duration: number;
  children: React.ReactNode;
}> = ({ startFrame, duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const DissolveIn: React.FC<{
  duration: number;
  children: React.ReactNode;
}> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
```

The overlap region is `transitionDuration` frames long. Both scenes are visible simultaneously, blending via opacity.

## Slide Transitions

Animate `translateX` or `translateY` to slide one scene off-screen while the next slides in.

### Slide Left (Push)

```tsx
const SlideTransition: React.FC<{
  direction: 'left' | 'right' | 'up' | 'down';
  duration: number;
  children: [React.ReactNode, React.ReactNode]; // [outgoing, incoming]
}> = ({ direction, duration, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const progress = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const offsets: Record<string, { outX: number; outY: number; inX: number; inY: number }> = {
    left:  { outX: -width * progress,  outY: 0, inX: width * (1 - progress),   inY: 0 },
    right: { outX: width * progress,   outY: 0, inX: -width * (1 - progress),  inY: 0 },
    up:    { outX: 0, outY: -height * progress,  inX: 0, inY: height * (1 - progress) },
    down:  { outX: 0, outY: height * progress,   inX: 0, inY: -height * (1 - progress) },
  };

  const { outX, outY, inX, inY } = offsets[direction];

  return (
    <>
      <AbsoluteFill style={{ transform: `translate(${outX}px, ${outY}px)` }}>
        {children[0]}
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${inX}px, ${inY}px)` }}>
        {children[1]}
      </AbsoluteFill>
    </>
  );
};
```

Use within overlapping Sequences:

```tsx
<Sequence from={overlapStart} durationInFrames={30}>
  <SlideTransition direction="left" duration={30}>
    <SceneA />
    <SceneB />
  </SlideTransition>
</Sequence>
```

## Wipe Transitions

Animate `clip-path` to reveal one scene underneath another. Wipes are directional and feel more cinematic than dissolves.

### Horizontal Wipe

```tsx
const HorizontalWipe: React.FC<{
  duration: number;
  children: [React.ReactNode, React.ReactNode];
}> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, duration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  return (
    <>
      <AbsoluteFill>{children[1]}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${progress}% 0 0)` }}>
        {children[0]}
      </AbsoluteFill>
    </>
  );
};
```

### Radial Wipe (Iris)

```tsx
const IrisWipe: React.FC<{
  duration: number;
  children: [React.ReactNode, React.ReactNode];
}> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, duration], [0, 75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <AbsoluteFill>{children[1]}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${progress}% at 50% 50%)` }}>
        {children[1]}
      </AbsoluteFill>
    </>
  );
};
```

### Diagonal Wipe

```tsx
const clipPath = `polygon(0 0, ${progress}% 0, ${progress - 20}% 100%, 0 100%)`;
```

Adjust the polygon points to change the angle and softness of the wipe edge.

## Text Animation

### Character-by-Character Reveal

```tsx
const CharReveal: React.FC<{ text: string; startFrame?: number }> = ({ text, startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const charsToShow = interpolate(
    frame,
    [startFrame, startFrame + text.length * 2],
    [0, text.length],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <span style={{ fontSize: 48, fontFamily: 'monospace' }}>
      {text.split('').map((char, i) => (
        <span key={i} style={{ opacity: i < charsToShow ? 1 : 0 }}>
          {char}
        </span>
      ))}
    </span>
  );
};
```

### Word-by-Word Reveal

```tsx
const WordReveal: React.FC<{ text: string; framesPerWord?: number }> = ({
  text,
  framesPerWord = 8,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');

  return (
    <div style={{ fontSize: 48, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {words.map((word, i) => {
        const wordStart = i * framesPerWord;
        const opacity = interpolate(frame, [wordStart, wordStart + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const translateY = interpolate(frame, [wordStart, wordStart + 6], [10, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <span
            key={i}
            style={{ opacity, transform: `translateY(${translateY}px)` }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
```

### Typewriter Effect

Combine character reveal with a blinking cursor:

```tsx
const Typewriter: React.FC<{ text: string; charsPerFrame?: number }> = ({
  text,
  charsPerFrame = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visibleChars = Math.floor(frame * charsPerFrame);
  const displayText = text.slice(0, Math.min(visibleChars, text.length));
  const cursorVisible = Math.floor(frame / (fps / 2)) % 2 === 0;
  const typing = visibleChars < text.length;

  return (
    <span style={{ fontSize: 36, fontFamily: 'monospace' }}>
      {displayText}
      <span style={{ opacity: typing || cursorVisible ? 1 : 0 }}>|</span>
    </span>
  );
};
```

## Lower Thirds and Title Cards

### Lower Third

A bar at the bottom of the frame showing name and title, common in interviews and presentations:

```tsx
const LowerThird: React.FC<{ name: string; title: string }> = ({ name, title }) => {
  const frame = useCurrentFrame();

  const slideIn = interpolate(frame, [0, 20], [-300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const holdEnd = 150; // frames to display
  const slideOut = interpolate(frame, [holdEnd, holdEnd + 20], [0, -300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  const translateX = frame < holdEnd ? slideIn : slideOut;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 60 }}>
      <div style={{ transform: `translateX(${translateX}px)` }}>
        <div style={{ background: '#1a1a2e', padding: '12px 24px', display: 'inline-block' }}>
          <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{name}</div>
          <div style={{ color: '#94a3b8', fontSize: 20 }}>{title}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### Title Card

Full-screen title with animated entrance:

```tsx
const TitleCard: React.FC<{ heading: string; subheading: string }> = ({ heading, subheading }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingScale = spring({ fps, frame, config: { damping: 15, stiffness: 120 } });
  const subOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ transform: `scale(${headingScale})`, color: '#fff', fontSize: 72 }}>
        {heading}
      </div>
      <div style={{ opacity: subOpacity, color: '#64748b', fontSize: 28, marginTop: 16 }}>
        {subheading}
      </div>
    </AbsoluteFill>
  );
};
```

## Picture-in-Picture

Layer a smaller video or content area over the main content:

```tsx
const PictureInPicture: React.FC<{
  mainContent: React.ReactNode;
  pipContent: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  pipScale?: number;
}> = ({ mainContent, pipContent, position = 'bottom-right', pipScale = 0.3 }) => {
  const { width, height } = useVideoConfig();
  const margin = 24;

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left':     { top: margin, left: margin },
    'top-right':    { top: margin, right: margin },
    'bottom-left':  { bottom: margin, left: margin },
    'bottom-right': { bottom: margin, right: margin },
  };

  return (
    <>
      <AbsoluteFill>{mainContent}</AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          width: width * pipScale,
          height: height * pipScale,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          ...positionStyles[position],
        }}
      >
        {pipContent}
      </div>
    </>
  );
};
```

Animate the PIP entrance with a spring on scale and opacity for polish.

## Ken Burns Effect

Pan and zoom over a static image to create movement. Named after the documentary filmmaker's technique.

```tsx
const KenBurns: React.FC<{
  src: string;
  startScale?: number;
  endScale?: number;
  startPosition?: [number, number];
  endPosition?: [number, number];
}> = ({
  src,
  startScale = 1,
  endScale = 1.3,
  startPosition = [0, 0],
  endPosition = [-50, -30],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(progress, [0, 1], [startScale, endScale]);
  const translateX = interpolate(progress, [0, 1], [startPosition[0], endPosition[0]]);
  const translateY = interpolate(progress, [0, 1], [startPosition[1], endPosition[1]]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

Vary the start/end parameters across different shots for visual variety. Alternate between zoom in and zoom out. Typical scale range: 1.0 to 1.3 (subtle) or 1.0 to 1.6 (dramatic).

## Split Screen

Display multiple content areas simultaneously:

```tsx
const SplitScreen: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: number;
  gap?: number;
}> = ({ left, right, ratio = 0.5, gap = 4 }) => {
  const { width, height } = useVideoConfig();
  const leftWidth = width * ratio - gap / 2;
  const rightWidth = width * (1 - ratio) - gap / 2;

  return (
    <AbsoluteFill style={{ flexDirection: 'row' }}>
      <div style={{ width: leftWidth, height, overflow: 'hidden' }}>
        {left}
      </div>
      <div style={{ width: gap, backgroundColor: '#000' }} />
      <div style={{ width: rightWidth, height, overflow: 'hidden' }}>
        {right}
      </div>
    </AbsoluteFill>
  );
};
```

Animate the `ratio` prop over time to create a dynamic split that shifts emphasis between sides.

## Overlay Graphics and Watermarks

### Static Watermark

```tsx
const Watermark: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 20,
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
        {text}
      </span>
    </AbsoluteFill>
  );
};
```

### Animated Progress Bar

```tsx
const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.3)', width: '100%' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: '#3b82f6',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
```

## Best Practices

1. Keep transition durations consistent within a video. Pick a standard (15 or 20 frames at 30fps) and use it everywhere unless there is a specific reason to vary.
2. Match transition style to content tone. Cuts for energy, dissolves for reflective moments, slides for sequential content, wipes for dramatic reveals.
3. Never use more than two transition types in a short video. Variety in transitions distracts from content.
4. Always use `extrapolateLeft: 'clamp'` and `extrapolateRight: 'clamp'` on transition interpolations. Unclamped values during overlaps produce visual artifacts.
5. Test text animations with varying string lengths. A word reveal that looks good with 5 words may feel sluggish with 20.
6. Build transition components as reusable wrappers. Pass children and configuration as props rather than hardcoding content inside transitions.
7. For Ken Burns, always use `overflow: 'hidden'` on the container. Scaling past 1.0 without clipping exposes the image edges.
8. Lower thirds should animate in and out. A static lower third appearing and disappearing on a cut feels amateurish.
