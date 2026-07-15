# Graph Lisp Agent Capability

Graph Lisp currently exposes a bounded, deterministic, pure capability
envelope as the Rust API
`rustyred_thg_graph_lisp::execute_capability`. It is not registered in MCP,
GraphQL, or the dynamic capability gateway. Agents may reason about, test, or
integrate the Rust envelope in repository work, but a remote Harness session
cannot invoke it today.

There is no MCP, GraphQL, or dynamic gateway projection today.

## Rust capability surface

`execute_capability(request, graph_version, limits, policy)` accepts these
`CapabilityRequest` operations:

| Operation | Input | Result |
|---|---|---|
| `read` | Source text | Content-addressed root, normalized readable source, and addressed expression nodes. |
| `eval` | Source text and fuel | Root plus a `TypedValue`. |
| `diff` | Before and after source | Before/after roots and added/removed expression ids. |
| `explain` | Source text | Root, normalized source, node count, free symbols, collection-node count, and `evaluator_is_pure`. |
| `dynamic_call` | Capability name and argument anchor | Never executes in this crate; even a granted request refuses with `external_executor_required`. |

Typed values are nil, boolean, integer, string, keyword, symbol, list, vector,
map, or function. The reader alpha-normalizes lexical binders before hashing,
hash-conses identical subexpressions, and limits structural diffs to the changed
spine.

## Limits and permission

`CapabilityLimits::default()` applies:

- 64 KiB maximum source bytes;
- 10,000 maximum expression nodes;
- 1,000,000 maximum requested evaluation fuel.

`CapabilityPolicy::pure()` permits only read, eval, diff, and explain.
`CapabilityPolicy::deny_all()` refuses all operations. A dynamic grant proves
only that an external effectful executor may receive the request; the pure
crate still refuses to perform the effect.

The caller must provide a nonblank `graph_version`. Today that value is bound
into the receipt but is not validated against a real GraphStore snapshot.

## Receipts and refusals

Every success returns a `CapabilityExecution` with a typed result and
`CapabilityReceipt`. Every refusal or failure returns `CapabilityFailure` with
the same receipt shape. Preserve:

- receipt version and content-addressed `receipt_id`;
- operation and caller-provided graph version;
- deterministic `input_anchor` and optional `outcome_anchor`;
- status `succeeded`, `refused`, or `failed`;
- error code;
- fuel limit and fuel used.

Error codes are `invalid_graph_version`, `input_too_large`,
`node_limit_exceeded`, `fuel_limit_exceeded`, `permission_denied`,
`external_executor_required`, `read_failure`, `fuel_exhausted`, and
`eval_failure`. `replay_bytes()` is byte-stable for an identical execution or
failure.

## Current proof and exposure boundary

Focused crate tests prove direct read/eval/diff/explain parity, typed values,
bounded fuel and input refusals, permission refusal, effect isolation, and
byte-stable replay. They do not prove an agent-callable remote surface, admitted
identity policy, real-store graph-version validation, or an end-to-end MCP or
GraphQL oracle.

Do not invent a remote action. Until an actual projection lands, report Graph
Lisp as a crate-local capability and route effectful work through separately
registered, permissioned capabilities only when those capabilities themselves
are advertised.
