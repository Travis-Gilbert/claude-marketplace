---
name: encode
description: The Harness memory-write capability. Use when the user runs /encode, when a session produces a durable lesson, or when an agent should preserve a feedback signal, solution, postmortem, decision, preference, or continuity pack into the shared harness memory substrate.
---

# Encode

Encode writes feedback, solutions, postmortems, decisions, preferences, and
continuity packs into the shared Theorem harness memory substrate. It is both
a user command (`/encode`) and an agent-owned primitive: an agent may trigger
it without prompting when the session produces a durable lesson worth ranking
later.

Related capabilities that also write memory but with different shapes:
`/surface-idea` for non-blocking idea atoms; `/peer-review` for review
findings; `self_note` for typed agent memory; `session_offload` for evicting
verbose intermediate context.

## When To Encode

Use Encode for:

- user feedback that something was especially good or bad
- explicit preference statements that should become training examples over
  time ("you're training your own assistant")
- a solved bug or implementation pattern that had been in flux
- a failed or successful run that deserves a postmortem
- a root-cause discovery after repeated false starts
- a coordination lesson between Claude Code, Codex, or Claude.ai
- a decision worth preserving across sessions
- a continuity pack: the compact handoff a future session needs to resume

Do not encode raw secrets, credentials, tokens, or long copied logs.
Summarize sensitive evidence and link to local artifacts when appropriate.

Do not encode in-scope work that belongs in the plan tree, vague hand-waves
without a "why," or bug-shaped findings that should flow through peer review.

## Tool Preference

Prefer the `encode` MCP verb. Shape:

```json
{
  "kind": "solution | postmortem | feedback | decision | continuity_pack | preference | encode",
  "outcome": "positive | negative | mixed | neutral",
  "content": "Self-contained lesson, postmortem, or continuity pack.",
  "reason": "Why this should shape future behavior.",
  "tags": ["repo-or-domain", "short-topic"],
  "auto_triggered": true,
  "training_weight": 1.0,
  "training_target": "personal_b | cohort_a | none"
}
```

Parse user-facing shortcuts:

| User input | Meaning |
|---|---|
| `/encode positive ...` | Positive feedback, default `training_weight=1.0`. |
| `/encode negative ...` | Negative feedback, default `training_weight=1.0`. |
| `/encode preference "..."` | Preference memory, default `training_target=personal_b`. |

Use `training_target=none` when the note should be recallable but should not
feed LoRA / federated training. Use `training_target=cohort_a` only when the
user clearly wants the signal to participate in cohort-level aggregation.

Fallbacks if `encode` is unavailable:

1. `self_note` with `memory_node_type="reflection"` or `"reasoning_record"`.
2. Memory-fitness signals: `pinned` for high-confidence positive lessons;
   `reused` for verified solutions; `contradicted` for harmful prior
   behavior; `cited` for neutral postmortems that should remain findable.

## Outcome And Signal

Outcome describes the session result. Signal describes the memory's
usefulness. They are independent.

| Outcome | Default signal | Use when |
|---|---|---|
| `positive` | `pinned` | The session behavior or result was good. |
| `negative` | `contradicted` | The session revealed a failure or harmful pattern. |
| `mixed` | `cited` | Useful learning with tradeoffs or incomplete validation. |
| `neutral` | `cited` | Durable factual note without strong valence. |

Override `signal` when the memory's usefulness differs from the outcome. A
failed training run can be `outcome=negative` + `signal=cited` if the
postmortem itself should remain easy to recall.

## Kinds

| Kind | When |
|---|---|
| `solution` | A verified fix or implementation pattern. |
| `postmortem` | An investigation of what went wrong and why. |
| `feedback` | A user signal that calibrates future behavior. |
| `preference` | A user-stated preference worth training future behavior on. |
| `decision` | A choice with rationale worth preserving. |
| `continuity_pack` | A compact handoff a future session needs to resume. |
| `encode` | General-purpose; use only when none of the above fit. |

`continuity_pack` is the first-class kind for SessionStart injection. Write
it when a long session is about to compact or a multi-agent task is about to
sleep. It carries the goal, current state, blockers, and next action in a
shape the next session can boot from.

## Auto-Trigger Rules

Agents may encode without prompting when all are true:

- the lesson is specific enough to help a future session
- the content is self-contained without requiring hidden chat context
- the user would likely agree it is worth preserving
- no secrets or private data are included verbatim

When auto-triggering, keep the content concise and include why it matters. If
the user is actively waiting on a result, do not interrupt with a long memory
report; encode quietly and mention it in the final summary.

## Output

Report the saved `doc_id`, `kind`, `outcome`, `signal`, and whether the write
was auto-triggered. Include `training_target` and `training_weight` when they
differ from defaults. If the tool was unavailable, report the fallback path
used. Keep it to a single line in normal reports; a full encode block belongs
only in postmortem reports.

## Anti-Patterns

- Encoding everything. Memory only stays useful when the bar for entry is
  high.
- Encoding bug-shaped findings as solutions. Route those through
  `/peer-review`.
- Encoding restatements of in-scope plan items.
- Encoding secrets, tokens, or raw API responses.
- Forgetting to set `kind=continuity_pack` when the memory's job is to boot
  the next session.
- Setting `training_target=cohort_a` without explicit user blessing.
