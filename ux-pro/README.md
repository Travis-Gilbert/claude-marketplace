# UX-Pro

Claude Code plugin for UX expertise across seven disciplines.

## Disciplines

| Agent | Domain | Command |
|-------|--------|---------|
| ux-researcher | Research planning, method selection, metrics | /ux-research |
| interaction-designer | Flows, patterns, micro-interactions, states | /interaction |
| information-architect | Navigation, taxonomy, labeling, findability | /ia |
| accessibility-auditor | WCAG 2.2, ARIA, keyboard, inclusive design | /a11y |
| ux-writer | Microcopy, error messages, voice and tone | /ux-write |
| usability-tester | Test scripts, heuristic evaluation, reporting | /usability |
| service-designer | Blueprints, journey maps, experience mapping | /service |

## What This Is

A context plugin for Claude Code. Nothing here executes in production. It provides:

- **1 skill** with 11 reference documents (~30K words of UX knowledge)
- **7 specialist agents** (researcher, interaction designer, IA, accessibility auditor, UX writer, usability tester, service designer)
- **7 slash commands** (one per discipline)
- **7 deliverable templates** (heuristic eval, test script, research plan, journey map, service blueprint, a11y audit, UX review)
- **15 reference source repos** from real design systems and accessibility tools

## Installation

```bash
# Option 1: Use with --plugin-dir
claude --plugin-dir /path/to/ux-pro

# Option 2: Run install script (clones 15 reference repos)
cd ux-pro
./install.sh
```

Note: The install script clones ~2-3GB of source code. This takes several minutes.

## Reference Source Repos

| Tier | Repos |
|------|-------|
| Must-Have | Radix Primitives, GOV.UK Design System, GOV.UK Frontend, Shopify Polaris, Deque axe-core |
| High Value | Headless UI, GitHub Primer React, IBM Carbon, Adobe React Spectrum |
| Selective | W3C ARIA Practices, W3C WCAG, Laws of UX, 18F Accessibility, Pinterest Gestalt, Microsoft Fluent UI |

## Core Principles

1. **Verify against source**: Grep `refs/` for accessibility patterns, not training data.
2. **WCAG 2.2 Level AA minimum**: All implementations must meet this standard.
3. **Keyboard first**: Every interactive element must be operable via keyboard.
4. **Cite your reasoning**: When recommending patterns, cite the heuristic or law that supports it.
5. **Use templates**: Do not reinvent report formats; use the tested templates.

## Relationship to Other Plugins

- **design-pro** (chat): Visual design, layout, prototyping
- **ui-design-pro** (Claude Code): Component implementation, design-to-code
- **animation-pro** (Claude Code): Motion and animation
- **UX-Pro** (this plugin): Research, IA, interaction, accessibility, content, service design
