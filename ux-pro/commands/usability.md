---
description: Create usability test scripts or conduct heuristic evaluation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <feature-or-page>
---

# /usability

Create usability test scripts or conduct heuristic evaluations.

## Steps

1. Load the `usability-tester` agent from `agents/usability-tester.md`.
2. Determine the evaluation type from the user's input: usability test or heuristic evaluation. If unclear, ask the user.
3. **For usability tests:**
   a. Read `references/research-methods.md` and `references/ux-metrics.md`.
   b. Use `templates/usability-test-script/` for the deliverable format.
   c. Write realistic task scenarios as user goals, not feature instructions.
   d. Define success criteria per task: completion, time limit, error tolerance.
   e. Include a screener questionnaire, facilitator guide, introduction script, task list, follow-up probes, SUS questionnaire, and debrief script.
   f. Specify metrics to collect: task success rate, time on task, error count, SUS score, and qualitative observations.
4. **For heuristic evaluations:**
   a. Read `references/nielsen-heuristics.md`.
   b. Use `templates/heuristic-evaluation/` for the deliverable format.
   c. Evaluate the target against all 10 Nielsen heuristics.
   d. Rate each finding on the 0 to 4 severity scale.
   e. Provide specific, actionable recommendations with component references.
   f. Include an executive summary with total findings by severity.
5. If the user requests a cognitive walkthrough, define: persona, goal, and for each step evaluate: will the user try this action, will they notice the control, will they understand the feedback.
