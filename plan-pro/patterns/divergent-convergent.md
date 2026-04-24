# Pattern: Divergent → Convergent (in one pass)

Generate broadly, filter rapidly, all in one response. Prevents "first reasonable thing" anchoring.

## Steps

1. Generate 5-8 approaches. Each: one-sentence strategy + one-sentence trade-off.
2. Include at least one unusual option: contrarian, radical simplification, inverted constraint.
3. Score each on 4 axes, one word each (good / ok / bad): fit / ship-time / reversibility / elegance.
4. Pick top 2-3. One-line reason per survivor.

## Template

```
Approaches for <topic>:

A. <strategy> — <trade-off>
   fit=good   ship=ok    reversible=good  elegance=ok
B. <strategy> — <trade-off>
   fit=ok     ship=good  reversible=bad   elegance=good
C. <strategy> — <trade-off>
   fit=good   ship=bad   reversible=good  elegance=good
D. <strategy> — <trade-off>
   fit=bad    ship=good  reversible=good  elegance=ok
E. <strategy> — <trade-off>
   fit=ok     ship=ok    reversible=good  elegance=good

Finalists:
  A — best overall; no single axis is a blocker
  C — highest elegance; accept the ship-time cost
```

## Why 5-8

Fewer than 5 → you didn't diverge enough.
More than 8 → you're brainstorming synonyms, not strategies.

## Include one unusual option

Human bias: pick the safe option. Force at least one contrarian into the pool:
- Radical simplification ("what if we just don't?")
- Inverted constraint ("what if we do the opposite?")
- External delegation ("what if we buy instead of build?")
- Time-box to a smaller slice ("what if we ship 10% of this in a day?")

Even if the unusual option doesn't win, it anchors the comparison. The "safe" option now competes.

## Single-response rule

Do not pause between generating and filtering. The user shouldn't see 5 options and then be asked to pick. The divergent-thinker agent generates AND filters in one response.

Why: users anchor on the first option they see. Showing all 5 unranked invites premature commitment. Showing 2-3 finalists with the divergence reasoning preserves the exploration without dragging the user through it.

## Where to use

- `/brainstorm` — divergent-thinker agent
- Retrofitting: when a plan was clearly picked from the first reasonable option, the retrofitter asks: was divergence run?
- Any feature with ≥3 reasonable approaches

## Where NOT to use

- Single-option features (the user said "add dark mode" — the question is how, not whether)
- Bug fixes (usually one root cause, one fix)
- Mechanical tasks (rename, extract, inline)
