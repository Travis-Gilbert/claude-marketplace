# PATTERNS-compound-learning.md

How the compound learning layer captures, refines, and compounds
knowledge from work sessions into a growing epistemic asset.

## Problem

Static plugin instructions degrade over time. Patterns that worked six
months ago may be wrong today. Corrections given in one session are
forgotten in the next. The compound learning layer solves this by
auto-capturing solutions, tracking claim confidence via Bayesian updates,
and surfacing the right knowledge at the right time.

## When to Use

- Setting up compound learning infrastructure for a plugin
- Debugging why auto-capture missed a solve
- Tuning claim confidence thresholds
- Reviewing the /learn pipeline output
- Linking claims across plugins

## The Pattern

### Auto-Capture Trigger Signals

The agent watches for these signals after a debugging or fixing sequence:

```
Explicit: "capture this", "document this fix"
Implicit: "that worked", "it's fixed", "working now", "problem solved",
          "that was the issue", "nice, that did it"
```

Assessment criteria (capture only if at least one is true):
1. Root cause required investigation (not obvious from the error message)
2. The fix involved understanding something non-obvious about the system
3. The pattern is likely to recur in future sessions
4. The problem affected more than one file or component

Skip: typo fixes, one-line config changes, import ordering, obvious
missing dependencies.

### Solution Doc Format

```markdown
# [Brief problem description]

**Date:** 2026-04-13
**Domain:** theseus.[domain]
**Agents involved:** [agent-1], [agent-2]

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

### Claim Extraction

Each claim is a single imperative statement scoped to one actionable
practice.

Good claims:
- "Always split read and write serializer classes when supporting both POST and PATCH"
- "Never train a GNN on fewer than 100 nodes"
- "Use -1.0 imputation for missing KGE features in the learned scorer"

Bad claims:
- "DRF is good" (not actionable)
- "Fix the serializer bug" (not a practice)
- "Always use DRF and split serializers and validate fields" (multiple practices)

Domain tagging: match the claim to the agent domain map. A claim about
GNN training gets `theseus.gnn`, a claim about SBERT gets `theseus.nlp`.

Deduplication: `claim_id = sha256("[plugin]:[lowercased text]")[:12]`.
Check against existing IDs before appending.

### Bayesian Confidence Lifecycle

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
- `> 0.8`: Claim overrides static instructions when conflicting
- `0.5 - 0.8`: Claim is a suggestion, static instructions win on conflict
- `0.3 - 0.5`: Claim needs attention; may be outdated
- `< 0.3`: Candidate for retirement

### /learn Review Queue

Phase 3 of the /learn command presents these categories:

```
1. Confidence changes (report only, no action)
   claim-007 strengthened: 0.71 -> 0.79 (suggestion accepted)

2. Auto-captured claims (confirm / edit / retire)
   [NEW] "Use neighbor averaging for cold-start KGE predictions"
   Domain: theseus.knowledge_rep | Confidence: 0.67

3. New tensions (resolve / defer)
   Tension: claim-003 vs claim-018
   "Always use FAISS" vs "BM25 is sufficient for < 1000 objects"

4. Attention needed (keep / retire / edit)
   claim-012 (confidence 0.38): may be outdated
```

### Cross-Plugin Linking

The `EXTERNAL_PLUGINS` config maps plugin names to absolute paths for
plugins outside the main repo:

```python
EXTERNAL_PLUGINS = {
    "theseus-pro": os.environ.get(
        "THESEUS_PRO_PATH",
        str(Path.home() / "code" / "Index-API" / "theseus-pro")
    ),
}
```

The cross-linker reads all plugins' `claims.jsonl` and finds semantic
neighbors via SBERT embedding similarity. A theseus-pro claim about
graph embeddings might link to an ml-pro claim about feature engineering.

Cross-plugin links are stored as `related_claims` entries with a
`plugin:claim_id` format: `"ml-pro:a1b2c3d4e5f6"`.

## Key Decisions

1. Auto-capture writes claims immediately (active status). The /learn
   command reviews retroactively, not prospectively. This means captured
   knowledge is available in the next session without waiting for review.
2. Temporal decay applies to both alpha and beta, preserving the ratio.
   A claim that was 80% confident six months ago and never consulted
   should have lower absolute certainty but the same relative confidence.
3. Confidence > 0.8 overrides static instructions. This is the mechanism
   by which learned behavior supersedes documentation. It requires
   multiple sessions of validation to reach this threshold.

## Common Mistakes

- Running /learn after every trivial session. Reserve for substantial
  work sessions where claims were consulted or problems solved.
- Auto-capturing trivial fixes. The assessment criteria exist to prevent
  knowledge base bloat.
- Ignoring temporal decay. Claims that go unused for months may reflect
  outdated practices. The decay forces periodic validation.
- Skipping the dedup hash check. Without it, the same fix captured twice
  creates duplicate claims that fragment confidence tracking.

## Related Patterns

- PATTERNS-iq-measurement.md (Learning axis measures compounding effect)
