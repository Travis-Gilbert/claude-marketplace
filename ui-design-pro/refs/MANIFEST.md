# ui-design-pro refs Manifest

19 vendored design-system reference repos. All commercial-use safe
(verified via `gh api repos/<owner>/<repo> --jq .license` for the 7
v1.2.0 additions; pre-existing 12 are well-known MIT/Apache projects).

Schema: see `production-theorem/references/REFS_MANIFEST.md`.

| path | source | license | bucket | framework | pull_what |
|---|---|---|---|---|---|
| `radix-primitives/` | https://github.com/radix-ui/primitives | MIT | components / unstyled | react | Unstyled accessible primitives. Canonical source for Dialog, Popover, Select, Tooltip, Tabs. Structural foundation; style on top |
| `radix-ui-themes/` | https://github.com/radix-ui/themes | MIT | components / styled | react | Radix's opinionated styled component layer. Use when the user wants Radix visual language out of the box |
| `radix-colors/` | https://github.com/radix-ui/colors | MIT | tokens / color | multi | 12-step scale color system designed for UI states (subtle bg, hover, active, border, text). Best for accessible color systems with consistent contrast |
| `shadcn-ui/` | https://github.com/shadcn-ui/ui | MIT | components / Radix+Tailwind | react | The canonical shadcn/ui source. Copy-paste components built on Radix Primitives + Tailwind. Best starting point for Tailwind + React |
| `tailwindcss/` | https://github.com/tailwindlabs/tailwindcss | MIT | tokens / utility | multi | Tailwind's source. Reference for utility-class naming, spacing scales, config conventions |
| `motion/` | https://github.com/framer/motion | MIT | animation | react | Canonical React animation library (formerly Framer Motion). Spring physics, gesture handling, layout animations |
| `cmdk/` | https://github.com/pacocoursey/cmdk | MIT | components / primitive | react | Headless command palette primitive (cmdk.paco.me). Use for any ⌘K-style interface |
| `vaul/` | https://github.com/emilkowalski/vaul | MIT | components / primitive | react | Drawer/sheet component primitive. Use for bottom-sheet and slide-over patterns |
| `sonner/` | https://github.com/emilkowalski/sonner | MIT | components / primitive | react | Toast notification primitive. De facto Radix-compatible toast library |
| `daisyui/` | https://github.com/saadeghi/daisyui | MIT | components / Tailwind | multi | Tailwind component library with semantic class names. Use for prototypes or pre-styled Tailwind components |
| `open-props/` | https://github.com/argyleink/open-props | MIT | tokens / CSS-vars | vanilla | CSS custom property design tokens. Use when targeting plain CSS without a build step |
| `ant-design/` | https://github.com/ant-design/ant-design | MIT | components / styled | react | 82 React components in `components/<name>/`. Best for forms, tables, date pickers, complex enterprise UI. Heavy on Less; adapt to Tailwind |
| `carbon/` | https://github.com/carbon-design-system/carbon | Apache-2.0 | components + tokens + a11y | multi | IBM's design system. `packages/react/src/components/` for component source, `packages/themes/` for white/g10/g90/g100 tokens, `docs/` for a11y patterns |
| `magicui/` | https://github.com/magicuidesign/magicui | MIT | components / animated | react | Shadcn-style copy-paste components for Framer Motion + Tailwind. `registry/` for shipped components, `content/` for docs. Best for animated decorative bits |
| `primer-primitives/` | https://github.com/primer/primitives | MIT | tokens | multi | GitHub's design tokens. NOT components. Color, typography, spacing scales in `data/` and `src/`. Use when designing a palette or type scale |
| `a11y-style-guide/` | https://github.com/cehfisher/a11y-style-guide | MIT | accessibility | vanilla | WCAG-aligned interaction and markup patterns in `src/`. Reference when implementing focus management, ARIA roles, accessible forms |
| `design-resources-for-developers/` | https://github.com/bradtraversy/design-resources-for-developers | MIT | curated archive | multi | 65.5k-star catalog of design tools, stock photos, UI templates, icon libraries, color tools. Index of external resources, not source |
| `awesome-design-md/` | https://github.com/VoltAgent/awesome-design-md | MIT | curated archive | multi | Markdown-formatted design knowledge: principles, type, color, patterns. Principle reference, not a component source |
