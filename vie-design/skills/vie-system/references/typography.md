# VIE Typography System

## Font Stack

### Vollkorn (Serif — Titles and Headings)

**Role:** Title and heading font. Scholarly weight without heaviness.
**Sizes:** 1.25-1.55rem
**Weights:** 400 (regular), 500 (medium), 600 (semi-bold)
**Tracking:** normal

Vollkorn SC is under consideration for small-caps variant headings. Would add scholarly weight without full uppercase.

```css
font-family: 'Vollkorn', Georgia, serif;
```

### IBM Plex Sans (Sans-Serif — Body and Text Answers)

**Role:** Body text, text answer content. Clean, readable.
**Size:** 14px
**Weight:** 400
**Tracking:** normal

```css
font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

### JetBrains Mono (Monospace — Labels, Status, Data, Code)

**Role:** System-voice labels, engine status, confidence scores, type badges, data, code.
**Sizes:** 11px (labels/status), 13px (data/code)
**Weight:** 400
**Tracking:** 0.08em (labels), normal (data/code)
**Ligatures:** Enable `font-feature-settings: 'liga' 1, 'calt' 1;`

Replaces Courier Prime. Better kerning at small sizes, built-in ligatures for operators, reads more cleanly on dark backgrounds.

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
font-feature-settings: 'liga' 1, 'calt' 1;
```

## Usage Matrix

| Context | Font | Size | Weight | Transform | Tracking |
|---------|------|------|--------|-----------|----------|
| Page title | Vollkorn | 1.55rem | 600 | none | normal |
| Section heading | Vollkorn | 1.35rem | 500 | none | normal |
| Subheading | Vollkorn | 1.25rem | 400 | none | normal |
| Body text | IBM Plex Sans | 14px | 400 | none | normal |
| Text answer | IBM Plex Sans | 14px | 400 | none | normal |
| Node label (graph) | JetBrains Mono | 11px | 400 | uppercase | 0.08em |
| Engine status | JetBrains Mono | 11px | 400 | uppercase | 0.08em |
| Confidence score | JetBrains Mono | 11px | 400 | none | normal |
| Type badge | JetBrains Mono | 10px | 400 | uppercase | 0.10em |
| Code block | JetBrains Mono | 13px | 400 | none | normal |
| Data value | JetBrains Mono | 13px | 400 | none | normal |
| Prompt input | IBM Plex Sans | 14px | 400 | none | normal |
| Toast message | JetBrains Mono | 11px | 400 | uppercase | 0.08em |
| Command palette | JetBrains Mono | 13px | 400 | none | normal |

## Voice Distinction

The typography system creates two distinct voices:

### System Voice (JetBrains Mono)
Used for engine-generated metadata: status labels, confidence scores, type badges, node labels in the graph. Always uppercase with letter-spacing when used as labels. This voice is the machine speaking.

```css
.vie-system-voice {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-feature-settings: 'liga' 1, 'calt' 1;
}
```

### Content Voice (Vollkorn + IBM Plex Sans)
Used for actual content: headings, body text, the LLM's text answer. This voice is the intelligence speaking.

```css
.vie-content-heading {
  font-family: 'Vollkorn', Georgia, serif;
  font-size: 1.35rem;
  font-weight: 500;
}

.vie-content-body {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}
```

## Anti-Patterns

- Sans-serif where monospace system-voice is needed (status, labels, badges)
- Monospace where content-voice is needed (body text, headings)
- Hardcoded font sizes instead of the scale
- Missing letter-spacing on uppercase monospace labels
- Disabled ligatures in JetBrains Mono
- Using Courier Prime (replaced by JetBrains Mono)
