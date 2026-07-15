<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Harness compatibility and deprecation projection

Removed names are documentation-only and must never re-enter current routing or family catalogs.

| Name | Status | Replacement | Reason |
|---|---|---|---|
| `code_search` | compatibility | compute_code(operation=search) or Query.codeSearch | Dispatch-compatible but not advertised in the current flat catalog. |
| `code_theorem` | removed | compute_code | Retired obsolete tool cluster. |
| `context-refresh` | removed | harness_prepare or Mutation.refreshContext | Retired plugin-only interface. |
| `coordination_decision` | removed | coordination_record(record_type=decision) | Record kinds are values, not dedicated tools. |
| `coordination_reflection` | removed | coordination_record(record_type=reflection) | Record kinds are values, not dedicated tools. |
| `coordination_tension` | removed | coordination_record(record_type=tension) | Record kinds are values, not dedicated tools. |
| `harness_begin` | removed | plan or harness_run | Obsolete replay teaching alias. |
| `harness_compare` | removed | replay_last_run or harness_replay | Obsolete replay teaching alias. |
| `harness_context` | removed | harness_prepare | Obsolete replay teaching alias. |
| `harness_describe_current` | removed | graphql_introspect and the focused family catalog | Never registered by the current Harness. |
| `harness_fork` | removed | plan refine or multihead_refine | Obsolete replay teaching alias. |
| `mentions_wait` | removed | mentions or stream_read at a bounded checkpoint | No long-poll mentions tool is advertised. |
| `orchestrate_refresh` | removed | harness_prepare or Mutation.refreshContext | Never registered by the current Harness. |
| `ponytail` | removed | practice-system | The retired practice layer was replaced by source-attributed practices. |
| `show-context` | removed | context_status or context_explain | Retired plugin-only interface. |
| `spawn_handoff_session` | removed | spawn_session | The real spawn surface is GitHub repository dispatch. |
| `subscribe` | removed | stream_subscribe | There is no generic coordination subscribe tool. |
| `theorem_harness_write_intent` | compatibility | coordination_intent | Accepted legacy dispatch alias but not advertised in tools/list. |
| `write_intent` | compatibility | coordination_intent | Accepted dispatch alias but not advertised in tools/list. |
