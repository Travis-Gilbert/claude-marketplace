---
name: style
description: Switch the active D3 visual preset
argument-hint: "[preset: observable | sketch | editorial | dark | minimal]"
allowed-tools: Read, Grep
---

Switch the active D3 visual preset for all subsequent D3 output.

## Available Presets

| Preset | Character |
|---|---|
| `observable` | Default. White bg, solid circles, thin gray links, schemeObservable10. |
| `sketch` | Hand-drawn via rough.js. Cross-hatch fills, wobbly lines, Caveat font. |
| `editorial` | NYT/Pudding style. Annotations, muted palette, direct labeling. |
| `dark` | Observable Framework dark theme. CSS variables, schemeSet2. |
| `minimal` | Maximum data-ink ratio. Tufte-inspired. No axes, thin strokes. |

## Instructions

1. Read the preset file: `refs/d3-presets/$ARGUMENTS.md`
   - If no argument provided, read `refs/d3-presets/observable.md` and report current preset
   - If argument is not one of the five presets, suggest the closest match

2. Summarize the key properties of the selected preset to the user:
   - Color scheme
   - Node/link treatment
   - Typography
   - Background
   - Special features (rough.js, annotations, CSS variables, etc.)

3. Confirm the preset is now active. All subsequent D3 code in this session
   should follow the selected preset's guidelines.

4. If the user has existing D3 code that needs updating to match the new preset,
   offer to modify it.
