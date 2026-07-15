<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Verification and calibration capability catalog

Canonical receipts bind claim, evidence, verifier, graph version, result, and calibration without treating confidence as proof.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `calibration_reliability` | flat_mcp | flat reliability diagnostic | stable | source-advertised; live-unverified | `tools/list:calibration_reliability` |
| `verification_record` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:verification_record` |
| `Mutation.recordVerification` | graphql | preferred typed write | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.recordVerification` |
| `Query.verificationExplain` | graphql | preferred typed evidence explanation | stable | source-advertised; live-unverified | `graphql_introspect:Query.verificationExplain` |
| `Query.verificationReceipt` | graphql | preferred typed receipt | stable | source-advertised; live-unverified | `graphql_introspect:Query.verificationReceipt` |

Behavioral contract: `references/VERIFICATION_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
