<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Verification and calibration capability catalog

Canonical receipts bind claim, evidence, verifier, graph version, result, and calibration without treating confidence as proof.

Plugin version: `0.9.4`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `calibration_reliability` | flat_mcp | flat reliability diagnostic | stable | source-advertised; live-unverified | `tools/list:calibration_reliability` | — |
| `verification_allocate` | flat_mcp | flat verification-budget ranking | stable | source-advertised; live-unverified | `tools/list:verification_allocate` | — |
| `verification_explain` | flat_mcp | Invoke `verification_explain` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_explain` | `harness.verification.explain`<br>`sha256:6c20d2f1a39182b65cf993eff300c44b8cd85f3be841d71cbe6da65f08fd1b3f` |
| `verification_frontier_receipt` | flat_mcp | Invoke `verification_frontier_receipt` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_frontier_receipt` | `harness.verification.frontier_receipt`<br>`sha256:999c439b67ccfde8ff0342fd2dc52521381102267b1bb337c74f32a8a8c743b9` |
| `verification_frontier_record` | flat_mcp | Invoke `verification_frontier_record` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_frontier_record` | `harness.verification.frontier_record`<br>`sha256:c1b60a7b28e9eeecdf16260619f842af2aee012dfb042d5a268338e0b9aae794` |
| `verification_obligation_discharge` | flat_mcp | Invoke `verification_obligation_discharge` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_obligation_discharge` | `harness.verification.obligation_discharge`<br>`sha256:cc8886e1a1e85cce705d05b167f4b01c08638302e52a9392936e1c050a4e3881` |
| `verification_receipt` | flat_mcp | Invoke `verification_receipt` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_receipt` | `harness.verification.receipt`<br>`sha256:66ebc7e8d8650317e131ed112cb3108b50628c77335a57797759d06965f5a326` |
| `verification_record` | flat_mcp | Invoke `verification_record` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `tools/list:verification_record` | `harness.verification.record`<br>`sha256:294e99b076a30ae70d0395637203afa544ef7a67c979db15a441c3516075e286` |
| `Mutation.dischargeVerificationObligation` | graphql | Invoke `verification_obligation_discharge` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.dischargeVerificationObligation` | `harness.verification.obligation_discharge`<br>`sha256:cc8886e1a1e85cce705d05b167f4b01c08638302e52a9392936e1c050a4e3881` |
| `Mutation.recordVerification` | graphql | Invoke `verification_record` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.recordVerification` | `harness.verification.record`<br>`sha256:294e99b076a30ae70d0395637203afa544ef7a67c979db15a441c3516075e286` |
| `Mutation.recordVerificationFrontier` | graphql | Invoke `verification_frontier_record` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Mutation.recordVerificationFrontier` | `harness.verification.frontier_record`<br>`sha256:c1b60a7b28e9eeecdf16260619f842af2aee012dfb042d5a268338e0b9aae794` |
| `Query.verificationExplain` | graphql | Invoke `verification_explain` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Query.verificationExplain` | `harness.verification.explain`<br>`sha256:6c20d2f1a39182b65cf993eff300c44b8cd85f3be841d71cbe6da65f08fd1b3f` |
| `Query.verificationFrontierReceipt` | graphql | Invoke `verification_frontier_receipt` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Query.verificationFrontierReceipt` | `harness.verification.frontier_receipt`<br>`sha256:999c439b67ccfde8ff0342fd2dc52521381102267b1bb337c74f32a8a8c743b9` |
| `Query.verificationReceipt` | graphql | Invoke `verification_receipt` with an admitted principal and preserve its typed verification receipt. | stable | source_advertised_live_unverified | `graphql_introspect:Query.verificationReceipt` | `harness.verification.receipt`<br>`sha256:66ebc7e8d8650317e131ed112cb3108b50628c77335a57797759d06965f5a326` |

Behavioral contract: `references/VERIFICATION_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
