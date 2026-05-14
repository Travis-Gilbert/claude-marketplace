# Context Theorem

A programmable harness that gives AI agents structured memory, orchestrated context, and a verifiable audit trail — across Claude, Codex, Gemini, and any LLM that can call an API.

Context Theorem has two parts: a **harness** (the SDK and runtime) that handles memory, context compilation, orchestration, and auditability; and a fleet of **domain-specialist plugins** that do the actual engineering work, accumulate knowledge across sessions, and ground themselves in real library source code instead of training data.

The harness doesn't care which model is driving. The plugins don't care which harness run they're inside. Everything participates in the same memory, the same audit trail, and the same orchestration layer.

## The Harness

The harness is the backbone. It tracks every agent session as a **run** — a first-class object with an ID, a task description, an actor identity, scope metadata, and a full step history. Every decision, search, context compilation, and outcome is recorded as a step. Every state transition carries a cryptographic before/after hash pair. Artifacts can be exported with signatures for verification.

The core capabilities:

**Context compilation.** Given a task and a token budget, the compiler produces a ranked, structured context package organized into channels (system invariants, user task, team policy, repo memory, external content, tool outputs, suggested actions). Every artifact carries a detailed token ledger showing compression ratios and savings.

**Context Web.** Graph-structured retrieval that goes beyond flat compilation — returns atoms, edges between atoms, and scored paths through the knowledge graph. Multiple retrieval modes: full, mini, review-delta, research, browser folio, GraphRAG-powered.

**Orchestration.** A decision engine that selects the right profile, skills, agents, tools, validators, renderers, and compute backends for a task, then explains why. Produces transparent decision records with rejected candidates, risk summaries, and policy traces.

**Memory.** User-scoped, LLM-agnostic. The same memory works whether the agent is Claude, Codex, Gemini, or anything else. Saved contexts persist at the tenant level. Runtime-generated memory patches flow through a review pipeline before becoming permanent. The full memory contract includes evidence, operational policies, memory banks, recall policies, and hydration handles.

**Inference engine.** Pluggable epistemic computations: a kernel registry, discovery runs for structured hypothesis testing, validator receipts, and controlled writebacks to the canonical graph. All append-only.

**Fork, replay, compare.** Branch a run at any decision point, try a different approach, compare outcomes. Counterfactual analysis for agent sessions.

**Multi-tenancy.** Tenants, projects, API keys with per-hour quotas, role-based membership, usage analytics, and billing.

For the full feature reference, see [`theorem-context-sdk/FEATURES.md`](./theorem-context-sdk/FEATURES.md).

### Dual SDK

The harness ships as both:

- **`theorem-context-ts`** — TypeScript/Node
- **`theorem-context-py`** — Python (Pydantic v2, async httpx)

Both implement identical APIs with full type safety. Either can be used from any agent framework.

### Codex Adapter

A turnkey integration for Claude Code: one call that detects repo metadata, begins a harness run, compiles context, exports markdown, and writes a `.theorem/` bundle. Any agent framework can participate in the harness lifecycle without custom integration work.

## The Plugins

Each plugin is a domain-specialized engineering intelligence built on the two-surface architecture: a **chat skill** on Claude.ai handles planning and reasoning, a **Claude Code plugin** handles implementation and learning.

### What's Inside Each Plugin

**Specialist agents.** Each plugin ships with 3–7 agents that handle specific subtasks and compose in defined sequences.

**Source-code references.** Plugins shallow-clone real library repos into a local `refs/` directory and grep them at runtime. When UI-Design-Pro needs to know how Radix handles focus restoration, it reads the actual source. Training data goes stale. Source code doesn't.

**Decision frameworks.** Static expert knowledge: inheritance decision tables, ORM anti-pattern catalogs, animation physics constants.

**Epistemic knowledge layer.** The part that learns. Each plugin maintains typed claims with Bayesian confidence scores that update based on session outcomes. Claims start as drafts, get reviewed, and accumulate evidence. Over time, each plugin develops its own body of verified, weighted domain knowledge.

### The Epistemic Protocol

Every plugin with a `knowledge/` directory runs the same cycle:

**Session start** — load active claims sorted by confidence, surface unresolved tensions before making decisions. **During work** — track which claims informed each suggestion, note user acceptance or rejection. **Session end** — write observations, flag contradictions as tension signals, note uncovered patterns.

Knowledge types: claims (factual assertions with confidence), tensions (unresolved conflicts), questions (open research threads), methods (process knowledge), preferences (user-specific overrides).

### Available Plugins

| Plugin | Domain | What It Knows |
|--------|--------|---------------|
| **[UI-Design-Pro](./ui-design-pro)** | Web UI | Design theory, shadcn/Radix internals, polymorphic rendering, accessibility |
| **[Django-Engine-Pro](./django-engine-pro)** | Backend | ORM optimization, DRF vs. Ninja, django-polymorphic, Pydantic v2, MCP servers |
| **[Django-Design](./django-design)** | Full-Stack Django | HTMX, Alpine.js, Tailwind, D3 integration, Cotton components |
| **[ML-Pro](./ml-pro)** | Machine Learning | PyTorch, GNNs, Transformers, training loops, deployment |
| **[SciPy-Pro](./scipy-pro)** | Epistemic Engineering | NLP pipelines, graph theory, causal inference, knowledge representation |
| **[D3-Pro](./d3-pro)** | Data Visualization | D3.js scales, transitions, force layouts, geographic projections |
| **[Three-Pro](./three-pro)** | 3D Visualization | Three.js, shaders, physics simulation, WebGL, 3D graph embeddings |
| **[Animation-Pro](./animation-pro)** | Motion Design | Spring physics, state-driven animation, CSS/JS motion patterns |
| **[Next-Pro](./next-pro)** | Next.js | App Router, Server Components, data fetching, deployment |
| **[UX-Pro](./ux-pro)** | UX Research | Interaction design, information architecture, accessibility auditing |
| **[App-Forge](./app-forge)** | App Conversion | PWA, Tauri desktop, native app planning from web apps |
| **[Swift-Pro](./swift-pro)** | Native Apple | SwiftUI, SwiftData, AppKit, web-to-native architecture |
| **[Production-Theorem](./production-theorem)** | Harness Ops | Deployment, monitoring, and operational management for Context Theorem |
| **[Shipit](./shipit)** | Deployment | Handoff documents, CI/CD configuration, shipping protocols |

### Two-Surface Architecture

| Chat Skill (Claude.ai) | Claude Code Plugin |
|------------------------|-------------------|
| Decision frameworks | Slash commands and agents |
| Tradeoff analysis | Source-code grepping |
| Structured handoff docs | Implementation and testing |
| Domain reasoning | Session logging and learning |
| Static (expert knowledge) | Dynamic (knowledge that evolves) |

Chat skill specs live in the root directory as `.md` files. The chat skills are installed separately via Claude.ai's custom skill system.

## Installation

```bash
# Clone the repo
git clone https://github.com/Travis-Gilbert/Plugins-building.git codex-plugins
cd codex-plugins

# Sync all plugins to Claude Code
./sync-plugins.sh

# Sync a single plugin
./sync-plugins.sh d3-pro

# Check what's linked
./sync-plugins.sh --status

# Remove a plugin
./sync-plugins.sh --uninstall d3-pro
```

The sync script symlinks plugin directories into the Claude Code marketplace path, registers them in `installed_plugins.json`, and enables them in `settings.json`. If enablement fails, manually add `"<plugin-name>@local-desktop-app-uploads": true` to `enabledPlugins` in `~/.claude/settings.json`.

After syncing, populate source references for any plugin you plan to use:

```bash
cd ui-design-pro && ./install.sh   # clones 11 repos (~115 MB)
cd ../ml-pro && ./install.sh        # clones ML source refs
```

### SDK Installation

```bash
# Python
pip install theorem-context

# TypeScript
npm install theorem-context-ts
```

## How This Compares

Most AI agent tooling falls into one of two categories: horizontal measurement layers that ask "is the agent ready to act?" or role-based starter kits with skills and connectors but no learning and no memory across providers.

Context Theorem is neither. It is a vertical stack: a harness that provides LLM-agnostic memory, token-aware context compilation, and a cryptographic audit trail, combined with domain-specialist plugins that accumulate knowledge across every session they run. The harness makes agent sessions reproducible, forkable, and verifiable. The plugins make each domain smarter over time.

The question it asks is not "does the agent know enough?" but "what has this system learned, how confident is it, and can you prove what happened?"

## Structure

```
codex-plugins/
├── theorem-context-sdk/         # The harness: SDK clients and feature reference
│   ├── theorem-context-py/      # Python SDK (Pydantic v2, async httpx)
│   ├── theorem-context-ts/      # TypeScript SDK
│   └── FEATURES.md              # Full feature reference
├── sync-plugins.sh              # Installs/syncs all plugins to Claude Code
├── django-engine-pro/           # Backend Django specialist
│   ├── agents/                  # Specialist agent definitions
│   ├── commands/                # Slash commands
│   ├── knowledge/               # Epistemic layer (claims, tensions, sessions)
│   ├── references/              # Static decision frameworks
│   ├── skills/                  # Domain knowledge files
│   └── templates/               # Output templates
├── ui-design-pro/               # UI design specialist
│   ├── chat-skill/              # Companion Claude.ai skill
│   ├── knowledge/               # Epistemic layer + SBERT embeddings
│   ├── refs/                    # Cloned library source (gitignored)
│   └── ...
├── ml-pro/                      # Machine learning specialist
├── scipy-pro/                   # Epistemic engineering specialist
├── d3-pro/                      # D3 visualization specialist
├── three-pro/                   # Three.js 3D specialist
├── animation-pro/               # Motion design specialist
├── next-pro/                    # Next.js specialist
├── ux-pro/                      # UX research specialist
├── django-design/               # Django frontend specialist
├── app-forge/                   # Web-to-app conversion
├── swift-pro/                   # Native Apple platform specialist
├── production-theorem/          # Harness operations
├── shipit/                      # Deployment and handoff
└── *.md                         # Plugin specs and chat skill definitions
```
