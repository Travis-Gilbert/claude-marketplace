---
name: harness-coordinate
description: Teach and run Theorem's Harness cross-agent coordination protocol. Use when Codex, Claude Code, Claude.ai, or another agent works on the same repo/task and the user wants coordination, shared intent, mentions, presence, handoff, or a ping-like wait. The model is a shared substrate the heads read and write, not a message bus they handshake over.
---

# Harness Coordinate

Two or more turn-based agents (codex, claude-code, claude-ai) working a shared
codebase. The user invokes each separately; no head has a continuous loop.

The protocol is **gossip over a shared substrate**, not handshakes over a bus.
Each agent reads the others' live state at turn-start, declares its own intent,
acts, and closes that intent with a handoff at turn-end. The other head reads
those records at its next turn-start and adapts. You do not ask permission and
wait for an ack. Negotiation happens only at a real fork.

This replaces the old "heartbeat, check inbox, mention, wait" loop. That loop
made every claim cost a round-trip, and every round-trip was paced by user
invocation cadence rather than by the agents. The substrate removes that cost.

## When To Use

- another agent is active on the same repo, branch, task, or workstream
- the user asks whether Claude / Codex can coordinate or message each other
- you are about to touch files another head may be editing
- you are handing off, pausing, or finishing multi-agent work
- the user asks for "real-time" coordination

## The model

| Primitive | Tool | Role |
|---|---|---|
| Intent | `write_intent` / `read_intents_for_room` | The spine. One live record per (room, actor): what you are doing now and which files you claim. Read others' at turn-start; write yours before you act; close it at turn-end as your handoff. |
| Room | `coordination_room` | Durable membership + the task. `status` to read; `start` / `join` to enter. Not a lane registry. |
| Presence | `presence` | Short-TTL liveness only. Says who is fresh right now. Not ownership. |
| Mention | `coordinate` + `mentions` / `mentions_wait` | The interrupt / fork channel. A specific head must see this now: a block ("stop, X is broken") or a real question whose answer changes your next step. Not the default channel. |

Read the substrate; do not poll an inbox for permission. Claim files in your
intent record, not in prose. Surface a fork as a message; do not freeze a lane.

## Actor Names

Stable, boring ids: `codex`, `claude-code`, `claude-ai`. If two sessions share
an id, disambiguate in metadata (`session_id`, `repo`, `branch`, `task`,
`files`) but keep the mention target stable unless the user gives a sharper id.

## Worktree Targeting

Actor name is the channel, not ownership proof. For unpushed local work, target
the durable checkout identity: `target_session_id`, `target_worktree`,
`target_branch`, `target_head`, `target_changed_files`. A targeted mention is
delivered only when the receiver polls with matching identity covering the
target files. Clients auto-advertise local `worktree` / `branch` / `head` /
`changed_files`; pass target fields explicitly to reach a specific dirty
checkout.

## The protocol, turn-shaped

### 1. Turn-start: read the substrate

Read what the other heads declared, before you plan your edits.

```json
// read_intents_for_room: who is doing what, which files they claim
{ "actor": "claude-code", "room_id": "harness-plugin-rebuild" }
```

```json
// mentions: drain only block / ask interrupts addressed to you
{ "actor": "claude-code", "consume": true, "limit": 20 }
```

Optionally `coordination_room` (`status`) for the task and membership, and
`presence` (`mode: "get"`) for liveness. Synthesize: does my planned work
overlap an active intent's `claimed_files`? Does it cut against an open fork?

### 2. Begin: write your intent

Declare what you are doing and which files you are touching. This is the claim.
It replaces stating a lane in prose and replaces asking "can I take X?".

```json
{
  "actor": "claude-code",
  "room_id": "harness-plugin-rebuild",
  "status": "working",
  "summary": "Rewriting the harness-coordinate skill to the gossip protocol.",
  "claimed_files": ["theorems-harness/skills/harness-coordinate/SKILL.md"],
  "expected_completion": "this session"
}
```

If your read in step 1 showed another head already claims a file you need,
yield on that file (second mover yields on the overlapping file only, not the
whole surface): claim the non-overlapping part, or open a fork (step 3) if the
overlap is structural.

### 3. During the turn: act; broadcast forks, do not handshake

Do the work. Only reach for a mention in two cases:

- **Block.** Something is broken and the other head must stop or wait. Send
  `coordinate` with `urgency: "block"` and an `@actor`.
- **Fork.** You disagree with a structural choice the other head made. Write a
  `coordination_tension` (the durable fork record: what you observed, why it is a
  fork, your proposed alternative) and keep working around it; do not freeze.
  Optionally `coordinate` with `urgency: "ask"` if a specific head should see it
  now. The tension records the disagreement for the user; it is not a permission
  ask, and it does not block the disagreed-with work.

```json
{
  "message": "@codex I am rewriting the skill spine to intent-first. If you are mid-edit on the same file, say so; otherwise I proceed and you redline on disk.",
  "urgency": "ask",
  "target_worktree": "/path/to/checkout",
  "target_changed_files": ["theorems-harness/skills/harness-coordinate/SKILL.md"],
  "metadata": { "room": "harness-plugin-rebuild", "files": ["theorems-harness/skills/harness-coordinate/SKILL.md"] }
}
```

For ordinary progress (a file landed, a test passed, a decision made), you do
not need a mention at all. Update your intent summary; the other head reads it
at its next turn-start.

### 4. Turn-end: close your intent (it is your handoff)

Rewrite your intent with `status: "done"` or `"paused"`, and put your handoff in
the summary: what changed, what is true now, what the next step is. The next
turn of either head reads this and resumes cold, with no "let me catch you up".

```json
{
  "actor": "claude-code",
  "room_id": "harness-plugin-rebuild",
  "status": "done",
  "summary": "Skill rewritten to gossip protocol; command tool-order fixed. Open: MCP wrappers for event/decision/tension/reflection, and turn-start substrate-read hook. Redline at rebuild-proposal.md.",
  "claimed_files": [],
  "expected_completion": "handoff complete"
}
```

Also write a `coordination_reflection` (working memory: what you are tracking,
what you are assuming, what is still open) so the next turn of either head picks
up cleanly. The closed intent is the claim; the reflection is the mental state.
A real architectural choice you made during the turn is a `coordination_decision`,
so the next turn inherits it instead of relitigating.

## When to actually send a mention

Send one only when the answer changes your immediate next action, or the other
head must stop. Otherwise do not. Specifically:

- before overlapping edits you could not deconflict from intents alone
- after discovering another head claims the exact file and state you need
- when a blocker belongs to another session's dirty worktree
- before a commit / PR if the work was genuinely multi-agent

Do not wait just because you sent a mention. Send it, keep working on the
non-blocked slice, and read the reply at your next checkpoint. Wait
(`mentions_wait`, `timeout_seconds` <= 30) only when you cannot proceed without
the answer.

## Tool surface

The substrate exposes the full five-kind gossip surface via MCP, plus the
mention / room / presence layer:

- spine: `write_intent`, `read_intents_for_room`
- audit / decisions / forks / working memory: `write_event` / `read_events_since`,
  `write_decision` / `read_decisions_since`, `write_tension` / `resolve_tension`
  / `read_open_tensions`, `write_reflection` / `read_reflections_for_room`
- interrupt / fork channel: `coordinate`, `mentions`, `mentions_wait`
- liveness / membership: `presence`, `coordination_room`, `subscribe`

The four non-intent kinds were wired into MCP recently and take effect on server
reload. All writes return compact receipts (the full record set is read on
demand), so emitting events or decisions does not bloat your context.

## Output discipline

- Claim files in your intent record, not in prose lane statements.
- `urgency: "block"` only when the other head should stop or wait.
- Put file paths and repo names in `metadata`, not just the message body.
- Consume mentions after reading so the same ping does not reappear.
- Close your intent at turn-end even on a short turn; a stale `working` intent
  with claimed files looks like a frozen lane to the other head.
- Summarize coordination in your final user-facing reply only when it shaped
  the work.

## Reality of "real time"

`mentions_wait` is long-polling, not host-level push. It feels like a ping when
an active head calls it at a checkpoint, but it cannot wake a suspended turn by
itself; the host still has to run the agent. It also holds one MCP request
thread until it returns, so keep waits short (`timeout_seconds` <= 30, max 120)
and prefer checkpoints over permanent listeners. The substrate is what makes
coordination feel continuous across sleeps: the records persist and are read at
the next turn-start, whether or not anyone was waiting.
