# PATTERNS-compound-learning.md

How the compound learning layer captures, refines, and compounds knowledge
from cosmos-pro work sessions into a growing epistemic asset. Adapted
from the theseus-pro pattern; tailored for cosmos.gl + Mosaic + vgplot
+ SceneDirective work.

## Problem

Static plugin instructions degrade over time. Patterns that worked six
months ago may be wrong today. Corrections given in one session are
forgotten in the next. The compound learning layer solves this by
auto-capturing solutions, tracking claim confidence via Bayesian updates,
and surfacing the right knowledge at the right time.

For cosmos-pro specifically: the same pain points recur until they're
captured as claims that the hub command (`/cosmos-pro:cosmos`) reads
BEFORE routing. Hardcoded colors, Float32Array allocation in hot paths,
`setConfig` mid-runtime, missing `graph.destroy()`, SceneDirective drift
— each of these has bitten the project once and would bite again if the
plugin's static instructions were the only safeguard.

## When to use

- Setting up the learning loop for a new session: invoke `/cosmos-pro:learn`
  at the end of substantial work.
- Debugging why auto-capture missed a solve: read the session log under
  `knowledge/session_log/`.
- Tuning claim confidence thresholds: edit
  `knowledge/manifest.json::confidence_thresholds`.
- Reviewing the `/cosmos-pro:learn` pipeline output.
- Linking claims across plugins (cosmos-pro ↔ vie-design ↔ d3-pro):
  see "Cross-plugin linking" below.

## The pattern

### Auto-capture trigger signals

The agent watches for these signals after a debugging or fixing sequence:

```
Explicit: "capture this", "document this fix", "remember this for next time"
Implicit: "that worked", "it's fixed", "working now", "problem solved",
          "that was the issue", "nice, that did it"
```

Assessment criteria (capture only if at least one is true):

1. Root cause required investigation (not obvious from the error message).
2. The fix involved understanding something non-obvious about cosmos.gl /
   Mosaic / vgplot / DuckDB-WASM / the SceneDirective contract.
3. The pattern is likely to recur in future sessions (cosmos-pro's recurring
   pain list: colors, Float32Arrays, lifecycle, setConfig, Coordinator
   multiplication, pending state, vgplot Selection inlining).
4. The problem affected more than one file or component.

Skip: typo fixes, one-line config changes, import ordering, obvious
missing dependencies, prose tweaks to skills/recipes.

### Solution doc format

```markdown
# [Brief problem description]

**Date:** 2026-04-19
**Domain:** cosmos.[render|data|chart|scene-directive|performance|foundations]
**Agents involved:** [cosmos-render, cosmos-critic, ...]

## Problem
1-2 sentence description of the observable issue.

## Root Cause
What was actually wrong, technically.

## Solution
The fix, with code references. Before/after when applicable.

## Prevention
One concrete step to avoid recurrence.

## Claims Extracted
- claim-[hash1]: "[claim text]"
- claim-[hash2]: "[claim text]"
```

Filename: `knowledge/solutions/[domain-slug]-[YYYY-MM-DD].md`
If exists, append counter: `[domain-slug]-[YYYY-MM-DD]-2.md`

### Claim extraction

Each claim is a single imperative statement scoped to one actionable
practice within the cosmos-pro domain.

Good claims (cosmos-pro examples):

- "Always pull link/point colors from `var(--cp-*)` via `cssVarToRgba`;
  never hardcode hex or float triplets."
- "Always extract Float32Array allocations to a power-of-two bucket pool
  outside per-frame and per-data-update hot paths."
- "Use `setConfigPartial` for every cosmos.gl runtime update; reserve
  `setConfig` for the initial `new Graph(...)` construction only."
- "Always pair `new Graph(...)` with `graph.destroy()` in the same
  effect's cleanup; React StrictMode double-mount will leak otherwise."
- "Share one Mosaic `Coordinator` per page; use the singleton from
  `coordinator()` and bind via context."
- "When a SceneDirective field exists in `refs/theseus-viz-types/SceneDirective.ts`
  but `applyDirective` has no handler, the adapter is failing silently —
  add the handler before declaring work complete."

Bad claims:

- "cosmos.gl is good" (not actionable).
- "Fix the renderer" (not a practice).
- "Always batch setters and pool buffers and use tokens and destroy
  graphs" (multiple practices — split into separate claims).

Domain tagging: match the claim to the agent/skill domain map:

| Domain | Skill | Owner agent |
|---|---|---|
| `cosmos.foundations` | cosmos-foundations | cosmos-render |
| `cosmos.data` | cosmos-mosaic-duckdb | cosmos-data |
| `cosmos.scene-directive` | cosmos-scene-directive | cosmos-render |
| `cosmos.performance` | cosmos-performance | cosmos-render, cosmos-critic |
| `cosmos.chart` | cosmos-mosaic-duckdb | cosmos-chart |
| `cosmos.recipes` | cosmos-recipes | cosmos-architect |
| `cosmos.tokens` | (cross-cutting) | cosmos-render + vie-design |

Deduplication: `claim_id = sha256("cosmos-pro:[lowercased text]")[:12]`.
Check against existing IDs before appending.

### Bayesian confidence lifecycle

Each claim tracks alpha (successes) and beta (failures) in its evidence
field.

```
Initial state (seeded):     alpha=2, beta=1  -> confidence 0.667
Initial state (captured):   alpha=2, beta=1  -> confidence 0.667

After accepted suggestion:  alpha += 1.0     -> confidence rises
After rejected suggestion:  beta += 1.0      -> confidence drops
After auto-capture event:   alpha += 0.3     -> weak positive

Temporal decay (every 30 days unused):
  alpha *= 0.95
  beta *= 0.95
  (Both decay, preserving the ratio but reducing certainty)
```

Confidence thresholds:

- `> 0.8`: Claim overrides static instructions when conflicting. The
  hub command surfaces it as a hard stop before routing.
- `0.5 - 0.8`: Claim is a suggestion; static instructions win on conflict.
  The hub surfaces it as advisory.
- `0.3 - 0.5`: Claim needs attention; may be outdated. Surfaces in `/learn`
  Phase 3 attention queue.
- `< 0.3`: Candidate for retirement.

### /cosmos-pro:learn review queue

Phase 3 of the `/learn` command presents these categories:

```
1. Confidence changes (report only, no action)
   claim-7e3a2f9c strengthened: 0.71 -> 0.79 (color discipline win in cosmos-render)

2. Auto-captured claims (confirm / edit / retire)
   [NEW] "When fitView is called before the simulation has had ~200 ticks,
          the camera anchors to seed positions; always call after onSimulationEnd
          or via fitViewDelay >= 800ms"
   Domain: cosmos.foundations | Confidence: 0.67

3. New tensions (resolve / defer)
   Tension: claim-a4b1e8d2 vs claim-c2f9e10b
   "Always pin positions with enableSimulation:false" vs
   "Run simulation gently with low repulsion to resolve overlap on pinned layers"
   (Resolution: both are correct in different recipes — pinned-layer-positions.md
    documents the choice. No conflict; close as design variants.)

4. Attention needed (keep / retire / edit)
   claim-d8e2a91f (confidence 0.32): "Use globalTentativeFactor as link
   alpha" — may be outdated since v3 SceneDirective restructured hypothesis_style.
```

### Cross-plugin linking

The `EXTERNAL_PLUGINS` config maps plugin names to absolute paths for
plugins outside the main repo:

```python
EXTERNAL_PLUGINS = {
    "cosmos-pro": str(Path.home() / "Tech Dev Local" / "codex-plugins" / "cosmos-pro"),
    "vie-design": str(Path.home() / "Tech Dev Local" / "codex-plugins" / "vie-design"),
    "d3-pro":     str(Path.home() / "Tech Dev Local" / "codex-plugins" / "d3-pro"),
    "theseus-pro": os.environ.get(
        "THESEUS_PRO_PATH",
        str(Path.home() / "code" / "Index-API" / "theseus-pro")
    ),
}
```

The cross-linker reads all plugins' `claims.jsonl` and finds semantic
neighbors via SBERT embedding similarity. A cosmos-pro claim about color
tokens links to a vie-design claim about token naming. A cosmos-pro claim
about Float32Array reuse links to a three-pro claim about InstancedMesh
buffer reuse — same underlying idea in a different renderer.

Cross-plugin links are stored as `related_claims` entries with a
`plugin:claim_id` format: `"vie-design:b2c4d6e8f0a1"`.

### How the hub uses claims (the routing-time check)

`/cosmos-pro:cosmos` reads `claims.jsonl` BEFORE routing. The check:

1. For each claim with `confidence > 0.5`, check whether the user's task
   signals match the claim's `triggers` field (a list of substrings).
2. If a `confidence > 0.8` claim matches, surface it as a HARD STOP that
   the routed agent must acknowledge before proceeding.
3. If a `confidence 0.5-0.8` claim matches, surface it as an advisory
   note appended to the agent's brief.

Example: a user types `/cosmos-pro:cosmos write the canvas config`. The
hub matches `write` + `canvas` + `config` against claim triggers and
surfaces:

```
[HARD STOP — claim-7e3a2f9c, confidence 0.91]
Always pull link/point colors from var(--cp-*) via cssVarToRgba; never
hardcode hex or float triplets. Source: 3 prior sessions where hardcoded
colors were caught in critic review and rewritten.
```

The cosmos-render agent acknowledges, then proceeds with that constraint
baked in from the start.

## Key decisions

1. **Auto-capture writes claims immediately (active status).** The
   `/cosmos-pro:learn` command reviews retroactively, not prospectively.
   Captured knowledge is available in the next session without waiting
   for review.

2. **Temporal decay applies to both alpha and beta**, preserving the
   ratio. A claim that was 80% confident six months ago and never
   consulted should have lower absolute certainty but the same relative
   confidence.

3. **Confidence > 0.8 overrides static instructions.** The hub surfaces
   high-confidence claims as hard stops. This is the mechanism by which
   learned behavior supersedes documentation. It requires multiple
   sessions of validation to reach.

4. **Cross-plugin linking is a one-way SBERT query, not a sync.** A
   cosmos-pro claim never overrides a vie-design claim; it just surfaces
   the related one for human review.

## Common mistakes

- Running `/cosmos-pro:learn` after every trivial session. Reserve for
  substantial work where claims were consulted or pain points solved.
- Auto-capturing trivial fixes (typo, import order). Assessment criteria
  exist to prevent knowledge base bloat.
- Ignoring temporal decay. Claims unused for months may reflect outdated
  practices (e.g., a claim about cosmos.gl v1 API that hasn't been
  consulted since the v2 migration). The decay forces validation.
- Skipping the dedup hash check. Without it, the same fix captured twice
  creates duplicate claims that fragment confidence tracking.
- Letting recipe drift: when a session finds a new pattern, capturing
  the claim isn't enough — the relevant recipe in `recipes/` may need
  updating too. The `/cosmos-pro:learn` Phase 3 review should call out
  recipes that are referenced by claims with stale confidence.

## Related patterns

- The theseus-pro `/learn` command (the prior art).
- The hardcoded-colors pain point: this is the canonical example of why
  the loop exists. Captured as a seed claim in `knowledge/claims.jsonl`
  with high initial confidence.
