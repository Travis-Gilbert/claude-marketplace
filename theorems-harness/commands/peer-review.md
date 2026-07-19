---
description: Request or perform cross-frontier-model peer review between Claude Code and Codex.
argument-hint: [target-actor or review request]
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:peer-review skill against the user's request.

1. Parse the user's argument as either a target actor (`claude-code`, `codex`,
   or `claude-ai`), a review packet path, a diff range, or a free-form review
   request.
2. Invoke the `theorems-harness:peer-review` skill with the full argument.
3. If no packet exists and the current directory is a git repo, generate one
   with `scripts/peer-review-request.sh`.
4. Prefer the shared coordination tools in this order: `presence`, `mentions`,
   `coordinate`, `mentions`, or `stream_read`.
5. Return the packet path, peer-review status, findings, and reconciliation.

Use `/coordinate` for simple messages. Use `/peer-review` when a diff needs
another model's review before commit, PR, launch reporting, or handoff closure.
