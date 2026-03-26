# Codex Plugins

Multi-plugin repository for Claude Code. Each subdirectory is a standalone plugin that extends Claude Code with domain-specific agents, commands, skills, and verified reference knowledge.

Remote: `https://github.com/Travis-Gilbert/Plugins-building.git`

---

## Repository Structure

```
Plugins-building/
├── CLAUDE.md                              # This file
├── README.md                              # Human-facing overview
├── sync-plugins.sh                        # Plugin installer (symlink + register + enable)
├── <plugin-name>/                         # 13 standalone plugins (see list below)
│   ├── .claude-plugin/plugin.json         # Manifest (name, version, description, keywords)
│   ├── CLAUDE.md                          # Plugin-level instructions for Claude Code
│   ├── agents/*.md                        # Specialist agents (YAML frontmatter + instructions)
│   ├── commands/*.md                      # Slash commands (YAML frontmatter + routing)
│   ├── skills/*/                          # Domain knowledge organized by topic
│   ├── references/*.md                    # Static reference docs (8-15 KB each)
│   ├── templates/*                        # Code templates (Python, JS, etc.)
│   ├── examples/*                         # Runnable annotated examples
│   ├── knowledge/                         # Epistemic layer (claims, tensions, embeddings)
│   ├── refs/                              # Shallow-cloned library source (gitignored)
│   └── install.sh                         # Clones refs/ and registers commands
├── plugin-server/                         # Django-based MCP server for claude.ai delivery
├── scripts/                               # Shared utilities (epistemic seeder, embeddings)
├── skills/                                # Standalone skills (not inside a plugin)
├── ui-lab/                                # JS-Pro plugin + shared UI skill assets
├── django-engine-pro-plugin-spec.md       # Plugin design spec
├── django-engine-pro-epistemic-layer.md   # Epistemic layer spec
├── ui-design-pro-plugin-spec.md           # Plugin design spec
└── plugin-server-spec.md                  # MCP server spec
```

---

## Active Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **ui-design-pro** | 1.1.0 | Visual design theory + component engineering (Radix, shadcn, Tailwind, Motion) |
| **django-engine-pro** | 1.0.0 | Django backend mastery: ORM, DRF, Ninja, polymorphic patterns, MCP servers |
| **django-design** | 3.0.0 | Full-stack Django: backend architecture + HTMX/Alpine/Tailwind frontend |
| **d3-pro** | 1.0.0 | D3 visualization grounded in the Bostock/Observable canon |
| **three-pro** | 1.0.0 | Three.js, React Three Fiber, D3+Three hybrid, NPR rendering |
| **ml-pro** | 1.0.0 | ML engineering: PyTorch, GNNs, transformers, RL, LoRA fine-tuning |
| **scipy-pro** | 4.0.0 | Epistemic engineering: NLP, knowledge graphs, causal inference, IR |
| **next-pro** | 1.0.0 | Next.js development + diagnostic error tracing through framework source |
| **app-forge** | 1.0.0 | Website-to-app conversion: PWA, Tauri desktop, native handoffs |
| **app-pro** | 1.0.0 | Mobile development: PWA, React Native, Expo, offline-first sync |
| **animation-pro** | 0.1.0 | Motion across UI, creative/generative, 3D, and programmatic video |
| **ux-pro** | 0.1.0 | UX research, IA, interaction design, accessibility, usability testing |
| **shipit** | 1.0.0 | Git and deployment automation with verification at every step |
| **JS-Pro** | — | JavaScript engineering (inside `ui-lab/JS-Pro/`) |

---

## Plugin Install Model

Three gates must all be satisfied for a plugin to load:

| Step | What | Where | How |
|------|------|-------|-----|
| 1. Symlink | Plugin files accessible | `~/.claude/plugins/marketplaces/local-desktop-app-uploads/<name>/` | `./sync-plugins.sh` |
| 2. Registry | Plugin registered | `~/.claude/plugins/installed_plugins.json` | `./sync-plugins.sh` |
| 3. Enablement | Plugin enabled | `~/.claude/settings.json` → `enabledPlugins` | `./sync-plugins.sh` (auto) |

`sync-plugins.sh` handles all three steps automatically. If step 3 fails, manually add `"<name>@local-desktop-app-uploads": true` to `enabledPlugins` in `~/.claude/settings.json`.

`~/.claude/plugins/<name>/` (without marketplace namespace) is NOT read by Claude Code.

### Sync Commands

```bash
./sync-plugins.sh                  # Sync all plugins
./sync-plugins.sh <plugin-name>    # Sync one plugin
./sync-plugins.sh --status         # Show sync status
./sync-plugins.sh --uninstall <n>  # Remove a plugin
```

---

## Plugin Anatomy

### Manifest (`.claude-plugin/plugin.json`)

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "What the plugin does",
  "author": { "name": "Travis Gilbert" },
  "keywords": ["tag1", "tag2"]
}
```

### Agent Files (`agents/<name>.md`)

YAML frontmatter with `name`, `description`, `model`, `color`, `tools`, followed by markdown instructions. Each plugin has 5-12 specialized agents.

### Command Files (`commands/<name>.md`)

YAML frontmatter with `description`, `allowed-tools`, `argument-hint`, followed by routing instructions that invoke agents.

### Knowledge Layer (`knowledge/`)

Epistemic persistence system for learning across sessions:

| File | Purpose |
|------|---------|
| `manifest.json` | Stats, schema version, update log |
| `claims.jsonl` | Factual assertions with confidence scores (0.0-1.0) |
| `methods.jsonl` | Process knowledge |
| `preferences.jsonl` | User-specific overrides |
| `questions.jsonl` | Open research threads |
| `tensions.jsonl` | Unresolved contradictions |
| `embeddings.npz` | SBERT vectors for semantic search (optional, gitignored) |

**Confidence protocol**: claims > 0.8 override static instructions; claims < 0.5 defer to static instructions.

### Source References (`refs/`)

Shallow-cloned library source repos populated by `install.sh`. Gitignored. Used for API verification via grep — plugins ground their knowledge in real source code, not training data.

---

## Plugin Server

Django-based MCP server at `plugin-server/` that delivers plugins to claude.ai.

**Stack**: Django 5.1, Django Ninja, PostgreSQL + pgvector, Gunicorn, deployed on Railway.

**Key files**: `manage.py`, `Dockerfile`, `railway.toml`, `requirements.txt`

**Transports**: SSE and Streamable HTTP via unified `/mcp/` endpoint.

---

## Scripts & Tooling

`scripts/` contains shared epistemic utilities:

- **Dependencies**: pydantic, sentence-transformers, numpy, hdbscan, scikit-learn
- **Purpose**: Knowledge seeding, embedding generation, claim clustering

---

## Development Conventions

### Git

- **Commit format**: Conventional commits — `feat(scope):`, `fix(scope):`, `docs:`, etc.
- **Branch naming**: `claude/<description>` for AI-generated branches
- **LFS**: `GIT_LFS_SKIP_SMUDGE=1` required when cloning DRF into refs/ (large test fixtures)

### Plugin Development

- Plugins are **pure markdown** — no build step, no package.json, no compiled output
- Each plugin is self-contained; no cross-plugin imports
- Reference files target 8-15 KB each
- Agent/command files use YAML frontmatter format
- Templates are runnable starting points, not scaffolding generators

### Epistemic Seeder Notes

- `seed_knowledge.py` over-extracts structural lines as claims. Target spec Part III sample claims, not raw agent markdown lines.
- Review seeded claims and retire low-quality ones (set `status: "retired"`)

### Adding a New Plugin

1. Create `<plugin-name>/.claude-plugin/plugin.json` with manifest
2. Add `CLAUDE.md` with plugin-level instructions
3. Add agents in `agents/`, commands in `commands/`
4. Optionally add `knowledge/`, `references/`, `skills/`, `templates/`, `examples/`
5. If the plugin needs library source: add `install.sh` to clone into `refs/`
6. Add `refs/` to the plugin's `.gitignore`
7. Run `./sync-plugins.sh` to install
8. Update this file's Active Plugins table
