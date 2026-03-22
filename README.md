# Codex Plugins

A collection of **Claude Code** plugins and specialized engineering skills managed in git. These plugins ground Claude Code in verified reference material, library source code, and enforced engineering standards.

## Usage & Syncing

This repository uses a sync script to link the local plugin directories into the Claude Code marketplace path (`~/.claude/plugins/marketplaces/local-desktop-app-uploads/`).

```bash
# Sync all plugins to Claude Code
./sync-plugins.sh

# Sync a specific plugin
./sync-plugins.sh d3-pro

# Show sync status
./sync-plugins.sh --status

# Uninstall/un-register a plugin
./sync-plugins.sh --uninstall d3-pro
```

*Note: After syncing, you may need to restart Claude Code or ensure the plugins are enabled in your `~/.claude/settings.json`.*

## Available Plugins (v4)

These are full Claude Code plugins containing specialist agents, slash commands, and source-code-backed reference systems.

| Plugin | Domain | Key Expertise |
|--------|--------|---------------|
| **[ML-Pro](./ml-pro)** | Machine Learning | PyTorch, GNNs, Transformers, model architecture, training loops, deployment. |
| **[SciPy-Pro](./scipy-pro)** | Epistemic Engineering | NLP, graph theory, causal inference, knowledge representation, Bayesian reasoning. |
| **[UI-Design-Pro](./ui-design-pro)** | Web UI Design | Design theory, visual judgment, shadcn/Radix, polymorphic rendering, a11y. |
| **[UX-Pro](./ux-pro)** | UX Research | Interaction design, info architecture, accessibility auditing, service design. |
| **[Django-Design](./django-design)** | Full-Stack Django | Frontend (HTMX, Alpine.js, Tailwind, D3), Cotton components, design systems. |
| **[Django-Engine-Pro](./django-engine-pro)** | Backend Engine | ORM optimization, DRF/Ninja, polymorphic patterns, Pydantic v2, MCP servers. |
| **[D3-Pro](./d3-pro)** | Data Visualization | D3.js scales, transitions, layouts, geographic, math-heavy visualization. |
| **[Three-Pro](./three-pro)** | 3D Visualization | Three.js, shaders, physics, WebGL, 3D graph embeddings. |
| **[Animation-Pro](./animation-pro)** | Motion Design | Spring physics, state-driven animation, CSS/JS motion patterns. |
| **[JS-Pro](./ui-lab/JS-Pro)** | JS Engineering | Advanced JavaScript/TypeScript patterns, architectural standards. |
| **[Shipit](./shipit)** | Deployment | Handoff documents, CI/CD, shipping protocols. |

## Custom Chat Skills & Plugin Specs

Found in the root directory, these are custom instructions and plugin specifications for Claude.ai or Claude Desktop.

- `python-pro.md`: Senior Python developer expertise (PEP 8, type-safety, async).
- `react-specialist.md`: Expert React & TypeScript patterns (hooks, state, performance).
- `django-engine-pro-plugin-spec.md`: Detailed specification for the Django Engine plugin.
- `ui-design-pro-plugin-spec.md`: Detailed specification for the UI Design plugin.
- `epistemic-plugin-spec.md`: Core spec for epistemic engineering workflows.
- `ui-designer.md`: Visual and interaction design expertise.
- `ux-researcher.md`: User research and usability testing expertise.
- `Rough.js Plugin`: Rough.js implementation for sketching/diagramming.

## Legacy Skills

Found in the `skills/` directory, these are simpler skill-based workflows.

- `skills/next-tailwind-ui-builder`: React, Next.js, and Tailwind UI build workflow.
- `skills/next-tailwind-ux-review`: React, Next.js, and Tailwind UX review workflow.

## Notes
- **Reference Repos**: Many plugins include an `install.sh` or `bootstrap_refs.sh` to clone large library source repositories into a `refs/` directory for local API verification.
- **Persistence**: 
  - The active installed copies for Claude Code live under `~/.claude/plugins/`.
  - Legacy skills may still be managed under `~/.codex/skills/`.
  - This repo is the version-controlled source and uses symlinks to stay in sync with the live environment.
