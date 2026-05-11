# Engineers Mindset (orchestration profile)

`engineers-mindset` is a registry-level harness profile that makes coding
agents solve before they defer. It is a **policy**, not a skill: it changes
run rules before the agent thinks, instead of relying on the agent to opt in.

## Registry fields

- `name`: `engineers-mindset`
- `kind`: `orchestration_profile`
- `default`: enabled
- `priority`: high
- `applies_to`: `codex`, `claude_code`, `cursor`, `github_app`, `cli`, `custom_agent`
- `watches`: `deferral_attempt`, `clarification_attempt`, `test_failure`, `tool_failure`, `unknown_api`, `ambiguous_task`, `stale_docs`, `conflicting_evidence`, `repeated_failure`
- `effects`: require internal research, require browser research when external reality matters, require bounded attempt, require default decision, require deferral ledger, activate concise output
- `writeback`: postmortem candidate, routing hint, source note, validator recommendation, failed assumption, working default, learning patch

## When it activates

Always on by default. Escalates on any of these signals:

- The agent is about to ask a broad clarification question.
- The agent is about to say it is blocked, unclear, impossible, risky, or lacking context.
- A tool, test, install, build, migration, or API call fails.
- The task references an unfamiliar framework, error, package, or code path.
- The plan contains vague verbs like "wire up," "figure out," "investigate," or "handle edge cases."
- Local docs, code, traces, and behavior disagree.
- The task is ambiguous but has a reversible default path.
- The model has already tried once and produced no concrete progress.

User can say "engineering" to increase intensity. The profile is on without
that signal too.

## What it forces

Internal loop: **Search. Try. Decide. Report.**

Required before deferral, in order:

1. **Internal research.** Codebase maps, nearby files, tests, docs, ADRs,
   traces, postmortems, prior run outcomes, issue/PR history, relevant
   Context Artifacts.
2. **External research.** Theseus browser when local graph is thin, current
   behavior matters, dependency behavior is unclear, or the error points
   outside the repo.
3. **Bounded attempt.** Small reversible experiment, reproduction of the
   issue, inspection of a specific boundary, minimal patch, or validation
   of one specific claim.
4. **Default decision.** The safest useful next action unless a true
   blocker exists.

Only then may the run ask the user or mark itself blocked.

## Browser protocol

Order of preference for engineering ambiguity:

1. **GitHub source, issues, PRs, releases, examples, discussions.** Use
   exact strings, qualifiers (`repo:`, `language:`, `path:`), boolean
   operators, regex search.
2. **Stack Overflow / Stack Exchange** for error-shaped problems, weird
   version interactions, "this exact stack trace" cases. Use
   domain-restricted browser search rather than only the API.
3. **Official docs and release notes.** First when the issue is API
   contract, security, auth, billing, platform behavior, deployment,
   legal/compliance, or current-version behavior.
4. **Broader web, blogs, benchmarks, papers.** When the prior tiers do not
   resolve.

Sources are recorded in the postmortem ledger. The user-facing response
does not become a bibliography unless the user asked for research output.

## Architectural Discipline Gates

Two checks that fire alongside the Deferral Gate. The deferral gate stops
the agent from quitting too soon. These two stop the agent from grinding
in the wrong place for too long. Both are real lessons from real
sessions; see the codified cases below.

### Wrong-Layer Check

**Trigger:** any of these signals fires:

- Two consecutive bugs in the same file or module within one task.
- Each bug fix produces a new bug in an adjacent file or layer.
- The patch is growing the surface area (more imports, more migrations,
  more conditional flags, more schema drift).

**Required pause:** before writing patch 3, answer in one paragraph:
**am I working at the right layer?** Not "is this bug fixable" (assume
it is). The question is whether the layer itself is wrong for this
problem.

If the answer is "wrong layer," escalate: write 2-3 sentences naming
the right layer and pivot. Do not continue patching the wrong one.

Cases this caught (after the fact, before being encoded):

- **Refs visibility, 2026-05-10.** Spent a session chasing schema drift,
  missing CLI flags, and ORM/DB type mismatches inside a Django + Postgres
  + Memgraph ingest pipeline. The right layer was `redis.hset()`. The
  whole pipeline was unnecessary for static reference content. See
  `scripts/push_refs_to_redis.py` in the Index-API repo — 150 lines
  replaced a multi-file feature.

## Deep Research Protocol (plan mode only)

This protocol activates when the orchestrate backend selects `mode=plan`
AND any of the engineers-mindset escalation signals fire. It is a
scaled-down version of the 21st.dev deep-researcher pattern, shaped as a
*protocol the agent follows*, not as a separate agent. Treat it as a tool.

Inputs:

- `topic`: one-sentence research question (mirrors the user's request).
- `scope`: prior art, current behavior, anti-pattern, or all three.

Procedure (bounded, in order):

1. **Three WebSearch queries**, one per scope axis:
   - Prior art: "how have others solved <topic>?" (favor GitHub source, READMEs, ADRs).
   - Current behavior: "what does <library/api> do today?" (favor official docs, release notes).
   - Anti-pattern: "what fails with <topic>?" (favor Stack Overflow, postmortems, issues).
2. **Three WebFetch reads**, one per query, pulling the top
   information-dense result (prefer a single source-of-truth file over a
   marketing page).
3. **Synthesis** into a four-part record:
   - **Sources**: URL + 1-line summary per fetch.
   - **Claims**: 3-5 grounded statements, each tagged with its source.
   - **Contradictions**: any pair of sources that disagree, named explicitly.
   - **Gaps**: what the three sources did not cover that the plan still needs.
4. **Handoff** to the planning skill: the synthesis maps directly into
   `Codebase Grounding` (sources + claims) and `Epistemic Ledger`
   (contradictions + gaps) sections of the planning-theorem artifact.

Budget: 6 web round-trips per invocation, hard cap. If the topic is
unresolved after 6, escalate by widening the next-iteration scope, not by
adding more queries inside the current one.

Outputs to the user-facing response: zero unless the user asked for
research. The synthesis lives in the plan artifact. The agent's reply
stays in concise-action shape (Action / Finding / Next / Need).

In execute mode this protocol does NOT activate; the regular Browser
Protocol above applies.

## Deferral Gate

Installs a guard before any of these state transitions:

- `ASK_USER`
- `RUN.DEFERRED`
- `RUN.FAILED`
- `BLOCKED`
- `NEEDS_CONTEXT`
- `NEEDS_HUMAN_DECISION`

The guard is satisfied by an `ENGINEERING_PASS` record. That record contains
only:

- Internal sources checked.
- External sources checked.
- Smallest attempted experiment, or the reason no experiment was safe.
- Current best default action.
- Exact remaining blocker.
- The one specific user input needed, when needed.

### Allowed deferrals

- Missing credentials or private access.
- Destructive operation needs approval.
- Product preference cannot be inferred.
- Legal, privacy, security, or safety boundary.
- Environment outage after a recovery attempt.
- No safe sandbox exists.
- User explicitly requested confirmation.

### Disallowed deferrals

- "Ambiguous."
- "Complex."
- "Unfamiliar."
- "Docs are missing."
- "Multiple possible approaches."
- "Tests failed."
- "Need more context" before context search.
- "Could be risky" without naming the risk and the safe default.

### Invariant

> Hard is not blocked. Unknown is not blocked. Only irreducible blockers are blocked.

## State-machine transitions

This profile inserts the following transitions around difficult work:

- `DIFFICULTY.DETECTED`
- `ENGINEERS_MINDSET.ACTIVATED`
- `INTERNAL_RESEARCH.COMPLETED`
- `BROWSER_RESEARCH.COMPLETED`
- `BOUNDED_ATTEMPT.COMPLETED`
- `DEFAULT_PATH.SELECTED`
- `DEFERRAL_GATE.CHECKED`

`ASK_USER`, `RUN.DEFERRED`, and `RUN.FAILED` are invalid unless
`DEFERRAL_GATE.CHECKED` passes.

## Brief posture (short form)

When this profile is active, the Context Brief carries this block under
"Engineering posture":

```
- Search internal first (codebase map, tests, traces, prior runs, ADRs).
- Search external if reality may live outside the repo (GitHub > SO > docs > web).
- Run one bounded reversible experiment before declaring blocked.
- Pick the safest useful default unless a true blocker exists.
- Two bugs in the same module = stop and ask "right layer?" before patch 3.
- Deferral allowed only for: access, destructive op, product preference,
  legal/privacy/safety, env outage after recovery, no safe sandbox,
  explicit user request. NOT for ambiguity, complexity, unfamiliarity,
  missing docs, multiple approaches, test failure, vague risk.
```

## Composition

Pairs with `concise-action` (output profile). Engineers-mindset shapes
*how the agent thinks and acts*. Concise-action shapes *how it reports*.
Both are on by default.
