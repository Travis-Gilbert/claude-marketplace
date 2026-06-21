---
name: design-engineering
description: "Use when the user says design engineering, design mode, token audit, CSS audit, APG check, UI accessibility check, or invokes /design-engineering; and when designing, implementing, reviewing, debugging, or encoding design systems, CSS, design tokens, accessible components, APG fixtures, typography, motion, layout grids, or data visualization UI. Persistent for the active design task until normal mode/design engineering off."
---

# Design Engineering

Use this skill for design-system implementation, CSS review, design-token repair, accessible component work, APG fixture preparation, typography and layout checks, motion review, and data visualization UI correctness.

## Activation

- Activate on explicit phrases: "design engineering", "design mode", "token
  audit", "CSS audit", "APG check", "UI accessibility check", or
  `/design-engineering`.
- Also activate automatically for tasks that edit or review CSS, design tokens,
  APG fixtures, accessible components, typography, motion, layout grids, or data
  visualization UI.
- Off on "normal mode", "stop design engineering", or "design engineering off".

## Persistence

ACTIVE FOR THE CURRENT DESIGN TASK once active. Apply the workflow and validation
defaults to all design-facing edits, reviews, and reports until the task ends or
the user turns it off. Do not drift into visual-only judgment when a checker can
prove the axis. Still active if unsure and the work touches design artifacts.

## Core Posture

- Tokens before pixels. Raw values must earn their place by becoming system tokens.
- Check the math instead of claiming by eye: contrast, target size, spacing scale, line-height, measure, motion duration, and palette separation are computable.
- The system beats invention. Prefer the existing primitive, token, scale, and APG pattern over restyling around it.
- Reduced motion is not optional, and visible focus is part of the component contract.
- A component's keyboard behavior is part of the component, not a later QA polish step.

## Standard Workflow

1. Identify the design system: token files, CSS custom properties, component primitives, and fixture/story examples.
2. Classify the domain using the map below, then choose the smallest static or render checker that can prove the fix.
3. Repair toward the system: tokenized values, grid spacing, APG pattern contracts, and accessible primitives.
4. Validate with `css_static` and `token_lint` first. Use `axe_render` and `apg_behavioral` when the render engine seam is wired.
5. Report which axes ran, which passed, and which render-dependent checks remain pending.

## Domain Map

| Domain | Look for | Good default |
|---|---|---|
| Tokens and scale | token files, custom properties, raw literals | Every value traceable to a token; spacing on the 4/8 grid. |
| Typography | font-size sets, line-height, measure | Sizes from the modular scale; body 16px+, line-height 1.4+, measure 45-75ch. |
| Color and contrast | palettes, text/background pairs | 4.5:1 body, 3:1 large and UI; check the math, not the eye. |
| Layout and grid | columns, gutters, breakpoints | Gutters and breakpoints from tokens; one grid per surface. |
| Components | dialogs, comboboxes, tabs, menus | Match the APG keyboard contract; the contract is part of the component. |
| Accessibility | focus styles, labels, headings, ARIA | axe-clean; never remove focus without replacing it. |
| Motion | transitions, keyframes | 100-500ms; always pair with prefers-reduced-motion. |
| Data viz | palettes, axes, legends | Colorblind-distinguishable palettes; label directly when series are few. |

## Validation Defaults

- `css_static` for contrast where colors resolve, target sizes, focus, reduced motion, spacing, type scale, typography, breakpoints, durations, infinite animation, and palette distance.
- `token_lint` for raw colors outside token definitions and untokenized borders/radii.
- `axe_render` for rendered accessibility once the browser render seam is available.
- `apg_behavioral` for dialog, combobox, tabs, and menu keyboard contracts once act/observe is wired.

## Output Shape

- which domain pattern applied
- which checker axes ran and passed
- which values or components changed
- what remains unvalidated or render-pending

## Anti-Patterns

- Raw hex outside token files or CSS custom-property definitions.
- Off-grid spacing and one-off breakpoints.
- Div-as-button or restyling an inaccessible primitive.
- Removing focus outlines without an equally visible replacement.
- Animation without a reduced-motion path.
- Contrast judged visually instead of computed.

## Capabilities
- checker_rule
- context_atom_template
- css_declaration_context
- design_token_context
- fallback_text_context
- native_validator_candidate
- source_file_context
- validator_contract

## Validators (no rendered scripts in this export)
- code.schema_roundtrip
- code.content_hash_provenance
- code.no_canonical_mutation

## Provenance
Distilled from source:design-engineering-external-corpus-v0.1 (code_corpus_v1) at confidence "scanned (compiled, not yet held-out validated)". Full record in provenance.json.
- pack_content_hash: sha256:8a74b42202b10f8394f2cbaa82c041d8617c76ceb5eeb0ecb214a661e35c2f3b
- source_content_hash: sha256:08d543dfd4d07702cc8ae8ff008c0e079ec6d30f3a90b95213997b64c85eb501
