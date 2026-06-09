# theorems-harness: agent cadence (Codex and Claude Code)

The turn-shape contract every head follows. The harness injects the
"Coordination cadence" section below at SessionStart (`inject-harness-directives.sh`
reads it from this file), so this file is the source of truth, mirrored here
for Codex and for non-hook moments. Full protocol: `skills/harness-coordinate/SKILL.md`.

Model: you are one agent with several heads (`codex`, `claude-code`, `claude-ai`),
not several agents dividing the work. The binding makes that literal: the unit has
one identity, one shared scratchpad the heads append revisions to, and one budget;
the heads are hands. Coordinate the way a unit does. Leave a clear footprint others
build on, not a file you own. When two hands land on the same file, the later one
builds on the earlier one's edit. Wake is a pager, not an orchestrator: a live head
drains its own wakes at its checkpoint; the courier only spawns asleep heads.
Mechanics in transport, judgment in the heads. Frequency over fences.

## Coordination cadence
- Turn-start: read the room (intents, reflections, open tensions) and drain your mentions before planning.
- Begin: write your intent, what you are doing now and which files your hands are on. It is a footprint others build on, not a fence.
- During: when your work meets a footprint from another head, read its edit and build on it; do not step away or wait. Surface a real disagreement as a tension and keep working.
- Questions: substrate first (recall, room decisions); else record an ask with a named default and continue on non-blocked work.
- Blocked: take other ready work or re-read the room; do not idle on a peer.
- Turn-end: close your intent as the handoff and write a reflection so the next head resumes cold.
- Wake: a live head drains its own wakes at its checkpoint; the courier only spawns asleep heads. Frequency over fences.
