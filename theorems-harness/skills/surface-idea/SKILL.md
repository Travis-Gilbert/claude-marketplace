---
name: surface-idea
description: Capture a non-blocking idea or improvement that arose during the current task as a structured memory atom, instead of letting it drop in chat. Auto-fires at end-of-task and on inline idea markers. Manual via /surface-idea.
---

# Surface Idea

When an agent notices a non-blocking improvement (`"we could also..."`,
`"would be cool if..."`, `"v2 candidate"`, `"missing capability"`, an
adjacency to the current task that is worth building later), capture it as
a structured idea atom in harness memory instead of letting it drop into
chat where it gets lost.

This skill exists because the 2026-05-24 launch-week run surfaced four
high-value ideas inside the `99-questions-and-deferrals.md` document
(I1-I4), the user blessed all four with `/encode`, and the only thing
preventing each future task from doing the same is that the action of
encoding an idea was discretionary rather than ritualized. This skill
ritualizes it.

## When to use

Use this skill when:

- Inside an active task, the agent identifies a tangentially-related
  improvement that would be worth doing later but is not in scope now.
- At end of any harness run, before final reporting (auto-trigger
  candidate, see below).
- The user asks "any ideas?", "what would you change about X", "anything
  worth following up", or similar prompts.
- The agent's deliberation contains an "idea-shaped" marker:
  `"Idea:"`, `"I1:"`, `"I2:"`, `"could also"`, `"would be cool"`,
  `"v2 candidate"`, `"worth following up"`, `"post-launch"`,
  `"future improvement"`.

Do NOT use this skill for:

- In-scope work. If the idea is part of what is being shipped right now,
  it goes in the plan tree as a checklist item, not in idea memory.
- Confirmed bugs. Bugs go through `/peer-review` (with finding severity)
  or directly into the bug tracker, not into idea memory.
- Vague hand-waves. If the agent cannot articulate why the idea is worth
  building, do not encode. Force the articulation.

## Automatic trigger

At the end of any harness run (Stop hook, or when an agent is about to
write a final report), run a scan over the run's event timeline and
chat output for idea-shaped markers. For each candidate found:

1. Extract the idea text and immediate surrounding context.
2. If confidence is high (clear "we should also X because Y" structure
   and X is actionable), auto-encode without asking.
3. If confidence is low or the idea body is vague, surface as a
   candidate to the user in the final report: "Surfaced 3 candidate
   ideas. Want me to encode any? [list]"

Automatic does NOT mean "block reporting forever waiting for user
input." The default is "auto-encode high-confidence ones; list
low-confidence ones in the report and move on."

## Manual

`/surface-idea "the idea text"` writes one idea atom immediately.

`/surface-idea --auto` runs the end-of-task scan now (useful mid-run
when the agent wants to flush surfaced ideas before a long task).

`/surface-idea --list` lists all idea atoms surfaced in the current
session.

## What gets captured

Each idea atom is encoded with:

```json
{
  "kind": "encode",
  "outcome": "positive",
  "signal": "pinned",
  "title": "Idea: <short noun phrase>",
  "content": "<idea body, 2-5 sentences explaining WHAT and WHY>",
  "summary": "<one-sentence headline>",
  "tags": [
    "idea",
    "surfaced",
    "source-task:<task_id_or_run_id>",
    "surfaced-from:<actor_id>"
  ],
  "metadata": {
    "auto_surfaced": true,
    "confidence": "high" | "medium" | "low",
    "source_marker": "<the phrase that triggered detection, if auto>"
  }
}
```

Ideas are observation memory, not training signal. If the user explicitly
blesses an idea (`/encode` in response to the idea, or "yes encode that" in
chat), record a linked feedback or decision memory. Do not imply that this
automatically trains a model.

## Output discipline

- Idea bodies should be SHORT (2-5 sentences). Long ones are plan
  candidates, not ideas; they belong in the plan tree.
- Always include WHY the idea is worth building, not just WHAT. The
  "why" is what makes the idea recallable later when context has
  faded.
- Tag with the source task / run id so a future agent can query
  "ideas surfaced from task X."
- Do NOT fabricate ideas. Only encode what the agent actually
  surfaced during the run. The auto-scan should produce a CANDIDATE
  list; the agent is the one that confirms each candidate is real.
- Do NOT auto-encode ideas marked with low confidence. Always surface
  those as candidates for explicit user/agent confirmation.

## Relation to other skills

- `/peer-review`: produces structured FINDINGS (correctness bugs, suggestions, validation gaps). DIFFERENT from ideas. A finding is "this code has an issue"; an idea is "we could build this thing."
- `/encode`: general-purpose memory writer. `/surface-idea` is a specialization that adds the auto-scan + source-task linkage + restrains the body shape.
- `/coordinate`: the negotiation channel between agents. Ideas surfaced during coordination should still flow through this skill, not get buried in coordinate threads.
- `/harness`: the canonical harness run command. The auto-trigger condition for this skill is "end of harness run before final report."

## Worked example (from launch-week-may-24 run)

The 2026-05-24 launch-week orchestration run produced four ideas during
the work that were captured manually in `99-questions-and-deferrals.md§I1-I4`:

- I1: Plan-tree-as-grounding becomes explicit orchestrate-skill step.
- I2: Peer-review writes its review as a queryable MemoryAtom.
- I3: Claim-the-unclaimed auto-yield (silence-as-consent) rule.
- I4: Use this run as the first launch-week soft-test report.

The user blessed all four with `/encode`. Without this skill, each
future run would have to re-invent the capture mechanism. With this
skill, the same four ideas would have been auto-encoded at end of
run with `confidence: high` (each had a clear "we should also X
because Y" structure and explicit grounding in the work just done).
The user's `/encode` would then add a linked, explicit feedback memory without
rewriting the original observation episode.

## Guardrails

- Do not encode the same idea twice in one session (content_hash check).
- Do not encode ideas that are restatements of what is already in the
  plan tree as a checklist item.
- Do not encode bug-shaped findings as ideas. Route those through
  `/peer-review` instead.
- Do not auto-encode when `confidence: low`. Surface as candidate
  only.

## Output shape (final report fragment)

When summarizing at end of a run, include an Ideas section:

```md
## Ideas surfaced this run

- **Auto-encoded** (high confidence):
  - <doc_id>: <title> — <one-line>
  - ...
- **Candidates** (need confirmation):
  - <source-marker>: <extracted idea text>
  - ...
```

If no ideas surfaced, omit the section entirely. Do not pad reports.
