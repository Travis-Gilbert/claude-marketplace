---
name: design-pro
description: >-
  Design partner for planning, reasoning, and prototyping interfaces
  grounded in design theory, UX psychology, and systems thinking. Use
  when the user asks to plan a UI layout, review a design, build a
  prototype or wireframe, create a component system, reason about visual
  hierarchy, information architecture, color theory, spacing, or
  typography. Triggers on: "design this," "lay this out," "wireframe,"
  "prototype," "how should this look," "plan the UI," "review this
  design," "what's wrong with this layout," "design system," "design
  tokens," or screenshot feedback. Also triggers on affordances, mental
  models, cognitive load, Gestalt principles, data-ink ratio, pattern
  languages, or any named design principle, or broad UX questions like
  "how should I think about the UX of this." Always use over
  frontend-design for design reasoning, user psychology, or
  pre-implementation planning. This skill supplements the active
  conversation: always carry forward prior context and brand systems.
---

# Design Pro

## Purpose

This skill serves as a design partner for planning interfaces before
implementation. It combines design theory knowledge with practical
layout and color implementation guidance, so the user can explore
structure, hierarchy, color systems, and component anatomy in
conversation before opening Claude Code.

## Context Continuity

**This skill is an overlay on the active conversation, not a reset.**

When this skill triggers, Claude must:

1. **Review the full conversation history first.** What has the user
   already described, decided, or shown? What project is this part of?
   What constraints have already been established? Do not ask questions
   the user has already answered.
2. **Carry forward all prior context.** If the user has been discussing
   a specific project (its tech stack, brand system, target audience,
   content types), all of that context applies to the design work. Do
   not treat the design task as isolated from the conversation that led
   to it.
3. **Reference Claude's memories when relevant.** The user may have
   established preferences, brand guidelines, project context, or
   design patterns in prior conversations. Apply what you know about
   the user's projects, aesthetic preferences, and technical environment
   without asking them to re-state it.
4. **Acknowledge continuity explicitly.** When building on prior
   conversation context, briefly reference what you are carrying forward
   so the user can correct you if something has shifted.

If the user has an established brand system, color palette, typography
stack, or design language from prior work, use it as the starting point
rather than proposing something from scratch.

## Two Modes

### Mode 1: Design Planning (conversation + rationale)

For questions like "how should I lay out this dashboard" or "what's wrong
with this page." Produce a structured design rationale (see Design
Rationale Format below) and discuss tradeoffs conversationally.

### Mode 2: Interactive Layout Creation (conversation + artifact)

For requests like "design this settings page" or "prototype a feed for
mixed content types." Guide the user through an interactive design process,
then produce a working layout prototype as a React or HTML artifact.

**The interactive process works like this:**

1. **Understand the brief.** Ask about: what the screen is for, who uses
   it, what content types it displays, what the primary user task is, and
   what density level is appropriate.

2. **Propose a design direction.** Before building anything, describe:
   - Screen archetype (monitoring, triage, authoring, configuration, exploration)
   - Composition strategy (asymmetric split, stack, dashboard grid, timeline, etc.)
   - Object rendering approach (polymorphic for mixed types, or uniform for homogeneous)
   - Hierarchy map (what gets primary, secondary, tertiary visual weight)
   - State inventory (which states this screen needs beyond the happy path)

3. **Build the prototype.** Create a React artifact that shows the layout
   with realistic placeholder content. The prototype should demonstrate:
   - Visual hierarchy through size, contrast, and whitespace
   - Object-type-aware rendering for mixed content
   - Responsive behavior (show the mobile adaptation)
   - At least one non-default state (empty state, loading, or error)

4. **Iterate.** The user reviews the prototype and asks for changes.
   Update the artifact and explain the design reasoning behind each change.

## Core Design Philosophy: Polymorphic Object Rendering

NEVER default to uniform card grids for mixed content types. This is the
single most important design principle in this skill.

### The Anti-Pattern (always avoid)

Every item wrapped in the same `rounded-lg bg-white shadow-sm p-6` card.
This destroys information architecture. A research source, an essay
preview, a field note, and a video project all carry different meaning,
different affordances, and different user intent.

### The Principle

Each content type declares its own visual identity. A renderer maps object
type to visual treatment. Visual differentiation communicates structure
without requiring the user to read labels.

**Strategies for visual differentiation:**
- **Density**: sources are compact/citation-dense; essays lead with prose
- **Chrome**: some types get borders, some get backgrounds, some get neither
- **Orientation**: horizontal for media-forward, vertical for text-forward
- **Emphasis**: primary content at full treatment; referenced content at reduced/inline
- **Status**: per-type progress or state indicators (draft/published/archived)

**Collections should feel curated, not generated.** A feed of mixed content
types should read like an editorial layout, not a database dump through a
single template.

---

## Color Palette Construction

This section covers how to actually build a usable color system from
scratch or from a single brand color.

### HSL-Based Palette Building

Always work in HSL (hue, saturation, lightness) rather than hex or RGB.
HSL gives you independent control over the three perceptual dimensions
of color, which makes systematic palette generation possible.

**From one brand color to a full scale:**

1. Start with your brand hue. Example: terracotta at `hsl(16, 65%, 45%)`.
2. Generate a lightness scale by holding hue and saturation roughly
   constant while stepping lightness: 95% (tint/background), 85% (subtle),
   70% (light), 55% (medium), 45% (base), 35% (dark), 25% (darker),
   15% (near-black). Adjust saturation slightly at extremes: reduce
   saturation at very light values (they look garish otherwise), increase
   slightly at very dark values (they look muddy otherwise).
3. For each step, the pattern is roughly:
   - Lightest (50 shade): `hsl(H, S-15%, 95%)` for backgrounds
   - Light (200 shade): `hsl(H, S-10%, 82%)`
   - Mid-light (300 shade): `hsl(H, S-5%, 65%)`
   - Base (500 shade): `hsl(H, S, 45%)`
   - Dark (700 shade): `hsl(H, S+5%, 30%)`
   - Darkest (900 shade): `hsl(H, S+5%, 15%)` for text on light bg

**Tailwind custom color configuration:**
```js
// tailwind.config.js
colors: {
  brand: {
    50:  'hsl(16, 50%, 95%)',
    100: 'hsl(16, 52%, 90%)',
    200: 'hsl(16, 55%, 82%)',
    300: 'hsl(16, 58%, 65%)',
    400: 'hsl(16, 62%, 55%)',
    500: 'hsl(16, 65%, 45%)',  // base
    600: 'hsl(16, 68%, 38%)',
    700: 'hsl(16, 70%, 30%)',
    800: 'hsl(16, 70%, 22%)',
    900: 'hsl(16, 70%, 15%)',
  }
}
```

### Palette Structures

- **Monochromatic**: one hue, vary lightness/saturation. Safest. Works
  for any interface. Risk: monotony on content-heavy pages.
- **Analogous**: base hue plus neighbors within 30 degrees. Warm palette:
  terracotta (16) + amber (35) + rose (350). Harmonious, low-tension.
- **Complementary accent**: base hue plus the hue 180 degrees opposite,
  used sparingly (5-10% of the surface). Creates strong focal points.
- **Split-complementary**: base hue plus the two hues flanking its
  complement (150 and 210 degrees from base). More nuanced than straight
  complementary, less likely to clash.

### Semantic Token System

Raw HSL values should not appear in components. Map them to semantic
tokens that describe function, not appearance:

```
// Surfaces
--color-surface-primary     // main background (white or near-white)
--color-surface-secondary   // sidebar, card backgrounds
--color-surface-elevated    // modals, popovers, tooltips
--color-surface-sunken      // inset areas, code blocks, wells

// Content
--color-text-primary        // body text (brand-900 or neutral-900)
--color-text-secondary      // captions, metadata (neutral-500/600)
--color-text-tertiary       // placeholders, disabled (neutral-400)
--color-text-inverse        // text on dark/colored backgrounds
--color-text-link           // interactive text

// Interactive
--color-interactive-default // buttons, links (brand-500)
--color-interactive-hover   // brand-600
--color-interactive-active  // brand-700
--color-interactive-focus   // focus ring color

// Status
--color-status-success      // green family, hue ~142
--color-status-warning      // amber family, hue ~38
--color-status-error        // red family, hue ~0
--color-status-info         // blue family, hue ~210

// Borders
--color-border-default      // neutral-200 (subtle dividers)
--color-border-strong       // neutral-400 (input borders)
--color-border-interactive  // brand-500 (focused inputs)
```

### Contrast and Accessibility

WCAG AA minimum contrast ratios:
- Normal text (< 18px or < 14px bold): **4.5:1**
- Large text (>= 18px or >= 14px bold): **3:1**
- UI components and graphical objects: **3:1**

Practical rules:
- Text on `surface-primary`: use shade 700+ for body, 500+ for large headings
- Text on colored backgrounds: almost always needs to be white or shade 50
- Never rely on color alone for meaning (add icon, label, or pattern)
- Test with a contrast checker; do not eyeball it

### Dark Mode Color Strategy

Do not invert your lightness scale mechanically. Dark mode needs its own
tuning:
- Surfaces become dark neutrals (not pure black; use `hsl(H, 5-10%, 10-15%)`)
- Reduce saturation on accent colors by 10-15% (vivid colors on dark
  backgrounds cause eye strain)
- Elevations in dark mode go lighter (opposite of light mode shadows)
- Text shifts to shade 100-200 range, not pure white (pure white on dark
  backgrounds causes halation)

---

## Layout Patterns

### Flexbox vs Grid Decision

**Flexbox** is for one-dimensional flow:
- Navigation bars, button groups, inline form rows
- Content that wraps naturally (tag lists, chip groups)
- Vertically stacked sections with variable height
- When children should size based on their own content

**CSS Grid** is for two-dimensional structure:
- Dashboard panels (rows AND columns matter)
- Form layouts with label-input alignment across rows
- Card galleries with consistent column sizing
- Any layout where items need to align both horizontally and vertically
- Page-level composition (sidebar + main + aside)

**Rule of thumb:** if you are setting both `grid-template-columns` and
`grid-template-rows`, Grid is correct. If you only care about one axis
and want items to flow along it, Flexbox is correct.

### Common Compositions (Tailwind)

**Sidebar + Main (app shell):**
```html
<div class="grid grid-cols-[240px_1fr] h-screen">
  <aside class="border-r overflow-y-auto">...</aside>
  <main class="overflow-y-auto">...</main>
</div>
```
Collapses on mobile: hide sidebar behind a drawer or hamburger below `lg`.

**Asymmetric Dashboard:**
```html
<div class="grid grid-cols-12 gap-6">
  <div class="col-span-8"><!-- primary panel --></div>
  <div class="col-span-4"><!-- secondary panels stacked --></div>
</div>
```
Primary content gets 2/3; supporting widgets get 1/3. On mobile,
stack to single column with primary first.

**Centered Content (article/form):**
```html
<div class="mx-auto max-w-2xl px-4">...</div>
```
`max-w-2xl` (672px) keeps measure in the 45-75 character sweet spot for
body text. Add `max-w-lg` (512px) for narrow forms.

**Holy Grail (header + sidebar + main + footer):**
```html
<div class="grid grid-rows-[auto_1fr_auto] min-h-screen">
  <header>...</header>
  <div class="grid grid-cols-[240px_1fr]">
    <aside>...</aside>
    <main>...</main>
  </div>
  <footer>...</footer>
</div>
```

**Split Pane (list/detail):**
```html
<div class="grid grid-cols-[320px_1fr] h-screen">
  <div class="border-r overflow-y-auto"><!-- list --></div>
  <div class="overflow-y-auto"><!-- detail --></div>
</div>
```
On mobile, show list view; navigate to detail view on tap.

---

## Component Spacing Anatomy

The base unit is 4px (Tailwind's spacing scale). These are the internal
spacing patterns for common component types.

### Card Internals
```
┌─────────────────────────────┐  p-4 (16px) or p-6 (24px)
│  Title (text-lg font-semibold)
│                                gap-1 (4px) between title and meta
│  Meta (text-sm text-muted)
│                                gap-3 (12px) between meta and body
│  Body text or content area
│                                gap-4 (16px) between body and actions
│  [Action] [Action]
└─────────────────────────────┘
```
- Compact cards (list items, search results): `p-3`, `gap-1`
- Standard cards (content previews): `p-4` to `p-6`, `gap-2` to `gap-3`
- Feature cards (hero, marketing): `p-8` or more, `gap-4` to `gap-6`

### Form Anatomy
```
Label (text-sm font-medium)
                                 gap-1.5 (6px) label to input
Input  [h-10 px-3 border rounded-md]
                                 gap-1 (4px) input to helper text
Helper text (text-sm text-muted)
                                 gap-4 (16px) field to next field
Label
Input
                                 gap-6 (24px) between field groups/sections
Section heading (text-base font-semibold)
```
- Labels above inputs, not beside (better for mobile, scanning, and localization)
- Input height: `h-9` (36px compact), `h-10` (40px standard), `h-11` (44px touch)
- Input padding: `px-3` standard, `px-4` for larger inputs

### List Item Internals
```
┌─────────────────────────────────────┐
│ px-4  [Icon]  gap-3  Content    px-4│  py-2 (compact) or py-3 (standard)
│              Title (text-sm)        │
│              Description (text-xs)  │  gap-0.5 between title and description
└─────────────────────────────────────┘
  border-b or gap between items (pick one, not both)
```
- Dense lists (data tables, file trees): `py-1.5`, `px-3`, `text-sm`
- Standard lists (settings, nav items): `py-2` to `py-3`, `px-4`
- Spacious lists (email, messages): `py-4`, `px-4` to `px-6`

### Modal Anatomy
```
┌─────────────────────────────────────┐
│ p-6                                 │
│  Title (text-lg font-semibold)      │
│                         gap-1       │
│  Description (text-sm text-muted)   │
│                         gap-6       │
│  ┌─ Content area ─────────────┐     │
│  │  (scrollable if needed)    │     │
│  └────────────────────────────┘     │
│                         gap-6       │
│  ─────────── border-t ──────────    │
│  pt-4  [Cancel]    [Primary Action] │  justify-end
└─────────────────────────────────────┘
```
- Small modal: `max-w-sm` (384px) for confirmations
- Standard modal: `max-w-lg` (512px) for forms, details
- Large modal: `max-w-2xl` (672px) for complex content
- Always add a visible close mechanism (X button or Cancel)

---

## Design Theory Reference

These principles directly inform layout and interaction decisions.
Apply them as lenses during every design task.

### Visual Hierarchy
Visual weight is controlled by size, contrast, position, whitespace,
and depth. These are independent levers. Pulling all at once creates
noise; pulling one or two creates clarity. When everything has the same
visual weight, nothing has emphasis. Asymmetry establishes priority
more effectively than uniform grids.

### Spacing and Proximity (Gestalt)
Spacing communicates grouping. Tighter spacing within a group signals
belonging. Wider spacing between groups signals separation. Primary
Gestalt principles: proximity (near = grouped), similarity (alike =
related), continuity (aligned = connected), common region (shared
background = grouped), figure/ground (contrast separates layers).

### Interaction Laws
- **Fitts's Law**: primary actions should be large and near the current
  focus. Touch targets: minimum 44x44px.
- **Hick's Law**: decision time increases with choices. Reduce visible
  options through progressive disclosure and smart defaults.
- **Cognitive load**: reduce extraneous load (bad complexity); support
  germane load (learning complexity). Every decorative element has an
  attention cost.

### Information Design (Tufte)
- **Data-ink ratio**: maximize ink devoted to data; every border,
  background, and divider that does not communicate structure is noise.
- **Chartjunk**: decorative elements that obscure rather than reveal.
  The UI equivalent is chrome inflation (borders wrapping borders).

### Affordances and Feedback (Norman)
- **Affordances**: perceived properties that suggest use. A button
  affords pressing. Flat design that removes affordance cues creates
  discoverability problems.
- **Signifiers**: indicators of where and how to act. Make affordances
  visible.
- **Feedback**: every action needs a visible, immediate response.
  Silence is the worst feedback.
- **Mapping**: controls and effects should have a natural relationship.

### Typography and Measure
Use a modular scale (e.g. 1.25 major second) for size progression.
Tighter line-height at display sizes, looser at body sizes. Keep line
length (measure) between 45-75 characters. In Tailwind, `max-w-prose`
or `max-w-2xl` for body text containers.

### Key Cognitive Principles
- **Recognition over recall**: show options, do not require memory.
- **Satisficing**: users pick the first good-enough option. Make the
  safest/most common choice the most visible and easiest to reach.
- **Von Restorff effect**: items that differ from surroundings are
  remembered. Basis for polymorphic rendering.
- **Miller's Law**: working memory holds ~7 items. Group related info.
- **Jakob's Law**: users expect your site to work like others they know.
  Novel patterns carry a learning cost that needs justification.

---

## Common UI Patterns

### Navigation
- **Sidebar nav**: best for apps with 5+ top-level sections. Fixed width
  (200-280px), collapsible to icon-only (48-64px). Active state: background
  fill + font-weight change, or left border accent. Group items with
  section labels (`text-xs uppercase tracking-wider text-muted`).
- **Top nav / header bar**: best for sites with 3-7 top-level sections.
  `h-16` (64px) standard height. Logo left, nav center or left, actions
  right. Collapses to hamburger on mobile.
- **Tabs**: best for 2-6 views of the same context. Use `role="tablist"`,
  `role="tab"`, `role="tabpanel"` for accessibility. Active tab:
  bottom border (`border-b-2 border-brand-500`) or background fill.
  Never nest tabs inside tabs.

### Overlays
- **Modal**: interrupts flow, requires response. Use for confirmations,
  focused forms, critical decisions. Always includes backdrop overlay.
  Trap focus inside. Close on Escape.
- **Drawer / slide-over**: like a modal but slides from edge. Better for
  detail panels, filters, secondary forms. Same focus-trapping and
  Escape-to-close rules.
- **Popover**: anchored to a trigger element. For menus, tooltips with
  interaction, date pickers. Closes on outside click. Keep content brief.
- **Dropdown menu**: `role="menu"` with `role="menuitem"` children.
  Arrow key navigation. Closes on selection or outside click.

### Data Display
- **Tables**: use for structured, comparable, multi-attribute data.
  `text-sm` for density. Align numbers right, text left, status center.
  Sticky header for scroll. Stripe rows (`even:bg-muted/50`) OR use
  borders, never both.
- **Detail panel**: split-pane secondary view showing full record.
  Header with title + actions, then grouped fields. Use `dl` (description
  list) markup for label-value pairs.

---

## Responsive Implementation

### Breakpoint Strategy (Tailwind defaults)
- `sm` (640px): large phones landscape
- `md` (768px): tablets
- `lg` (1024px): small laptops
- `xl` (1280px): desktops
- `2xl` (1536px): large monitors

**Build mobile-first.** Base styles are mobile. Add complexity at
larger breakpoints with `sm:`, `md:`, `lg:` prefixes.

### What Changes at Each Tier
- **Mobile (base)**: single column, full-width cards, hamburger nav,
  stacked forms, bottom-anchored primary actions, touch targets 44px+
- **Tablet (md)**: two-column grids, sidebar may appear, inline nav
  begins, form rows possible for short fields
- **Desktop (lg+)**: multi-column layouts, persistent sidebar, hover
  states active, information density increases, split panes viable

### Touch Considerations
- Minimum tap target: 44x44px (Apple HIG) / 48x48px (Material)
- Space between tap targets: minimum 8px
- Bottom of screen is easier to reach than top (thumb zone)
- Swipe gestures should supplement, not replace, visible controls

---

## Screen Archetypes

- **Monitoring** (dashboard): high density, multiple data sources,
  asymmetric card sizing establishes priority.
- **Triage** (inbox, queue): scannable list with preview, batch actions.
  High information density, low chrome.
- **Authoring** (editor, form): focused, single-task, distraction-free.
  Progressive disclosure for advanced options.
- **Configuration** (settings): grouped by category, immediate feedback.
  Avoid wizard patterns when settings are independent.
- **Exploration** (search, browse, feed): variable content types,
  filtering. Polymorphic rendering is essential here.

## State Coverage

Every screen exists in multiple states. If you only design the happy
path, you have designed the least common state.

Full state inventory:
- **Interaction**: default, hover, focus-visible, pressed, disabled, loading, dragging
- **Data**: empty, error, success, partial, stale
- **Content**: skeleton, truncated, overflow, collapsed
- **Responsive**: mobile-collapsed, touch-mode, reduced-motion

## Design Smell Catalog

Flag these patterns during any review or planning conversation:

- **Uniform card grid for heterogeneous data.** Each object type should
  have its own visual treatment.
- **Decoration without hierarchy.** Gradients, shadows, and borders that
  do not establish visual priority are noise.
- **Placeholder-as-label.** Placeholders disappear on focus. Labels persist.
- **Color-only status.** Red/green indicators without text or icon fail
  for colorblind users.
- **Equal-weight everything.** When all cards, buttons, or sections have
  the same size and emphasis, nothing has emphasis.
- **Missing empty state.** A blank screen with no guidance is a dead end.
- **Desktop-only assumptions.** Side panels unusable below 768px. Hover-
  dependent interactions with no touch equivalent.
- **Motion without purpose.** Decorative animation on dense, task-focused
  screens increases cognitive load.
- **Symmetry as default.** Asymmetric layouts establish priority more
  effectively than grids of identical panels.
- **Chrome inflation.** Borders around borders around cards around sections.

## Prototype Artifact Guidelines

When building layout prototypes as artifacts:

### Technical Approach
- Use React (JSX) artifacts for interactive prototypes
- Use Tailwind CSS for styling (available in the artifact environment)
- Use realistic placeholder content, not "Lorem ipsum"
- Include enough items to show the rhythm of a collection (5-8 items min)
- For mixed content, include at least 3 different object types

### What the Prototype Should Show
- Visual hierarchy through actual size, color, and spacing differences
- Object-type-aware rendering (each type visually distinct)
- Responsive behavior (include a viewport width toggle or show both)
- At least one non-happy-path state (empty, error, or loading)
- Interactive elements that show hover/focus states

### What the Prototype Should NOT Do
- Do not build a full application with data fetching and routing
- Do not spend time on pixel-perfect animation (that is for implementation)
- Do not use generic AI aesthetics (purple gradients, uniform rounded cards)
- Do not include functionality that distracts from the layout evaluation

### Iteration Pattern
After presenting a prototype:
1. Ask what feels right and what feels wrong
2. Identify whether the issue is hierarchy, density, object rendering,
   spacing, or something else
3. Make targeted changes and explain the design reasoning
4. Repeat until the user is satisfied with the structure

## Design Rationale Format

When producing a design rationale, use this structure:

### Intent
What the screen is for and who it serves. One paragraph.

### Hierarchy
How visual weight and placement support the primary task. Which elements
get primary, secondary, and tertiary weight, and why.

### Object Model
How different object types are represented. Whether polymorphic rendering
is used and why.

### Interaction Model
How users move through the flow. How Fitts's Law, Hick's Law, and
progressive disclosure are applied.

### Behavior and States
How loading, empty, error, success, and disabled states support real use.

### Accessibility
Contrast, focus management, semantics, and motion considerations.

### Tradeoffs
What you deliberately optimized for and what you chose not to optimize.
Every design decision has a cost; name it explicitly.

### For PRs (summary)
3-5 bullet points explaining the most important design decisions.

## Handoff to Claude Code

When the design planning is complete and the user is ready to implement,
produce a handoff document that includes:

1. **Design rationale** (using the format above)
2. **Component inventory**: list of components needed with their variants
3. **State matrix**: which states each component needs
4. **Token recommendations**: spacing scale, color approach, type scale
5. **Object renderer map**: if polymorphic rendering is used, the type-to-treatment mapping
6. **Library recommendations**: which libraries to use for which components

This handoff document is designed to be pasted into a Claude Code session
alongside the ui-design-pro plugin, where the component-builder agent can
turn it into production code.

## References (load on demand)

This SKILL ships with a curated reference library. Load only what the
current task needs.

### Applied design knowledge (10 references, originally from design-theory)

| Topic | Reference file |
|---|---|
| Layout architecture, composition, hierarchy | `references/layout-composition.md` |
| Color theory, typography, spacing, modular scale | `references/visual-fundamentals.md` |
| Interaction design, affordances, flows | `references/interaction-design.md` |
| Defaults, nudges, attention economics | `references/behavioral-design.md` |
| Design token systems (own/extend) | `references/design-systems.md` |
| Polymorphic rendering for mixed content | `references/object-rendering.md` |
| Accessibility as a design concern (WCAG 2.2) | `references/accessibility.md` |
| Responsive and mobile strategy | `references/responsive-strategy.md` |
| Screen archetypes (monitoring, triage, authoring, configuration, exploration) | `references/screen-archetypes.md` |
| When and how to animate | `references/animation-and-motion-principles.md` |

### Components library (new)

| Topic | Reference file |
|---|---|
| Catalog of saved components: 45 items with file paths and screen-archetype tags. **Check here FIRST before hand-rolling JSX.** | `references/components-library.md` |

### External design knowledge (new)

| Topic | Reference file |
|---|---|
| Bucketed index of 7 vendored repos: component libraries (ant-design, carbon, magicui), design tokens (primer/primitives), accessibility (a11y-style-guide), curated archives (design-resources-for-developers, awesome-design-md). Lists what to pull from where. | `references/external-design-knowledge.md` |

### Components-first decision rule

When the user asks to build a UI surface, **before writing any JSX**:

1. Load `references/components-library.md` and scan the catalog for a
   candidate matching the user's request (by screen archetype + content
   type).
2. If a candidate fits: name it, show the file path, propose it as the
   starting point.
3. If no candidate fits: load `references/external-design-knowledge.md`
   and check the bucketed index for a primitive in `refs/ant-design/`,
   `refs/carbon/`, `refs/magicui/`, or a token system in
   `refs/primer-primitives/` or `refs/carbon/packages/themes/`.
4. Only if neither step (1) nor step (2) yields a starting point: write
   hand-rolled JSX, and explicitly flag in the response that nothing in
   the library fit and why.

The components-first rule is the single most important behavioral output
of this SKILL. Hand-rolling defeats the entire purpose of vendoring 7
production design systems.
