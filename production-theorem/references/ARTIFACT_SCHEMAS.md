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

## OrchestratePlan

```json
{
  "kind": "OrchestratePlan",
  "title": "",
  "mode": "plan|execute|theorize|review|debug",
  "current_condition": "",
  "goal": {
    "user_visible_outcome": "",
    "system_behavior": "",
    "data_or_model_changes": "",
    "operational_impact": "",
    "must_not_regress": []
  },
  "context_stack": [],
  "delegation_map": [],
  "action_rail": [],
  "checklist": [
    {
      "id": "ORCH-001",
      "task": "",
      "grounding": [],
      "route": "",
      "acceptance_criteria": [],
      "validation": [],
      "risk": "",
      "status": "planned"
    }
  ],
  "production_gates": [],
  "epistemic_ledger": [],
  "deferrals": [],
  "execution_instructions": []
}
```

## OrchestrateReport

```json
{
  "kind": "OrchestrateReport",
  "title": "",
  "final_condition": "",
  "goal_status": "done|partial|blocked|failed",
  "checklist_reconciliation": [
    {
      "id": "ORCH-001",
      "status": "done|partial|blocked|skipped|failed",
      "evidence": [],
      "tests": [],
      "notes": ""
    }
  ],
  "delegation_reconciliation": [],
  "context_and_action_rail": {},
  "changes_made": [],
  "tests_run": [],
  "incomplete_items": [],
  "new_findings": [],
  "production_gate_review": [],
  "learning_candidates": [],
  "next_steps": []
}
```

## HarnessWritebackRecord

```json
{
  "kind": "HarnessWritebackRecord",
  "run_id": "",
  "events": [
    "RUN.CREATED",
    "TASK.RESOLVED",
    "PROFILE.SELECTED",
    "TOOLKIT.COMPILED",
    "CONTEXT.PLANNED",
    "CONTEXT.PACKED",
    "AGENT.ACTING",
    "VALIDATION.FINISHED",
    "OUTCOME.RECORDED",
    "LEARNING.PROPOSED",
    "RUN.CLOSED"
  ],
  "writeback_status": "proven|deferred|blocked|not_available",
  "evidence": [],
  "deferred_reason": ""
}
```
