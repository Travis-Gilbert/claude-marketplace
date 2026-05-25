---
name: encode
description: Use when the user runs /encode, marks a session result especially good or bad, wants to record a solution or postmortem, or when the agent should automatically preserve a durable learning in the harness memory substrate.
---

# Encode

Encode records feedback, solutions, preferences, and postmortems into the
shared Theorem harness memory substrate. It is both a user command and an
agent-owned memory primitive: the human can run `/encode`, and an agent may
trigger it when the session produces a durable lesson worth ranking later.

## What To Record

Use Encode for:

- user feedback that something was especially good, especially bad, or strongly
  calibrating
- explicit preference statements that should become training examples over time
- a solved bug or implementation pattern that had been in flux for a while
- a failed or successful training run that deserves a postmortem
- a root-cause discovery after repeated false starts
- a reusable coordination lesson between Claude Code, Codex, or another agent
- an explicit "remember this as a solution" or "record this as a postmortem"

Do not encode raw secrets, credentials, private tokens, or long copied logs.
Summarize sensitive evidence and link to local artifacts when appropriate.

## Tool Preference

Prefer the `encode` MCP tool when available.

Recommended shape:

```json
{
  "kind": "solution | postmortem | feedback | encode",
  "outcome": "positive | negative | mixed | neutral",
  "content": "Self-contained lesson or postmortem.",
  "reason": "Why this should shape future behavior.",
  "tags": ["repo-or-domain", "short-topic"],
  "auto_triggered": true,
  "training_weight": 1.0,
  "training_target": "personal_b | cohort_a | none"
}
```

Frame user-facing preference capture plainly: "you're training your own assistant." Parse these shorthands:

| User input | Meaning |
|---|---|
| `/encode positive ...` | Positive feedback, default `training_weight=1.0`. |
| `/encode negative ...` | Negative feedback, default `training_weight=1.0`. |
| `/encode preference "..."` | Preference memory, default `training_target=personal_b`. |

Use `training_target=none` when the note should be recallable but should not
feed LoRA/federated training. Use `training_target=cohort_a` only when the user
clearly wants the signal to participate in cohort-level aggregation.

If `encode` is unavailable, fall back to:

1. `self_note` with `memory_node_type="reflection"` or `"reasoning_record"`.
2. A memory fitness signal if available:
   - `pinned` for high-confidence positive lessons.
   - `reused` for verified solutions.
   - `contradicted` for harmful or incorrect prior behavior.
   - `cited` for neutral postmortems that should remain findable.

## Outcome And Signal

Keep outcome separate from memory quality:

| Field | Meaning |
|---|---|
| `outcome=positive` | The session behavior or result was good. |
| `outcome=negative` | The session revealed a failure, bad answer, broken run, or harmful pattern. |
| `outcome=mixed` | Useful learning with tradeoffs or incomplete validation. |
| `outcome=neutral` | Durable factual note without strong valence. |

Default signal mapping in the harness:

| Outcome | Default signal |
|---|---|
| `positive` | `pinned` |
| `negative` | `contradicted` |
| `mixed` | `cited` |
| `neutral` | `cited` |

Override `signal` when the memory's usefulness differs from the outcome. For
example, a failed training run can be `outcome=negative` but `signal=cited` if
the postmortem itself should remain easy to recall.

## Auto Trigger Rules

Agents may encode automatically when all are true:

- the lesson is specific enough to help a future session
- the content is self-contained without requiring hidden chat context
- the user would likely agree it is worth preserving
- no secrets or private data are included verbatim

When auto-triggering, keep the content concise and include why it matters. If
the user is actively waiting for code or a test result, do not interrupt with a
long memory report; encode quietly and mention it in the final summary.

## Output

Report the saved document id, kind, outcome, signal, and whether it was
auto-triggered. Include training target and weight when they are not the
defaults. If the tool is unavailable, report the fallback path used.
