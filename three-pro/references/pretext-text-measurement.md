# Pretext: DOM-Free Text Measurement

## What It Is

Pretext (`@chenglou/pretext`) is a pure JS/TS library for multiline text
measurement and layout. It measures text dimensions using the browser's
Canvas font engine, bypassing `getBoundingClientRect`, `offsetHeight`, and
all other DOM measurements that trigger layout reflow.

**Source:** `refs/pretext/` (clone from `https://github.com/chenglou/pretext.git`)

## When to Use Pretext

Use pretext when you need text dimensions to feed into a layout algorithm
and the text is NOT being rendered by the browser's own CSS layout engine.

**Reach for pretext when:**
- Computing text width/height for D3 force-directed node sizing
- Positioning labels in a Canvas or WebGL/R3F scene
- Sizing annotation bubbles or tooltips in custom layout code
- Measuring text during animation frames (where reflow is expensive)
- Building mixed-font-run layouts (inline pills, styled fragments)
- Pre-computing text height for virtualized lists or scroll calculations
- Measuring text in a server component or worker (no DOM access)

**Do NOT use pretext when:**
- Standard CSS handles the text layout (paragraphs, flex/grid text)
- The browser's own line-breaking is sufficient
- You only need to style text, not measure it programmatically

## Core API

### Basic: `prepare` + `layout`

```typescript
import { prepare, layout } from '@chenglou/pretext'

// One-time work: normalize whitespace, segment text, measure via canvas
const prepared = prepare('Some text content', '16px Inter')

// Pure arithmetic, no DOM. Returns height and lineCount.
const { height, lineCount } = layout(prepared, maxWidth, lineHeight)
```

The `font` string uses the same format as `CanvasRenderingContext2D.font`,
e.g. `'16px Inter'`, `'bold 14px system-ui'`, `'italic 500 18px Georgia'`.
Keep it synced with the CSS font declaration for the text being measured.

### With Line-Level Data: `prepareWithSegments` + `layoutWithLines`

```typescript
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments('Text to measure', '16px Inter')
const { height, lineCount, lines } = layoutWithLines(prepared, maxWidth, lineHeight)

// Each line provides: text slice, width, segment boundaries
for (const line of lines) {
  // Position each line in your custom renderer
}
```

Use this when you need per-line positioning (canvas text rendering,
custom cursor placement, selection highlighting).

### Mixed Inline Runs: `inline-flow` (Experimental)

```typescript
import { prepareInlineFlow, walkInlineFlowLines } from '@chenglou/pretext/inline-flow'

const prepared = prepareInlineFlow([
  { text: 'Ship ', font: '500 17px Inter' },
  { text: '@maya', font: '700 12px Inter', break: 'never', extraWidth: 22 },
  { text: "'s rich-note", font: '500 17px Inter' },
])

walkInlineFlowLines(prepared, containerWidth, line => {
  // Each fragment: source item index, text slice, gapBefore, cursors
})
```

Use `inline-flow` for:
- Mixed-font text runs (bold + regular in the same line)
- Atomic inline elements ("pills", tags, badges) that must not break
- Whitespace collapse matching browser behavior
- Complex inline layouts that would otherwise require DOM measurement

### Options

```typescript
prepare(text, font, {
  whiteSpace: 'normal' | 'pre-wrap'  // default: 'normal'
})
```

## Performance Characteristics

- `prepare()` does canvas measurement (the expensive part). Call once per
  text + font combination, cache the result.
- `layout()` is pure arithmetic. Call freely on resize, animation frames,
  or layout recalculations.
- No DOM reads, no layout reflow, no forced synchronous layout.
- Handles bidirectional text (Arabic, Hebrew), CJK, and emoji correctly.

## Integration Patterns

### D3 Force Layout: Node Sizing

```typescript
import { prepare, layout } from '@chenglou/pretext'

// During node initialization, not during tick
nodes.forEach(node => {
  node._textPrepared = prepare(node.label, '14px Inter')
  const { height } = layout(node._textPrepared, maxLabelWidth, 18)
  node._textHeight = height
  node.radius = Math.max(minRadius, height / 2 + padding)
})
```

### Canvas/WebGL Label Rendering

```typescript
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

function renderLabel(ctx, text, x, y, maxWidth) {
  const prepared = prepareWithSegments(text, '14px Inter')
  const { lines } = layoutWithLines(prepared, maxWidth, 18)

  lines.forEach((line, i) => {
    ctx.fillText(line.text, x, y + i * 18)
  })
}
```

### R3F Text Positioning

```typescript
import { prepare, layout } from '@chenglou/pretext'

function useTextDimensions(text, font, maxWidth, lineHeight) {
  return useMemo(() => {
    const prepared = prepare(text, font)
    return layout(prepared, maxWidth, lineHeight)
  }, [text, font, maxWidth, lineHeight])
}
```

### Polymorphic Content Sizing

```typescript
// Different content types have different text densities.
// Pretext lets you pre-compute layout without rendering to DOM.
function measureContentCard(item) {
  const titlePrep = prepare(item.title, 'bold 18px Inter')
  const bodyPrep = prepare(item.summary, '14px Inter')

  const titleLayout = layout(titlePrep, cardWidth - padding * 2, 24)
  const bodyLayout = layout(bodyPrep, cardWidth - padding * 2, 20)

  return {
    titleHeight: titleLayout.height,
    bodyHeight: bodyLayout.height,
    totalHeight: titleLayout.height + bodyLayout.height + padding * 3
  }
}
```

## Decision Heuristic

Ask: "Am I measuring text to feed into a layout algorithm?"

- YES, and the layout runs outside CSS (D3, canvas, WebGL, R3F, virtual
  scroll, animation frame) -> **Use pretext**
- YES, but the layout is CSS-based (flexbox, grid, block flow) -> **Let
  the browser handle it**
- NO, I just need to style text -> **CSS only, no measurement needed**
