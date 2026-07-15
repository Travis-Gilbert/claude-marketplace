---
name: graph-lisp
description: "Use when repository work needs Graph Lisp pure read, eval, diff, or explain semantics, bounded fuel and permission refusals, deterministic receipts, or an honest account of the current crate-only agent capability boundary."
---

# Graph Lisp agent capability

Read `../../references/GRAPH_LISP_CAPABILITY.md` before claiming Graph Lisp can
be invoked by an agent session.

## Workflow

1. In Rust repository work, call
   `rustyred_thg_graph_lisp::execute_capability` with a `CapabilityRequest`,
   nonblank graph version, `CapabilityLimits`, and `CapabilityPolicy`.
2. Use only the pure operations `read`, `eval`, `diff`, and `explain` in this
   executor. Keep typed results and the full `CapabilityReceipt`.
3. Treat source-byte, node, fuel, permission, read, and evaluation outcomes as
   typed refusals/failures. Preserve deterministic anchors and replay bytes.
4. Never execute effects through `dynamic_call`. A grant still returns
   `external_executor_required`; effectful capabilities need their own admitted
   executor.
5. Do not treat the caller-provided graph version as real-store validation.
6. Do not invent a remote action. Graph Lisp has no MCP, GraphQL, or dynamic
   gateway projection today.
