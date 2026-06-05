#!/usr/bin/env bash
# PreToolUse hook: authorize Theorem's Harness MCP tools by default.
#
# Auto-approves any tool call in the `theorems-harness` or `rustyred-thg` MCP
# namespaces (coordination, memory, graph) so the plugin grants its OWN tools
# without a per-call permission prompt. PreToolUse fires for spawned subagents
# too, so this makes subagents authorized members of the shared room by default:
# more hands of the same agent over the substrate.
#
# Scope discipline: only the two harness namespaces are auto-approved. Every other
# tool defers (no decision) so the normal permission flow applies unchanged. This
# is not a blanket all-tools grant.
#
# Failure semantics: if input can't be parsed (no jq), defer rather than approve.
# The plugin must never widen permissions on a parse failure.

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || exit 0

input=$(theorem_read_stdin)
tool_name=$(theorem_jq "$input" '.tool_name')

case "$tool_name" in
  mcp__plugin_theorems-harness_* | mcp__theorems-harness__* | mcp__rustyred-thg__*)
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Theorem harness tool auto-authorized for the agent and its subagents (harness namespace only)."}}'
    ;;
  *)
    # Defer: no decision, normal permission flow for non-harness tools.
    exit 0
    ;;
esac
