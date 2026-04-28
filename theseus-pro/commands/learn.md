---
description: >
  Run the compound learning pipeline. Save the session log, run Bayesian
  confidence updates, and present the review queue with auto-captured
  claims, tensions, and attention items.
argument-hint: "[--deep] [--skip-review]"
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
---

# /learn

Execute the compound learning loop in four phases.

## Phase 1: Save the Session

Write a session log to:
`knowledge/session_log/[YYYY-MM-DD]-[short-slug].jsonl`

Log event lines for what happened in the session. Capture all relevant:
- `agent_invoked`
- `claim_consulted`
- `suggestion_outcome`
- `auto_capture`

Include enough context to replay why decisions were made and which files
or subsystems changed.

## Phase 2: Learn

Run the preferred cross-repo learning pipeline:

```bash
cd ~/code/codex-plugins && python -m scripts.epistemic.learn --plugin theseus-pro
```

If `~/code/codex-plugins` is unavailable, run a local fallback:
1. Read `knowledge/claims.jsonl`.
2. Apply temporal decay and evidence updates to confidence.
3. Update `knowledge/manifest.json` stats.
4. Build a local review queue for Phase 3.

## Phase 3: Review

Present the review queue in this order:

1. Confidence changes from this session (report only, no action needed).
2. Auto-captured claims from this session (confirm / edit / retire).
3. New tensions detected (resolve / defer).
4. Attention items:
   - claims with confidence `< 0.3`
   - claims not consulted in `60+` days (keep / retire / edit)

Use direct, action-oriented prompts and apply user choices to the
knowledge files.

## Phase 4: Report

Print a single-line summary:

```text
[theseus-pro]: N active claims, avg confidence X.XX, M items reviewed
```
