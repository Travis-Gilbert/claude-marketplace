# Context Theorem — Feature Reference

Context Theorem is the programmable harness that gives AI agents structured memory, orchestrated context, and a verifiable audit trail — across Claude, Codex, Gemini, and any LLM that can call an API.

This document covers what the harness does, organized by the problem each feature solves.

---

## 1. Harness Runs

The harness tracks every agent session as a **run** — a first-class object with an ID, a task description, an actor identity, scope metadata, and a full step history.

- **`harness.begin`** opens a new run, binding it to a task, actor (which agent/LLM is working), and scope (repo root, branch, commit, whether the tree is dirty).
- **`harness.get`** retrieves a run's current state.
- **`harness.step`** appends a typed step to the run's timeline. Steps are the atomic unit of the audit trail — every decision, search, context compilation, and outcome is a step.
- **`harness.transition`** advances the run through a state machine with typed events and state hashes before/after, making every state change tamper-evident.
- **`harness.events`** returns the full event log for a run.
- **`harness.state_hash`** returns the current cryptographic state hash — useful for verifying that nothing was mutated between transitions.
- **`harness.outcome`** records an outcome as a transition on the run — distinct from artifact-level outcome recording.
- **`harness.context_injected`** signals that compiled context was injected into an agent, recording the adapter and target.
- **`harness.patch`** supports controlled policy mutation during a run, with validation.

Runs are append-only by default. Every transition records a before/after state hash pair, so you can detect if anything was tampered with or replayed out of order.

## 2. Context Compilation

The core job: take a task description and a token budget, and produce a **context artifact** — a compressed, ranked, structured package of exactly the information an agent needs.

- **`context.compile`** takes a task, optional repo target, task type, and token budget. Returns a `ContextArtifact` containing ranked atoms (files, claims, postmortems, code symbols, tests, policies), a capsule with structured channels, actions, graph health scores, a stress test report, provenance metadata, and a token ledger showing compression ratios and savings.
- **`context.compile_stream`** does the same thing over SSE, streaming events as the compiler works. Useful for real-time UI feedback.
- **`context.estimate`** dry-runs compilation to estimate atom count and raw token cost without spending budget.
- **`context.remember`** stores a piece of context for later recall within or across runs.
- **`context.audit`** audits the context pipeline, returning diagnostic information about compilation decisions.

### Capsule Channels

The compiled context isn't a flat blob. It's organized into six channels, each with its own text, token count, atoms, and actions:

| Channel | What Goes In |
|---------|-------------|
| `system_invariants` | Hard constraints the agent must follow |
| `user_task` | The task description and user intent |
| `team_policy` | Operational policies for the team/project |
| `trusted_repo_memory` | Learned knowledge from the repo's history |
| `external_content` | Web docs, external references |
| `tool_outputs` | Results from prior tool calls |
| `suggested_actions` | Recommended next steps |

### Token Ledger

Every artifact carries a detailed accounting of where tokens went and where they were saved:

- Raw candidate tokens vs. capsule tokens
- Compression ratio
- Savings breakdown: compression, artifact cache hits, stage cache hits, tool schema deduplication, captured doc reuse, plugin method deduplication, compiler overhead, cache lookup cost
- Estimated net savings

## 3. Context Web

The Context Web is a graph-structured context retrieval system that goes beyond flat compilation. It returns atoms, edges between atoms, and scored paths — essentially a subgraph of relevant knowledge.

- **`harness.context_web`** — full context web pack for a run
- **`harness.context_web_mini`** — lightweight version for smaller budgets
- **`harness.context_web_review_delta`** — context focused on what changed (for code review)
- **`harness.context_web_research`** — research-oriented retrieval
- **`harness.context_web_browser_folio`** — context from browser session state
- **`harness.graphrag_context`** — GraphRAG-powered retrieval
- **`harness.context_web_spend_plan`** — previews how the budget would be allocated before committing
- **`harness.context_web_explain`** — explains why a specific atom was included or excluded, with policy traces

Each pack contains: atoms with citations and hydration levels, edges with relations and scores, paths through the graph, a token ledger, a spend plan, validation findings, and an evaluation comparing naive vs. context-web token usage.

### Context Web Index

Incremental index management for repos:

- Tracks commit SHAs, changed files, file hashes, symbol hashes
- Supports incremental updates (only re-index what changed)
- Graph state hashing for consistency verification

## 4. Orchestration

The orchestrator is the decision engine. Given a task, it selects the right profile, skills, agents, tools, validators, renderers, and compute backends — then explains why.

- **`client.orchestrate`** — full orchestration: runs the decision engine, compiles context, generates an action rail, recalls memory, and returns everything bundled with a harness run.
- **`client.orchestrate_preview`** — dry-run: returns the decision and toolkit without executing.
- **`client.orchestrate_prepare`** — returns the decision plus a full memory contract (evidence, operational policies, memory banks, recall policy, hydration handles) without executing.

These are top-level methods on the client, not namespaced.

### Orchestration Decision

Every orchestration produces a transparent decision record:

- Selected profile, pack, skill, agent, tool, validator, renderer, and compute backend IDs
- Rejected candidates with reasons
- Context plan (how tokens are budgeted across metadata, skill bodies, references, tool schemas, context artifacts)
- Risk summary: shell risk, network risk, data exposure risk, over-orchestration risk
- `why_selected` explanations per component
- Policies applied, user overrides honored, federated priors used

## 5. Memory System (User-Specific, Interoperable)

Memory is scoped to users and tenants, not to a specific LLM. The same memory works whether the agent is Claude, Codex, Gemini, or anything else that calls the API.

### Saved Contexts

Persistent, user-managed knowledge entries stored at the tenant level:

- **`product.saved_contexts.create`** — create a saved context with title, kind (note, policy, evidence, etc.), memory role, content, summary, and optional project scoping
- **`product.saved_contexts.update`** — modify any field
- **`product.saved_contexts.mute / activate / delete`** — lifecycle management
- **`product.saved_contexts.preview_recall`** — preview which saved contexts would be recalled for a given task, repo, mode, or profile

### Memory Patches

Runtime-generated memory that flows through a review pipeline:

- During a harness run, the system generates **memory patches** — proposed additions to the persistent memory
- **`product.memory_patches.review.list`** — queue of patches awaiting review, filterable by project and review status
- **`product.memory_patches.review.update`** — accept, reject, or promote a patch to a saved context
- **`product.saved_contexts.promote_memory_patch`** — promotes a reviewed patch directly into the saved context store

### Memory Contract (via Orchestrate Prepare)

The full memory state for a session, structured as:

- **Evidence** — immutable facts (source, kind, payload, rationale)
- **Operational Policy** — editable rules (scope, payload, rationale, status)
- **Memory Banks** — collections of memory grouped by kind and scope
- **Recall Policy** — which banks to query, scope filters, rationale
- **Recall Preview** — what the agent should read first, risks, do-not-do lists, next actions, hydration handles, recalled evidence

### Memory Policy Proposals

Agents can propose changes to operational policy during a run:

- Proposals carry source category, target category, proposed action, and promotion intent
- Policy patches can be queued for review or submitted directly
- The `harness.patch` endpoint supports controlled policy mutation with validation

## 6. Artifacts

Context artifacts have a full lifecycle beyond compilation:

- **`context.artifacts.list`** — query artifacts with filters
- **`context.artifacts.get`** — retrieve a specific artifact
- **`context.artifacts.export`** — export as signed JSON (with payload hash and signature), markdown, or PDF
- **`context.artifacts.fork`** — clone an artifact for branching explorations, preserving atom lineage
- **`context.artifacts.attach`** — bind an artifact to a harness run
- **`context.outcome`** — record what happened: agent used, whether accepted, tests passed, PR merged, user feedback, which atoms were cited or dismissed

### Signed Export

Artifacts can be exported with cryptographic signatures — the payload hash and signature fields enable verification that the artifact hasn't been modified since export. This is the foundation for auditable AI decision trails.

## 7. Harness Search

Structured search within a harness run's scope:

- **`harness.search`** — runs a scoped search with budget and session/folio binding, returns results and admission proposals (suggestions for what should be added to the knowledge graph)

## 8. Harness Fork, Replay, and Compare

Tools for branching and analyzing agent sessions:

- **`harness.replay`** — returns the ordered step history of a run, enabling playback
- **`harness.fork`** — creates a new run branching from a specific step in an existing run, optionally changing the actor
- **`harness.compare`** — diffs two runs, showing what diverged

These three together enable counterfactual analysis: fork a run at a decision point, try a different approach, compare outcomes.

## 9. Action Rail

A recommendation engine that generates ranked, scored actions for an agent to take:

- **`actions.generate`** — given a context command and perception bundle, generates up to N actions with categories, labels, descriptions, risk scores, confidence, and execution routes
- **`actions.preview`** — previews a specific action before execution
- **`actions.record_selected`** — records which action the agent (or user) chose, closing the feedback loop

## 10. Context Commands

A higher-level abstraction for resolving what context an agent needs:

- **`context_command.resolve`** — given a goal or query, user/session/folio/project IDs, current URL, selected text, open tabs, working set, exclusions, memory scope, graph layers, tool scope, retrieval policy, and risk mode — resolves the optimal context strategy
- **`context_command.get / preview`** — retrieve or preview a resolved command
- **`context_command.latest_folio.resolve / get`** — resolve context for the latest entry in a folio (browser session)

## 11. Theorem Hot Graph (THG)

A graph database interface for direct manipulation of the knowledge graph:

- **`thg.command`** — execute arbitrary THG commands (node CRUD, edge operations, graph algorithms)
- **`thg.cypher`** — run Cypher queries against the graph with parameterized inputs
- **`thg.profiles.install / resolve / toolkit / budget`** — manage learning profiles that control how the graph behaves for different task types
- **`thg.plugins.run_begin / run_step / claim_consult / outcome_record`** — plugin lifecycle within the graph
- **`thg.context_web.update_index`** — incremental index updates for repo tracking

## 12. Inference Engine

A pluggable inference layer for running epistemic computations:

- **`inference.registry`** — lists all registered inference kernels with their epistemic jobs, inference families, consumed views, produced outputs, truth types, validators, and writeback policies
- **`inference.expression.render`** — renders inference results through a specific engine
- **`inference.solver.context_capsule`** — runs a solver over a context capsule (SAT-style reasoning over context)

### Discovery Runs

Structured hypothesis testing:

- **`inference.discovery_runs.create`** — start a discovery run with an objective, hypothesis, action, and expected value
- **`inference.discovery_runs.append_validator_receipt`** — attach validation results from external validators
- **`inference.discovery_runs.finish / cancel`** — complete or abort
- **`inference.discovery_runs.review_writeback`** — review and approve/reject proposed writebacks to the canonical graph

Discovery runs produce: candidates, outcomes with validator receipts, writeback proposals, events, kernel runs, and a candidate archive. All append-only. Canonical graph mutations require explicit review.

### Kernel Runs

Lower-level inference execution:

- **`inference.kernel_runs.create`** — dispatch a kernel by ID, epistemic job, or inference family
- **`inference.kernel_runs.append_receipt`** — attach result receipts with writeback proposals
- Kernels produce typed results with receipt hashes for verification

## 13. Learning System

Adaptive behavior that improves across sessions:

- **`learning.profiles.install`** — install a learning profile for a specific domain
- **`learning.profiles.toolkit`** — get the recommended toolkit for a task type and permission set
- **`learning.context.spend_plan`** — optimize token budget allocation based on learned patterns
- **`learning.structural_signals.record`** — record structural signals (task signature, graph motifs, method used, validator results, token metrics) with privacy controls for cross-session learning

## 14. Product & Multi-Tenancy

Full product infrastructure for teams and organizations:

- **Tenants** — create, list, get, update organizations with billing plans, quotas, and configuration
- **Projects** — scoped workspaces within a tenant
- **API Keys** — tiered keys with per-hour quotas, capability flags (import, webhook, sessions), and usage tracking
- **Members** — role-based team membership (owner, member)
- **Usage** — detailed usage analytics by day, category, key, and project, with billing summaries and quota tracking
- **Bootstrap** — single-call initialization that returns the authenticated user's account, tenants, and access state

## 15. Codex Adapter

A turnkey integration for Claude Code / Codex:

- **`prepare_codex_bundle`** — one call that: detects repo metadata (git root, branch, HEAD, dirty state), begins a harness run, compiles context, exports markdown, and writes a `.theorem/` bundle with `current-run.json`, `current-artifact.json`, `current-context.md`, and a per-run trace directory
- **`begin_harness_bundle`** — lightweight version that opens a run without compiling context
- **`compile_run_context_bundle`** — compiles context for an existing run
- **`record_run_outcome`** — records outcomes back to both the artifact and the harness run

The adapter auto-detects git metadata and manages the `.theorem/` directory structure, making it trivial for any agent framework to participate in the harness lifecycle.

## 16. Dual SDK

The entire surface ships as both:

- **`theorem-context-ts`** — TypeScript/Node package
- **`theorem-context-py`** — Python package (Pydantic v2 models, async httpx)

Both implement identical APIs with full type safety. The Python SDK uses Pydantic models for request/response validation; the TypeScript SDK uses equivalent typed interfaces. Either can be used from any agent framework.

---

## Design Principles

**Append-only audit trail.** Runs, steps, events, and discovery runs are append-only with state hashing. You can always prove what happened and when.

**LLM-agnostic.** The harness doesn't care which model is driving. The actor field on runs and the adapter pattern mean Claude, Codex, Gemini, or a custom agent all participate in the same memory and orchestration layer.

**User-scoped memory.** Memory belongs to the user (via tenant), not to any specific LLM session. Saved contexts, memory patches, and operational policies persist across tools and providers.

**Token-aware everything.** Every compilation, context web pack, and orchestration decision carries a detailed token ledger. The system optimizes for information density per token, not just relevance.

**Verifiable.** Signed artifact exports, state hashes on transitions, receipt hashes on kernel results, and payload hashes on discovery writebacks. The harness produces a cryptographic trail, not just logs.
