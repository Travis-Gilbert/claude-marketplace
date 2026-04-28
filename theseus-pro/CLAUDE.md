# Theseus-Pro: Intelligence Engineering Plugin

You are working on systems that learn from their own operation. The
primary application is Index-API (becoming Theseus), a Django-based
epistemic engine that discovers, organizes, and generates knowledge
through a self-improving pipeline.

Named for Claude Shannon's maze-navigating mouse (1950): the intelligence
is not in the mouse but in the maze itself. The relay circuits under the
floor record which direction leads forward. Theseus walks straight to the
goal on the second run.

## Prime Directive

Read the source before writing code. Read refs/ for library internals.
Read the Index-API codebase for application patterns. Do not rely on
training data for either.

## Command Routing

/reason    -> text -> claims -> tensions -> models (NLP, NLI, KR)
/graph     -> objects -> structure -> self-organization -> GNN (graph, temporal, causal)
/train     -> features -> models -> evaluation -> adaptation (ML, RL, evolution)
/architect -> layers -> separation -> feedback loops -> optimization (systems, infra)
/simulate  -> hypotheses -> debate -> counterfactuals -> revision (symbolic, agents)
/measure   -> axes -> scores -> trends -> opportunities (IQ tracker)

## Agent Loading

Each command loads relevant agents. Agents are reusable across commands.

| Agent | /reason | /graph | /train | /architect | /simulate | /measure |
|---|---|---|---|---|---|---|
| information-retrieval | * | | * | | | * |
| nlp-pipeline | * | | * | | | |
| claim-analysis | * | | | | * | |
| knowledge-representation | * | * | * | | * | |
| graph-theory | | * | | | | * |
| causal-inference | | * | | | * | |
| probabilistic-reasoning | * | * | | | * | |
| self-organization | | * | | * | | * |
| program-synthesis | | | | * | | |
| software-architecture | | | | * | | |
| training-pipeline | | | * | | | |
| web-acquisition | | | * | | | |
| learned-scoring | | | * | | | * |
| graph-neural-networks | | * | * | | | |
| temporal-graph-memory | | * | * | | * | |
| language-model-training | | | * | | * | |
| multimodal-networks | | | * | | | |
| multi-agent-reasoning | | | | | * | |
| reinforcement-learning | | | * | | | * |
| evolutionary-optimization | | | * | * | | |
| symbolic-reasoning | | | | | * | |
| systems-theory | | * | | * | * | * |
| counterfactual-simulation | | | | | * | |
| domain-specialization | | | * | * | | * |

## The Theseus Stack

### Primitives (apps/notebook/models.py)
  Object          Unit of captured knowledge (10 types)
  Edge            Explained connection (14 types, from_object/to_object)
  Claim           Sentence-sized proposition extracted from an Object
  Question        Durable unit of inquiry organizing evidence
  Tension         Stored contradiction, ambiguity, or unresolved conflict
  EpistemicModel  Explanation with assumptions, scope, failure conditions
  Method          Versioned executable knowledge
  MethodRun       One execution of a Method
  Narrative       Synthesis artifact (memo, brief, story, report)

### Engines
  engine.py             7-pass post-capture graph enrichment
  compose_engine.py     6-pass live write-time discovery
  inquiry_engine.py     Structured inquiry pipeline
  claim_decomposition   LLM + rule-based claim extraction
  causal_engine.py      Temporal influence DAG construction
  community.py          Louvain community detection
  gap_analysis.py       Structural hole detection
  temporal_evolution.py Sliding-window graph dynamics
  synthesis.py          LLM cluster summarization
  self_organize.py      5 feedback loops
  canvas_engine.py      Altair/Vega-Lite spec generation
  method_runtime.py     Method execution engine
  embedding_service.py  Embedding generation service
  kge.py                TheseusKGE runtime (RotatE predictions, cold-start)
  kge_export.py         Triple export for KGE training
  kge_tokens.py         GL-Fusion Stream C structural token generation
  scorer_ensemble.py    Multi-scorer coordination
  symbolic_adjudication.py  Symbolic conflict resolution
  inquiry_engine.py     Structured inquiry pipeline
  canvas_engine.py      Altair/Vega-Lite spec generation
  deepseek_dispatch.py  DeepSeek V3.2 MCP-to-MCP integration
  speaking_dispatch.py  Voice/speaking interface

### Infrastructure
  vector_store.py       FAISS indexes (SBERT + KGE)
  advanced_nlp.py       SBERT + CrossEncoder NLI (two-mode safe)
  bm25.py               BM25 lexical index
  adaptive_ner.py       Graph-learned PhraseMatcher
  tasks.py              RQ background jobs (engine, ingestion, default)
  provenance.py         Auditable object history + influence lineage
  file_ingestion.py     PDF, DOCX, images, code (tree-sitter AST)
  scraper.py            Firecrawl web acquisition

### The Eight Levels
  Level 1: Tool-Based Intelligence       (SHIPPED)
  Level 2: Learned Connection Scoring    (NEXT - see INDEX-LEVEL2-SPEC.md)
  Level 3: Hypothesis Generation         (fine-tuned LM, grounded in graph)
  Level 4: Emergent Ontology             (SELF-ORGANIZING-SPEC.md Loop 5)
  Level 5: Self-Modifying Pipeline       (per-domain engine configuration)
  Level 6: Multi-Agent Epistemic Reasoning (Advocate/Critic/Judge)
  Level 7: Counterfactual Simulation     (Truth Maintenance Systems)
  Level 8: Creative Hypothesis Generation (structural anomaly + abduction)

### Two-Mode Contract (NEVER BREAK THIS)
  PRODUCTION (Railway): spaCy + BM25 + TF-IDF. No PyTorch.
  LOCAL/DEV: All 7 passes. PyTorch + FAISS + SBERT + NLI + KGE.
  MODAL (GPU): Batch re-encoding, KGE training, GNN training, LM fine-tuning.

### Architectural Invariants
  1. Edge.reason is a plain-English sentence a human can read.
  2. Edge uses from_object / to_object (not source/target).
  3. Timeline Nodes are immutable (except retrospective_notes).
  4. SHA-hash identity tracks provenance. Don't bypass _generate_sha().
  5. Per-Notebook engine_config controls pass behavior.
  6. Objects soft-delete only (is_deleted=True).
  7. LLMs propose. Humans review. Nothing auto-promotes to canon.
  8. compose_engine is stateless (text-in, objects-out, no DB writes).
  9. engine.py is stateful (object-in, edges + nodes out).
  10. Every epistemic primitive carries its provenance.
  11. Learned models fall back gracefully to fixed weights when untrained.
  12. Feedback loops close one at a time, never all at once.
  13. Neural components produce signals alongside (not instead of) symbolic ones.
  14. The IQ Tracker measures every change.

### IQ Tracker (Seven Axes, 0-100 each)
  Discovery (0.20)     Can it find real connections?
  Organization (0.15)  Can it structure knowledge without being told?
  Tension (0.15)       Can it find contradictions?
  Lineage (0.10)       Can it trace how knowledge evolved?
  Retrieval (0.15)     Can it find the right thing when asked?
  Ingestion (0.10)     Can it handle diverse inputs?
  Learning (0.15)      Does it get smarter over time?
  Current composite: check live via theseus_measure_iq MCP tool

## Multi-Agent Routing Examples

"Ship the Level 2 learned scorer":
  1. learned-scoring (architecture, feature vector, graceful fallback)
  2. software-architecture (model persistence, RQ scheduling)
  3. information-retrieval (feature extraction from BM25, TF-IDF)
  4. systems-theory (feedback loop: engagement -> labels -> model -> better scoring)

"Add a GNN structural similarity pass to the engine":
  1. graph-neural-networks (R-GCN training, embedding extraction)
  2. graph-theory (graph export, node feature construction)
  3. software-architecture (Modal GPU dispatch, two-mode fallback)
  4. learned-scoring (GNN embedding as a new feature in the scorer)

"Build counterfactual simulation for Claims":
  1. counterfactual-simulation (dependency trees, retraction cascading)
  2. symbolic-reasoning (TMS architecture, de Kleer ATMS)
  3. knowledge-representation (Claim model, provenance chains)
  4. causal-inference (temporal precedence, influence DAG)

"Implement the Advocate/Critic/Judge debate system":
  1. multi-agent-reasoning (role definition, grounded evidence rules)
  2. language-model-training (LoRA fine-tuning per role)
  3. claim-analysis (NLI scoring for evidence evaluation)
  4. reinforcement-learning (reward from human review of verdicts)

"Evolve engine hyperparameters using the IQ Tracker":
  1. evolutionary-optimization (NSGA-II multi-objective search)
  2. systems-theory (parameter sensitivity, feedback stability)
  3. domain-specialization (per-cluster configurations)
  4. learned-scoring (feature importance as fitness signal)

## Reference Materials

- `agents/` has 24 agent definitions (12 from v4, 12 new)
- `patterns/` has 31 executable pattern documents covering the full engine (engine passes, self-org loops, learned scoring, GNN training, LoRA fine-tuning, argumentation assembly, autonomous investigation, edge acceptance, information metrics, reasoning pipeline, compound learning, and the enrichment pipeline: EpiGNN, KGE RotatE, SBERT enrichment, GL-Fusion three-stream, model swarm, network effects)
- `product/` has roadmap, specs, and landscape analysis
- `examples/` has runnable code samples per workflow
- `scripts/bootstrap_refs.sh` clones all 43 reference repos

## Plugin Installation (Local)

Source: `theseus-pro/` (this repo, committed to git)
Installed: `~/.claude/plugins/marketplaces/local-desktop-app-uploads/theseus-pro/`

Three steps required for Claude Code to discover a local plugin:
1. Copy to marketplace dir: `rsync -av --exclude='.git' theseus-pro/ ~/.claude/plugins/marketplaces/local-desktop-app-uploads/theseus-pro/`
2. Register in `~/.claude/plugins/installed_plugins.json` with `installPath` pointing to marketplace dir
3. Enable in `~/.claude/settings.json` → `enabledPlugins` → `"theseus-pro@local-desktop-app-uploads": true`

After changes to source, re-run step 1 to sync. Restart Claude Code to pick up changes.

Commands require YAML frontmatter (`description`, `argument-hint`, `allowed-tools`).
Plugin requires `skills/*/SKILL.md` as the routing hub entry point.

## Compound Learning Layer

This plugin learns from your work sessions. Three things happen automatically.

### At Session Start
1. Read `knowledge/manifest.json` for stats and last update time
2. Read `knowledge/claims.jsonl` for active claims relevant to this task
   (filter by domain and tags matching the agents you are loading)
3. When a claim's confidence > 0.8 and it conflicts with static
   instructions, follow the claim. It represents learned behavior.
4. When a claim's confidence < 0.5 and it conflicts with static
   instructions, follow the static instructions.

### During the Session (Passive Tracking)
- Note which claims you consult and why
- Note suggestion outcomes (accepted, modified, rejected)
- Note patterns not yet in the knowledge base
- Note any corrections the user makes that contradict existing claims

### When a Problem Is Solved (Auto-Capture)

When you detect that a non-trivial problem has been solved (trigger
phrases: "that worked", "it's fixed", "working now", "problem solved",
"that was the issue", or the user explicitly asks you to capture/document
a fix), perform a compact capture before continuing:

1. Assess: is this worth capturing? Skip trivial typo fixes, simple
   config changes, or problems with obvious one-line solutions. Capture
   when the root cause required investigation, the fix involved
   understanding something non-obvious, or the pattern is likely to
   recur.

2. If worth capturing, write a solution doc to `knowledge/solutions/`:
   - Filename: `[domain-slug]-[YYYY-MM-DD].md`
     If the file exists, append a counter: `[domain-slug]-[YYYY-MM-DD]-2.md`
   - Format: Problem, Root Cause, Solution, Prevention, Claims Extracted
   - Keep it concise. 10-30 lines total.

3. Extract 2-5 typed Claims from the solution. Each claim should be:
   - A single imperative statement (starts with a verb or "always/never")
   - Scoped to one actionable practice
   - Tagged with the relevant domain from the agent domain map

4. For each candidate claim, compute the claim_id (sha256 of
   "[plugin]:[lowercased text]", first 12 hex chars). Skip if that ID
   already exists in claims.jsonl.

5. Append new claims to `knowledge/claims.jsonl` as JSON lines:
   ```json
   {"id":"[hash]","text":"[claim]","domain":"[domain]","agent_source":"[agent]","type":"empirical","confidence":0.667,"source":"auto-capture","first_seen":"[date]","last_validated":"[date]","status":"active","evidence":{"accepted":0,"rejected":0,"modified":0},"projects_seen":["[project]"],"tags":["[tag1]","[tag2]"],"related_claims":[]}
   ```

6. Print a brief confirmation:
   ```
   [compound] Captured: [brief problem summary]
     Solution: knowledge/solutions/[filename].md
     Claims: +N new, M skipped (duplicate)
   ```

7. Log an `auto_capture` event in your mental session log:
   ```json
   {"event":"auto_capture","claims_added":["[hash1]","[hash2]"],"solution_file":"knowledge/solutions/[filename].md","domain":"[domain]","project":"[project]"}
   ```

8. Continue with whatever the user asked for next. Do not pause for
   review. The /learn command handles review.

### At Session End
Run `/learn` to save the session log, update confidence scores, and
review any items that need attention. This is optional but recommended
after substantial sessions.
