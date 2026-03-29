# Example: Before and After

## Before (Natural Language, Deviation-Prone)

> The essay hero should have a dark background with the title
> displayed in large serif type. Put the date in the top-right
> corner. Use next/image for the YouTube thumbnail background.
> Add a category label above the title in small caps.

## After (Spec-Compliance Output)

```markdown
# EssayHero Implementation Spec

## META
Status: LOCKED
Spec version: 1.0
Author: user via spec-compliance
Date: 2026-03-29
Implements: Essay hero design conversation

Summary: 15 MUST, 7 MUST NOT, 6 VERIFY statements

## SCOPE
Files to create or modify:
- src/components/essay/EssayHero.tsx
- src/app/essays/[slug]/page.tsx

Files that MUST NOT be modified:
- src/components/dot-grid/DotGrid.tsx
- src/styles/global.css

## REQUIREMENTS

### Background

MUST: Background image uses next/image with fill prop and
  object-fit: cover
MUST: Background source is the essay's YouTube thumbnail URL
MUST: Dark overlay uses background: rgba(26, 24, 22, 0.82)
MUST NOT: Use an <img> tag for the background image
VERIFY: Grep EssayHero.tsx for '<img'. Expect zero matches.
VERIFY: Grep EssayHero.tsx for 'next/image' or '@next/image'.
  Expect at least one match.

### Title

MUST: Font family is var(--font-serif) (Vollkorn)
MUST: Font weight is 700
MUST: Font size is clamp(1.75rem, 4vw, 3rem)
MUST: Color is var(--color-hero-text)
MUST NOT: Use a font family other than var(--font-serif)
VERIFY: Inspect title element computed font-family. Must
  resolve to Vollkorn.

### Date

MUST: Date element is positioned absolute, top: 1.5rem,
  right: 1.5rem
MUST: Font is var(--font-mono) (Courier Prime), 0.75rem
MUST: Color is var(--color-hero-text-muted)
MUST NOT: Place the date in a flex row with other elements
MUST NOT: Left-align the date
VERIFY: Inspect date element position. Must be absolute with
  top and right values.

### Category Label

MUST: Renders above the title
MUST: Font is var(--font-mono) (Courier Prime), 11px
MUST: text-transform: uppercase
MUST: Color is var(--color-terracotta-light)
MUST: A 24px horizontal rule appears below the label,
  1px solid var(--color-terracotta-light)
MUST NOT: Omit the category label
VERIFY: Category label element exists in rendered output.
  Grep for the relevant class or element.

### Closed Scope

MUST NOT: Add props not listed in this spec
MUST NOT: Add UI elements not described in this spec
MUST NOT: Modify files not listed in SCOPE

## CONFLICT PROTOCOL

IF CONFLICT: This spec takes precedence over existing code.
IF CONFLICT: If a MUST cannot be met, STOP and report.
IF CONFLICT: If you believe a requirement is wrong, implement
  it anyway and note your concern afterward.

## COMPLETION CHECKLIST

Run all VERIFY statements. Report pass/fail for each.
Run git diff --stat. Confirm only SCOPE files were modified.
```

## What Changed

| Original (vague) | Locked (binary) |
|-------------------|----------------|
| "dark background" | `rgba(26, 24, 22, 0.82)` overlay |
| "large serif type" | `var(--font-serif)`, `clamp(1.75rem, 4vw, 3rem)`, weight 700 |
| "top-right corner" | `position: absolute; top: 1.5rem; right: 1.5rem` |
| "Use next/image" | MUST use + MUST NOT use `<img>` + VERIFY grep |
| "small caps" | `11px`, `uppercase`, specific font and color token |
| (unstated) | Scope closed, additive deviation blocked |
