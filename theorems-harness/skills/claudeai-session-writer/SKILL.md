---
name: claudeai-session-writer
description: Use on every substantive turn of a claude.ai conversation with Travis (or any operator who shares the harness substrate). Writes the turn's decisions, commitments, and architectural shifts into Commonplace through the harness MCP tools so Claude Code, Codex, and the next claude.ai session can read them. Closes the asymmetry where Claude Code/Codex get automatic lifecycle hooks but claude.ai relies on manual tool calls.
---

# Claude.ai Session Writer

The forcing function for claude.ai to participate in the cross-vendor
substrate. Claude Code's hooks fire automatically on every tool call
and write events into Commonplace; claude.ai has no equivalent
lifecycle hook, so participation requires deliberate per-turn tool
calls. This skill makes that deliberate behavior the default.

## When To Use

**On every substantive turn.** A turn is substantive if any of these
are true:

- A decision was made (architectural choice, scope decision, library
  pick, design direction)
- A commitment was made (the user agreed to ship X, the user
  authorized work on Y)
- A new tension was named (something the user disagreed with, a
  contradiction surfaced between two prior beliefs)
- A durable lesson emerged (a failure pattern, a successful pattern,
  a calibration the user gave)
- A handoff to another agent was implied (the user said they'd send
  this to Claude Code or Codex, or asked you to coordinate with
  another agent)
- The user said "remember this" / "encode this" / "this is important"

**Not substantive:** small talk, clarifying questions that didn't
yield a decision, restating what the user already said without
adding to it.

## What To Write

Per turn, write **one record per kind** that fired. Most turns
produce one or two records; a heavy planning turn may produce three
or four. Do not flood the substrate with low-signal records — the
admission rule is "would the next session want to know this?"

The four kinds map to existing harness tools:

| Kind | Tool | Use when |
| --- | --- | --- |
| Decision | `coordinate` (or `theorem_document_write` for longer rationale) | A choice was made between two or more options |
| Lesson / postmortem | `encode` | A durable insight emerged (good or bad) |
| Cross-agent mention | `coordinate` with `@claude-code` or `@codex` in the message | The user wants another agent to know |
| Personal note | `self_note` | Something only THIS conversation's continuity needs (less urgent than encode) |

## How To Write

### Decision

```
coordinate(
  message="@claude-code The decision from this turn: <one-paragraph summary of the decision, the alternatives considered, and the rationale>",
  title="<short noun phrase>",
  urgency="info",
)
```

The `@claude-code` (or `@codex`) mention queues the decision into the
target agent's next-session digest so they see it as a pending mention.

### Lesson / postmortem

```
encode(
  kind="solution" | "postmortem" | "feedback",
  outcome="positive" | "negative" | "mixed" | "neutral",
  auto_triggered=true,
  title="<short title>",
  summary="<1-2 sentence summary>",
  content="<full content including context, what happened, what was learned>",
  tags=["<tag1>", "<tag2>"],
  signal="<one-token signal>",
  reason="<why this fires the encode threshold>",
)
```

Set `auto_triggered=true` because this skill makes the encode
non-interactive — the user didn't run `/encode` explicitly.

### Cross-agent mention without a decision

When the user wants the OTHER agent to do something but no decision
was reached in THIS turn:

```
coordinate(
  message="@codex <imperative ask, including context the other agent needs>",
  title="<short title>",
  urgency="ask",
)
```

Use `urgency="ask"` when the other agent should respond before
proceeding; `urgency="info"` when it's a heads-up; `urgency="block"`
only when the other agent should pause work entirely.

### Personal note (current-session continuity only)

```
self_note(
  kind="self_note",
  memory_node_type="belief" | "observation" | "intention",
  title="<short title>",
  content="<what to remember for the next claude.ai session>",
  tags=["<tag1>"],
)
```

Use this when the content is specific to ongoing claude.ai
conversations and doesn't need cross-agent visibility.

## SessionStart Companion

At the very first turn of a new claude.ai conversation with Travis,
before responding to the first message, call:

```
orchestrate_map()
recall(query="<the first user message>", limit=5)
mentions(actor="claude-ai")
```

This pulls the current substrate state (pending decisions, peer
intents, recent reflections) so the first response reflects what the
substrate currently believes — not what userMemories last summarized.
The harness skill prescribes this pattern; this skill makes it
binding on every Travis-context conversation, not just ones with
explicit memory triggers.

## Examples

### Example 1: Architectural decision in turn

The user says "Let's go with Option B." Previous turns had laid out
Options A, B, C with trade-offs.

```
coordinate(
  message="@claude-code Decision: implementing Option B (bisected query routing) for fractal expansion. Rationale: idea-side and code-side retrieval are routed to separate engines with explicit attribution at merge. Alternatives considered: A (parallel lane), C (weighted fusion). Rejected A because it doesn't suppress code-class density bleed; rejected C because it keeps two retrieval modes mixed in one ranked list.",
  title="Option B for fractal expansion: bisected routing",
  urgency="info",
)
```

### Example 2: Failed approach lesson

A user tried to use the rerank stage to discriminate between code and
idea candidates; it didn't work. The user moved on.

```
encode(
  kind="postmortem",
  outcome="negative",
  auto_triggered=true,
  title="Reranker cannot discriminate code vs idea candidates downstream",
  summary="Tried weighting at rerank instead of routing at retrieval; the mixed candidate stream poisoned the discrimination.",
  content="Approach: ran fractal expansion with weighted gap_score = raw_score * (1 - code_likeness). Failure mode: the reranker still sorted by combined score, code candidates dominated top-K. Lesson: discrimination must happen at the retrieval LANE level, not the SCORE-COMPOSITION level. Routing at the source is the only fix.",
  tags=["fractal-expansion", "reranker", "lesson", "discrimination"],
  signal="rerank_cant_discriminate_post_hoc",
  reason="durable design lesson about where in the pipeline discrimination must happen",
)
```

### Example 3: Cross-agent handoff

The user says "Send this to Claude Code so they can ship it."

```
coordinate(
  message="@claude-code Travis is handing off the Slice 2 (community suppression) work. Context: Slice 1 already shipped (commit b4a099c5) — compute_code_weight returns a CodeWeightDecision; the orchestrator just needs to consume it in _gap_walk_candidates to filter source_system='codebase' Objects from the community pool when code_weight < 0.3. See docs/plans/fractal-expansion-corpus-routing/README.md for the full slice list.",
  title="Slice 2 handoff: community suppression",
  urgency="ask",
)
```

## What NOT To Do

- **Don't flood the substrate.** One encode per turn maximum unless
  multiple genuinely-distinct kinds fired. A turn that contains both
  a decision AND a postmortem can produce both; a turn with one
  decision should produce one record.
- **Don't paraphrase the user back into the substrate.** If the user
  said something verbatim that should be carried forward, quote it
  in the content; don't rewrite it.
- **Don't write the conversation transcript.** The substrate stores
  receipts, not transcripts. Each record should be self-contained and
  readable in isolation.
- **Don't skip the call because "the user knows."** The substrate
  serves the OTHER agents and the NEXT claude.ai session, not the
  current user. If the next session would benefit, write it.

## Verification

After writing, the substrate's response carries a `doc_id`. Mention
it briefly in your turn's reply so the user knows the write landed:
"Encoded as `<doc_id>` for the next session." This is a one-line
confirmation, not a wall of text.

## Why This Exists

The lifecycle-hook asymmetry between Claude Code and claude.ai is
mechanical, not architectural. Claude Code's hooks fire on every tool
call because the harness wraps them. Claude.ai has no equivalent
wrapper, so participation in the substrate is opt-in per turn. This
skill is the opt-in policy: make it the default, lean toward writing
when in doubt, and the substrate populates from claude.ai the same
way it does from Claude Code.

The day the substrate has claude.ai writes alongside Claude Code +
Codex writes is the day "one memory across claude.ai, Claude Code,
Cursor, Codex" stops being an aspiration and becomes the operating
state.
