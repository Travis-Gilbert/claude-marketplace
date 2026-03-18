# JS-Pro Agent Registry

> Agent routing rules for the JS-Pro plugin. Claude Code reads this to determine
> which specialist to load for a given task.

## Agent Selection

Agents are **composable context**, not exclusive. A single task may load multiple
agents. Read the relevant agent .md file(s) before starting work.

### By Task Type

| Task | Primary Agent | Also Load | Key Refs |
|------|--------------|-----------|----------|
| React component | `react-specialist` | `typescript-pro` | `~/.claude/js-pro/refs/react-main/`, `~/.claude/js-pro/refs/base-ui-master/` |
| Next.js page/API | `nextjs-developer` | `react-specialist` | `~/.claude/js-pro/refs/react-main/` |
| D3 visualization | `data-analyst` | — | `~/.claude/js-pro/refs/d3-main/`, `~/.claude/js-pro/examples/D3js-code-examples-I-love/` |
| D3 graph (guided) | `d3-graph-builder` | `data-analyst` | `~/.claude/js-pro/refs/d3-main/`, `~/.claude/js-pro/examples/D3js-code-examples-I-love/` |
| Observable Plot chart | `data-analyst` | — | `~/.claude/js-pro/refs/plot-main/`, `~/.claude/js-pro/examples/plot-rough/` |
| TypeScript types | `typescript-pro` | (domain agent) | — |
| Component API design | `ui-designer` | `react-specialist` | `~/.claude/js-pro/refs/base-ui-master/`, `~/.claude/js-pro/refs/material-ui-master/` |
| Complex data table | `ui-designer` | `react-specialist` | `~/.claude/js-pro/refs/ag-grid-latest/` |
| Node graph UI | `ui-designer` | `react-specialist` | `~/.claude/js-pro/refs/xyflow-main/` |
| Code refactoring | `refactoring-specialist` | (domain agent) | — |
| jQuery-to-React migration | `legacy-modernizer` | `react-specialist` | `~/.claude/js-pro/refs/react-main/` |
| Angular work | `javascript-pro` | — | `~/.claude/js-pro/refs/angular.js-master/` |
| Alpine.js patterns | `frontend-developer` | — | `~/.claude/js-pro/refs/alpine-main/` |
| HTMX patterns | `frontend-developer` | — | `~/.claude/js-pro/refs/htmx-master/` |
| Build/bundling | `build-engineer` | — | Build configs in `~/.claude/js-pro/refs/*/` |
| Performance optimization | `javascript-pro` | (domain agent) | — |
| CSS/HTML/browser APIs | `frontend-developer` | — | — |
| Serverless/Node infra | `platform-engineer` | — | — |
| SEO/Core Web Vitals | `seo-specialist` | `frontend-developer` | — |
| Stripe/payments | `payment-integration` | — | — |
| Cross-framework research | `knowledge-synthesizer` | — | Multiple `~/.claude/js-pro/refs/` |
| Task planning | `project-manager` | — | — |
| Feature scoping | `product-manager` | — | — |

### Slash Commands

| Command | Agent File | Description |
|---------|-----------|-------------|
| `/js-pro` | `agents/js-pro.md` | **Plugin hub** — routes to the right specialist agent |
| `/javascript-pro` | `agents/javascript-pro.md` | General JS expertise (ES2023+, async, perf, Node.js) |
| `/react` | `agents/react-specialist.md` | React 19, hooks, server components, compiler |
| `/nextjs` | `agents/nextjs-developer.md` | Next.js 15 App Router, server actions, middleware |
| `/typescript` | `agents/typescript-pro.md` | Advanced type patterns, generics, conditional types |
| `/frontend` | `agents/frontend-developer.md` | CSS, HTML, browser APIs, responsive, a11y |
| `/d3` | `agents/data-analyst.md` | D3 visualization, Observable Plot, charting |
| `/d3-graph` | `agents/d3-graph-builder.md` | **Guided D3 graph builder** — interview → chart type → encoding → code |
| `/ui-design` | `agents/ui-designer.md` | Component design, design systems, visual patterns |
| `/refactor` | `agents/refactoring-specialist.md` | Code smell detection, safe refactoring patterns |
| `/migrate` | `agents/legacy-modernizer.md` | Framework migrations (jQuery→React, class→hooks) |
| `/build` | `agents/build-engineer.md` | Bundler config, CI/CD, monorepo tooling |
| `/platform` | `agents/platform-engineer.md` | Node.js, serverless, Docker, deployment |
| `/seo` | `agents/seo-specialist.md` | Core Web Vitals, structured data, SSR optimization |
| `/payments` | `agents/payment-integration.md` | Stripe, billing, PCI considerations |
| `/synthesize` | `agents/knowledge-synthesizer.md` | Cross-cutting research, documentation |
| `/plan` | `agents/project-manager.md` | Task breakdown, estimation, prioritization |
| `/scope` | `agents/product-manager.md` | Feature scoping, user stories, trade-offs |

## Cross-Agent Handoff Rules

When a task spans multiple domains, follow these handoff patterns:

### react-specialist
- **Complex TypeScript generics** → defer type design to `typescript-pro`
- **D3 integration** → `data-analyst` owns D3 logic; `react-specialist` owns the React wrapper (useRef, useEffect, resize)
- **Performance** → `javascript-pro` handles profiling; `react-specialist` handles React-specific (memo, useMemo, concurrent)
- **Component API design** → `ui-designer` reviews prop interface and interaction patterns

### data-analyst
- **React wrapper** → `react-specialist` builds the component shell; `data-analyst` fills in D3 logic
- **TypeScript types** for D3 → `typescript-pro` defines generics for data shapes
- **Annotations/labels** → check `~/.claude/js-pro/refs/d3-annotation-master/` before custom solutions

### ui-designer
- **Accessibility internals** → grep `~/.claude/js-pro/refs/base-ui-master/` for focus management, ARIA, keyboard nav
- **Styling systems** → grep `~/.claude/js-pro/refs/material-ui-master/` for theme/variant patterns
- **Complex data components** → grep `~/.claude/js-pro/refs/ag-grid-latest/` for virtualization patterns

### legacy-modernizer
- **Target framework** → hand off to the target framework's agent after migration plan is set
- **Type definitions** → `typescript-pro` defines types for newly migrated code

## Verification Rules

All agents MUST verify against source code before generating framework-dependent code.

### General
1. Check `~/.claude/js-pro/refs/{framework}/package.json` to confirm the version
2. Grep the actual implementation file, not just the re-export
3. If an API seems unfamiliar, search `~/.claude/js-pro/refs/` — don't rely on training data

### React Verification
- Hook signatures → `~/.claude/js-pro/refs/react-main/packages/react/src/ReactHooks.js`
- Server component boundaries → `~/.claude/js-pro/refs/react-main/packages/react-server/`
- Reconciler behavior → `~/.claude/js-pro/refs/react-main/packages/react-reconciler/src/`

### D3 Verification
- Layout APIs → `~/.claude/js-pro/refs/d3-main/` (monorepo re-exports)
- Idiomatic patterns → `~/.claude/js-pro/examples/D3js-code-examples-I-love/`
- Annotations → `~/.claude/js-pro/refs/d3-annotation-master/src/`
- Sankey layouts → `~/.claude/js-pro/refs/d3-sankey-master/src/`

### Component Verification
- Unstyled primitives → `~/.claude/js-pro/refs/base-ui-master/packages/react/src/`
- Styled patterns → `~/.claude/js-pro/refs/material-ui-master/packages/`
- Data grid patterns → `~/.claude/js-pro/refs/ag-grid-latest/`

## Test Data

Available in `~/.claude/js-pro/data/` for immediate prototyping:

| File | Type | Use Case |
|------|------|----------|
| `flare-2.json` | Hierarchical tree (~100 nodes) | Treemaps, circle packing, dendrograms |
| `sfhh@4.json` | Temporal network | Animated force graphs, network evolution |
| `mobile-patent-suits.tgz` | Directed graph | Force graphs, arc diagrams, labeled edges |
| `treemap_2.tgz` | Nested categories | Treemaps, sunburst, icicle charts |
