# Datadot Grid — Porting DotGrid.tsx to Theseus Dark Theme

## Source Component

Port from `src/components/DotGrid.tsx` (the original, full-featured version), NOT from `src/app/theseus/TealDotGrid.tsx` (the stripped-down version that lacks binary data).

## What DotGrid.tsx Has (preserve all of this)

- **mulberry32 PRNG** for deterministic binary scatter
- **Spring physics** with mouse repulsion (dot displacement)
- **Ink trail** effect
- **Binary data** (0s and 1s scattered across the grid)
- **Configurable density** via `binaryDensity` prop
- **`inverseVignette` mode** (clean center reading area, dots at edges)
- **Fixed to viewport** (does not scroll)

## What TealDotGrid.tsx Is Missing (the core problem)

- No binary characters (0s and 1s) — just uniform dots
- No mulberry32 PRNG
- Simplified physics

## Dark Theme Adaptation

### Colors

| Element | Original (light) | Theseus (dark) |
|---------|-------------------|----------------|
| Background | `#F0EEE6` | `#0f1012` (`--vie-bg`) |
| Dot base | warm gray | `rgba(156, 149, 141, 0.04)` (`--vie-grid-dormant`) |
| Active dots | — | `rgba(74, 138, 150, 0.10-0.15)` (`--vie-grid-active`) |
| Thinking dots | — | `rgba(74, 138, 150, 0.18)` (`--vie-grid-thinking`) |
| Ink trail | warm gray | teal-blue (`rgba(74, 138, 150, 0.2)`) |
| Binary chars | dark on light | teal-blue on dark, very low opacity |

### Configuration

```typescript
interface TheseusDatadotGridProps {
  binaryDensity?: number;        // 0.12-0.20 (12-20%)
  inverseVignette?: boolean;     // true for homepage
  mouseRepulsion?: boolean;      // true (preserve spring physics)
  inkTrail?: boolean;            // true (adapt to teal-blue)
  thinkingPulse?: boolean;       // false by default, true during engine thinking
  pulseColor?: string;           // --vie-grid-thinking
  pulseCycle?: number;           // 3-4 seconds
}
```

### Behavioral Rules

1. **Present behind non-3D content** (homepage, text panels)
2. **Hidden when R3F is active** — the 3D scene is the substrate
3. **Thinking pulse** — teal-blue dots brighten/dim on 3-4s sine cycle during thinking states
4. **Fixed to viewport** — never scrolls
5. **Binary data required** — 0s and 1s must be present. If they're not, the port is incomplete.

### Reference: AsciiBinaryFlow

The `AsciiBinaryFlow` component from earlier design work shows the aesthetic direction for animated binary patterns: flowing, eroding, soft. The datadot grid is a more restrained version of this idea. Binary values as texture, not as content.

### Implementation Notes

1. Copy `DotGrid.tsx` as starting point
2. Replace color palette with dark theme values
3. Adapt ink trail color to teal-blue
4. Add `thinkingPulse` prop with sine-wave opacity modulation
5. Ensure binary characters render at correct density
6. Test `inverseVignette` mode on homepage layout
7. Verify mouse repulsion physics work with dark theme colors
8. Replace `TealDotGrid.tsx` usage throughout `src/app/theseus/`
