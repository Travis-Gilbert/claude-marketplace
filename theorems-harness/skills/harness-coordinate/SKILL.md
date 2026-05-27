---
name: harness-coordinate
description: Teach and run Theorem's Harness cross-agent coordination protocol. Use when Codex, Claude Code, Claude.ai, or another agent is working on the same repo/task and the user wants live coordination, mentions, presence, handoff, or a ping-like wait.
---

# Harness Coordinate

This skill teaches the behavioral protocol around the coordination tools. The
tools already exist; this skill makes agents use them predictably without
turning coordination into ceremony or global lane freezes.

`/coordinate` is the slash command. `harness-coordinate` is the skill/protocol
that command invokes. There should not be a separate public
`/harness-coordinate` command unless a host needs one for disambiguation.

## When To Use

Use this when:

- another agent is active on the same repo, branch, task, or workstream
- the user asks whether Claude/Codex can message each other
- an agent needs to ask another agent to validate, pause, avoid a file, or hand
  off a finding
- the user asks for "real-time" coordination

The UI is optional. The shared substrate is enough for headless communication:
presence says who is around, `coordinate` writes the message, `mentions` and
`mentions_wait` let an agent receive it.

The mental model is a room plus packet mail:

- durable room membership and pending mentions survive agent sleep
- `coordination_room` / `join_room` is the durable membership layer
- `subscribe` is the mention polling layer, not room ownership
- short-TTL presence only says who is fresh right now
- worktree targeting identifies the dirty checkout that matters
- file-level claims beat broad surface ownership

## Actor Names

Use stable, boring actor ids:

- `codex`
- `claude-code`
- `claude-ai`

If multiple sessions of the same actor are active, disambiguate in metadata with
`session_id`, `repo`, `branch`, `task`, and `files`, but keep the mention target
stable unless the user gives a more specific actor id.

## Worktree Targeting

Actor name is the channel, not ownership proof. For unpushed local work, target
the durable checkout identity instead: `target_session_id`, `target_worktree`,
`target_branch`, `target_head`, and `target_changed_files`. A targeted mention
is delivered only when the receiver polls with matching `session_id`,
`worktree`, `branch`, `head`, and a changed-file set that covers the target
files.

Use this when two sessions share an actor name or when you need the agent
holding a particular dirty worktree. Current plugin clients auto-advertise
their local `worktree` / `branch` / `head` / `changed_files` in presence,
mentions, and coordinate metadata; pass target fields explicitly when sending
to a specific unpushed checkout.

## Protocol

For implementation handoffs, prefer a shared goal plus negotiated ownership over
strict lane assignments. Claim the next files or subsystem you are actively
touching, then use peer review before commit to catch cross-agent mistakes.
Second mover yields only on the overlapping file or state boundary, not on the
entire product surface.

1. Heartbeat yourself:

```json
{
  "actor": "codex",
  "mode": "heartbeat",
  "surface": "codex",
  "ttl_seconds": 60
}
```

2. Join or inspect the durable coordination room when the task is shared:

```json
{
  "actor": "codex",
  "action": "join",
  "repo": "Index-API",
  "branch": "main",
  "task": "harness plugin rewrite",
  "lane": "skills-and-routing"
}
```

3. Subscribe to the mention channel:

```json
{
  "actor": "codex",
  "doc_id": "repo:flint-civic-atlas"
}
```

4. Check your inbox before touching shared files:

```json
{
  "actor": "codex",
  "consume": true,
  "limit": 20
}
```

5. Send messages with explicit `@actor` mentions:

```json
{
  "message": "@claude-code I am taking the plugin docs and MCP wrapper; please keep TTL work isolated to RustyRed.",
  "urgency": "ask",
  "target_worktree": "/Users/travisgilbert/Tech Dev Local/Creative/Website/Index-API",
  "target_branch": "claude/worktree-targeting",
  "target_changed_files": ["theorems-harness/skills/harness-coordinate/SKILL.md"],
  "metadata": {
    "repo": "flint-civic-atlas",
    "files": ["theorems-harness/skills/harness-coordinate/SKILL.md"]
  }
}
```

6. Wait only when a response is useful now:

```json
{
  "actor": "codex",
  "consume": true,
  "timeout_seconds": 30,
  "interval_seconds": 1
}
```

7. Write a continuity pack before compaction, handoff, or a long pause:

```json
{
  "actor": "codex",
  "summary": "What changed and what is true now.",
  "next_action": "The exact next step for the waking agent.",
  "trigger": "handoff"
}
```

8. End presence when supported:

```json
{
  "actor": "codex",
  "mode": "end",
  "surface": "codex"
}
```

If a surface does not support `mode="end"`, send a final heartbeat with
`status="done"` and a short TTL.

## Adaptive Harness Use

When `/harness` is active, coordination is one capability in the larger loop.
Use it at natural checkpoints:

- before overlapping edits
- after discovering another agent owns the same file
- when asking for validation or review
- when a blocker belongs to another session's worktree
- before commit/PR if the work was multi-agent
- before compaction, handoff, or long pause when a continuity pack would make
  resume safer

Do not wait just because a mention was sent. Send the packet, wait briefly only
when the answer changes the next immediate action, and otherwise continue with
the claimed bounded slice.

## Output Discipline

- Before making overlapping edits, state what files or subsystem you are taking.
- Use `urgency="block"` only when the other agent should stop or wait.
- Put file paths and repo names in metadata, not just prose.
- Consume mentions after reading them so the same ping does not keep reappearing.
- Summarize coordination in the final response only when it affected the work.
- If no agent answers within a short wait, proceed with the safest claimed slice
  and leave a durable packet for the sleeping agent.

## Reality Of "Real Time"

`mentions_wait` is long-polling, not host-level push. It feels like a ping when
an active agent calls it at checkpoints or after sending a message. It cannot
wake a suspended model turn by itself; the host still has to run the agent. It
also occupies one MCP request thread until it returns, so keep waits short
(`timeout_seconds=30`, maximum 120) and use checkpoints instead of permanent
listeners.
