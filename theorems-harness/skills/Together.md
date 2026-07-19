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
one's edit. You do not own files, you do not yield them, you do not wait for an ack.

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
| Fork | `coordination_record` (`record_type: "tension"`) | A durable record of a structural disagreement. Surface it and keep working; it does not block the disagreed-with work. |
| Memory | `coordination_record` (`record_type: "reflection"` / `"decision"`) | Turn-end working memory and architectural choices the next head inherits. |

## The turn, in four beats

**1. Read the room.** Before you plan edits, read what the other heads left.

```json
// read_intents_for_room: who is doing what, which files their hands are on
{ "actor": "claude-code", "room_id": "harness-plugin-rebuild" }
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
  "footprint": ["theorems-harness/skills/harness-coordinate/SKILL.md"],
  "expected_completion": "this session"
}
```

(`footprint` means "files my hands are on now," not a lock. The tool still
accepts the legacy `claimed_files` name.)

**3. Work, and co-edit on overlap.** Do the work. If your read in beat 1 shows
another head's footprint on a file you also need, that is not a stop sign, it is
the parent revision. Read its footprint and read the file on disk, then build your
change on top of what is there. Held, not clobbered: you extend the latest state,
you do not revert it to make room for yours. If you think its edit is wrong, that
is a fork, not a license to silently overwrite: write a tension record
(`coordination_record`, `record_type: "tension"`) with what you saw and your
alternative, and keep moving. The scratchpad is the
model for this. Many heads append revisions to one document, each on the parent
before it.

**4. Close your footprint.** Rewrite your intent with `status: "done"` or
`"paused"`, and put the handoff in the summary: what changed, what is true now,
what the next step is. Write a reflection record (what you are tracking,
assuming, leaving open) and a decision record for any real architectural
choice — both via `coordination_record` — so the next turn of either head
resumes cold with no catch-up.

```json
{
  "actor": "claude-code",
  "room_id": "harness-plugin-rebuild",
  "status": "done",
  "summary": "Coordinate skill rewritten to the unit model. Open: spine and execute word-level flips. Redline at COORDINATION-REDESIGN.md.",
  "footprint": [],
  "expected_completion": "handoff complete"
}
```

A stale `working` footprint with files still listed reads to the other head like
an abandoned hand on the keyboard, so close it even on a short turn.

## When to send a mention

Send one only when the answer changes your immediate next action, or the other
head must stop. Two cases:

- **Block.** Something is broken and the other head should stop or wait.
  `coordinate` with `urgency: "block"` and an `@actor`.
- **Fork.** You disagree with a structural choice. Write the tension record,
  and add a `coordinate` with `urgency: "ask"` only if a specific head should
  see it now.

Ordinary progress (a file landed, a test passed) needs no mention. Update your
footprint summary; the other head reads it next turn. Do not wait just because you
sent a mention: send it, keep working the non-blocked slice, read the reply at
your next checkpoint. There is no long-poll wait tool; when you truly cannot
proceed without the answer, say so in the ask and check `mentions` at your next
natural stopping point.

## Reaching a specific dirty checkout

Actor name is the channel, not proof of anything. For unpushed local work, target
the durable checkout identity (`target_session_id`, `target_worktree`,
`target_branch`, `target_changed_files`) so the mention reaches the right dirty
tree. Clients auto-advertise local `worktree` / `branch` / `head` /
`changed_files`. This is the one place targeting matters; default coordination
needs only the room.

## Reality of "real time"

There is no long-polling wait tool and no host push into a suspended turn.
Delivery is checkpoint-shaped: a mention with urgency ask or block lands on the
target head's mention and wake path, the wake courier (`theorem-receiver` wake
mode) spawns asleep heads, and a live head drains its own wakes by reading
`mentions` at its next checkpoint. Prefer checkpoints over listeners.
Frequency over fences.

## Output discipline

- Record where your hands are in the footprint, not in prose.
- `urgency: "block"` only when the other head should stop.
- Put file paths and repo names in `metadata`, not just the message body.
- Consume mentions after reading so the same ping does not reappear.
- Close your footprint at turn-end, every turn.
- Mention coordination in your final reply only when it shaped the work.
