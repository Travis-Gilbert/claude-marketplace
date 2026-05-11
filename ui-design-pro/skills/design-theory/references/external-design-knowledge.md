# External Design Knowledge

Vendored reference repos under `refs/`. All commercial-use safe.

The plugin ships **19 vendored design-system repos**: 12 were already
present (Radix, shadcn, Tailwind, Motion, etc.) and 7 were added in
v1.2.0 (ant-design, carbon, magicui, primer-primitives, a11y-style-guide,
design-resources-for-developers, awesome-design-md). License for each of
the 7 v1.2.0 additions was verified via `gh api repos/<owner>/<repo>
--jq .license`. The pre-existing 12 are well-known MIT/Apache projects.

## Newly added in v1.2.0

| Path under `refs/` | Source | License | Bucket | Pull what from here |
|---|---|---|---|---|
| `ant-design/` | https://github.com/ant-design/ant-design | MIT | components | 82 React components under `components/<name>/`. Best for forms, tables, date pickers, complex enterprise UI. Heavy on Less; adapt styling to Tailwind/CSS variables. |
| `carbon/` | https://github.com/carbon-design-system/carbon | Apache-2.0 | components + tokens + a11y | IBM's design system. `packages/react/src/components/` for component source, `packages/themes/` for the white/g10/g90/g100 token system, `docs/` for accessibility patterns. |
| `magicui/` | https://github.com/magicuidesign/magicui | MIT | components (animated) | Shadcn-style copy-paste components for Framer Motion + Tailwind. Use `registry/` for shipped components, `content/` for docs. Best for animated decorative bits (orbit rings, marquees, scramble text). |
| `primer-primitives/` | https://github.com/primer/primitives | MIT | tokens | GitHub's design tokens. NOT components. Color, typography, spacing scales in `data/` and `src/`. Use when designing a new palette or type scale. |
| `a11y-style-guide/` | https://github.com/cehfisher/a11y-style-guide | MIT | accessibility | WCAG-aligned interaction and markup patterns in `src/`. Reference when implementing focus management, ARIA roles, or accessible form patterns. |
| `design-resources-for-developers/` | https://github.com/bradtraversy/design-resources-for-developers | MIT | curated archive | 65.5k-star catalog of design tools, stock photos, UI templates, icon libraries, color tools. Index of external resources, not source. |
| `awesome-design-md/` | https://github.com/VoltAgent/awesome-design-md | MIT | curated archive | Markdown-formatted design knowledge: principles, type, color, patterns. Principle reference, not a component source. |

## Pre-existing in the plugin (already there before v1.2.0)

| Path under `refs/` | What it is | Bucket | Pull what from here |
|---|---|---|---|
| `radix-primitives/` | Radix UI primitives | components (unstyled) | Unstyled accessible component primitives. The canonical source for headless component patterns (Dialog, Popover, Select, Tooltip, Tabs). Use as the structural foundation; layer styling on top. |
| `radix-ui-themes/` | Radix Themes | components (styled) | Radix's opinionated styled component layer. Use when the user wants Radix's visual language out of the box. |
| `radix-colors/` | Radix color system | tokens | 12-step scale color system designed for UI states (subtle bg, hover, active, border, text). Use when building accessible color systems with consistent contrast. |
| `shadcn-ui/` | shadcn/ui | components (Radix + Tailwind) | The shadcn/ui source. Copy-paste components built on Radix Primitives + Tailwind. Best starting point for Tailwind + React projects. |
| `tailwindcss/` | Tailwind CSS source | tokens (utility-first) | Tailwind's own source. Reference for utility-class naming, spacing scales, and config conventions. |
| `motion/` | Motion (formerly Framer Motion) | animation | Source for the canonical React animation library. Reference for spring physics, gesture handling, layout animations. |
| `cmdk/` | cmdk command palette | components | Headless command palette primitive (cmdk.paco.me). Use for any ⌘K-style interface. |
| `vaul/` | vaul drawer | components | Drawer/sheet component primitive. Use for bottom-sheet and slide-over patterns. |
| `sonner/` | sonner toast | components | Toast notification primitive. The de facto Radix-compatible toast library. |
| `daisyui/` | DaisyUI | components (Tailwind) | Tailwind component library with semantic class names. Use for prototypes or when the user wants pre-styled Tailwind components. |
| `open-props/` | Open Props | tokens (CSS variables) | CSS custom property design tokens. Use when targeting plain CSS without a build step. |

## Buckets at a glance (across all 19 repos)

| Bucket | Repos | What it gives you |
|---|---|---|
| **Headless / unstyled components** | `radix-primitives/`, `cmdk/`, `vaul/`, `sonner/` | Accessible primitives to style yourself |
| **Styled component libraries** | `shadcn-ui/`, `radix-ui-themes/`, `magicui/`, `ant-design/`, `carbon/packages/react/src/components/`, `daisyui/` | Ready-to-adapt component source |
| **Design tokens** | `radix-colors/`, `primer-primitives/`, `carbon/packages/themes/`, `tailwindcss/`, `open-props/` | Token systems for color, type, space |
| **Accessibility patterns** | `a11y-style-guide/`, `carbon/docs/` | WCAG-aligned interaction and markup |
| **Animation** | `motion/` | React animation primitives |
| **Curated archives** | `design-resources-for-developers/`, `awesome-design-md/` | Indexes of external resources and principles |

## How to use this when designing

1. Start with `components-library.md` (the user's curated 39-component
   catalog). It is the most opinionated and likely the best fit.
2. If `components-library.md` has no match, return here. Match the user's
   request to the right path. Prefer the closest fit; do NOT default to
   ant-design or carbon unless they actually beat the alternatives:
   - **"Tailwind + React"** → `shadcn-ui/` first. Likely already what the user wants.
   - **"Headless primitive (Dialog, Popover, Select, etc.)"** → `radix-primitives/apps/`
   - **"Color system / palette"** → `radix-colors/` for UI-state-aware scales, `primer-primitives/` for GitHub-style, `carbon/packages/themes/` for IBM-style
   - **"Command palette / ⌘K"** → `cmdk/`
   - **"Bottom sheet / drawer"** → `vaul/`
   - **"Toast"** → `sonner/`
   - **"Animated decorative bit"** → `magicui/registry/` or compose with `motion/`
   - **"Enterprise form / Table / DatePicker"** → `ant-design/components/<name>/` (82 components available) or `carbon/packages/react/src/components/`
   - **"Plain CSS, no Tailwind"** → `open-props/`
   - **"WCAG focus management / ARIA pattern"** → `a11y-style-guide/src/`
   - **"What's a good icon library / stock photo / color tool?"** → `design-resources-for-developers/README.md`
   - **"Design principle / type-color reading"** → `awesome-design-md/`
3. Quote the exact file path before writing JSX. The user should be able
   to open the source.

## Licenses (all verified safe)

v1.2.0 adds (verified via `gh api`):
- MIT: ant-design, magicui, primer-primitives, a11y-style-guide,
  design-resources-for-developers, awesome-design-md
- Apache-2.0: carbon

Pre-existing (all are well-known commercial-use-OK projects; spot-check
LICENSE if a downstream user requires it):
- MIT: radix-primitives, radix-ui-themes, radix-colors, shadcn-ui,
  tailwindcss, motion, cmdk, vaul, sonner, daisyui, open-props

Original plan included `alchaincyf/huashu-design` for the curated-archive
bucket, but it returned `NOASSERTION` (no recognizable SPDX license) and
was swapped for `bradtraversy/design-resources-for-developers`. Both fill
the same role; the swap is invisible to users of this SKILL.
