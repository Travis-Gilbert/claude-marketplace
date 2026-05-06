# Material Tokens — Mantine Mapping to VIE CSS Variables

## Strategy: Option 3

Mantine's theming system provides tokens (shadows, elevation, z-index, spacing, radii) mapped to VIE CSS variables. Radix primitives provide behavioral accessibility (dialog, tooltip, dropdown). Custom components for everything Theseus-specific.

## Shadow Scale

Mapped from Mantine's shadow tokens to VIE CSS custom properties. See `color-tokens.md` for the full `--vie-shadow-*` values.

To verify or update these values, grep the Mantine source:
```bash
grep -r "shadow" refs/mantine/packages/mantine-core/src/core/MantineProvider/
```

## What Mantine Provides

- **Shadow scale:** `--vie-shadow-xs` through `--vie-shadow-xl`
- **Z-index scale:** Consistent layering for overlays, modals, toasts
- **Transition timing functions:** Physically plausible motion
- **`Paper` component** (or equivalent): For any surface needing material presence with elevation
- **Spacing scale:** Consistent padding/margin tokens
- **Border-radius scale:** Consistent corner rounding

## Glass-Morphism Panel Spec

The primary surface treatment for floating UI elements:

```css
.vie-panel {
  background: rgba(15, 16, 18, 0.66-0.76);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18-22px;
  backdrop-filter: blur(18px);
  box-shadow: var(--vie-shadow-lg);
}
```

### Variants

**Standard panel (text answer, overlays):**
```css
background: rgba(15, 16, 18, 0.72);
border-radius: 20px;
box-shadow: var(--vie-shadow-lg);
```

**Query header badge:**
```css
background: rgba(15, 16, 18, 0.66);
border-radius: 12px;
box-shadow: var(--vie-shadow-sm);
padding: 8px 16px;
```

**Prompt input:**
```css
background: rgba(15, 16, 18, 0.56);
border-radius: 24px;
box-shadow: var(--vie-shadow-md);
```

## What Mantine Does NOT Provide

These are all custom implementations:

- The datadot grid
- The R3F scene
- The D3 layout computation
- The TF.js intelligence layer
- The engine heat gradient
- The construction animation
- Answer-specific visualizations

## Grepping Mantine Source

For shadow definitions:
```bash
grep -r "shadows" refs/mantine/packages/mantine-core/src/core/
```

For z-index scale:
```bash
grep -r "zIndex" refs/mantine/packages/mantine-core/src/core/
```

For spacing tokens:
```bash
grep -r "spacing" refs/mantine/packages/mantine-core/src/core/MantineProvider/
```

For Paper component:
```bash
grep -r "Paper" refs/mantine/packages/mantine-core/src/components/Paper/
```
