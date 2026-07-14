---
name: writing-engineering
description: This skill should be used when the user says "writing engineering", "writing mode", "prose mode", "write tight", "write plain", "engineered writing", or invokes /writing-engineering; and at Harness synthesis, report, handoff, coordination, and postmortem boundaries. It includes the pinned 1918 Elements of Style ruleset inside the existing Writing Engineering pack. "normal mode" turns it off.
---

# Writing Engineering

Writing Engineering is the prose pack for Theorem's Harness. It is a persistent
output mode in the same family as `/caveman`: once active it shapes every
response until it is turned off. Caveman compresses by dropping grammar; Writing
Engineering compresses by craft and keeps grammar intact. It applies at the
synthesis boundary and records receipts through `prose-check`.

## Activation

- On by default at session start, in the `plain` register, through the
  `sessionstart-writing-engineering` hook.
- Assert or switch register on demand: "writing engineering", "writing mode",
  "prose mode" set `plain`; "spare" or "terser" set `spare`; "wire" sets `wire`;
  or run `/writing-engineering [plain|spare|wire]`.
- Off on "normal mode", "stop writing engineering", or "writing engineering
  off". Re-arm with any activation phrase. The off state is recorded per session,
  so it survives a resume.

## Persistence

ACTIVE EVERY RESPONSE once active. Apply the register to all user-facing prose
now and on every later turn. No revert after many turns. No filler drift. Still
active if unsure. Off only on the explicit off-switches above.

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
- ruleset version and pinned Elements of Style provenance
- complete boundary/project/user/session register override chain
- labeled EOS-10 through EOS-13 findings and accepted exact-span exceptions

Statuses:

- `shadow`: receipt only, no behavior change.
- `advisory`: receipt plus violations for self-revision context.
- `validated` and `canonical`: one model revision pass when hard axes fail;
  hard axes never silently rewrite text.

The pack publishes at `advisory` when the current run carries a
`writing_engineering_status`; the stop hook falls back to `shadow` when that
run detail is absent. Imported Elements findings remain soft axes; fidelity and
em-dash behavior retain their existing hard-axis treatment.
Disabled or malformed policy emits a refused Writing Engineering receipt rather
than silently disappearing.

## Provenance

The pinned 1918 catalog extends this pack rather than creating a parallel
Elements capability. Read `references/elements-of-style-1918.md` for all 18
rules, enforcement modes, source hashes, override precedence, and exception
policy. Other distilled sources remain part of the pre-existing Writing
Engineering corpus; protected prose samples are stylometry only.
