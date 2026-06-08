---
name: writing-engineering
description: Use when synthesis, reports, coordination packets, handoffs, postmortems, or agent-to-agent messages should be written with the encoded writing-engineering prose pack: plain, spare, or wire register with fidelity-preserving compression.
---

# Writing Engineering

Writing Engineering is the prose pack for Theorem's Harness. It compresses by
craft, not by deleting grammar. It applies at the synthesis boundary and records
receipts through `prose-check`.

## Core Directive

Write plain. Every word earns its place. Short declarative sentences carry the load; one longer sentence may land a point. Active voice. Concrete nouns, strong verbs, few adverbs. No throat-clearing, no pleasantries, no hedging, no filler. Keep every fact, identifier, number, file path, and error string exact. Code blocks, commit messages, and PR bodies pass through untouched. For security warnings, irreversible actions, and ordered sequences, spend the words: full grammar, no compression. No em dashes. Registers: plain (default, humans), spare (tighter), wire (agent-to-agent). "normal mode" turns it off.

## Registers

| Register | Audience default | Targets |
|---|---|---|
| `plain` | User-facing reports and chat | `clutter_hits` 0; passive <= 10% of sentences; adverbs <= 1.5 per 100 words; sentence mean 12-18 words; stdev >= 4; full sentences |
| `spare` | Briefs and postmortems | clutter 0; passive <= 5%; adverbs <= 0.8 per 100 words; mean 7-12; rare fragments; stdev >= 3 |
| `wire` | Coordination, intents, reflections, records, handoff summaries, mention text | clutter 0; passive <= 5%; mean 5-9; abbreviations only for prose words; article drop only when unambiguous |

## Boundary Rules

- Default user-facing chat, run reports, and final summaries to `plain`.
- Default coordination messages, intents, reflections, records, handoff payload
  summaries, and mention text to `wire`.
- Use `spare` only when the user asks for terse prose or a stored preference
  says so.
- Auto-clarity overrides every register for security warnings, irreversible
  actions, ordered sequences, and genuine ambiguity.
- Never abbreviate code symbols, function names, API names, file paths, error
  strings, quoted strings, or numbers with units.
- Preserve fenced code blocks, commit messages, and PR bodies byte-for-byte.

## Receipt Contract

At synthesis and report boundaries, `prose-check` records:

- token estimate with tokenizer name `cl100k_base_estimate`
- fidelity preservation for source identifiers
- passive, adverb, clutter, nominalization, sentence-shape, readability, and
  em-dash axes
- code spans and clarity-break spans excluded from scoring
- content hash of the pack payload

Statuses:

- `shadow`: receipt only, no behavior change.
- `advisory`: receipt plus violations for self-revision context.
- `validated` and `canonical`: one model revision pass when hard axes fail;
  hard axes never silently rewrite text.

## Provenance

Distilled from Strunk 1918, Orwell's six rules, AP wire economy conventions,
Bryson-style redundant-pair rules, Zinsser clutter principles, and
Theorem-specific harness output pairs. Public-domain and distilled-rule sources
are used as rules; protected prose samples are stylometry only.
