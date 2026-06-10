---
name: harness-coordinate
description: Teach and run Theorem's Harness cross-agent coordination protocol. Use when Codex, Claude Code, Claude.ai, or another head works the same repo/task and the user wants coordination, shared intent, mentions, presence, handoff, or a ping-like wait. The model is one agent with several heads sharing a scratchpad, coordinating by footprint over a shared substrate, not separate workers dividing files over a bus.
---

# Harness Coordinate

You are not several agents sharing a repo. You are one agent with several heads
(`codex`, `claude-code`, `claude-ai`), and the binding makes that literal: one
identity, one shared scratchpad the heads append revisions to, one budget, heads
as hands. Coordinate the way a unit does. Leave a clear footprint others build on,
and when two hands land on the same file, the later one builds on the earlier
one's edit. You do not own files, you do not step away from them, you do not wait
for an ack, and you do not split the task into lanes to keep your hands apart.

The transport is gossip over a shared substrate, not handshakes over a bus. Each
head reads the others' live state at turn-start, writes its own footprint, works,
and closes that footprint as a handoff at turn-end. The next head reads those
records and continues. That is what makes coordination feel continuous across
sleeps: the records persist and are read at the next turn-start, whether or not
anyone was waiting.

## When to use

- another head is active on the same repo, branch, task, or workstream
- the user asks whether the heads can coordinate or message each other
- you are about to touch files another head may be editing
- you are handing off, pausing, or finishing multi-head work

## The primitives

| Primitive | Tool | Role |
|---|---|---|
| Footprint | `coordination_intent` / `read_intents_for_room` | The spine. One live record per (room, head): what you are doing now and which files your hands are on. Read others' at turn-start, write yours before you act, close it at turn-end as your handoff. It marks where you are so others build on it; it is not a fence. |
| Room | `coordination_room` | Durable membership and the task. `status` to read, `start` / `join` to enter. |
| Presence | `presence` | Short-TTL liveness. Who is fresh right now. |
| Interrupt | `coordinate` + `mentions` | The block and fork channel. A specific head must see this now: something is broken, or a real disagreement changes the next step. Not the default channel. |
| Fork | `coordination_tension` | A durable record of a structural disagreement. Surface it and keep working; it does not block the disagreed-with work. |
| Memory | `coordination_reflection` / `coordination_decision` | Turn-end working memory and architectural choices the next head inherits. |

## The turn, in four beats

**1. Read the room.** Before you plan edits, read what the other heads left.

```json
// read_intents_for_room: who is doing what, which files their hands are on
{ "actor": "claude-code", "room_id": "harness-plugin-rebuild" }
```

```json
// mentions: drain block / fork interrupts addressed to you
{ "actor": "claude-code", "consume": true, "limit": 20 }
```

Also read open tensions and recent reflections / decisions when the task is live.
Synthesize: where are the other hands, and does anything I am about to do cut
against an open fork or a recorded decision.

**2. Leave your footprint.** Write what you are doing and where your hands are.
This replaces stating a lane and replaces asking "can I take X".

```json
{
  "actor": "claude-code",
  "room_id": "harness-plugin-rebuild",
  "status": "working",
  "summary": "Rewriting harness-coordinate to the unit model.",
  "claimed_files": ["theorems-harness/skills/harness-coordinate/SKILL.md"],
  "expected_completion": "this session"
}
```

(`claimed_files` is the tool's field name. Read it as "files my hands are on now,"
not a lock.)

**3. Work, and co-edit on overlap.** Do the work. If your read in beat 1 shows
another head's footprint on a file you also need, that is not a stop sign, it is
the parent revision. Read its footprint and read the file on disk, then build your
change on top of what is there. Held, not clobbered: you extend the latest state,
you do not revert it to make room for yours. If you think its edit is wrong, that
is a fork, not a license to silently overwrite: write a `coordination_tension`
with what you saw and your alternative, and keep moving. The scratchpad is the
model for this. Many heads append revisions to one document, each on the parent
before it.

**4. Close your footprint.** Rewrite your intent with `status: "done"` or
`"paused"`, and put the handoff in the summary: what changed, what is true now,
what the next step is. Write a `coordination_reflection` (what you are tracking,
assuming, leaving open) and a `coordination_decision` for any real architectural
choice, so the next turn of either head resumes cold with no catch-up.

```json
{
  "actor": "claude-code",
  "room_id": "harness-plugin-rebuild",
  "status": "done",
  "summary": "Coordinate skill rewritten to the unit model. Open: spine and execute word-level flips. Redline at COORDINATION-REDESIGN.md.",
  "claimed_files": [],
  "expected_completion": "handoff complete"
}
```

A stale `working` footprint with files still listed reads to the other head like
an abandoned hand on the keyboard, so close it even on a short turn.

## Do not divide the work to avoid overlap

The instinct to split a shared task into clean lanes (you take the chassis, I take
the brain) and minimize the interface between them is good engineering for
independent workers and the wrong move for one unit. It feels virtuous, which is
exactly why it slips past "do not claim files": splitting on a clean seam does not
look like avoidance, but it is, because it engineers away the overlap before any
co-editing can happen. The shared interface between your pieces is the coupling you
build together, not a seam to shrink so you can work apart. When you split on it,
each hand writes half of every contract blind to the other half, and you renegotiate
across a handshake the moment the halves do not meet. That renegotiation across
separated work is the world-model divergence this whole model exists to avoid.

So on a shared task small enough that one tight loop beats integration, which is
most tasks here, do not pre-assign lanes. Both hands work the same files in tight
succession, each reading the other's footprint and building on it. The overlap is
the point: it is where two heads catch each other's errors. Frequency over fences
means tighten the loop, not shrink the contact surface. Divide only genuinely large,
independent surfaces, and treat the urge to minimize the seam as the signal that you
are about to split work that should stay shared.

## When to send a mention

Send one only when the answer changes your immediate next action, or the other
head must stop. Two cases:

- **Block.** Something is broken and the other head should stop or wait.
  `coordinate` with `urgency: "block"` and an `@actor`.
- **Fork.** You disagree with a structural choice. Write the
  `coordination_tension`, and add a `coordinate` with `urgency: "ask"` only if a
  specific head should see it now.

Ordinary progress (a file landed, a test passed) needs no mention. Update your
footprint summary; the other head reads it next turn. Do not wait just because you
sent a mention: send it, keep working the non-blocked slice, read the reply at
your next checkpoint. Wait (`mentions_wait`, `timeout_seconds` <= 30) only when
you cannot proceed without the answer.

## Reaching a specific dirty checkout

Actor name is the channel, not proof of anything. For unpushed local work, target
the durable checkout identity (`target_session_id`, `target_worktree`,
`target_branch`, `target_changed_files`) so the mention reaches the right dirty
tree. Clients auto-advertise local `worktree` / `branch` / `head` /
`changed_files`. This is the one place targeting matters; default coordination
needs only the room.

## Reality of "real time"

`mentions_wait` is long-polling, not host push. It feels like a ping when a live
head calls it at a checkpoint, but it cannot wake a suspended turn by itself, and
it holds an MCP thread until it returns. Keep waits short and prefer checkpoints
over listeners. The wake courier (`theorem-receiver` wake mode) only spawns asleep
heads; a live head drains its own wakes. Frequency over fences.

## Output discipline

- Record where your hands are in the footprint, not in prose.
- `urgency: "block"` only when the other head should stop.
- Put file paths and repo names in `metadata`, not just the message body.
- Consume mentions after reading so the same ping does not reappear.
- Close your footprint at turn-end, every turn.
- Mention coordination in your final reply only when it shaped the work.
