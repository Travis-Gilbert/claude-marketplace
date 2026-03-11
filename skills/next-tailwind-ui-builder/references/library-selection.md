# Library Selection

## Reference Roles
- `shadcn-ui/ui`: use as the model for local-source components, Tailwind-first styling, and copy-then-own implementation.
- `radix-ui/primitives`: use as the accessibility and behavior baseline for dialogs, popovers, menus, selects, tabs, accordions, and layered UI.
- `emilkowalski/vaul`: use for mobile-first drawer and bottom-sheet interaction patterns.
- `emilkowalski/sonner`: use for non-blocking toast feedback and concise notification patterns.
- `iconoir-icons/iconoir`: use for a consistent, lightweight icon language when the project does not already have an icon system.
- `creativetimofficial/ui`: use for polished page sections, admin layouts, marketing blocks, and compositional ideas.
- `ant-design/ant-design`: use for UX heuristics, especially dense enterprise workflows, form clarity, tables, empty states, and action hierarchy.
- `vercel-labs/agent-skills`: use for review heuristics around React, Next.js, accessibility, responsiveness, and performance.

## Default Stack for New Work
- Start with React or Next.js plus Tailwind CSS.
- Prefer local components over package-level opaque abstractions.
- Prefer accessible primitives with explicit composition boundaries.
- Prefer CSS variables and Tailwind tokens over ad hoc literal values.

## Component Choice Matrix
| Need | Default choice | Why |
| --- | --- | --- |
| Buttons, inputs, select, tabs, accordion, dialog, popover | local shadcn-style component backed by Radix patterns | accessible, flexible, easy to own |
| Mobile drawer or sheet | Vaul-style drawer | better drag and sheet ergonomics on touch devices |
| Toast feedback | Sonner-style toast layer | concise API, good stack behavior |
| Icons | existing icon set, else Iconoir | keep icon language consistent |
| Hero, pricing, dashboard shell, auth, marketing sections | Creative Tim composition ideas | stronger layout polish than raw primitives |
| Dense admin form, table, filter bar, batch actions | Ant Design heuristics implemented in local stack | clarity under high information density |

## Dependency Rules
- Reuse what the repo already ships before adding new packages.
- If the repo already has a dialog, drawer, or toast implementation, extend it instead of replacing it.
- Avoid adding both `antd` and a local Tailwind design system unless the repo already supports both.
- In Next.js, keep the server/client boundary deliberate; UI libraries are not a reason to move whole routes client-side.

## Mapping Heuristics
- Ant Design: borrow information architecture and states, not the visual identity by default.
- shadcn: borrow file layout and component ownership model.
- Radix: borrow interaction and accessibility mechanics.
- Creative Tim: borrow page composition, balance, and section pacing.
- Vaul and Sonner: borrow focused single-purpose interaction patterns.
