# Dark Preset

Uses Observable Framework's CSS variable system. When targeting Framework,
set `theme: "dark"` in the config. For standalone HTML, inline the
variable definitions.

## CSS Variables

```css
:root {
    --theme-foreground: #e0e0e0;
    --theme-background: #161616;
    --theme-foreground-focus: #7aa2f7;
    --theme-foreground-alt: color-mix(in srgb, #e0e0e0 90%, #161616);
    --theme-foreground-muted: color-mix(in srgb, #e0e0e0 60%, #161616);
    --theme-foreground-faint: color-mix(in srgb, #e0e0e0 50%, #161616);
    --theme-foreground-fainter: color-mix(in srgb, #e0e0e0 30%, #161616);
    --theme-foreground-faintest: color-mix(in srgb, #e0e0e0 14%, #161616);
    --theme-background-alt: color-mix(in srgb, #e0e0e0 4%, #161616);
}
```

## Color Scheme

Use `d3.schemeSet2` or `d3.schemePastel2` instead of Category10.
Dark backgrounds need higher-luminance colors.

```javascript
const color = d3.scaleOrdinal(d3.schemeSet2);
```

## Node and Link Treatment

D3 code using `var(--theme-*)` works unchanged across light and dark.
If hardcoding is necessary:

| Element | Property | Dark Value |
|---|---|---|
| Node fill | `color(d.group)` | Use schemeSet2 |
| Node stroke | fill | `rgba(255, 255, 255, 0.3)` |
| Link stroke | fill | `rgba(255, 255, 255, 0.15)` |
| Text | fill | `#e0e0e0` |
| Axis/grid | stroke | `rgba(255, 255, 255, 0.1)` |

## Background

The SVG itself should be transparent. The page or container provides
the dark background. Never set `fill` on the root SVG for dark mode.

## Named Framework Dark Themes

| Theme | Background | Focus Color | Character |
|---|---|---|---|
| (default dark) | `#161616` | blue | Neutral |
| deep-space | `#000000` | purple (`#bd89ff`) | Pure black, vibrant |
| stark | `#000000` | yellow (`#fff61f`) | Max contrast |
| midnight | dark blue-black | | Warm dark |
| ink | warm dark | | Aged, inky |
| ocean-floor | deep teal | | Underwater |
| slate | gray-blue | | Cool, professional |

## Standalone HTML Template

```html
<!DOCTYPE html>
<html>
<head>
<style>
:root {
    --theme-foreground: #e0e0e0;
    --theme-background: #161616;
    --theme-foreground-focus: #7aa2f7;
    --theme-foreground-faint: color-mix(in srgb, #e0e0e0 50%, #161616);
    --theme-foreground-fainter: color-mix(in srgb, #e0e0e0 30%, #161616);
    --theme-foreground-faintest: color-mix(in srgb, #e0e0e0 14%, #161616);
    --theme-background-alt: color-mix(in srgb, #e0e0e0 4%, #161616);
}
body {
    background: var(--theme-background);
    color: var(--theme-foreground);
    margin: 0;
    display: flex;
    justify-content: center;
    padding: 20px;
}
</style>
</head>
<body>
<script type="module">
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
// D3 code using var(--theme-*) works here
</script>
</body>
</html>
```
