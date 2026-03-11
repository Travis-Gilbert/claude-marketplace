---
name: next-tailwind-ui-builder
description: Build, refactor, and polish React and Next.js interfaces in Tailwind CSS using accessible headless primitives, local-source components, and production-ready UX states. Use when Codex needs to create or improve pages, dashboards, forms, navigation, dialogs, drawers, sheets, toasts, tables, or reusable design-system components in a React or Next.js codebase, especially when Tailwind CSS, shadcn/ui, Radix UI, Vaul, Sonner, Iconoir, or Creative Tim style blocks are relevant.
---

# Next Tailwind UI Builder

## Workflow
1. Inspect the target stack before editing.
- Run `scripts/detect_ui_stack.sh <repo-root>`.
- Confirm whether the project already uses Next.js app router, Tailwind, `components/ui`, Radix packages, `sonner`, `vaul`, `iconoir-react`, or another icon system.

2. Reuse the host codebase first.
- Extend existing tokens, helpers, and shared primitives before adding dependencies.
- If the project already has a UI layer, map these references onto that layer instead of building a parallel system.

3. Load only the references you need.
- Library and dependency decisions: `references/library-selection.md`
- Layout, component, and interaction recipes: `references/patterns.md`

4. Implement for the default stack.
- Prefer Next.js server components for data and static structure.
- Move to client components only for interaction, browser APIs, or local UI state.
- Prefer Tailwind plus local source components over heavy runtime styling.
- Prefer Radix-style primitives for accessibility, layering, focus management, and keyboard support.

5. Finish the full experience.
- Add loading, empty, error, success, disabled, hover, focus-visible, and mobile states.
- Check hierarchy, spacing rhythm, density, truncation, and scroll behavior.
- Keep the UI visually intentional; avoid generic placeholder layouts when the task calls for product-facing polish.

6. Verify.
- Run the repo's formatter, linting, typecheck, and targeted tests when available.
- If the work is primarily visual, inspect the result in a browser and compare states across desktop and mobile widths.

## Default Decisions
- Primitive layer: Radix UI patterns or the repo's equivalent accessible primitives.
- Styled component layer: local source components in a shadcn-style `components/ui` structure when the repo supports it.
- Drawers and bottom sheets: Vaul patterns or an existing sheet implementation with the same interaction model.
- Toasts and transient feedback: Sonner patterns or the repo's existing toast stack.
- Icons: existing project icon set first; otherwise use Iconoir for a consistent stroke language.
- Layout blocks: use Creative Tim style composition for polished sections, then adapt spacing, naming, and tokens to the host repo.
- UX heuristics: use Ant Design thinking for dense workflows, form clarity, empty states, validation, and task-oriented actions.

## Guardrails
- Do not add `antd` unless the repo already depends on it or the user explicitly asks for it.
- Do not paste shadcn or Creative Tim code verbatim without adapting naming, tokens, and file structure.
- Do not introduce a second toast, drawer, icon, or dialog stack when the project already has one.
- Do not default every component to `use client` in Next.js.
- Do not stop at the happy path; missing states usually matter more than the base view.

## Quick Triggers
Use this skill for requests such as:
- "Build a dashboard in Next.js and Tailwind."
- "Refactor this settings page to feel more polished."
- "Add a mobile drawer, toast feedback, and better loading states."
- "Create reusable UI primitives for a design system."
