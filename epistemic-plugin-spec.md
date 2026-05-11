# Epistemic Plugin Architecture

## Turning Five Plugins into Independent Intelligent Systems

**Target Plugins:**
1. **django-design** (Travis-Gilbert/django-design) - 29 agents, Django/DRF/HTMX/Cotton/Alpine full-stack
2. **ux-pro** (Travis-Gilbert/Plugins-building/ux-pro) - 7 agents, research/IA/accessibility/service design
3. **ui-design-pro** (Travis-Gilbert/Plugins-building/ui-design-pro) - 6 agents, design theory + implementation
4. **ml-pro** (Travis-Gilbert/Plugins-building/ml-pro) - 5 agents, PyTorch/GNN/RL/transformers
5. **animation-pro** (Travis-Gilbert/Plugins-building/animation-pro) - 10 agents, motion/3D/creative/video

**Scope:** Each plugin becomes an independently intelligent epistemic engine that learns from every project it touches. These are NOT extensions of Theseus. They serve all projects and need their own ML-powered learning capabilities.

---

## Part I: What Each Plugin Carries Today (and What's Missing)

### Current Architecture (all five plugins)

```
plugin-name/
  .claude-plugin/plugin.json
  CLAUDE.md              # static prose instructions
  agents/*.md            # task-specific agent prompts (static)
  refs/                  # library source for grep verification
  commands/              # slash commands
  skills/                # sub-skill definitions
  templates/             # (some plugins) starter patterns
```

Every piece of knowledge is **frozen prose**. Django-design's django-architect agent has a 73-item checklist encoded as markdown. It doesn't know which items Travis hits most often, which projects trigger which patterns, or whether the "fat-models-thin-views" rule has ever been overridden intentionally.

### What Each Plugin Needs

| Capability | Current | Target |
|---|---|---|
| Domain knowledge | Static prose | Typed Claims with confidence, provenance, timestamps |
| Contradictions | Invisible | Explicit Tensions surfaced before decisions |
| Solution patterns | Flat template files | Methods with usage history, variants per project, success rates |
| Open unknowns | Not tracked | Questions auto-generated from low-confidence signals |
| User preferences | Not tracked | Preferences learned from accept/reject patterns |
| Cross-plugin links | Static "defer to X" prose | Semantic embeddings enabling similarity discovery |
| Relevance filtering | None (full CLAUDE.md loaded every time) | Neural scorer selecting relevant knowledge per task context |

---

## Part II: The Epistemic Layer

### 2.1 New Directory Structure

Each plugin gains a `knowledge/` directory:

```
plugin-name/
  knowledge/
    manifest.json          # schema version, stats, update log
    claims.jsonl           # typed propositions (append-only log + snapshot)
    tensions.jsonl         # competing claims, unresolved conflicts
    methods.jsonl          # solution patterns with usage history
    questions.jsonl        # open unknowns
    preferences.jsonl      # learned Travis-specific defaults
    embeddings.npz         # SBERT embeddings for all claims (numpy compressed)
    scorer_weights.json    # learned relevance scorer parameters
    session_log/           # per-session tracking (flushed between sessions)
      *.jsonl
```

JSONL (one JSON object per line) for append-friendly updates. The `.npz` file stores pre-computed embeddings so Claude Code can do similarity lookups at session start without running inference.

### 2.2 Primitive Schemas

**Claim**
```json
{
  "id": "django-claim-042",
  "text": "Use select_related for ForeignKey traversals in templates, prefetch_related for reverse relations and M2M",
  "domain": "django-design",
  "agent_source": "orm-specialist",
  "type": "best_practice",
  "confidence": 0.92,
  "source": "django-architect checklist + 14 observed sessions",
  "embedding_idx": 41,
  "first_seen": "2025-12-01",
  "last_validated": "2026-03-15",
  "evidence": {
    "accepted": 14,
    "rejected": 1,
    "modified": 2
  },
  "projects_seen": ["apply.thelandbank.org", "Index-API"],
  "tags": ["orm", "performance", "queryset", "templates"],
  "related_claims": ["django-claim-018", "ux-claim-009"]
}
```

Claim types: `best_practice`, `architectural_rule`, `preference` (Travis-specific), `empirical` (learned from usage), `inherited` (from external source), `heuristic` (probabilistic guidance).

**Tension**
```json
{
  "id": "django-tension-007",
  "claim_a": "django-claim-012",
  "claim_b": "django-claim-045",
  "description": "Fat-models-thin-views is the stated principle, but GCLBA portal views contain significant business logic for compliance workflow state transitions",
  "domain": "django-design",
  "status": "unresolved",
  "context_dependent": true,
  "context_note": "Compliance workflows may justify view-level orchestration when multiple models + external services are involved",
  "occurrences": 6,
  "first_seen": "2026-01-10",
  "resolution_attempts": [
    {
      "date": "2026-02-05",
      "approach": "Extracted to service layer",
      "outcome": "partially_adopted",
      "project": "apply.thelandbank.org"
    }
  ]
}
```

Tension statuses: `unresolved`, `resolved`, `context_dependent` (both claims valid in different contexts), `superseded`.

**Method**
```json
{
  "id": "django-method-011",
  "name": "HTMX partial with Alpine.js toggle state",
  "description": "Server-rendered partial via HTMX for data, Alpine for client-side UI state (dropdowns, modals, tabs)",
  "template_file": "templates/htmx-alpine-pattern.html",
  "usage_count": 11,
  "last_used": "2026-03-18",
  "avg_satisfaction": 0.88,
  "variants": [
    {
      "project": "apply.thelandbank.org",
      "modifications": "Added hx-headers for CSRF, inline Alpine.data() for form validation state",
      "commit": "abc123",
      "date": "2026-03-10"
    },
    {
      "project": "Index-API",
      "modifications": "Compose Mode split-pane: HTMX loads partial, Alpine manages pane resize state",
      "commit": "def456",
      "date": "2026-02-20"
    }
  ],
  "failure_modes": [
    "Alpine x-data scope doesn't survive HTMX swap unless hx-swap='innerHTML' targets a parent of the Alpine root"
  ],
  "tags": ["htmx", "alpine", "frontend", "partial"]
}
```

**Question**
```json
{
  "id": "ui-question-012",
  "text": "The polymorphic renderer philosophy is well-defined for collection views, but how should it apply to detail/single-item views where the content type is already known?",
  "domain": "ui-design-pro",
  "status": "open",
  "raised_by": "pattern_analysis",
  "raised_date": "2026-03-01",
  "related_claims": ["ui-claim-001", "ui-claim-023"],
  "related_tensions": ["ui-tension-002"],
  "priority": "medium"
}
```

**Preference**
```json
{
  "id": "pref-008",
  "text": "Prefers function-based views even for standard CRUD in Django",
  "domain": "django-design",
  "strength": 0.78,
  "distribution": {"alpha": 14, "beta": 4},
  "first_observed": "2025-12-01",
  "last_observed": "2026-03-15",
  "exceptions": [
    "Admin-adjacent views where ModelAdmin patterns dominate",
    "DRF ViewSets where class-based is the natural idiom"
  ],
  "projects": {
    "apply.thelandbank.org": {"accepted": 8, "rejected": 1},
    "Index-API": {"accepted": 6, "rejected": 3}
  }
}
```

### 2.3 Manifest

```json
{
  "schema_version": "1.0.0",
  "plugin": "django-design",
  "last_updated": "2026-03-21T14:30:00Z",
  "stats": {
    "claims": 87,
    "tensions": 12,
    "methods": 24,
    "questions": 15,
    "preferences": 11,
    "embedding_dim": 384,
    "scorer_accuracy": 0.82
  },
  "model_versions": {
    "embedder": "all-MiniLM-L6-v2",
    "scorer": "v3_2026-03-15"
  },
  "update_log": [
    {"date": "2026-03-15", "source": "session_flush", "claims_updated": 8, "new_claims": 2},
    {"date": "2026-03-10", "source": "git_analysis", "patterns_found": 3, "tensions_flagged": 1}
  ]
}
```

---

## Part III: The Learning System

This is where the plugins become genuinely intelligent rather than just well-organized.

### 3.1 In-Session Tracking

During a Claude Code session, a lightweight tracker records what happens. This does NOT require ML inference during the session. It is pure logging.

**What gets tracked:**
- Which agents were invoked
- Which claims from `knowledge/claims.jsonl` were consulted (by ID)
- What suggestions Claude Code made (keyed to file + line range)
- What the user accepted, rejected, or modified (observable via subsequent edits and commits)

**Session log entry format** (written to `knowledge/session_log/{timestamp}.jsonl`):

```json
{"event": "session_start", "project": "apply.thelandbank.org", "files_open": ["views.py", "models.py"], "timestamp": "2026-03-21T10:00:00Z"}
{"event": "agent_invoked", "agent": "orm-specialist", "trigger": "writing queryset", "timestamp": "..."}
{"event": "claim_consulted", "claim_id": "django-claim-042", "relevance_score": 0.89, "timestamp": "..."}
{"event": "suggestion", "id": "sug-001", "type": "code_pattern", "content_hash": "a1b2c3", "file": "views.py", "lines": [45, 52], "claim_refs": ["django-claim-042"], "timestamp": "..."}
{"event": "suggestion_outcome", "suggestion_id": "sug-001", "outcome": "accepted", "modifications": null, "timestamp": "..."}
{"event": "session_end", "duration_minutes": 47, "files_changed": ["views.py", "models.py", "admin.py"], "timestamp": "..."}
```

**How in-session tracking works in Claude Code:**

The CLAUDE.md instructs Claude Code to:
1. At session start, read `knowledge/manifest.json` and relevant claims
2. When consulting a claim, log the claim_id
3. When making a suggestion that draws on a claim, log the link
4. Before session ends (or on `/session-save`), write the session log

This is pure text file operations. No ML inference required during the session.

### 3.2 Between-Session Learning Pipeline

This is where the real intelligence lives. A Python script suite runs between sessions (manually via `/knowledge-update` command or on a cron).

**Pipeline stages:**

```
Session logs + Git diffs
        |
        v
  [1] Evidence Collector
  Reads session_log/*.jsonl + git log --diff
  Classifies: accepted / rejected / modified / abandoned
        |
        v
  [2] Confidence Updater (Bayesian)
  Updates Beta distributions on each claim
  Flags claims that dropped below threshold
        |
        v
  [3] Pattern Extractor (SBERT)
  Clusters similar code changes across sessions
  Proposes new Claims from repeated patterns
  Proposes new Methods from recurring solutions
        |
        v
  [4] Tension Detector
  Finds contradictory outcomes (same claim accepted in project A, rejected in project B)
  Finds competing claims with overlapping tags but opposite advice
        |
        v
  [5] Relevance Scorer Training (MLP)
  Trains a small neural network to predict:
    "Given (project, file_types, task_description, claim_embedding) -> relevance score"
  Uses session logs as training data (consulted + accepted = relevant, not consulted = irrelevant)
        |
        v
  [6] Embedding Update
  Re-embeds any new or modified claims
  Saves to embeddings.npz
        |
        v
  [7] Question Generator
  Flags low-confidence claims as questions
  Flags methods with low success rates
  Flags long-unresolved tensions
        |
        v
  [8] Cross-Plugin Linker
  Reads all plugins' claims.jsonl
  Finds semantic neighbors across plugin boundaries
  Updates related_claims fields
```

### 3.3 The ML Components (Detailed)

**Component 1: Bayesian Confidence (no neural network, pure math)**

Each claim's confidence is modeled as a Beta distribution:
- `alpha` = number of positive outcomes (accepted, validated)
- `beta` = number of negative outcomes (rejected, contradicted)
- `confidence = alpha / (alpha + beta)` (posterior mean)
- `uncertainty = 1 / (alpha + beta + 2)` (inversely proportional to total evidence)

New claims start at `alpha=2, beta=1` (prior belief: probably good, limited evidence).

Update rules:
- Accepted: `alpha += 1.0`
- Modified (partially accepted): `alpha += 0.5, beta += 0.3`
- Rejected: `beta += 1.5` (rejections are stronger signal)
- Not consulted but relevant to the task: `beta += 0.1` (weak negative signal that it wasn't useful enough to surface)

Temporal decay: Every 30 days without validation, `alpha *= 0.95, beta *= 0.95`. This shrinks the distribution toward the prior, meaning old unchallenged claims gradually lose certainty rather than staying frozen at high confidence.

**Component 2: SBERT Embeddings (pre-trained, no training required)**

Each claim's text gets embedded using `all-MiniLM-L6-v2` (384-dim, runs on CPU in <1ms per claim). Stored in `embeddings.npz`.

Used for:
- Finding semantically similar claims across plugins
- Clustering session suggestions to discover implicit patterns
- Input features for the relevance scorer

Pre-computation means Claude Code never needs to run SBERT during a session. It loads the `.npz` and does cosine similarity with numpy.

**Component 3: Relevance Scorer (small MLP, trained between sessions)**

Architecture:
```
Input: concat(claim_embedding[384], project_embedding[32], task_embedding[64]) = 480 dims
  -> Linear(480, 128) -> ReLU -> Dropout(0.3)
  -> Linear(128, 32) -> ReLU -> Dropout(0.2)
  -> Linear(32, 1) -> Sigmoid
Output: relevance probability [0, 1]
```

~62K parameters. Trains in seconds on CPU.

Training data comes from session logs:
- Positive: claim was consulted AND suggestion was accepted
- Negative: claim exists, is tagged for this domain, but was not consulted (or was consulted and rejected)
- Project embedding: learned 32-dim embedding per project (apply.thelandbank.org, Index-API, travisgilbert.me, etc.)
- Task embedding: TF-IDF of the file names and agent types involved in the session, projected to 64 dims

The scorer answers: "Of the 87 claims django-design carries, which 10 are most relevant right now?" This replaces the current approach of loading the entire CLAUDE.md every time.

Scorer weights saved to `scorer_weights.json` (serialized PyTorch state dict as JSON for portability).

**Component 4: Pattern Extractor (SBERT + HDBSCAN clustering)**

Runs on git diffs accumulated over multiple sessions:
1. Extract all code hunks from `git diff` for files in the plugin's domain
2. Embed each hunk with SBERT
3. Cluster with HDBSCAN (no need to specify k, handles noise)
4. For each cluster with 3+ members: propose a new Claim or Method
5. Human reviews proposals before they become active

This discovers patterns like: "Travis consistently adds `hx-headers='{"X-CSRFToken": csrftoken}'` to Alpine-managed forms" without anyone telling the plugin to look for that.

**Component 5: Cross-Plugin Semantic Linker**

Loads embeddings.npz from all five plugins. For each claim, finds the top-3 nearest neighbors in OTHER plugins by cosine similarity. If similarity > 0.75, creates a `related_claims` link.

This discovers connections like:
- django-design claim about "accessible form error messages" links to ux-pro claim about "error message pattern: what + why + fix"
- animation-pro claim about "prefers-reduced-motion" links to ux-pro accessibility-auditor claim about "WCAG 2.2 motion guidelines"

---

## Part IV: How Claude Code Uses the Knowledge Layer

### 4.1 Modified CLAUDE.md (template for all five plugins)

Add this section to each plugin's CLAUDE.md:

```markdown
## Epistemic Knowledge System

This plugin carries structured, evolving knowledge in `knowledge/`.

### Session Start Protocol

1. Read `knowledge/manifest.json` for current state.
2. Read `knowledge/scorer_weights.json` if it exists.
3. Based on the current project and open files, score all claims
   for relevance using the scorer (or fall back to tag matching
   if scorer is not yet trained).
4. Load the top 15-20 most relevant claims into active context.
5. Check `knowledge/tensions.json` for unresolved tensions in
   the active domain. If the current task touches a tension,
   surface it to the user BEFORE making a decision.
6. Check `knowledge/preferences.json` for Travis-specific
   defaults that override generic best practices.

### During Work

7. When your reasoning draws on a specific claim, note its ID
   in the session log.
8. When you make a suggestion, log which claims informed it.
9. When the user accepts, modifies, or rejects a suggestion,
   log the outcome.

### Session End Protocol

10. Write the session log to `knowledge/session_log/{timestamp}.jsonl`.
11. If you discovered something that contradicts an existing claim,
    note it in the session log as a tension signal.
12. If you noticed a pattern the knowledge base doesn't cover,
    note it as a candidate claim.

### Knowledge Priority Rules

- When a claim in knowledge/ conflicts with prose in this CLAUDE.md,
  check the claim's confidence. Above 0.8: the claim wins.
  Below 0.5: the prose wins. Between 0.5 and 0.8: surface the
  conflict to the user.
- Preferences always defer to explicit user instructions in the
  current session. Preferences inform defaults, not mandates.
- Tensions are information, not blockers. Surface them, let the
  user decide, log the decision.
```

### 4.2 Agent Integration Pattern

Each agent file gets a small addition at the top:

```markdown
## Knowledge-Aware Operation

Before executing your checklist/workflow:
1. Check knowledge/claims.jsonl for claims tagged with your domain
   keywords (this agent's tags: [orm, queryset, models, performance]).
2. If a claim contradicts your static instructions, and the claim's
   confidence > 0.8, follow the claim. It represents learned behavior.
3. If a method in knowledge/methods.jsonl matches the current task
   context (same project, similar file types), start from that method's
   variant rather than the generic template.
4. Log your work to the session log.
```

### 4.3 New Commands

Each plugin gains three new slash commands:

| Command | What it does |
|---|---|
| `/knowledge-status` | Shows claim count, avg confidence, unresolved tensions, open questions, scorer accuracy, days since last update |
| `/knowledge-update` | Runs the between-session learning pipeline (stages 1-8) |
| `/knowledge-review` | Surfaces the 5 lowest-confidence claims, 3 oldest unresolved tensions, and any auto-generated candidate claims for human review |

---

## Part V: Plugin-Specific Knowledge Seeds

### 5.1 django-design (estimated: 90+ claims)

**Richest sources for extraction:**
- `django-architect.md`: 73-item review checklist across backend, frontend, and cross-pillar checks. Each checklist item is 1-3 claims.
- `orm-specialist.md`: queryset patterns, N+1 prevention, annotation/aggregation rules
- `template-specialist.md`: Cotton component conventions, HTMX partial patterns, Alpine integration rules
- `drf-specialist.md`: serializer validation ordering, viewset routing, permission patterns
- CLAUDE.md rules section: 8 explicit rules, each a claim

**High-value tensions to seed:**
- Fat-models-thin-views vs. service-layer orchestration for complex workflows
- Cotton components vs. HTMX partials for reusable UI fragments
- Django forms vs. Alpine.js client-side validation
- DRF serializers vs. Django Ninja pydantic schemas

**Travis-specific preferences to seed (from memory):**
- Function-based views preferred over class-based for standard CRUD
- Cross-service slug references over ForeignKeys
- HTMX + Alpine for frontend interactivity over React/JS frameworks
- WhiteNoise for static files
- django-unfold for admin UI

### 5.2 ux-pro (estimated: 45+ claims)

**Richest sources:**
- `accessibility-auditor.md`: WCAG 2.2 AA requirements, ARIA patterns, keyboard rules
- `ux-writer.md`: error message pattern (what + why + fix), microcopy rules
- `information-architect.md`: navigation patterns, labeling conventions
- CLAUDE.md rules: 8 explicit rules covering form design, error messages, research citations
- Reference files: `nielsen-heuristics.md`, `laws-of-ux.md`, `wcag-22-design-guide.md`, `aria-patterns.md`

**High-value tensions:**
- Accessibility completeness vs. development velocity
- User research ideal (full usability study) vs. pragmatic heuristic evaluation
- Single-column form layout rule vs. complex multi-section forms
- Direct labeling vs. tooltip/hover patterns for data-dense interfaces

### 5.3 ui-design-pro (estimated: 60+ claims)

**Richest sources:**
- Polymorphic object rendering philosophy (core principle, multiple agent references)
- `design-critic.md`: principle violation detection rules
- `visual-architect.md`: layout and hierarchy planning rules
- `component-builder.md`: library selection, primitive composition rules
- `a11y-auditor.md`: WCAG 2.2 conformance rules (overlaps with ux-pro, cross-link)
- `animation-engineer.md`: motion patterns, spring physics, performance rules (overlaps with animation-pro)
- Two skills (design-theory, ui-engineering): each with its own reference library

**High-value tensions:**
- Polymorphic rendering complexity vs. development speed
- shadcn/ui composability vs. Radix direct usage
- CSS-first animation vs. Motion library for state transitions
- Tailwind utility classes vs. design token semantic classes

**Travis-specific preferences:**
- Polymorphic rendering is non-negotiable for heterogeneous content
- Studio-journal aesthetic: warm paper tones, terracotta, Courier Prime, rough.js
- Radix primitives preferred over alternatives for accessibility
- shadcn/ui v4 registry as component foundation

### 5.4 ml-pro (estimated: 50+ claims)

**Richest sources:**
- 5 agents: model-architect, training-engineer, ml-debugger, graph-engineer, systems-optimizer
- 6 reference files: pytorch-patterns, gnn-cookbook, transformers-patterns, training-craft, evaluation-deploy, advanced-systems
- 6 templates: train-loop, gnn-pipeline, fine-tune-lora, kge-pipeline, rl-agent
- CLAUDE.md rules: 10 explicit rules (shape comments, overfit-one-batch, gradient clipping, mixed precision, baseline comparison, checkpoint completeness, data verification, explicit imports)

**High-value tensions:**
- PyTorch Geometric vs. DGL for GNN work
- LoRA vs. full fine-tuning for small models
- Mixed precision benefits vs. numerical sensitivity in certain loss functions
- Complexity of R-GCN for heterogeneous graphs vs. simpler homogeneous approaches

**Travis-specific preferences (from Theseus work):**
- PyG over DGL
- RotatE for KG completion
- SBERT (all-MiniLM-L6-v2) as default sentence embedder
- Modal for GPU workloads, Railway for CPU production
- Two-mode contract: production (no PyTorch) vs. local/dev (full stack)

### 5.5 animation-pro (estimated: 40+ claims)

**Richest sources:**
- The Purpose Test (3-part filter: orientation, feedback, relationship)
- Tool Selection Framework (18-row decision table)
- 10 agents: motion-architect, spring-engineer, gesture-engineer, scroll-animator, scene-animator, camera-choreographer, creative-coder, physics-simulator, video-compositor, a11y-motion-auditor
- 4 skills: motion-craft, creative-animation, 3d-animation, production-motion

**High-value tensions:**
- Spring physics vs. duration-based animation (rule says springs, but some transitions need precise timing)
- CSS transitions (simple) vs. Motion library (powerful but heavier)
- Three.js direct vs. R3F for React projects
- Lottie (designer handoff) vs. code-driven animation (developer control)

**Travis-specific preferences:**
- NPR/sketch rendering as first-class concern in 3D
- rough.js for hand-drawn aesthetic
- D3-computes-positions / Three.js-renders-geometry (cardinal rule from three-pro)
- prefers-reduced-motion is non-negotiable

---

## Part VI: The Learning Scripts

### 6.1 File Manifest

```
codex-plugins/
  scripts/
    epistemic/
      __init__.py
      schema.py             # Pydantic models for all primitive types
      evidence_collector.py # Stage 1: session logs + git diffs -> evidence
      confidence_updater.py # Stage 2: Bayesian updates on claims
      pattern_extractor.py  # Stage 3: SBERT + HDBSCAN on code changes
      tension_detector.py   # Stage 4: contradiction and conflict finder
      relevance_scorer.py   # Stage 5: MLP training and inference
      embedding_manager.py  # Stage 6: SBERT embedding generation
      question_generator.py # Stage 7: flag low-confidence, propose questions
      cross_linker.py       # Stage 8: cross-plugin semantic neighbor search
      seed_knowledge.py     # One-time: extract claims from CLAUDE.md + agents
      run_pipeline.py       # Orchestrator: runs stages 1-8 in sequence
      config.py             # Paths, model names, hyperparameters
```

### 6.2 Dependencies

```
# requirements.txt for epistemic scripts
sentence-transformers>=2.2.0    # SBERT embeddings
torch>=2.0                       # MLP scorer + SBERT backend
hdbscan>=0.8.33                  # Pattern clustering
numpy>=1.24                      # Embedding storage and math
scikit-learn>=1.3                # TF-IDF for task embeddings, metrics
pydantic>=2.0                    # Schema validation
gitpython>=3.1                   # Git log and diff access
```

All CPU-only. No GPU required. The heaviest operation (SBERT embedding of ~100 claims) takes <2 seconds on a modern laptop.

### 6.3 Key Implementation Notes

**seed_knowledge.py:**
- Parses each CLAUDE.md and agent .md file
- Extracts imperative statements ("always X", "never Y", "prefer X over Y", "use X when Y")
- Extracts checklist items (numbered/bulleted items under review headings)
- Extracts table rows from decision tables (e.g., animation-pro's Tool Selection Framework)
- Outputs draft claims.jsonl for human review
- Does NOT auto-activate claims. All seeds start at `status: "draft"` and require manual promotion

**evidence_collector.py:**
- Reads `knowledge/session_log/*.jsonl` for all unprocessed sessions
- Reads `git log --since=<last_update> --diff-filter=M` for the project repos
- Matches suggestions to commits by file path + line range proximity
- Classifies outcomes: `accepted` (suggestion in commit), `modified` (partial match), `rejected` (suggestion not in commit), `abandoned` (file not committed at all)
- Outputs evidence records linked to claim IDs

**relevance_scorer.py:**
- Trains only when there are 50+ labeled examples (claim + context + outcome)
- Falls back to cosine similarity between claim embedding and task description embedding when scorer is not yet trained
- Retrains weekly or on `/knowledge-update`
- Saves weights as JSON (not pickle) for portability and inspectability
- Reports accuracy on held-out 20% of data

**cross_linker.py:**
- Loads all five plugins' embeddings.npz files
- For each claim, finds top-3 nearest neighbors in OTHER plugins
- Threshold: cosine similarity > 0.75
- Writes `related_claims` back to the source claim
- Also generates a cross-plugin report: which plugins have the most inter-connections, where are the coverage gaps

---

## Part VII: Implementation Order

### Sprint 1: Schema + Seeding Infrastructure (1 week)

**Deliverables:**
1. `scripts/epistemic/schema.py` with Pydantic models for all primitives
2. `scripts/epistemic/seed_knowledge.py` that extracts claims from markdown
3. `scripts/epistemic/config.py` with paths and hyperparameters
4. Run seeder on **django-design** (richest plugin, 29 agents)
5. Human review of seed output, promote good claims to active
6. Modified django-design CLAUDE.md with knowledge-loading protocol
7. Test: run a Django task in Claude Code with knowledge layer active

**Why django-design first:** 29 agents, most complex checklist system, most projects served (GCLBA portal + Index-API), most claim-dense.

### Sprint 2: Session Logger + Second Plugin (1 week)

**Deliverables:**
1. Session log format and writer (pure file I/O, no ML)
2. `/session-save` command definition for all plugins
3. Seed **ui-design-pro** (second most complex, polymorphic rendering philosophy)
4. Human review and promotion
5. Run 3-5 real sessions with both plugins, accumulate session logs

### Sprint 3: Evidence Collection + Bayesian Updates (1 week)

**Deliverables:**
1. `evidence_collector.py` (session logs + git diffs)
2. `confidence_updater.py` (Beta distribution updates + temporal decay)
3. `run_pipeline.py` stages 1-2
4. Seed **ux-pro** and **animation-pro**
5. Run pipeline on accumulated session logs, verify confidence updates make sense

### Sprint 4: Embeddings + Pattern Discovery (1 week)

**Deliverables:**
1. `embedding_manager.py` (SBERT encoding, .npz storage)
2. `pattern_extractor.py` (HDBSCAN clustering of code changes)
3. `tension_detector.py` (contradiction finder)
4. `question_generator.py`
5. Seed **ml-pro**
6. Run full pipeline stages 1-7

### Sprint 5: Relevance Scorer + Cross-Plugin Links (1 week)

**Deliverables:**
1. `relevance_scorer.py` (MLP training and inference)
2. `cross_linker.py` (semantic neighbor search across plugins)
3. Full pipeline stages 1-8
4. `/knowledge-status`, `/knowledge-update`, `/knowledge-review` commands for all five plugins
5. Cross-plugin report generation

### Sprint 6: Evaluation + Tuning (1 week)

**Deliverables:**
1. Measure: does the relevance scorer actually surface better claims than tag matching?
2. Measure: do sessions with the knowledge layer active produce fewer rejected suggestions?
3. Measure: are auto-generated tensions and questions actionable?
4. Tune: adjust confidence update rates, decay rates, scorer architecture if needed
5. Document: which parts of the system are working, which need iteration

---

## Part VIII: What This Enables (By Sprint)

### After Sprint 1
- Claude Code reads structured claims alongside prose
- Claims carry confidence scores; low-confidence advice is flagged
- Django-design knows its own knowledge gaps

### After Sprint 3
- Claims strengthen when accepted, weaken when rejected
- Stale knowledge decays over time
- Each session makes the next session marginally smarter

### After Sprint 5
- Neural scorer selects the most relevant 15-20 claims per task (from 50-90 total)
- Cross-plugin insights: "your animation accessibility approach should align with your ux-pro WCAG guidance"
- New patterns discovered from git history without manual encoding

### After Sprint 6
- Measurable improvement in suggestion acceptance rates
- Plugins that haven't been used recently honestly report their own uncertainty
- The system knows what it doesn't know (open questions auto-generated)
- Each plugin is a small, focused, self-improving expert

---

## Part IX: In-Session vs. Between-Session Learning

Travis asked about this directly. Here's the decision:

**In-session: tracking only, no inference.**
- Log what happens (agents invoked, claims consulted, suggestions made, outcomes observed)
- Pure file I/O, no ML libraries loaded, no latency impact
- The session log is the raw material for between-session learning

**Between-session: real ML processing.**
- Bayesian confidence updates (fast, CPU, <1 second for all claims)
- SBERT embedding of new/modified claims (fast, CPU, <2 seconds for 100 claims)
- HDBSCAN pattern clustering (fast, CPU, <5 seconds for 1000 code hunks)
- MLP scorer training (fast, CPU, <10 seconds for 500 training examples)
- Cross-plugin linking (fast, CPU, <3 seconds for 300 total claims)

**Why not in-session ML?**
1. Claude Code sessions are ephemeral. Updating weights mid-session risks inconsistency.
2. Loading PyTorch + SBERT adds 2-3 seconds to session start. Not worth it when pre-computed embeddings + scorer weights cover the need.
3. The feedback loop (suggest -> user acts -> git records -> evidence classified -> confidence updated) naturally spans session boundaries. Forcing it into a single session would require approximations that reduce accuracy.

**The one exception:** If a claim is explicitly contradicted during a session (Claude Code suggests X based on claim Y, user says "no, never do Y in this context"), the session log should flag this as a HIGH-PRIORITY tension signal so the next pipeline run processes it first.

---

## Part X: What NOT to Build

1. **No LLM-generated claims.** Claims come from code extraction, user behavior, and pattern clustering. Not from asking Claude to guess what good claims would be.

2. **No complex ontology.** Five types (Claim, Tension, Method, Question, Preference) are enough. If the system needs more, that signal comes from actual usage gaps.

3. **No real-time model serving.** The scorer runs between sessions and writes a static weights file. Claude Code reads weights at session start, does matrix multiply in numpy. No inference server.

4. **No plugin-to-plugin communication during sessions.** Cross-plugin links are computed between sessions. During a session, a plugin sees its own knowledge plus pre-computed cross-references. No runtime inter-plugin queries.

5. **No automatic claim activation.** All auto-generated claims (from pattern extraction) and auto-generated tensions start at `status: "draft"`. They require human review via `/knowledge-review` before affecting behavior. LLMs propose, humans review. Always.

---

## Part XI: Risk Assessment

| Risk | Signal | Mitigation |
|---|---|---|
| Knowledge bloat exceeds context window budget | Total token count of top-20 claims > 3K tokens | Enforce max 20 claims per session; summarize claim text to <50 words each |
| Scorer overfits to one project | Accuracy drops when switching from GCLBA to travisgilbert.me | Include project ID as feature; require minimum 5 sessions per project before project-specific scoring |
| Seeding is tedious and error-prone | Initial claim extraction quality is low | Invest in good seed_knowledge.py parser; accept that Sprint 1 seeds will need manual cleanup |
| Session logging adds friction | Claude Code sessions feel slower or more verbose | Keep logging invisible (no user-facing output from logging); use the existing session end as the flush point |
| Temporal decay kills valid knowledge | Good claims decay to low confidence just because they haven't been needed recently | Floor at 0.3 confidence from decay alone; only actual rejections can push below 0.3 |
| Cross-plugin links create noise | Too many weak cross-references | Require cosine similarity > 0.75 AND at least one shared tag for a link to be created |
| Pattern extractor proposes junk | HDBSCAN clusters random code changes | Require 3+ members per cluster AND human review of all auto-generated content |
