---
description: Record a feedback signal, preference, durable solution, or postmortem in the shared harness memory substrate.
argument-hint: <positive|negative|preference|solution|postmortem note>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:encode skill against the user's note.

1. Parse the user's argument as a memory encoding request. If it is empty, ask what feedback, preference, solution, or postmortem should be encoded.
2. Invoke the `theorems-harness:encode` skill via the Skill tool, passing the user's full argument as input.
3. Prefer GraphQL `rememberMemory(input)` with `input.outcome`; use flat `encode` only when GraphQL is unavailable or under compatibility diagnosis. If neither write path exists, fall back to `self_note` and report the different shape.
4. Map `/encode positive` to `outcome=positive, signal=pinned`; map `/encode negative` to `outcome=negative, signal=contradicted`; map `/encode preference` to GraphQL `kind=preference`, or flat `kind=feedback` plus a `preference` tag.
5. Return the saved document id, kind, outcome, signal, admitted project, and provenance. Do not claim that the memory write trained or federated a model without a separate registered capability and receipt.

Agents may also invoke `theorems-harness:encode` without an explicit slash command when a session produces a durable lesson, a notable success/failure, or a postmortem-worthy incident.

Apply `references/MEMORY_CAPABILITY.md` for the GraphQL-to-flat mapping,
tenant/project isolation, opt-out, episode provenance, deduplication, and
practice-promotion guardrails.
