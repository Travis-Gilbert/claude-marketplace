---
description: Plan user research or select research methods.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <research-question-or-project-phase>
---

# /ux-research

Plan user research studies and select appropriate research methods.

## Steps

1. Load the `ux-researcher` agent from `agents/ux-researcher.md`.
2. Determine the current project phase from the user's input: discovery, definition, design, validation, or post-launch. If unclear, ask the user.
3. Read `references/research-methods.md` to identify candidate methods for the phase.
4. Recommend 2 to 3 research methods with rationale for each. Explain what each method will reveal, its cost and timeline, and participant requirements.
5. If the user requests a full research plan, use `templates/research-plan/` as the deliverable format. Include: research objectives, methodology, participant criteria, recruitment approach, study timeline, analysis plan, and ethical considerations.
6. If the user requests an interview guide, structure it as: introduction script, warm-up questions, core questions grouped by theme with probes, and closing script.
7. If the user requests a screener, write questions that filter for target participants without revealing the purpose of the study.
