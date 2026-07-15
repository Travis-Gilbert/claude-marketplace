---
name: programmable-wasm
description: "Use when a task involves installed Theorem app WASM exports or the durable programmable WASM lifecycle, and the agent must distinguish callable dynamic affordances from the Rust-only publish, promote, inspect, invoke-selected, receipt, and rollback kernel."
---

# Programmable WASM

Read `../../references/PROGRAMMABLE_WASM_CAPABILITY.md` before acting. First
classify the request into one of two lanes.

## Installed app export lane

For an export already present in a tenant's installed Theorem app manifest:

1. Discover with `tool_search`.
2. Select an id shaped `wasm_plugin:<plugin_id>.<export>`.
3. Read the exact schema, permissions, and writeback policy with `describe`.
4. Call `invoke` with the selected affordance and candidate ids, or use
   `dry_run: true` for a non-firing plan.
5. Interpret `planned`, `fired`, `outcome`, and `recorded`. Do not call this a
   durable lifecycle receipt.

## Durable lifecycle lane

The tenant-bound `DurableWasmCapabilityRegistry` can `publish` frozen bytes,
`promote` exact tested module/policy evidence, `inspect` versions,
`invoke_selected`, `load_receipt`, and `rollback_selected`. Those Rust
substrate methods are not exposed as MCP or GraphQL calls.

If the user asks an agent to remotely publish, promote, inspect, or roll back a
WASM capability, report that the lifecycle is not remotely exposed. Do not
invent a lifecycle tool. Implement or test the Rust API only when the task is a
code change in the substrate.
