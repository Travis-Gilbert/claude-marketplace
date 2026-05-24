---
name: orchestrate-coordinate
description: Teach and run the cross-agent coordination protocol. Use when Codex, Claude Code, Claude.ai, or another agent is working on the same repo/task and the user wants live coordination, mentions, presence, handoff, or a ping-like wait.
---

# Orchestrate Coordinate

This skill teaches the behavioral protocol around the coordination tools. The
tools already exist; this skill makes agents use them predictably.

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

## Actor Names

Use stable, boring actor ids:

- `codex`
- `claude-code`
- `claude-ai`

If multiple sessions of the same actor are active, disambiguate in metadata with
`session_id`, `repo`, `branch`, `task`, and `files`, but keep the mention target
stable unless the user gives a more specific actor id.

## Protocol

1. Heartbeat yourself:

```json
{
  "actor": "codex",
  "mode": "heartbeat",
  "surface": "codex",
  "ttl_seconds": 60
}
```

2. Subscribe to the shared task or repo channel:

```json
{
  "actor": "codex",
  "doc_id": "repo:flint-civic-atlas"
}
```

3. Check your inbox before touching shared files:

```json
{
  "actor": "codex",
  "consume": true,
  "limit": 20
}
```

4. Send messages with explicit `@actor` mentions:

```json
{
  "message": "@claude-code I am taking the plugin docs and MCP wrapper; please keep TTL work isolated to RustyRed.",
  "urgency": "ask",
  "metadata": {
    "repo": "flint-civic-atlas",
    "files": ["production-theorem/skills/orchestrate-coordinate/SKILL.md"]
  }
}
```

5. Wait only when a response is useful now:

```json
{
  "actor": "codex",
  "consume": true,
  "timeout_seconds": 30,
  "interval_seconds": 1
}
```

6. End presence when supported:

```json
{
  "actor": "codex",
  "mode": "end",
  "surface": "codex"
}
```

If a surface does not support `mode="end"`, send a final heartbeat with
`status="done"` and a short TTL.

## Output Discipline

- Before making overlapping edits, state what files or subsystem you are taking.
- Use `urgency="block"` only when the other agent should stop or wait.
- Put file paths and repo names in metadata, not just prose.
- Consume mentions after reading them so the same ping does not keep reappearing.
- Summarize coordination in the final response only when it affected the work.

## Reality Of "Real Time"

`mentions_wait` is long-polling, not host-level push. It feels like a ping when
an active agent calls it at checkpoints or after sending a message. It cannot
wake a suspended model turn by itself; the host still has to run the agent.
