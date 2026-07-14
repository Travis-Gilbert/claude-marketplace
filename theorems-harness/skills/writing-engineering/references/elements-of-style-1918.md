# Elements of Style 1918 Ruleset

Writing Engineering version
`writing-engineering-ruleset-v0.2` incorporates the pinned 1918 catalog from
`obra/the-elements-of-style` commit
`6099c505c2a8eb066f3777f83a97d9d828f7954c`.

## Automated evidence

These rules currently emit checker findings:

| Rule | Heading | Evidence mode |
|---|---|---|
| EOS-10 | Use the active voice | passive-voice heuristic |
| EOS-11 | Put statements in positive form | exact-phrase heuristic |
| EOS-12 | Use definite, specific, concrete language | nominalization heuristic |
| EOS-13 | Omit needless words | deterministic clutter lexicons |

Heuristics are evidence, not semantic certainty. Passive voice, negative form,
and nominalizations can be correct in context.

## Guidance-only catalog

The remaining rules stay available as source-attributed guidance until a
validator can produce defensible evidence:

1. Form the possessive singular of nouns by adding `'s`.
2. In a series of three or more terms with a single conjunction, use a comma
   after each term except the last.
3. Enclose parenthetic expressions between commas.
4. Place a comma before a conjunction introducing a co-ordinate clause.
5. Do not join independent clauses by a comma.
6. Do not break sentences in two.
7. A participial phrase at the beginning of a sentence must refer to the
   grammatical subject.
8. Make the paragraph the unit of composition: one paragraph to each topic.
9. As a rule, begin each paragraph with a topic sentence and end it in
   conformity with the beginning.
14. Avoid a succession of loose sentences.
15. Express co-ordinate ideas in similar form.
16. Keep related words together.
17. In summaries, keep to one tense.
18. Place the emphatic words of a sentence at the end.

Do not present these guidance-only rules as deterministic validator results.

## Overrides and exceptions

Resolve register precedence as boundary default, project, user, then explicit
session. Record the complete override chain. Accept exceptions only with an
exact rule id, UTF-8 byte span, nonblank reason, and project/user/session
authority. Keep code, structured data, safety text, and clarity spans visible
as system exceptions. Never silently rewrite source text.
