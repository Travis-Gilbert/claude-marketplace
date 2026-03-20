# Audio Sync Reference

## Frame-Based Audio Alignment

All programmatic video operates on frames, not seconds. Convert between time and frames using the fps (frames per second) value.

```
frame = timestamp_seconds * fps
timestamp_seconds = frame / fps
```

Examples at 30fps:

| Timestamp | Frame |
|-----------|-------|
| 0.0s | 0 |
| 0.5s | 15 |
| 1.0s | 30 |
| 2.5s | 75 |
| 10.0s | 300 |

At 60fps the same timestamps map to double the frame numbers. Always reference `fps` from the video configuration rather than hardcoding values.

## Remotion Audio Component

Import and place audio within a Composition:

```tsx
import { Audio } from 'remotion';

const MyVideo: React.FC = () => {
  return (
    <>
      <Audio src={'/audio/background-music.mp3'} />
      <AbsoluteFill>
        {/* Visual content */}
      </AbsoluteFill>
    </>
  );
};
```

### Key Props

| Prop | Type | Purpose |
|------|------|---------|
| `src` | string | Path or URL to the audio file |
| `startFrom` | number | Frame offset into the audio file to begin playback |
| `endAt` | number | Frame in the audio file at which to stop |
| `volume` | number or callback | Volume level (0 to 1) or a function of frame |
| `playbackRate` | number | Speed multiplier (1 = normal, 0.5 = half speed) |
| `muted` | boolean | Silences the audio without removing it |

### Trimming Audio

Use `startFrom` and `endAt` to play a specific section of an audio file. Both values are in frames relative to the audio file, not the Composition timeline.

```tsx
const { fps } = useVideoConfig();

// Play audio from 5 seconds to 15 seconds of the source file
<Audio
  src={'/audio/interview.mp3'}
  startFrom={5 * fps}
  endAt={15 * fps}
/>
```

Wrap in a `<Sequence>` to control when the audio starts on the video timeline:

```tsx
<Sequence from={90} durationInFrames={300}>
  <Audio src={'/audio/effect.wav'} />
</Sequence>
```

This plays the effect starting at frame 90 of the Composition.

## Volume Automation

### Static Volume

```tsx
<Audio src={'/audio/bg.mp3'} volume={0.3} />
```

### Dynamic Volume with interpolate

Pass a function that receives the frame number and returns a volume between 0 and 1:

```tsx
import { interpolate, useCurrentFrame } from 'remotion';

const MyAudio: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Audio
      src={'/audio/music.mp3'}
      volume={(f) =>
        interpolate(f, [0, 30, 270, 300], [0, 0.6, 0.6, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    />
  );
};
```

This creates a fade-in over 30 frames, holds at 0.6 volume, then fades out over the final 30 frames.

### Ducking Pattern

Lower background music when voiceover is active:

```tsx
const voiceoverStart = 60;   // Frame where VO begins
const voiceoverEnd = 450;    // Frame where VO ends
const duckLevel = 0.15;      // Music volume during VO
const normalLevel = 0.5;
const fadeFrames = 15;        // Transition duration

<Audio
  src={'/audio/background.mp3'}
  volume={(f) =>
    interpolate(
      f,
      [
        voiceoverStart - fadeFrames,
        voiceoverStart,
        voiceoverEnd,
        voiceoverEnd + fadeFrames,
      ],
      [normalLevel, duckLevel, duckLevel, normalLevel],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  }
/>
```

## BPM to Frames Conversion

Synchronize visual events to musical beats by converting BPM (beats per minute) to frame intervals.

```
framesPerBeat = fps * 60 / bpm
```

| BPM | FPS | Frames per Beat |
|-----|-----|-----------------|
| 60 | 30 | 30 |
| 90 | 30 | 20 |
| 120 | 30 | 15 |
| 120 | 60 | 30 |
| 140 | 30 | ~12.86 |
| 150 | 30 | 12 |

Create a utility function:

```tsx
function beatToFrame(beatNumber: number, bpm: number, fps: number, offset = 0): number {
  const framesPerBeat = (fps * 60) / bpm;
  return Math.round(beatNumber * framesPerBeat) + offset;
}

function frameToBeat(frame: number, bpm: number, fps: number): number {
  const framesPerBeat = (fps * 60) / bpm;
  return frame / framesPerBeat;
}
```

The `offset` parameter accounts for audio files that do not start exactly on a downbeat. Measure the offset in an audio editor (the time from file start to the first beat) and convert to frames.

### Handling Non-Integer Frame Counts

When `fps * 60 / bpm` does not produce a whole number, round to the nearest frame. Over long sequences, rounding drift accumulates. Recalculate from the beat number each time rather than adding `framesPerBeat` repeatedly:

```tsx
// Correct: calculate each beat position from the origin
const beatFrames = Array.from({ length: 32 }, (_, i) =>
  Math.round(i * framesPerBeat) + offset
);

// Incorrect: accumulating rounded values drifts over time
// let frame = offset;
// for (let i = 0; i < 32; i++) { frame += Math.round(framesPerBeat); }
```

## Beat-Synced Transitions

Trigger visual changes on beat boundaries:

```tsx
const bpm = 120;
const { fps } = useVideoConfig();
const frame = useCurrentFrame();
const framesPerBeat = (fps * 60) / bpm;

// Determine current beat
const currentBeat = Math.floor(frame / framesPerBeat);

// Pulse effect on every beat
const beatProgress = (frame % framesPerBeat) / framesPerBeat;
const pulse = interpolate(beatProgress, [0, 0.15, 1], [1.1, 1.05, 1], {
  extrapolateRight: 'clamp',
});

return (
  <div style={{ transform: `scale(${pulse})` }}>
    {/* Content pulses on each beat */}
  </div>
);
```

### Beat-Synced Color Changes

```tsx
const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
const colorIndex = currentBeat % colors.length;
const backgroundColor = colors[colorIndex];
```

### Beat-Synced Scene Cuts

Align Sequence boundaries to beat frames:

```tsx
const beats = Array.from({ length: 8 }, (_, i) =>
  Math.round(i * framesPerBeat)
);

<>
  <Sequence from={beats[0]} durationInFrames={beats[2] - beats[0]} name="Intro">
    <IntroScene />
  </Sequence>
  <Sequence from={beats[2]} durationInFrames={beats[4] - beats[2]} name="Build">
    <BuildScene />
  </Sequence>
  <Sequence from={beats[4]} durationInFrames={beats[8] - beats[4]} name="Drop">
    <DropScene />
  </Sequence>
</>
```

## Waveform Visualization

### Pre-Processing Audio Data

Use `@remotion/media-utils` to extract audio metadata:

```tsx
import { getAudioData, visualizeAudio } from '@remotion/media-utils';
import { useCurrentFrame, useVideoConfig, staticFile } from 'remotion';

const Waveform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioSrc = staticFile('audio/music.mp3');

  const [audioData, setAudioData] = React.useState<AudioData | null>(null);

  React.useEffect(() => {
    getAudioData(audioSrc).then(setAudioData);
  }, [audioSrc]);

  if (!audioData) return null;

  const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64,     // Number of frequency bars
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 200 }}>
      {visualization.map((amplitude, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: `${amplitude * 100}%`,
            backgroundColor: '#3b82f6',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};
```

`visualizeAudio` returns an array of amplitude values (0 to 1) for the current frame. Use `numberOfSamples` to control the resolution. Higher values produce more bars but require more computation.

### Circular Waveform

Map frequency data to a radial layout:

```tsx
const bars = visualization.map((amp, i) => {
  const angle = (i / visualization.length) * Math.PI * 2;
  const innerRadius = 80;
  const outerRadius = innerRadius + amp * 100;
  const x1 = Math.cos(angle) * innerRadius;
  const y1 = Math.sin(angle) * innerRadius;
  const x2 = Math.cos(angle) * outerRadius;
  const y2 = Math.sin(angle) * outerRadius;

  return (
    <line
      key={i}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#3b82f6"
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
});

return (
  <svg width={400} height={400} viewBox="-200 -200 400 400">
    {bars}
  </svg>
);
```

## Voiceover Timing

### Cue Point Approach

Define cue points as an array of timestamped events. Each cue triggers a visual change:

```tsx
interface CuePoint {
  timestamp: number;    // In seconds
  label: string;
  action: string;       // Identifier for the visual event
}

const cuePoints: CuePoint[] = [
  { timestamp: 0.5, label: 'Title appears', action: 'show-title' },
  { timestamp: 3.2, label: 'First point', action: 'show-point-1' },
  { timestamp: 7.8, label: 'Second point', action: 'show-point-2' },
  { timestamp: 12.0, label: 'Conclusion', action: 'show-conclusion' },
];
```

Convert cue points to frames and use them to drive Sequences:

```tsx
const cueFrames = cuePoints.map(cue => ({
  ...cue,
  frame: Math.round(cue.timestamp * fps),
}));

// In the component
{cueFrames.map((cue, i) => {
  const nextFrame = cueFrames[i + 1]?.frame ?? durationInFrames;
  return (
    <Sequence key={cue.action} from={cue.frame} durationInFrames={nextFrame - cue.frame}>
      <SceneForAction action={cue.action} />
    </Sequence>
  );
})}
```

### Transcript-Driven Timing

For voiceover heavy content, structure timing from a transcript with word-level timestamps. Export from tools like Whisper, Descript, or Amazon Transcribe:

```tsx
interface WordTiming {
  word: string;
  start: number;
  end: number;
}

const transcript: WordTiming[] = [
  { word: 'Today', start: 0.2, end: 0.5 },
  { word: 'we', start: 0.5, end: 0.6 },
  { word: 'explore', start: 0.6, end: 1.0 },
  // ...
];
```

Use word timings to synchronize text highlights, subtitle displays, or animated text reveals.

### Subtitle Component

```tsx
const Subtitles: React.FC<{ words: WordTiming[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const activeWord = words.find(
    w => currentTime >= w.start && currentTime < w.end
  );
  const visibleWords = words.filter(
    w => currentTime >= w.start - 0.05
  );

  return (
    <div style={{ fontSize: 36, color: 'white', textAlign: 'center' }}>
      {visibleWords.map((w, i) => (
        <span
          key={i}
          style={{
            color: w === activeWord ? '#fbbf24' : '#ffffff',
            transition: 'color 0.1s',
          }}
        >
          {w.word}{' '}
        </span>
      ))}
    </div>
  );
};
```

## Motion Canvas Audio Integration

Motion Canvas handles audio through its project configuration and scene-level API:

```tsx
import { makeProject } from '@motion-canvas/core';
import audio from './audio/narration.wav';

export default makeProject({
  scenes: [intro, main, outro],
  audio: audio,    // Background audio for the entire project
});
```

### Scene-Level Audio Markers

Use the Motion Canvas editor to place audio markers on the timeline. Reference them with `waitUntil()`:

```tsx
export default makeScene2D(function* (view) {
  const title = createRef<Txt>();

  view.add(<Txt ref={title} fontSize={64} fill={'#fff'} opacity={0} />);

  yield* waitUntil('intro-start');
  yield* title().text('Welcome', 0.4);
  yield* title().opacity(1, 0.3);

  yield* waitUntil('main-topic');
  yield* title().text('Core Concepts', 0.4);

  yield* waitUntil('conclusion');
  yield* title().text('Summary', 0.4);
});
```

This approach decouples animation code from specific time values. Adjust timing by moving markers in the editor without changing code.

## Pre-Processing Audio Metadata

For projects that need audio analysis before rendering, pre-process the audio file and output a JSON metadata file:

```bash
# Extract beat positions using aubio (command line tool)
aubiotrack audio/music.wav -B 512 -H 256 > beats.txt

# Extract onset (transient) positions
aubioonset audio/music.wav > onsets.txt
```

Convert to a JSON format consumable by Remotion or Motion Canvas:

```tsx
// beats.json
{
  "bpm": 120,
  "offset": 0.05,
  "beats": [0.05, 0.55, 1.05, 1.55, 2.05],
  "downbeats": [0.05, 2.05, 4.05],
  "sections": [
    { "label": "intro", "start": 0, "end": 8.0 },
    { "label": "verse", "start": 8.0, "end": 24.0 },
    { "label": "chorus", "start": 24.0, "end": 40.0 }
  ]
}
```

Load this metadata in the video component and convert to frames at render time:

```tsx
import beatsData from '../data/beats.json';

const beatFrames = beatsData.beats.map(t => Math.round(t * fps));
const sectionFrames = beatsData.sections.map(s => ({
  ...s,
  startFrame: Math.round(s.start * fps),
  endFrame: Math.round(s.end * fps),
}));
```

## Best Practices

1. Always pre-process audio metadata rather than analyzing audio at render time. Rendering is frame-by-frame; audio analysis should happen once beforehand.
2. Use `staticFile()` in Remotion for audio assets in the `public/` directory. Avoid importing audio files as modules.
3. Keep volume automation smooth. Abrupt volume changes (jumping from 0 to 1 in a single frame) produce clicks. Use at least 5 to 10 frames for volume transitions.
4. Round frame calculations with `Math.round()`, not `Math.floor()`. Rounding minimizes drift over long sequences.
5. Test audio sync at export, not just in preview. Preview playback can have latency that masks sync issues.
6. For music-driven videos, choose fps values that divide cleanly with common BPMs. 30fps works well with 60, 90, 120, and 150 BPM.
7. Store cue points and beat data as external JSON files, not inline in components. This makes timing adjustable without touching animation code.
8. When ducking background music under voiceover, fade down before the voice starts (10 to 15 frames lead time) so the volume is already low when speech begins.
