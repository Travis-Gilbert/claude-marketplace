---
description: Create service blueprints or journey maps.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <service-or-experience>
---

# /service

Create service blueprints, journey maps, empathy maps, or JTBD analyses.

## Steps

1. Load the `service-designer` agent from `agents/service-designer.md`.
2. Read `references/service-design.md` for frameworks and methods.
3. Determine the deliverable type from the user's input: service blueprint, journey map (current or future state), empathy map, JTBD analysis, or opportunity solution tree. If unclear, ask the user.
4. **For service blueprints:**
   a. Use `templates/service-blueprint/` for the deliverable format.
   b. Map all five layers: physical evidence, customer actions, frontstage interactions, backstage interactions, and support processes.
   c. Draw the line of visibility between frontstage and backstage.
   d. Mark fail points (with recovery plans), wait points (with expected durations), and decision points (with branch conditions).
   e. Include time indicators for each phase from the customer perspective.
5. **For journey maps:**
   a. Use `templates/journey-map/` for the deliverable format.
   b. Define phases, user actions, thoughts, emotional curve (positive/neutral/negative), pain points, and opportunities.
   c. Include "before" and "after" phases, not just the core interaction.
   d. Identify moments of truth: interactions that disproportionately shape overall perception.
   e. Label assumptions explicitly when research data is unavailable.
6. **For empathy maps:**
   a. Structure into four quadrants: says (direct quotes), thinks (inferred beliefs), does (observed behaviors), feels (emotional states).
   b. Base on research data. Flag any quadrant that relies on assumptions.
7. **For JTBD analysis:**
   a. Structure job statements as: "When [situation], I want to [motivation], so I can [expected outcome]."
   b. Distinguish functional, emotional, and social jobs.
   c. Map the job timeline: first thought, passive looking, active looking, deciding, first use, ongoing use.
   d. Identify competing solutions.
8. **For opportunity solution trees:**
   a. Place the desired outcome at the root.
   b. Branch into opportunities discovered through research.
   c. Under each opportunity, list solution ideas.
   d. Under each solution, propose experiments to validate.
