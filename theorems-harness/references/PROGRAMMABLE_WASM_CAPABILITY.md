# Programmable WASM Capability

Programmable WASM currently has two real but distinct surfaces. Keep them
separate: an internal durable lifecycle kernel and dynamically callable exports
from installed Theorem app manifests.

## Durable lifecycle kernel

`rustyred-plugin` implements the tenant-bound
`DurableWasmCapabilityRegistry`. Its Rust API supports:

| Lifecycle operation | Current method | Durable result |
|---|---|---|
| Inspect versions | `inspect` | Ordered `WasmVersionInspection` values; read-only, no new receipt. |
| Publish frozen module bytes | `publish` | `DurableWasmOperation::Published` receipt. |
| Promote exact tested evidence | `promote` | `DurableWasmOperation::Promoted` receipt. |
| Invoke the selected version | `invoke_selected` | `DurableWasmOperation::Invoked` receipt. |
| Restore the prior selection | `rollback_selected` | `DurableWasmOperation::RolledBack` receipt. |
| Read a prior receipt | `load_receipt` | The content-addressed `DurableWasmReceipt`. |

Every mutating lifecycle operation commits the tenant snapshot, exact addressed
module version, and receipt as one GraphStore batch. Receipts bind tenant,
capability, before/after snapshot hashes, version/module/policy hashes, optional
input/output hashes, host version, and the typed operation. Promotion requires
evidence for the exact module and policy hashes. Cross-tenant publication or
selection is refused.

This lifecycle is not exposed as MCP or GraphQL operations yet. Agent workflows
must not guess lifecycle tool names. Use the Rust API only when implementing or
testing the substrate itself; otherwise report that publish, promote, durable
inspect, receipt lookup, and rollback are not remotely callable.

## Callable installed app exports

Installed Theorem app manifests may embed WASM modules. The connector gateway
projects each declared export as a tenant-scoped dynamic affordance with this id
shape:

```text
wasm_plugin:<plugin_id>.<export>
```

Use only the ordinary gateway sequence:

1. `tool_search` discovers a compact affordance and returns
   `candidate_affordance_ids`.
2. `describe` returns the export's current input schema, permissions,
   writeback policy, tags, and fitness.
3. `invoke` receives the selected `affordance_id`, export arguments, task type,
   and candidate ids. `dry_run: true` plans without loading or calling WASM.

A live invocation loads the module declared by the installed app manifest,
calls the named export in the bounded Extism host, persists permitted fact
writes before reporting success, and returns the ordinary dynamic invocation
shape: `planned`, `fired`, `outcome`, and `recorded`.

That dynamic app path does not publish or promote a durable registry version,
does not select a version from `DurableWasmCapabilityRegistry`, and does not
return `DurableWasmReceipt`. Its normal affordance invocation record is not a
substitute for a lifecycle receipt.

## Admission and refusal

- App manifests freeze embedded bytes or WAT and reject filesystem module
  paths. Their declared source hash, exports, grants, limits, and provenance are
  validated before the app is installed.
- The app manifest and derived affordances are tenant-scoped. A tenant cannot
  claim another app's managed runtime node.
- Read-only MCP mode does not reconcile new or changed app-manifest exports;
  search and describe can only see already registered affordance nodes.
- Read-only MCP mode permits dynamic dry-run but refuses a live `invoke`.
- Treat permissions and writeback policy returned by `describe` as contract
  metadata. Require the actual invocation/refusal record before claiming an
  action was admitted or applied.
- Do not describe installed app invocation as the durable publish/promote/
  rollback lifecycle. MCP exposure for that lifecycle remains HCM-018 work.
