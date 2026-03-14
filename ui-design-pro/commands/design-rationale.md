---
description: Produce a structured design reasoning document before major UI changes. Loads all design-theory references, identifies screen archetype, and ties claims to named principles. Triggers visual-architect agent.
allowed-tools: Read, Grep, Glob, LS
argument-hint: <screen-or-feature-to-rationalize>
---

Produce a structured design rationale for the specified screen or feature.

1. Load all design-theory reference files:
   - `skills/design-theory/references/layout-composition.md`
   - `skills/design-theory/references/visual-fundamentals.md`
   - `skills/design-theory/references/interaction-design.md`
   - `skills/design-theory/references/behavioral-design.md`
   - `skills/design-theory/references/object-rendering.md`
   - `skills/design-theory/references/accessibility.md`
   - `skills/design-theory/references/responsive-strategy.md`
   - `skills/design-theory/references/screen-archetypes.md`
2. Load the visual-architect agent.
3. Identify the screen archetype (monitoring, triage, authoring, configuration, or exploration) and state the density, interaction, and state expectations it implies.
4. Produce a rationale document with these seven sections:

   **Intent** — What the screen exists to accomplish. What user goal it serves. Which archetype it follows and why.

   **Hierarchy** — What has visual priority, what recedes, and why. Reference Gestalt grouping, Fitts's Law placement, or asymmetric emphasis as applicable.

   **Object Model** — What content types appear. Whether they are homogeneous or heterogeneous. If mixed: which polymorphic rendering strategy applies. Reference `object-rendering.md` principles.

   **Interaction Model** — Primary affordance, secondary actions, keyboard/touch considerations. Reference interaction-design principles (progressive disclosure, reversibility, feedback).

   **Behavior and States** — Full state inventory: default, loading, empty, error, success, disabled, destructive, skeleton, mobile-collapsed. For each, describe what the user sees and why.

   **Accessibility** — WCAG concerns specific to this screen. Focus management, ARIA roles, color-independence, motion preferences, touch targets. Not a generic checklist — specific to the design decisions made above.

   **Tradeoffs** — What was considered and rejected. What compromises were made and why. What would change if constraints changed.

5. Each section must tie claims to named principles from the reference files (e.g., "Fitts's Law: primary action placed at bottom-right where the cursor rests after scrolling" or "Gestalt proximity: metadata grouped below the title rather than in a sidebar").
6. After the seven sections, produce a **For PRs** summary: 3-5 bullet points specific enough for a code reviewer to verify against the implementation.

Output the rationale as a markdown document suitable for inclusion in design documentation or PR descriptions.
