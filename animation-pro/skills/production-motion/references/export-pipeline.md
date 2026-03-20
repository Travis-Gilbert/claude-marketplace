# Export Pipeline Reference

## Remotion CLI Rendering

Render a Composition to a video file from the command line:

```bash
npx remotion render <composition-id> <output-path>
```

Example:

```bash
npx remotion render MyVideo out/video.mp4
```

This renders the Composition with id `MyVideo` to `out/video.mp4`. Remotion renders each frame as an image, then assembles them into a video using FFmpeg (bundled automatically).

### Common CLI Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `--codec` | Video codec | `--codec h264` |
| `--image-format` | Frame format during render | `--image-format jpeg` |
| `--quality` | JPEG quality (1 to 100) | `--quality 80` |
| `--scale` | Resolution multiplier | `--scale 2` |
| `--frames` | Render specific frame range | `--frames 0-90` |
| `--props` | Pass input props as JSON | `--props='{"title":"Hi"}'` |
| `--concurrency` | Parallel frame rendering | `--concurrency 4` |
| `--overwrite` | Overwrite existing output | `--overwrite` |
| `--log` | Log level | `--log verbose` |
| `--crf` | Constant Rate Factor (quality) | `--crf 18` |

### Rendering a Still

```bash
npx remotion still <composition-id> <output-path>
```

Renders a single frame. Use for thumbnails, poster images, and social cards:

```bash
npx remotion still Thumbnail out/thumb.png
npx remotion still Thumbnail out/thumb.png --frame 45
```

## Output Formats

### MP4 (H.264)

The default and most widely compatible format. Plays on virtually every device and platform.

```bash
npx remotion render MyVideo out/video.mp4 --codec h264
```

H.264 configuration:

- `--crf 18`: High quality, moderate file size (range: 0 to 51; lower is better; 18 is visually lossless)
- `--crf 23`: Balanced quality and size (default)
- `--crf 28`: Smaller file, visible compression artifacts

Profile and level are auto-selected based on resolution and fps.

### MP4 (H.265 / HEVC)

Better compression than H.264 at the same quality. Supported on modern devices but not universally playable in browsers.

```bash
npx remotion render MyVideo out/video.mp4 --codec h265
```

Use H.265 when the output is for download or direct playback (not web streaming) and file size matters.

### WebM (VP8)

Open format supported in Chrome, Firefox, and Edge. Good for web embedding.

```bash
npx remotion render MyVideo out/video.webm --codec vp8
```

VP8 produces larger files than H.264 at comparable quality. Use it when an open, royalty-free format is required.

### WebM (VP9)

Better compression than VP8. Supported in modern browsers.

```bash
npx remotion render MyVideo out/video.webm --codec vp9
```

VP9 render times are significantly longer than H.264. Plan for 2 to 5 times slower encoding.

### ProRes

Apple's professional editing codec. Very large files, extremely high quality. Ideal for video editing workflows where the output will be imported into Final Cut Pro, DaVinci Resolve, or Premiere Pro for further editing.

```bash
npx remotion render MyVideo out/video.mov --codec prores --prores-profile 4444
```

ProRes profiles:

| Profile | Use Case | Quality |
|---------|----------|---------|
| `proxy` | Offline editing, proxy workflows | Lowest |
| `light` | Light editing | Low |
| `standard` | General editing | Medium |
| `hq` | Finishing | High |
| `4444` | Compositing, graphics with alpha | Highest |
| `4444-xq` | HDR, maximum quality | Maximum |

ProRes 4444 supports alpha transparency. Use it when exporting overlays or lower thirds that will be composited in an NLE.

### GIF

Animated GIF output for social media, documentation, and chat:

```bash
npx remotion render MyVideo out/animation.gif --codec gif
```

GIF limitations: 256 colors per frame, no audio, large file sizes for long content. Keep GIF renders under 10 seconds and under 720p for reasonable file sizes.

Optimize GIF quality with:
- `--every-nth-frame 2`: Skip every other frame (halves file size, reduces smoothness)
- `--number-of-gif-loops 0`: Infinite loop (default is 1)

## Resolution and Quality Settings

### Resolution via Composition

Resolution is defined in the Composition, not the CLI. Change resolution by modifying `width` and `height`:

```tsx
<Composition
  id="YouTube1080"
  component={Video}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={900}
/>

<Composition
  id="InstagramSquare"
  component={Video}
  width={1080}
  height={1080}
  fps={30}
  durationInFrames={900}
/>

<Composition
  id="TikTokVertical"
  component={Video}
  width={1080}
  height={1920}
  fps={30}
  durationInFrames={900}
/>
```

### Resolution Scaling

Use `--scale` to multiply the Composition's native resolution:

```bash
# Render at 2x (3840x2160 from a 1920x1080 Composition)
npx remotion render MyVideo out/4k.mp4 --scale 2

# Render at 0.5x (960x540 from a 1920x1080 Composition)
npx remotion render MyVideo out/preview.mp4 --scale 0.5
```

Scaling is applied after the component renders. Use 0.5x for fast preview renders during development.

### CRF (Constant Rate Factor) Guide

| CRF | Quality | File Size | Use Case |
|-----|---------|-----------|----------|
| 0 | Lossless | Very large | Archival master |
| 15 to 18 | Visually lossless | Large | Final delivery, YouTube upload |
| 18 to 23 | High quality | Medium | General purpose |
| 23 to 28 | Acceptable | Small | Web preview, draft review |
| 28+ | Low quality | Very small | Rough previews only |

For YouTube upload, use CRF 18. YouTube re-encodes everything, so starting with high quality preserves detail through the re-encoding.

## Codec Selection Guide

| Scenario | Codec | Reason |
|----------|-------|--------|
| YouTube upload | H.264, CRF 18 | Maximum compatibility, YouTube re-encodes |
| Web embedding | H.264 or VP9 | Browser support; VP9 for smaller files |
| Social media (Twitter, LinkedIn) | H.264, CRF 20 | Platform compatibility, reasonable size |
| NLE import (Premiere, Resolve) | ProRes HQ or 4444 | Edit-friendly, preserves quality |
| Overlay/lower third for compositing | ProRes 4444 | Alpha channel support |
| Email attachment / chat | GIF or H.264 at low res | Small file size |
| Archival | ProRes 4444-XQ or H.264 CRF 0 | Maximum quality preservation |

## Remotion Lambda (Cloud Rendering)

Render videos in the cloud using AWS Lambda for parallel frame rendering. Dramatically faster than local rendering for long videos.

### Setup

```bash
npm install @remotion/lambda
npx remotion lambda policies role     # Create IAM role
npx remotion lambda sites create      # Deploy the video bundle
```

### Rendering

```bash
npx remotion lambda render <site-url> <composition-id>
```

Or programmatically:

```tsx
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda';

const { renderId, bucketName } = await renderMediaOnLambda({
  region: 'us-east-1',
  functionName: 'remotion-render',
  serveUrl: siteUrl,
  composition: 'MyVideo',
  codec: 'h264',
  inputProps: { title: 'Hello' },
});

// Poll for completion
const progress = await getRenderProgress({
  renderId,
  bucketName,
  region: 'us-east-1',
  functionName: 'remotion-render',
});
```

Lambda splits the video into chunks, renders each chunk on a separate Lambda function, then concatenates the results. A 10-minute 1080p video that takes 30 minutes locally can render in 2 to 3 minutes on Lambda.

### Cost Considerations

Lambda is billed per millisecond of compute time across all invocations. A render that uses 200 Lambda functions for 10 seconds each is billed for 2000 seconds of compute. Estimate costs with the Remotion Lambda calculator before running large batches.

## Batch Rendering Multiple Compositions

### CLI Scripting

Render multiple Compositions in a shell script:

```bash
#!/bin/bash
COMPOSITIONS=("Intro" "Chapter1" "Chapter2" "Chapter3" "Outro")

for comp in "${COMPOSITIONS[@]}"; do
  echo "Rendering $comp..."
  npx remotion render "$comp" "out/${comp}.mp4" --codec h264 --crf 18
done
```

### Programmatic Batch Rendering

Use the Remotion Node.js API for more control:

```tsx
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const bundled = await bundle({ entryPoint: './src/index.ts' });

const compositions = ['Intro', 'Chapter1', 'Chapter2', 'Outro'];

for (const comp of compositions) {
  const composition = await selectComposition({
    serveUrl: bundled,
    id: comp,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: `out/${comp}.mp4`,
  });

  console.log(`Rendered ${comp}`);
}
```

### Data-Driven Batch Rendering

Generate videos from a dataset (e.g., one video per product, customer, or data point):

```tsx
const items = [
  { id: 'product-1', name: 'Widget', price: '$29' },
  { id: 'product-2', name: 'Gadget', price: '$49' },
  { id: 'product-3', name: 'Doohickey', price: '$19' },
];

for (const item of items) {
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'ProductAd',
    inputProps: item,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: `out/${item.id}.mp4`,
    inputProps: item,
  });
}
```

## Motion Canvas Rendering Pipeline

Motion Canvas renders via its CLI:

```bash
npx motion-canvas render
```

This renders all scenes in the project to the configured output directory. Output defaults to the `output/` folder in the project root.

### Configuration

Set render options in `vite.config.ts` (Motion Canvas uses Vite):

```ts
import { defineConfig } from 'vite';
import motionCanvas from '@motion-canvas/vite-plugin';

export default defineConfig({
  plugins: [
    motionCanvas({
      output: './output',
    }),
  ],
});
```

### Frame Sequence Export

Motion Canvas can output individual frame images (PNG sequence) instead of a video file. This is useful for importing into professional compositing software or for post-processing with FFmpeg.

```bash
npx motion-canvas render --format png
```

The output directory will contain numbered frames: `000000.png`, `000001.png`, etc.

## FFmpeg Post-Processing

FFmpeg handles tasks that fall outside the rendering engine: trimming, concatenation, audio mixing, format conversion, and more.

### Trimming

```bash
# Trim from 5 seconds to 15 seconds
ffmpeg -i input.mp4 -ss 5 -to 15 -c copy trimmed.mp4

# Trim with re-encoding (frame accurate)
ffmpeg -i input.mp4 -ss 5 -to 15 -c:v libx264 -crf 18 trimmed.mp4
```

Use `-c copy` for fast, lossless trimming (cuts at nearest keyframe). Use re-encoding for frame-accurate cuts.

### Concatenation

Combine multiple videos sequentially:

```bash
# Create a file list
echo "file 'intro.mp4'" > filelist.txt
echo "file 'main.mp4'" >> filelist.txt
echo "file 'outro.mp4'" >> filelist.txt

# Concatenate
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
```

All input files must have the same codec, resolution, and frame rate for `-c copy` concatenation. If they differ, re-encode:

```bash
ffmpeg -f concat -safe 0 -i filelist.txt -c:v libx264 -crf 18 output.mp4
```

### Audio Mixing

Add background music to a rendered video:

```bash
# Replace audio entirely
ffmpeg -i video.mp4 -i music.mp3 -c:v copy -c:a aac -map 0:v -map 1:a output.mp4

# Mix original audio with background music
ffmpeg -i video.mp4 -i music.mp3 \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac output.mp4
```

### Audio Volume Adjustment

```bash
# Reduce music volume to 30%
ffmpeg -i video.mp4 -i music.mp3 \
  -filter_complex "[1:a]volume=0.3[bg];[0:a][bg]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac output.mp4
```

### Adding Fade In/Out

```bash
# 1 second fade in at start, 1 second fade out at end (30 second video)
ffmpeg -i input.mp4 \
  -vf "fade=in:0:30,fade=out:870:30" \
  -af "afade=in:0:30,afade=out:st=29:d=1" \
  -c:v libx264 -crf 18 output.mp4
```

### Frame Sequence to Video

Convert a PNG sequence from Motion Canvas to a video:

```bash
ffmpeg -framerate 30 -i output/%06d.png -c:v libx264 -crf 18 -pix_fmt yuv420p video.mp4
```

The `-pix_fmt yuv420p` flag ensures compatibility with most players. Without it, some players show a green or corrupted image.

### Adding Audio to Frame Sequence

```bash
ffmpeg -framerate 30 -i frames/%06d.png -i audio/narration.wav \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest output.mp4
```

## Optimizing Render Time

### Concurrency

Remotion renders multiple frames in parallel. Set concurrency based on available CPU cores:

```bash
npx remotion render MyVideo out.mp4 --concurrency 8
```

General rule: set concurrency to the number of CPU cores minus 1. Higher values increase memory usage. Monitor system resources and reduce if the machine becomes unresponsive.

### Image Format

Choose JPEG for opaque content and PNG for transparent content:

```bash
# JPEG: faster encoding, smaller intermediate files, no transparency
npx remotion render MyVideo out.mp4 --image-format jpeg --quality 80

# PNG: supports transparency, larger intermediate files, slower
npx remotion render MyVideo out.mp4 --image-format png
```

JPEG renders 20 to 40% faster than PNG for opaque content. Use PNG only when the Composition contains transparency that must be preserved (e.g., ProRes 4444 output).

### Reducing Resolution for Previews

Render at half resolution for review:

```bash
npx remotion render MyVideo preview.mp4 --scale 0.5
```

This renders 4 times fewer pixels, producing a preview in roughly one quarter of the time.

### Frame Range Rendering

Render only the section being worked on:

```bash
npx remotion render MyVideo section.mp4 --frames 300-600
```

### Caching

Remotion caches the webpack bundle between renders. Avoid deleting `node_modules/.cache` unless troubleshooting build issues. The first render is slower due to bundling; subsequent renders reuse the cache.

### Heavy Computation

Move expensive calculations (data processing, image manipulation) into `calculateMetadata` or a pre-build script. Components should receive pre-computed data, not compute it per frame.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Render Video
on:
  push:
    branches: [main]
    paths:
      - 'src/video/**'

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Render all compositions
        run: |
          npx remotion render Intro out/intro.mp4 --codec h264 --crf 18
          npx remotion render Main out/main.mp4 --codec h264 --crf 18
          npx remotion render Outro out/outro.mp4 --codec h264 --crf 18

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: rendered-videos
          path: out/*.mp4
```

### Automated Thumbnail Generation

```yaml
- name: Generate thumbnails
  run: |
    npx remotion still Thumbnail out/thumb-ep1.png --props='{"episode":1}'
    npx remotion still Thumbnail out/thumb-ep2.png --props='{"episode":2}'
```

### Render on PR (Preview)

Generate low-resolution previews for pull request review:

```yaml
- name: Render preview
  run: npx remotion render MyVideo preview.mp4 --scale 0.5 --crf 28

- name: Comment preview link
  uses: actions/github-script@v7
  with:
    script: |
      // Upload preview and post link as PR comment
```

### Lambda Integration in CI

For faster CI renders, trigger Lambda from the pipeline:

```yaml
- name: Render via Lambda
  run: node scripts/render-lambda.js
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Best Practices

1. Always specify `--codec` and `--crf` explicitly. Relying on defaults produces inconsistent results across Remotion versions.
2. Use CRF 18 for final delivery. It is the sweet spot between quality and file size for H.264.
3. Render to ProRes for any output that will be edited further in an NLE. Re-encoding compressed video compounds quality loss.
4. Keep FFmpeg post-processing steps in a `Makefile` or shell script. Document the full pipeline from render to final output.
5. Run a preview render (`--scale 0.5 --crf 28`) before committing to a full-resolution render. Catching errors at low resolution saves hours.
6. For batch rendering, process sequentially on local machines (memory constraints) and in parallel on Lambda.
7. Version control the render scripts alongside the video source code. The render command is part of the project, not tribal knowledge.
8. Set `--overwrite` in automated pipelines to prevent interactive prompts from stalling CI.
9. Monitor disk space during long renders. Intermediate frame images accumulate and can exhaust storage on constrained CI runners.
10. Test the full pipeline (render, post-process, upload) end to end before relying on it for production deadlines.
