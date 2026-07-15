<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Commitments, claims, constitution, and policy capability catalog

Canonical typed commitments preserve identity-bound slots and immutable lifecycle history; coordination decisions and still-unprojected typed claims remain distinct.

Plugin version: `0.9.3`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `typed_commitment_affirm` | flat_mcp | Invoke `typed_commitment_affirm` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `tools/list:typed_commitment_affirm` | `harness.commitment.affirm`<br>`sha256:a0d4b34f6eedbd87593fa4517b45d064d6c59730daaafc4d81813e2c7d7c4d15` |
| `typed_commitment_explain` | flat_mcp | Invoke `typed_commitment_explain` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `tools/list:typed_commitment_explain` | `harness.commitment.explain`<br>`sha256:af11716ccff5468083805f351bee03888e0e660a106661bdd4a2cc0cb7c5c0e2` |
| `typed_commitment_read` | flat_mcp | Invoke `typed_commitment_read` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `tools/list:typed_commitment_read` | `harness.commitment.read`<br>`sha256:5520daf06271f3c4a9112668a433dc9cae4b9eca934a517ea73521a2bf24eeba` |
| `typed_commitment_retract` | flat_mcp | Invoke `typed_commitment_retract` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `tools/list:typed_commitment_retract` | `harness.commitment.retract`<br>`sha256:a1eb31739e2208cb75b24ad1bc16653a61627f6899502bedc04d6c443ea0293d` |
| `typed_commitment_supersede` | flat_mcp | Invoke `typed_commitment_supersede` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `tools/list:typed_commitment_supersede` | `harness.commitment.supersede`<br>`sha256:b4094a3828850a6f73cb070b1a22a504deedf1163cf6abdc023a233cb5eb13be` |
| `Mutation.affirmTypedCommitment` | graphql | Invoke `typed_commitment_affirm` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.affirmTypedCommitment` | `harness.commitment.affirm`<br>`sha256:a0d4b34f6eedbd87593fa4517b45d064d6c59730daaafc4d81813e2c7d7c4d15` |
| `Mutation.retractTypedCommitment` | graphql | Invoke `typed_commitment_retract` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.retractTypedCommitment` | `harness.commitment.retract`<br>`sha256:a1eb31739e2208cb75b24ad1bc16653a61627f6899502bedc04d6c443ea0293d` |
| `Mutation.supersedeTypedCommitment` | graphql | Invoke `typed_commitment_supersede` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.supersedeTypedCommitment` | `harness.commitment.supersede`<br>`sha256:b4094a3828850a6f73cb070b1a22a504deedf1163cf6abdc023a233cb5eb13be` |
| `Query.explainTypedCommitment` | graphql | Invoke `typed_commitment_explain` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Query.explainTypedCommitment` | `harness.commitment.explain`<br>`sha256:af11716ccff5468083805f351bee03888e0e660a106661bdd4a2cc0cb7c5c0e2` |
| `Query.typedCommitment` | graphql | Invoke `typed_commitment_read` through an admitted identity binding and retain its lifecycle receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Query.typedCommitment` | `harness.commitment.read`<br>`sha256:5520daf06271f3c4a9112668a433dc9cae4b9eca934a517ea73521a2bf24eeba` |

Behavioral contract: `references/COMMITMENTS_POLICY_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
