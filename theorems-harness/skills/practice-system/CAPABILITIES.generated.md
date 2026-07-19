<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Practices capability catalog

Source-attributed practices promote only after evidence-clustered outcomes and remain ambient across planning and execution.

Plugin version: `0.10.0`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `practice promotion firewall` | behavior | outcome-clustered promotion gate | stable contract | ambient proof incomplete | `references/MEMORY_CAPABILITY.md` | — |
| `practice_close_receipt` | flat_mcp | Use to read the exact Compound close-harvest receipt for one admitted run. | beta | source_advertised_live_unverified | `tools/list:practice_close_receipt` | `harness.practice.close_receipt`<br>`sha256:dbcadb49d308f8d2b3ba7fdf720c967b898b5ba7c72fcc334f5f9d46018c071e` |
| `practice_explain` | flat_mcp | Use to inspect exact selection, outcome, learning-state, episode, and Compound receipt lineage for one run. | beta | source_advertised_live_unverified | `tools/list:practice_explain` | `harness.practice.explain`<br>`sha256:751bbfbec45c0f77bdb98a06be7ed2265aad8c991ddfeca63af06b476b3c7a7d` |
| `practice_status` | flat_mcp | Use to verify that a run's practice and episode harvest completed without loading full receipts. | beta | source_advertised_live_unverified | `tools/list:practice_status` | `harness.practice.status`<br>`sha256:7ed3d20e8c3011c1d641a9102937f8f6aeef1598ca614d52760aa9ba53de8f5d` |
| `skill_apply` | flat_mcp | apply and receipt a skill pack | stable | source-advertised; live-unverified | `tools/list:skill_apply` | — |
| `skill_get` | flat_mcp | read a practice skill pack | stable | source-advertised; live-unverified | `tools/list:skill_get` | — |
| `skill_list` | flat_mcp | browse practice skill packs | stable | source-advertised; live-unverified | `tools/list:skill_list` | — |
| `Query.practiceCloseReceipt` | graphql | Use to read the exact Compound close-harvest receipt for one admitted run. | beta | source_advertised_live_unverified | `graphql_introspect:Query.practiceCloseReceipt` | `harness.practice.close_receipt`<br>`sha256:dbcadb49d308f8d2b3ba7fdf720c967b898b5ba7c72fcc334f5f9d46018c071e` |
| `Query.practiceExplain` | graphql | Use to inspect exact selection, outcome, learning-state, episode, and Compound receipt lineage for one run. | beta | source_advertised_live_unverified | `graphql_introspect:Query.practiceExplain` | `harness.practice.explain`<br>`sha256:751bbfbec45c0f77bdb98a06be7ed2265aad8c991ddfeca63af06b476b3c7a7d` |
| `Query.practiceStatus` | graphql | Use to verify that a run's practice and episode harvest completed without loading full receipts. | beta | source_advertised_live_unverified | `graphql_introspect:Query.practiceStatus` | `harness.practice.status`<br>`sha256:7ed3d20e8c3011c1d641a9102937f8f6aeef1598ca614d52760aa9ba53de8f5d` |

Behavioral contract: `references/LEARNINGS.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
