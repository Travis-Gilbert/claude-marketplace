# Theseus-Pro

A Codex/Claude plugin and skill pack for turning Index-API into Theseus:
an epistemic engine that learns from its own operation.

Successor to SciPy-Pro v4. Subsumes all twelve v4 agents and adds
twelve more covering ML, neural, symbolic, and systems disciplines
required for Levels 2 through 8 of the Theseus roadmap.

## Quick Start

```bash
# 1. Clone this plugin into your codex-plugins directory
cp -r theseus-pro/ ~/codex-plugins/theseus-pro/

# 2. Clone reference repositories (43 repos, ~5GB)
chmod +x scripts/bootstrap_refs.sh
./scripts/bootstrap_refs.sh

# 3. Symlink Index-API if not auto-detected
ln -s /path/to/Index-API refs/index-api

# 4. Copy your existing SciPy-Pro v4 agents into agents/
# (The Tier 1 agents are identical; just copy the 12 files)
cp ~/codex-plugins/scipy-pro/agents/*.md agents/
```

## Architecture

**7 commands** map to intelligence engineering workflows:

| Command | What it does |
|---------|-------------|
| `/reason` | Text to claims, tensions, and models |
| `/graph` | Objects to structure, GNNs, temporal memory |
| `/train` | Feature engineering, model training, evaluation |
| `/architect` | System design, feedback loops, separation of concerns |
| `/simulate` | Debate, counterfactuals, belief revision |
| `/measure` | IQ tracking, benchmarking, trend analysis |
| `/learn` | Compound learning lifecycle and review queue |

**24 agents** organized in three tiers:

| Tier | Count | Scope |
|------|-------|-------|
| 1: Epistemic Foundation | 12 | Knowledge discovery (from SciPy-Pro v4) |
| 2: Intelligence Layer | 6 | Learning from use (Levels 2-6) |
| 3: Generative Intelligence | 6 | Reasoning and generation (Levels 5-8) |

**43 reference repos** cloned by `scripts/bootstrap_refs.sh`.

## The Eight Levels

| Level | Name | Status |
|-------|------|--------|
| 1 | Tool-Based Intelligence | Shipped |
| 2 | Learned Connection Scoring | Specced, next to build |
| 3 | Hypothesis Generation | Designed |
| 4 | Emergent Ontology | Designed |
| 5 | Self-Modifying Pipeline | Designed |
| 6 | Multi-Agent Epistemic Reasoning | Designed |
| 7 | Counterfactual Simulation | Designed |
| 8 | Creative Hypothesis Generation | Designed |

## Directory Structure

```
theseus-pro/
  .codex-plugin/     Codex plugin manifest
  .claude-plugin/    Claude plugin manifest
  CLAUDE.md          Plugin root config
  AGENTS.md          Agent registry (24 agents)
  README.md          This file
  agents/            24 agent definitions by CS discipline
  commands/          7 command definitions
  patterns/          31 executable pattern documents
  knowledge/         Compound learning memory + session logs
  skills/            Codex skill entry points
  examples/          Runnable code samples per workflow
  product/           Roadmap, specs, landscape analysis
  scripts/           bootstrap_refs.sh and utilities
  refs/              43 cloned reference repositories (gitignored)
```

## Lineage

| Version | Date | Plugin | Commands | Agents |
|---------|------|--------|----------|--------|
| 1.0 | Feb 2026 | SciPy-Pro | 11 | 0 |
| 2.0 | Feb 2026 | SciPy-Pro | 11 | 0 |
| 3.0 | Mar 2026 | SciPy-Pro | 10 | 0 |
| 4.0 | Mar 2026 | SciPy-Pro | 4 | 12 |
| **1.0** | **Mar 2026** | **Theseus-Pro** | **6** | **24** |
| **1.1** | **Apr 2026** | **Theseus-Pro** | **7** | **24** |
