# vie-design

Visual design system plugin for Theseus VIE (Visual Intelligence Engine).

## What This Plugin Does

Enforces the VIE design language across the D3 layout -> TF.js intelligence -> R3F rendering pipeline. Manages the datadot grid, engine heat gradient, Mantine-sourced material tokens, borrowed Ink UI interaction patterns, and design primitives (Sonner, Vaul, CMDK).

## Skills

| Skill | Purpose |
|-------|---------|
| `vie-system` | Auto-loads VIE design knowledge when working on Theseus UI code |
| `vie-design` | Chat companion for planning screens and answer construction sequences |

## Agents

| Agent | Color | Purpose |
|-------|-------|---------|
| `vie-architect` | cyan | Plans visual structure of Theseus screens |
| `vie-pipeline-advisor` | blue | Configures D3 -> TF.js -> R3F pipeline per answer type |
| `vie-material` | green | Builds components with Mantine + Radix + custom stack |
| `vie-motion` | magenta | Plans answer construction and interaction animation |
| `vie-critic` | yellow | Reviews Theseus UI against VIE design language |

## Reference Repos

Cloned in `refs/` for grepping:

- `mantine/` — Shadow, elevation, spacing, z-index token source
- `sonner/` — Toast notification patterns
- `vaul/` — Bottom drawer patterns
- `cmdk/` — Command palette patterns
- `ink-ui/` — Spinner, progress bar, typing effect reference
- `vega-lite/` — Declarative chart specification patterns
- `observable-framework/` — Layout and chart composition patterns

## Installation

```bash
# Clone refs (if not already present)
./install.sh

# Symlink to Claude Code
cd .. && ./sync-plugins.sh
```

## Prerequisites

- refs/ repos cloned (run install.sh)
- Working on the travisgilbert.me Next.js project
- Theseus components in `src/components/theseus/`
