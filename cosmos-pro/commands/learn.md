---
description: >
  Run the compound learning pipeline for cosmos-pro. Save the session log,
  run Bayesian confidence updates, and present the review queue with
  auto-captured claims about cosmos.gl, Mosaic, vgplot, SceneDirective
  adapter behavior, performance pitfalls, and color/token discipline.
argument-hint: "[--deep] [--skip-review]"
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
---

# /cosmos-pro:learn

Execute the compound learning loop in four phases. Modeled on the
theseus-pro `/learn` command; adapted for the cosmos.gl + Mosaic +
DuckDB-WASM + vgplot + SceneDirective domain.

The loop turns work sessions into a growing epistemic asset that surfaces
the right knowledge at the right time — especially the recurring pain
points (hardcoded colors, Float32Array allocation in hot paths,
`setConfig` vs `setConfigPartial` confusion, missing pending-state
visuals).

## Phase 1: Save the session

Write a session log to:
`${CLAUDE_PLUGIN_ROOT}/knowledge/session_log/[YYYY-MM-DD]-[short-slug].jsonl`

Log event lines for what happened in the session:

- `agent_invoked` — which cosmos-pro agent was used (cosmos-architect,
  cosmos-data, cosmos-render, cosmos-chart, cosmos-critic)
- `skill_loaded` — which skills/<name>/SKILL.md was consulted
- `recipe_consulted` — which recipes/<name>.md was used as baseline
- `claim_consulted` — which claim from `knowledge/claims.jsonl` informed
  a decision
- `suggestion_outcome` — was a suggestion accepted (alpha += 1.0) or
  rejected (beta += 1.0)
- `auto_capture` — what fix or pattern was extracted as a new claim
- `verify_check_failed` — which V-* check failed (and was fixed)
- `cross_plugin_route` — when the task was routed out (vie-design,
  three-pro, etc.)

Include enough context to replay why decisions were made and which files
or subsystems changed.

## Phase 2: Learn

Run the preferred cross-repo learning pipeline:

```bash
cd ~/Tech\ Dev\ Local/codex-plugins && python -m scripts.epistemic.learn --plugin cosmos-pro
```

If `~/Tech Dev Local/codex-plugins/scripts/epistemic/learn.py` is
unavailable, run a local fallback:

1. Read `${CLAUDE_PLUGIN_ROOT}/knowledge/claims.jsonl`.
2. Apply temporal decay and evidence updates to confidence.
3. Update `${CLAUDE_PLUGIN_ROOT}/knowledge/manifest.json` stats
   (active_claims, avg_confidence, last_run).
4. Build a local review queue for Phase 3.

## Phase 3: Review

Present the review queue in this order:

1. **Confidence changes from this session** (report only, no action).
   Example: `claim-7e3a2f9c "Always pull link colors from --cp-link-default"
   strengthened: 0.71 -> 0.79 (suggestion accepted in cosmos-render)`

2. **Auto-captured claims from this session** (confirm / edit / retire).
   Example:
   ```
   [NEW] "Build phase must call setLinks before setLinkColors,
          otherwise cosmos.gl renders the previous edge alphas for one
          frame"
   Domain: cosmos.scene-directive | Confidence: 0.67
   ```

3. **New tensions detected** (resolve / defer). Example:
   ```
   Tension: claim-a4b1e8d2 vs claim-c2f9e10b
   "Always use setConfigPartial after init" vs
   "When changing simulation_alpha mid-Build, prefer fresh setConfig for
    cleaner reset"
   ```

4. **Attention items:**
   - claims with confidence `< 0.3` (candidate for retirement)
   - claims not consulted in `60+` days (keep / retire / edit)

Use direct, action-oriented prompts and apply user choices to the
knowledge files.

## Phase 4: Report

Print a single-line summary:

```text
[cosmos-pro]: N active claims, avg confidence X.XX, M items reviewed
```

## Auto-capture trigger signals

The agent watches for these signals after a debugging or fixing sequence
in a cosmos-pro task:

```
Explicit: "capture this", "document this fix", "remember this for next time"
Implicit: "that worked", "it's fixed", "working now", "problem solved",
          "that was the issue", "nice, that did it"
```

Capture-worthy patterns (specific to cosmos-pro):

- A hardcoded color triplet was found and replaced with a CSS-var read.
- A Float32Array was being reallocated in a hot path; extracted to a
  buffer pool.
- A `setConfig` was found in a non-init code path and replaced with
  `setConfigPartial`.
- A missing `graph.destroy()` was added to a component cleanup.
- A second `Coordinator` was found and consolidated to the page-level singleton.
- A SceneDirective field was found that the adapter wasn't handling
  (V-directive-1 fix).
- A vgplot brush wasn't propagating because a Selection was created inline
  in render.
- A pending visual was found missing for a layer with partial coverage.

Skip: typo fixes, import re-orders, comment changes, prose edits to recipes.

See `patterns/PATTERNS-compound-learning.md` for the full assessment
criteria, claim format, and Bayesian confidence lifecycle.
