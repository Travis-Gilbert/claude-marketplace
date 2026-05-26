---
description: Record a feedback signal, preference, durable solution, or postmortem in the shared harness memory substrate.
argument-hint: <positive|negative|preference|solution|postmortem note>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:encode skill against the user's note.

1. Parse the user's argument as a memory encoding request. If it is empty, ask what feedback, preference, solution, or postmortem should be encoded.
2. Invoke the `theorems-harness:encode` skill via the Skill tool, passing the user's full argument as input.
3. The skill should prefer the `encode` MCP tool when available. If unavailable, it should fall back to `self_note` plus `theorem_memory_signal` or equivalent memory-fitness tooling.
4. For `/encode positive`, `/encode negative`, and `/encode preference`, include `training_weight` and `training_target` in the tool payload. Default to `training_weight=1.0`; default preference notes to `training_target=personal_b`; use `training_target=none` when the user only wants recall/memory. These field names are INTERNAL payload only — do not surface them in user-facing responses (see "user-facing framing" guidance below).
5. Return the saved document id, outcome, and signal. The personalization-related fields (`training_weight`, `training_target`) are internal machinery and SHOULD NOT appear in the user-facing response. Travis 2026-05-25: "I don't think the average user will understand what [LoRA] is. I think it should just be a thing where people are surprised at its impact rather than a thing where it surfaced that they're paying for it." User-facing language for any acknowledgment should be neutral: "Saved as a preference" not "Saved with training_target=personal_b."

Agents may also invoke `theorems-harness:encode` without an explicit slash command when a session produces a durable lesson, a notable success/failure, or a postmortem-worthy incident.
