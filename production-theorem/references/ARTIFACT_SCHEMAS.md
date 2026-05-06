# Artifact Schemas

## PlanningArtifact

```json
{
  "kind": "PlanningArtifact",
  "title": "",
  "current_condition": "",
  "intent": "",
  "goal": "",
  "production_definition_of_done": "",
  "checklist": [
    {
      "id": "PT-001",
      "task": "",
      "codebase_grounding": [],
      "agent_or_skill_route": "",
      "acceptance_criteria": [],
      "validation": [],
      "risk": "",
      "status": "planned"
    }
  ],
  "epistemic_ledger": {
    "claims": [],
    "evidence": [],
    "assumptions": [],
    "tensions": [],
    "gaps": [],
    "decisions": []
  },
  "deferrals": []
}
```

## ExecutionReport

```json
{
  "kind": "ExecutionReport",
  "title": "",
  "final_condition": "",
  "goal_status": "done|partial|blocked|failed",
  "checklist_reconciliation": [
    {
      "id": "PT-001",
      "status": "done|partial|blocked|skipped",
      "evidence": [],
      "tests": [],
      "notes": ""
    }
  ],
  "changes_made": [],
  "tests_run": [],
  "incomplete_items": [],
  "new_findings": [],
  "next_steps": [],
  "compound_engineering_effect": []
}
```

## TheoremBrief

```json
{
  "kind": "TheoremBrief",
  "title": "",
  "current_condition": "",
  "intent": "",
  "goal": "",
  "options": [],
  "recommended_direction": "",
  "resolved_decisions": [],
  "open_questions": [],
  "planning_inputs": []
}
```
