# Shared Code CRDT Decision

## Decision

The harness plugin does not introduce a shared code CRDT buffer for agent
edits in this restructure.

## Rationale

- The current coordination substrate already has durable rooms, intents,
  mentions, reflections, decisions, tensions, patch receipts, proof receipts,
  and git worktree convergence.
- The useful product behavior is announce-over-room plus semantic-overlap
  detection before edits, followed by isolated patch/proof reconciliation when a
  concrete diff needs review.
- A shared code CRDT buffer would add another editing substrate without a pinned
  implementation contract, runtime oracle, or proven merge story for this plugin
  layer.

## Boundary

CodeCRDT-style work, including ideas from arXiv:2510.18893, can be revisited
only when a future spec names a concrete source, data model, merge oracle, and
host integration plan. Until then, do not model harness coordination as shared
`Y.Text` or another live code-buffer CRDT.
