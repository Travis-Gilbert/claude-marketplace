---
name: symbolic
description: Neuro-symbolic reasoning over the RustyRed substrate. Use when the user wants to derive facts from rules, forward-chain over the graph, apply a Datalog ruleset, score how reliable or trustworthy a source is, or decide whether a validation or check is worth running. Triggers on "derive facts", "apply these rules", "forward chaining", "Datalog", "what follows from", "how reliable is this source", "how trustworthy is", "source reliability", "is it worth validating", "is the check worth it", and "expected value of checking". This is the layer behind belief revision and source-independence reasoning.
---

# symbolic

The neuro-symbolic layer: deterministic rule derivation plus probabilistic
judgments over the graph. It answers three questions the plain read tools
cannot: what new facts follow from a ruleset, how much a given source should be
trusted, and whether a validation is worth its cost.

This is the machinery behind belief revision (facts derived from rules, then
revised as confidence shifts) and source-independence reasoning (weighing
sources by reliability rather than counting them). It complements the
graph-read tools: those return what is asserted; these reason about what should
follow and what to believe.

## When To Fire

- "Derive the new facts from these rules over the graph"
- "Forward-chain this ruleset / apply this Datalog program"
- "What follows from what we already know?"
- "How reliable is this source?" / "Should I trust this provenance?"
- "Is it worth running this validation before I commit to the result?"
- "What is the expected value of checking X?"

Not a fit:
- Reading already-asserted facts: use `rustyred_thg_graph_query`.
- Structural ranking of code or nodes: use the algorithm tools / `compute_code`.
- Free-text similarity: use `rustyred_thg_vector_search`.
- Reading a persisted head/model/domain/claim-type verification track record:
  use GraphQL `calibrationReliability` or flat `calibration_reliability` under
  the canonical contract in `references/VERIFICATION_CAPABILITY.md`.

## Tools

| Tool | When | Notes |
|---|---|---|
| `rustyred_thg_symbolic_datalog_derive` | Derive new facts from rules | Forward-chains a Datalog ruleset over current graph facts and returns the derived facts. Deterministic: same graph plus same rules yields the same derivations. This is the "apply these rules" verb. |
| `rustyred_thg_symbolic_probabilistic_source_reliability` | Score a source | Returns a probabilistic reliability score for a source, given its track record on the graph. Use it to weight evidence by trustworthiness rather than treating every source equally. |
| `rustyred_thg_symbolic_probabilistic_expected_value` | Decide whether to validate | Decision-theoretic value of running a check: weighs the information a validation would yield against its cost. Use it to answer "is this check worth running?" before spending the effort. |

## Example Calls

Forward-chain a ruleset:

```json
{
  "tool": "rustyred_thg_symbolic_datalog_derive",
  "rules": [
    "depends_on(X, Z) :- depends_on(X, Y), depends_on(Y, Z)."
  ]
}
```

Score a source:

```json
{
  "tool": "rustyred_thg_symbolic_probabilistic_source_reliability",
  "source_id": "source:civic-atlas-feed"
}
```

Value a validation before running it:

```json
{
  "tool": "rustyred_thg_symbolic_probabilistic_expected_value",
  "validation": "verify_citation",
  "target": "claim:budget-figure-2026"
}
```

## Standard Flow

1. **Derive, then read.** When the user wants implied facts, call
   `datalog_derive` with the rules. The derived facts are computed from current
   graph state; re-run after the graph changes rather than caching stale
   derivations.
2. **Weight sources before trusting them.** When provenance matters, call
   `source_reliability` to get a score, and let that score (not source count)
   drive how much weight an assertion gets.
3. **Value the check before paying for it.** When a validation is expensive or
   optional, call `expected_value` first. If the expected value is low, say so
   and skip the check rather than running it reflexively.

## Output

For `datalog_derive`, report the derived facts and the rules that produced them;
keep the full intermediate fixed-point out of the report unless asked. For
`source_reliability`, report the score and what it implies for weighting. For
`expected_value`, report the value and the recommendation (worth running or
not), with the cost/information tradeoff in one line.

## Anti-Patterns

- Treating `datalog_derive` output as permanent. Derivations follow from
  current facts; revise them when the facts change.
- Counting sources instead of weighting them. Use `source_reliability` so a
  single trustworthy source can outweigh several weak ones.
- Running every validation reflexively. `expected_value` exists so low-value
  checks get skipped, not just measured.
- Reaching for the symbolic layer to read facts that are already asserted; that
  is a plain graph query.
- Feeding rules that reference predicates absent from the graph and then
  reporting an empty derivation as a negative result without checking the
  predicates exist.
- Substituting symbolic source reliability for canonical verifier calibration.
  The symbolic tool scores an arbitrary graph source; `calibrationReliability`
  reads the outcome ledger for one exact head/model/domain/claim-type cell.
