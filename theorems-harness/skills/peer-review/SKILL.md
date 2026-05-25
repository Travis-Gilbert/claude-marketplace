---
name: peer-review
description: Coordinate cross-frontier-model review between Claude Code and Codex. Use at the end of multi-agent work, before commit or PR, or whenever the user asks one agent to review another agent's diff.
---

# Peer Review

Peer review is the launch-week quality loop for Theorem's Harness: two
different frontier models inspect each other's work before the change is
declared ready. It is strongest after loose coordination, where both agents had
a shared goal and negotiated file ownership through `coordinate` messages.

## When To Use

Use this skill when:

- Claude Code and Codex both worked on the same task, repo, branch, or launch
  lane.
- The user asks one agent to review another agent's diff.
- A harness run is about to commit, push, create a PR, or report production
  readiness after multi-agent work.
- A peer agent has sent a review packet path, diff range, run id, state hash, or
  "please review" mention.

Do not use this for single-agent typo fixes unless the user explicitly asks for
review. For single-agent work, use the normal execute review pass.

## Default Actors

- Codex reviews Claude Code as `codex`.
- Claude Code reviews Codex as `claude-code`.
- Claude.ai can participate as `claude-ai`, especially for product framing,
  memory continuity, and launch copy.

If actor identity is unclear, infer it from the host and put the uncertainty in
metadata, not in the user-facing summary.

## Automatic Trigger

At the end of a multi-agent task, run this skill automatically before final
commit or launch-ready reporting when any of these signals are present:

- `coordinate`, `mentions`, or `mentions_wait` were used during the task.
- The task instructions mention multiple agents, Claude Code, Codex, or
  Claude.ai working together.
- The diff includes files another active agent claimed, reviewed, or generated.
- The user asked for high confidence, launch readiness, or "you two decide."

Automatic means "start the review loop without waiting for a separate user
prompt." It does not mean "block forever." If the peer does not respond within
the local wait window, leave a review packet and report peer response as
pending.

## Protocol

1. Refresh presence:

```json
{
  "actor": "codex",
  "mode": "heartbeat",
  "surface": "codex",
  "status": "preparing peer review",
  "ttl_seconds": 60
}
```

2. Consume mentions before generating a packet:

```json
{
  "actor": "codex",
  "consume": true,
  "limit": 20
}
```

3. Build a local review packet:

```bash
bash "${PLUGIN_ROOT}/scripts/peer-review-request.sh" \
  --actor codex \
  --target claude-code \
  --title "Peer review before commit"
```

The script writes a packet under `.theorem/peer-review/` containing repo, branch,
base, status, file lists, and diff-stat context. It deliberately does not paste
large patches into chat. The peer agent is expected to inspect the live working
tree.

4. Send a coordination request:

```json
{
  "message": "@claude-code Peer review requested by @codex. Packet: <path>. Please review the live working tree before commit.",
  "urgency": "ask",
  "metadata": {
    "repo": "<absolute repo path>",
    "branch": "<branch>",
    "packet": "<absolute packet path>",
    "review_type": "peer-review"
  }
}
```

5. Wait briefly only if a response is useful now:

```json
{
  "actor": "codex",
  "consume": true,
  "timeout_seconds": 30,
  "interval_seconds": 1,
  "limit": 20
}
```

Use 30 seconds for normal work, up to 120 seconds only when the commit or PR is
waiting on the peer.

6. Review the peer's diff with code-review posture:

- Lead with findings, ordered by severity.
- Cite file and line where possible.
- Separate correctness bugs from performance, maintainability, and product
  notes.
- Name missing tests or validation gaps.
- Avoid broad rewrite suggestions unless they protect the launch goal.

7. Reconcile received review:

- Fix confirmed correctness issues before declaring done.
- Record "accepted", "declined", or "deferred" for each finding.
- Run focused validation after fixes.
- Send a short `coordinate` reply with the reconciliation result.

## Loose Coordination Rule

Do not pre-assign strict file lanes unless the repo or human explicitly needs
that safety. The preferred pattern is:

1. Shared goal.
2. Presence plus inbox check.
3. Claim only the immediate files you are about to touch.
4. Review each other's diff before commit.

Strict lanes can prevent useful negotiation. Peer review makes loose
coordination safe enough to move quickly.

## Review Packet Shape

A good packet includes:

- actor requesting review
- target peer
- repo root
- branch and upstream
- base commit or base ref
- changed files against base
- staged and unstaged files
- validation already run
- questions or areas of uncertainty
- exact command snippets for the peer to inspect the diff

Use `scripts/peer-review-request.sh` when available so packet shape stays
consistent across hosts.

## Output Shape

When reporting peer review to the user or peer agent, use:

```md
## Peer Review
- Reviewer:
- Reviewed diff:
- Status: pass | pass-with-notes | changes-requested | pending
- Findings:
- Validation gaps:
- Reconciliation:
- Packet:
```

If no peer responded, say `Status: pending` and include the packet path.

## Guardrails

- Do not run destructive git commands while preparing or reviewing a packet.
- Do not include secrets or full env dumps in the packet.
- Do not mark production-ready while unresolved `changes-requested` findings
  remain.
- Do not let peer review replace focused tests. It complements validation.
