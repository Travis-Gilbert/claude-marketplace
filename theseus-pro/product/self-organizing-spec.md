# Self-Organizing Engine: Five Feedback Loops

> Five loops that let the knowledge graph modify its own structure based on accumulated evidence and usage patterns.

## Overview

Self-organization is how Theseus moves from a system that processes knowledge
to a system that structures it. Each loop is a feedback cycle: the graph's
current state produces a signal, the signal triggers a structural change, and
the changed structure produces new signals on the next pass.

Invariant 12: "Feedback loops close one at a time, never all at once."

Implementation: `self_organize.py` in `apps/notebook/`.

## Loop 1: Auto-Classify

**What**: Infer Object types from graph context when the user doesn't specify.
A captured Note connected to 3 Sources via "supports" edges and containing
formal propositions is probably a Claim.

**Trigger**: Object captured without explicit type, or type review requested.
**Input**: Object text, connected edge types, neighbor types, NER entities.
**Output**: Suggested type with confidence score.
**Safety**: Suggestions only. Human confirms. (Invariant 7: LLMs propose, humans review.)

## Loop 2: Cluster-to-Notebook

**What**: When a community detection cluster becomes coherent enough, suggest
promoting it to a Notebook (or sub-Notebook). Organic structure becomes
explicit organization.

**Trigger**: Cluster exceeds coherence threshold + minimum object count.
**Input**: Community detection output, intra-cluster similarity, cluster label.
**Output**: Notebook creation suggestion with proposed name and member objects.
**Safety**: Preview function shows what would move. No auto-promotion.

## Loop 3: Entity Promotion

**What**: When a named entity (from adaptive NER) appears frequently across
multiple Objects, promote it to a first-class Object. Recurring concepts
become nodes in the graph.

**Trigger**: Entity frequency exceeds threshold across N+ distinct Objects.
**Input**: Entity mention count, span contexts, connected Objects.
**Output**: New Object of appropriate type with edges to all mentioning Objects.
**Safety**: Positive feedback loop (popular entities get promoted, promoted
entities get referenced more). Requires dampening coefficient to prevent
runaway growth.

## Loop 4: Edge Decay

**What**: Connections that are never engaged with (never clicked, never
referenced, never part of a Narrative) decay in strength over time.
Prevents the graph from becoming cluttered with stale connections.

**Trigger**: Periodic batch job (daily or weekly).
**Input**: Edge age, engagement count, last interaction timestamp.
**Output**: Reduced edge strength. Below threshold: soft-delete.
**Safety**: Negative feedback loop (stabilizing). Prevents runaway growth
from Loops 1-3. Exponential decay with configurable half-life. Currently
hand-tuned; Level 3 replaces with learned temporal memory (TGN).

## Loop 5: Emergent Type Detection

**What**: The system discovers new entity types and relation types that
aren't in the predefined schema. When Objects cluster by a pattern that
doesn't match existing types, propose a new type.

**Trigger**: Cluster analysis reveals coherent group with no matching type.
**Input**: Cluster members, shared features, edge patterns.
**Output**: Proposed new type with definition and membership rules.
**Safety**: Most dangerous loop. Requires highest confidence threshold.
Human review mandatory. See Level 4 (Emergent Ontology) for full spec.

## Orchestration

Two entry points in `self_organize.py`:

**`organize_batch(notebook)`**: Runs all active loops for a Notebook.
Called by RQ background task on schedule (daily). Processes loops in order
(1 through 5) so upstream results feed downstream loops.

**`periodic_reorganize()`**: Runs across all Notebooks. Triggered by
management command or scheduled RQ task. Includes cross-Notebook analysis
(entity promotion across Notebook boundaries).

## Safety Controls

**Thresholds**: Each loop has configurable activation thresholds in
`engine_config`. Default: conservative (high confidence required).

**Preview functions**: Every loop has a `preview_*` method that returns
what *would* change without making changes. Always run preview before
execution.

**Timeline events**: Every structural change creates an immutable Timeline
Node recording what changed, why, and which loop triggered it. Provides
full audit trail for self-organizing actions.

**Kill switches**: Each loop has an `is_active` flag in `engine_config`.
Default: inactive. Enable one at a time per the feedback loop control
pattern (see `PATTERNS-feedback-loop-control.md`).

**Dampening coefficients**: Positive feedback loops (1, 2, 3, 5) have
dampening parameters that limit the rate of change per cycle. Prevents
runaway amplification.
