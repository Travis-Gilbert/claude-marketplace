# SciPy-Pro v4: Epistemic Engineering Plugin

A Claude Code plugin organized around the computer science disciplines
required to build systems for structured understanding — grounded in
framework source code and the research_api epistemic engine.

## Overview

v4 is organized around **epistemic engineering workflows** — the CS skills
needed to build systems that acquire evidence, extract claims, detect
tensions, form models, encode executable knowledge, and revise understanding.

## Commands

| Command | Workflow | What It Does |
|---------|----------|--------------|
| `/reason` | Text -> Claims | NLP, NLI, claim decomposition, tension detection |
| `/graph` | Objects -> Structure | Community detection, causal DAGs, self-organization |
| `/encode` | Evidence -> Methods | DSL design, rule compilation, promotion pipeline |
| `/gather` | Web -> Training Data | Firecrawl scraping, corpus construction, SBERT tuning |

## Agents (12)

| Agent | CS Discipline |
|-------|---------------|
| information-retrieval | BM25, TF-IDF, FAISS, re-ranking |
| nlp-pipeline | spaCy, SBERT, NER, tokenization |
| claim-analysis | NLI, claim decomposition, stance detection |
| knowledge-representation | KGE, ontologies, epistemic primitives |
| graph-theory | Community detection, centrality, spectral methods |
| causal-inference | Influence DAGs, provenance, lineage tracing |
| probabilistic-reasoning | Bayesian decay, evidence weighting, uncertainty |
| self-organization | Feedback loops, entity promotion, edge decay |
| program-synthesis | Method DSL, rule compilation, evaluation |
| software-architecture | Two-mode deployment, RQ queues, caching |
| training-pipeline | SBERT fine-tuning, triplet construction, evaluation |
| web-acquisition | Firecrawl, content extraction, corpus building |

## Installation

```bash
# Install as Claude Code plugin
claude plugins add /path/to/scipy-pro

# Or test locally
claude --plugin-dir /path/to/scipy-pro
```

## Setting Up References

The agents reference library source code in `refs/`. To set up:

```bash
# Clone library repos (shallow, ~2GB total)
./scripts/bootstrap_refs.sh

# With research_api symlink
./scripts/bootstrap_refs.sh ~/.codex/cache/scipy-pro-refs /path/to/research_api

# Dry run first
./scripts/bootstrap_refs.sh --dry-run
```

## Directory Structure

```
scipy-pro/
├── .claude-plugin/plugin.json    Plugin manifest
├── CLAUDE.md                     Plugin root config + epistemic stack
├── commands/                     4 workflow commands
├── agents/                       12 CS discipline agents
├── skills/epistemic-engine/      Contextual knowledge skill
├── patterns/                     8 implementation pattern files
├── examples/                     12 runnable Python examples
├── product/                      5 product/roadmap docs
└── scripts/                      Reference bootstrapping
```

## Version History

| Version | Date | Organizing Principle | Commands |
|---------|------|----------------------|----------|
| 1.0 | Feb 2026 | File-based skills | 11 commands |
| 2.0 | Feb 2026 | File-based skills (validated) | 11 commands |
| 3.0 | Mar 2026 | Scientific disciplines (3-tier) | 10 commands |
| 4.0 | Mar 2026 | Epistemic engineering workflows | 4 commands, 12 agents |
