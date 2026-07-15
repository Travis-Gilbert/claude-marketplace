# Memory and Episode Capability Surface

Theorem's Harness exposes one tenant-bound memory substrate through typed
GraphQL, flat MCP compatibility tools, ambient episode capture, and an operator
retro-import path. Prefer GraphQL for agent reads and writes. Use flat tools only
when GraphQL is unavailable, when the capability has no typed field, or when
diagnosing compatibility.

## Intent mapping

| Intent | GraphQL field | Flat MCP fallback |
|---|---|---|
| Search active memory | query `memory(...)` | `recall` |
| Read one document by id | query `memoryDoc(id)` | `query_data` with the document `id`; there is no standalone memory-get tool |
| Traverse memory relations | nested `MemoryDoc.links` or `MemoryDoc.related(...)` | `relate` |
| Search the cold archive | query `memoryArchive(...)` | `self_recall_archive` |
| Remember a document | mutation `rememberMemory(input)` without `outcome` | `remember` |
| Encode feedback or an outcome | mutation `rememberMemory(input)` with `outcome` | `encode` |
| Revise a document | mutation `reviseMemory(id, input, reason)` | `self_revise` |
| Soft-delete a document | mutation `forgetMemory(id, reason)` | `forget` |
| Create a cross-actor handoff | mutation `createHandoff(toActor, payload, title)` | `handoff` |

The typed mutation deliberately uses one `rememberMemory` field for plain
memory and outcome-bearing encode semantics. The presence of `input.outcome`
selects encode. Do not search for a second GraphQL encode mutation.

Some stable flat tools do not have a one-for-one field on the Memory GraphQL
object:

- Use `observe` for a non-consuming context observation.
- Use `self_note` for typed actor memory and `self_archive` for explicit cold-tier
  archival.
- Use `retrieve_memory`, `turn_start`, and `evidence_bundle` for their bounded
  Data API and handoff packets when those tools are advertised.
- Prefer GraphQL `dataRetrieve`, `dataRecord`, and the other `data*` fields over
  `query_data` for general Data API access.

Call `graphql_introspect` before assuming any field exists. A GraphQL-default
server may hide covered flat tools from `tools/list`; hidden does not mean the
capability disappeared.

## Scope and admission

- Treat the authenticated connection as the tenant authority. Memory GraphQL
  fields do not accept a tenant argument. Never copy a user-supplied tenant id
  into a memory call.
- Treat the admitted project as a hard boundary. Pass `projectSlug` only to
  narrow within the admitted project, never to cross projects. A response whose
  project does not match the admitted project is a refusal or server defect, not
  reusable context.
- Keep actor, session, run, and surface identity attached to writes. Do not use
  metadata to impersonate a different principal.
- Do not merge memory results across tenants or projects, even when titles,
  hashes, or repository basenames match.

## Provenance and ranking evidence

Read the typed `MemoryDoc` evidence before using a result:

| Field | Meaning |
|---|---|
| `projectSlug` | Project boundary attached to the document. |
| `provenance` | General source and surface provenance. |
| `rankSignals` | Why retrieval ranked this document, including the available vector, graph, recency, or fitness signals. |
| `episodeProvenance` | Session, run, project, branch, exchange, source event/surface, tool receipts, source artifacts, practices, outcomes, and reasoning-strategy references. |
| `episodeProvenanceContentAddress` | Stable address of the normalized provenance envelope. |

Keep the score and `rankSignals` with every citation. A high score without an
explanation is not enough to claim why an episode was selected. Request bounded
results with `limit`; hydrate full content only for the few ids needed for the
current task.

```graphql
query RecallGroundedMemory {
  memory(query: "atomic warm learning", projectSlug: "Theorem", limit: 8) {
    id
    kind
    summary
    projectSlug
    score
    rankSignals
    episodeProvenance
    episodeProvenanceContentAddress
    related(maxHops: 1) { id kind summary projectSlug }
  }
}
```

```graphql
mutation EncodeVerifiedOutcome {
  rememberMemory(input: {
    kind: "solution"
    content: "Warm learning commits invocation, posterior, count, and receipt atomically."
    outcome: "positive"
    signal: "reused"
    tags: ["memory", "atomicity"]
    derivationRef: "proof:hcm013-warm-import"
    confidence: 0.98
  }) {
    id
    kind
    outcome
    projectSlug
    provenance
  }
}
```

## Episode capture, opt-out, and deduplication

Ambient episode capture is not a second memory system and not a manual agent
tool. The runtime binds an episode to tenant, project, actor, session, run,
branch, exchange, source event/surface, tool receipts, source artifacts,
practices, outcomes, and reasoning strategies. Normalized provenance is content
addressed, so replaying the same accepted episode returns the same identity.

Honor explicit opt-out and the canonical marker everywhere it appears:

```text
<INSTRUCTIONS-TO-EPISODIC-MEMORY>DO NOT INDEX THIS CHAT</INSTRUCTIONS-TO-EPISODIC-MEMORY>
```

Do not summarize, relocate, or encode opted-out content to evade the marker.
Do not create a near-duplicate document when a content-addressed capture reports
that it was deduplicated.

## Retro-import and reentrancy

Retro-import is an operator/runtime command, not an MCP verb. In a Theorem source
checkout, the explicit operator entrypoint is `theorem-retro-import sessions`.
Do not invent an agent tool for it.

Apply these guardrails when operating or evaluating an import:

- Hash the full accepted JSONL stream before bounded transcript sampling.
- Detect opt-out before extracting or warming any episode.
- Bind imports to canonical tenant and project identity; same-basename projects
  remain distinct.
- Treat per-phase receipts as the recovery cursor. Resume a partial import from
  persisted digest evidence instead of rebuilding a different episode.
- Expect repeated import and RedCore reopen to be idempotent.
- Commit invocation observations, posterior updates, warm-count nodes/edges, and
  the session warm receipt in one durable batch. A duplicate invocation key
  refuses before writing; a failed batch leaves no partial learning; one retry
  records one observation.

## Practice-promotion firewall

Keep a raw episode as an episode. Do not rewrite a canonical practice, publish a
skill, or strengthen an Ensemble prior from one anecdote.

The default practice-promotion gate requires evidence from the same tenant,
project, practice graph content address, and practice id, with at least:

- 3 distinct content-addressed episodes,
- 3 distinct runs,
- 2 distinct sessions,
- 2 positive outcomes, and
- a positive rate of 2/3.

Promotion reloads authoritative episode evidence and writes its receipt and
support edges atomically. Treat a pending or refused promotion as evidence, not
as permission to promote manually. Inspect run replay, Ensemble selection, and
promotion receipts; do not fabricate practice diagnostics or promotion tools.

## Completion discipline

- Report a memory write only after receiving its document id and provenance.
- Report recall as bounded retrieval, not as exhaustive tenant knowledge.
- Report a retro-import as complete only when its phase receipts and durable
  reopen/retry proof agree.
- Report practice promotion only from a committed promotion receipt whose cited
  evidence passes the declared gate.
