# End-of-Session Learning Capture

Every productive session leaves scar tissue: rules the agent should have
followed, methods that worked, anti-patterns that bit. Without a capture
mechanism, those lessons die in the transcript and the next session
repeats the same mistakes.

This contract defines:

1. What counts as a "learning"
2. Where learnings get stored
3. When the capture hook fires
4. How learnings get promoted to harness-level rules

The harness-side registry shape lives at
`apps/orchestrate/registry/learnings.py` (`OrchestrateLearningSpec`,
`learning_index`).

## Scope: what counts as a learning

Five recognized kinds:

| Kind | Definition |
|---|---|
| `rule` | A constraint the agent should follow next time (e.g. "two bugs in same module = check the layer before patch 3") |
| `method` | A repeatable procedure that worked (e.g. "license-check a vendored repo with `gh api repos/<owner>/<repo> --jq .license`") |
| `postmortem` | A failure with root cause analysis (e.g. "Django schema drift on `description` cost 3 turns; documented in `0096_instant_kg_schema.py`") |
| `anti_pattern` | A move that looked correct but was wrong (e.g. "presenting 3-option tables where 2 options are partial fixes") |
| `gotcha` | A surprise the codebase has that nobody learns from docs (e.g. "`.iterator(chunk_size=...)` materializes the full result set when `DISABLE_SERVER_SIDE_CURSORS=True`") |

Not learnings:

- Successful normal work ("I shipped the feature") — that's just work, not a lesson
- Personal preference observations ("user likes brevity") — those belong in memory, not the learnings registry
- Trivia ("this codebase uses X library") — that's documentation, not a learning

## Schema: required vs optional fields

Every captured learning must have:

- **id** (slug): kebab-case identifier, unique within a project
- **title**: one-line summary, under ~80 chars
- **kind**: one of the five above
- **trigger_case**: the real scar that prompted this. Named, specific, falsifiable. **A learning without a trigger is just abstract advice and will be rejected**.
- **rule_short**: one-line action the lesson encodes

Recommended optional fields:

- **rule_long**: longer explanation when the short form needs unpacking
- **evidence**: file paths, commit SHAs, log excerpts that ground the trigger
- **domain_tags**: free-form tags for filtering (`django`, `redis`, `thg`, `plugins`, `frontend`)
- **encoded_in**: paths where this learning is canonically stored — usually `docs/learnings/<date>-<slug>.md` plus any promoted spec doc
- **captured_at**: ISO-8601 timestamp
- **session_signature**: the immutable Theorem signature linking back to the run

## Storage: file-first, registry-aware

Canonical storage is one markdown file per learning:

```
docs/learnings/YYYY-MM-DD-<slug>.md
```

File template:

```markdown
# <title>

**Kind:** <rule|method|postmortem|anti_pattern|gotcha>
**Captured:** <ISO-8601>
**Session signature:** `<theorem run signature>`
**Domain tags:** <comma-separated>

## Trigger

<the real scar that prompted this lesson — specific, falsifiable>

## Rule

<one-line action>

<optional longer explanation>

## Evidence

- <file path / commit SHA / log line>
- ...

## Encoded in

- `docs/learnings/YYYY-MM-DD-<slug>.md` (this file)
- (optional) `theorems-harness/references/<SPEC>.md` if promoted
```

Files in `docs/learnings/` are committed to the project repo, so
learnings travel with the codebase and survive across machines.

## When the capture hook fires

The Stop hook (`~/.claude/hooks/capture-learnings.sh`) gates on real
activity to avoid noise:

1. Hook fires on every `Stop` event (model finished responding).
2. Hook checks: were commits made since this session started?
   - Reads sentinel `$THEOREM_STATE_DIR/learnings/<session_id>.head`
   - Compares stored HEAD SHA against current HEAD SHA
3. If no new commits: exit 0 silently. No prompt.
4. If new commits AND no capture-already-done sentinel: exit 2 with
   `asyncRewake=true`, wakes the model with a rewake message asking
   it to enumerate candidate learnings.
5. Model drafts to `docs/learnings/` (asks user first by default, can
   be configured to auto-encode via `LEARNINGS_AUTO_ENCODE=1`).
6. Capture-done sentinel created so subsequent Stops in the same
   session don't re-prompt.

## Capture policy: ask vs auto-encode

Default: **ask**. The agent drafts the learning(s) in the response,
shows them to the user, and writes the file(s) only after the user
confirms.

Override: set `LEARNINGS_AUTO_ENCODE=1` in env or
`learningsAutoEncode: true` in `~/.claude/settings.json` to skip the
confirmation and write directly. Use this only when you trust the
agent's judgment about what's material — for most sessions, the ask
gate prevents noise files.

## Promotion: when a learning becomes a harness rule

A learning that recurs across sessions deserves promotion to a
harness-level spec. The Wrong-Layer Check and Goal-Completion-or-
Options rule shipped to `ENGINEERS_MINDSET.md` are exactly this:
session-level scars promoted to per-turn brief content.

Promotion criteria:

1. The same trigger fires across multiple sessions/projects.
2. The rule has caught at least one real failure after promotion (not just been documented).
3. The rule fits in the existing harness contract (engineers-mindset, profile, registry, etc.).

Promotion is manual: the user or agent edits the target spec file
(`ENGINEERS_MINDSET.md`, `PROFILES.md`, etc.) and references the
original `docs/learnings/<date>-<slug>.md` as the case study. The
file-level learning stays in place; promotion adds a second
`encoded_in` location.

## Anti-pattern: don't auto-encode every observation

The capture hook is intentionally narrow. Things it should NOT
capture:

- "I learned the codebase has a Django backend" — discovery, not learning
- "I successfully ran the tests" — work, not learning
- "The user prefers concise answers" — preference, belongs in memory
- "I shipped commit X" — git log already records this

The bar is: would a future agent benefit from seeing this as a rule
or pattern, independent of this specific task? If no, skip it.

## Why this lives in the harness

Three reasons learnings belong here and not in a personal scratch
file:

1. **Cross-session memory.** The harness brief surfaces relevant
   learnings the same way it surfaces refs and profiles.
2. **Promotion path.** Learnings have a defined route to
   `ENGINEERS_MINDSET.md` and other spec docs.
3. **Schema enforcement.** The `OrchestrateLearningSpec` dataclass
   forces every learning to have a trigger — preventing abstract
   advice that doesn't survive contact with future work.

## Runtime practice and Compound diagnostics

The Harness runtime also turns selected Superpowers-derived practices into
receipt-backed outcomes and episodic memories. These read surfaces inspect that
loop for one admitted tenant, project, and run:

| Operation | GraphQL | Flat MCP | Meaning |
|---|---|---|---|
| Status | `practiceStatus` | `practice_status` | Bounded completeness summary with exact missing-outcome and missing-episode keys. |
| Explain | `practiceExplain` | `practice_explain` | Selection, outcome, learning-state, episode, and Compound-close lineage. |
| Compound close receipt | `practiceCloseReceipt` | `practice_close_receipt` | Exact receipt proving the Compound close hook ran. It does not alone prove practice attribution completed. |

Treat `closed_run_harvested=true` as the complete-run oracle. It requires a
Compound close receipt, an outcome for every selected practice, a matching
persisted episode for every outcome, no missing evidence keys, and an
untruncated diagnostic result. A Compound close receipt by itself is narrower:
it proves only the close hook, not the downstream outcome/episode harvest.

These diagnostics derive tenant and project from admitted identity. Supply only
the run id and an optional bounded limit; never use caller-provided tenant or
project fields as authority. A false status is actionable degradation, not an
empty successful run: inspect the missing keys with `practice_explain`, repair
or retry attribution, and preserve the original receipts.
