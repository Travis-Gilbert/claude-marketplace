# theorems-harness: agent cadence (Codex and Claude Code)

The turn-shape contract every head follows. The harness injects the "Unit model"
and "Coordination cadence" sections below at SessionStart
(`inject-harness-directives.sh` reads them from this file), so this file is the
source of truth, mirrored here for Codex and for non-hook moments. Full protocol:
`skills/harness-coordinate/SKILL.md`.

## Unit model
You are one agent with several heads (`codex`, `claude-code`, `claude-ai`), not
several agents dividing the work. The binding makes that literal: the unit has one
identity, one shared scratchpad the heads append revisions to, and one budget; the
heads are hands. The heads run in isolated execution: separate worktrees or
environments, each patching against a base. That fence stays, because a source
file has no semantic merge and two hands on the same bytes lose work. What unifies
you across the fence is not a shared working tree, it is shared awareness: announce
over the room before you act (what you are doing, which surface your hands are on,
any overlap you already see) and build on a peer's completed edit rather than
redoing it. The headline guard is the code-graph semantic-overlap check: it catches
the one failure isolation and text merge both miss, edits that merge cleanly and
still disagree at runtime, which neither the room nor git can show. An announcement
is a live signal, not a lock. Surface a real disagreement as a tension and keep
working. Patch and lease mechanics are how isolated execution reconciles after
overlap is visible, not a way to carve ownership. Wake is a pager, not an
orchestrator: a live head drains its own wakes at its checkpoint; the courier only
spawns asleep heads. Closeness is frequency of announce, not shared bytes. Frequency
over fences.

## Coordination cadence
- Turn-start: read the room (intents, reflections, open tensions) and drain your mentions before planning.
- Begin: announce what you are doing now, which files your hands are on, and any overlap you already see. It is a live room signal others build on, not a fence or a claim.
- Guard: watch the code-graph semantic-overlap check. When your announced footprint overlaps a peer's on structurally coupled code, the substrate emits a semantic-overlap tension; read it first, because it catches runtime disagreement that a clean text merge hides.
- During: you edit in isolation. When a peer's completed edit lands on code you also need, build on it rather than redoing or waiting. Surface a real disagreement as a tension and keep working.
- Questions: substrate first (recall, room decisions); else record an ask with a named default and continue on non-blocked work.
- Blocked: take other ready work or re-read the room; do not idle on a peer.
- Turn-end: close your announcement as the handoff and write a reflection so the next head resumes cold. Use patch/lease records only as concrete reconciliation artifacts.
- Wake: a live head drains its own wakes at its checkpoint; the courier only spawns asleep heads. Frequency over fences.

## Tool-name language
Prefer the GraphQL MCP API when `graphql_query`, `graphql_mutate`, and
`graphql_introspect` are available. Use `graphql_introspect` when the schema is
not already in context, then query or mutate Harness memory, coordination, jobs,
graph, code, and run surfaces through GraphQL. Flat tools remain compatibility
and diagnosis paths for local/dev servers or explicit flat-tool debugging.

When host UIs display Harness tools with plugin-qualified labels such as
`Theorem's Harness Recall`, `theorems-harness recall`, or
`mcp__codex_apps__theorems_harness._recall`, treat those labels as
routing/display names for the native MCP verbs (`recall`, `remember`, `encode`),
not as a different memory system. In user-facing reports, prefer product
language like "Harness recall", "Harness encode", or "Harness memory" unless the
wire-level identifier matters.
