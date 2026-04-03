# VIE Color Token Reference

## Complete Token Set

```css
/* === Base === */
--vie-bg: #0f1012;
--vie-text: #e8e5e0;
--vie-text-dim: rgba(232, 229, 224, 0.5);

/* === Accent === */
--vie-teal: #4A8A96;
--vie-teal-light: #5EA8B5;
--vie-terra: #C4503C;
--vie-amber: #C49A4A;

/* === Engine State Colors === */
--vie-state-idle: var(--vie-text-dim);
--vie-state-thinking: var(--vie-teal-light);
--vie-state-constructing: var(--vie-amber);
--vie-state-exploring: var(--vie-teal);
--vie-state-error: var(--vie-terra);

/* === Datadot Grid === */
--vie-grid-dormant: rgba(156, 149, 141, 0.04);
--vie-grid-active: rgba(74, 138, 150, 0.12);
--vie-grid-thinking: rgba(74, 138, 150, 0.18);

/* === Engine Heat Gradient === */
--vie-heat-terra: rgba(196, 80, 60, 0.06);
--vie-heat-amber: rgba(196, 154, 74, 0.04);
--vie-heat-intensity: 1.0;

/* === Object Type Colors === */
--vie-type-source: #2D5F6B;
--vie-type-concept: #7B5EA7;
--vie-type-person: #C4503C;
--vie-type-hunch: #C49A4A;
--vie-type-note: #e8e5e0;

/* === Shadow Scale (Mantine-sourced) === */
--vie-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.15);
--vie-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
--vie-shadow-md: 0 2px 6px rgba(0, 0, 0, 0.25);
--vie-shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.3);
--vie-shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.35);

/* === Surface === */
--vie-surface-primary: rgba(15, 16, 18, 0.72);
--vie-surface-secondary: rgba(15, 16, 18, 0.56);
--vie-surface-overlay: rgba(15, 16, 18, 0.86);
--vie-border: rgba(255, 255, 255, 0.08);
--vie-blur: 18px;
--vie-radius-sm: 12px;
--vie-radius-md: 18px;
--vie-radius-lg: 22px;
--vie-radius-pill: 24px;
```

## Usage Rules

1. **Never hardcode colors.** Always use `var(--vie-*)` tokens.
2. **Engine states drive color.** Use `--vie-state-*` tokens for all state-dependent UI.
3. **Object types are fixed.** The five type colors are canonical and should not change.
4. **Shadows require Mantine mapping.** Always use `--vie-shadow-*` for elevation.
5. **Glass-morphism surfaces** combine `--vie-surface-primary` + `--vie-border` + `backdrop-filter: blur(var(--vie-blur))` + appropriate shadow.

## Object Type Color Mapping

| Type | Token | Hex | Usage |
|------|-------|-----|-------|
| Source | `--vie-type-source` | #2D5F6B | Academic papers, URLs, documents |
| Concept | `--vie-type-concept` | #7B5EA7 | Abstract ideas, theories, themes |
| Person | `--vie-type-person` | #C4503C | People, organizations, entities |
| Hunch | `--vie-type-hunch` | #C49A4A | Hypotheses, uncertain connections |
| Note | `--vie-type-note` | #e8e5e0 | User notes, annotations |

## Engine State Color Mapping

| State | Token | Visual |
|-------|-------|--------|
| Idle | `--vie-state-idle` | Dimmed text color (50% opacity) |
| Thinking | `--vie-state-thinking` | Light teal (processing query) |
| Constructing | `--vie-state-constructing` | Amber (building answer model) |
| Exploring | `--vie-state-exploring` | Teal (user interacting with model) |
| Error | `--vie-state-error` | Terracotta (error state) |

## Dark Theme Context

All VIE colors are designed for the dark theme (`--vie-bg: #0f1012`). There is no light theme variant. The design assumes:
- Dark background with high contrast for accent colors
- Low opacity for structural elements (grid, borders, gradients)
- Emissive materials in R3F that glow against dark scene background
- Glass-morphism surfaces that are semi-transparent against dark backdrop
