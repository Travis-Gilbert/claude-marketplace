# Code Capability Surface

Theorem's Harness exposes one code capability through two transports. Prefer
GraphQL because its fields separate reads from writes and expose typed revision
provenance. Use flat MCP tools only when GraphQL is unavailable or when
diagnosing flat-tool compatibility.

## Intent mapping

| Intent | GraphQL field | Flat MCP fallback |
|---|---|---|
| Ingest a repository | mutation `ingestCodebase(repo, actor)` | `code_ingest` with `operation: "ingest"` |
| Reindex a repository | mutation `reindexCodebase(repo, actor)` | `code_ingest` with `operation: "reindex"` |
| Read index status | query `codeStatus(repo)` | `compute_code` with `operation: "kg_status"` |
| Search indexed code | query `codeSearch(query, repo, limit)` | `compute_code` with `operation: "search"` |
| Assemble symbol context | query `codeContext(query, nodeId, repo, limit)` | `compute_code` with `operation: "context"` |
| Explain a symbol or edge | query `codeExplain(nodeId, query, repo)` | `compute_code` with `operation: "explain"` |
| Compile a specification | query `codeSpec(repo, maxSymbols)` | `code_compile_spec` |
| Compare specification drift | query `codeDrift(repo, specId, maxSymbols)` | `code_spec_drift` |
| Extract connection features | query `codeFeatures(repo, maxFeatures)` | `code_extract_features` |
| Compile implementation obligations | query `codeObligations(repo, query, maxSymbols, maxFeatures, patternLimit)` | `code_implementation_obligations` |

There is no separate flat context tool. Context is an operation on
`compute_code`; `codeContext` is the corresponding GraphQL query field.

## Routing and evidence

- Call `graphql_introspect` when the current schema is not already in context.
- Send code reads through `graphql_query` and ingest/reindex through
  `graphql_mutate`. GraphQL write gating is the authority for those mutations.
- `repo` accepts the repository id, URL, or local path that the server can
  resolve. A hosted server cannot read an arbitrary client-local path; use a
  repository URL or the local binding.
- Ingest and reindex return job submission evidence. Poll the job as directed
  by the response, then confirm the indexed revision with `codeStatus` or
  `compute_code` operation `kg_status`. A queued job is not proof of indexing.
- `codeStatus`, `codeSpec`, `codeDrift`, `codeFeatures`, and `codeObligations`
  return `CodeDomainResult`. Read its typed `revision` claim (`tenantId`,
  `repoId`, `generation`, `repoUrl`, `headSha`, evidence ids, and missing
  evidence) before comparing outputs across calls.
- Specification, drift, feature, and obligation results are revision-bound.
  Do not combine artifacts from different tenant, repository, generation, or
  head-SHA claims.

## Minimal GraphQL examples

```graphql
query CodeDiscovery {
  codeStatus(repo: "repo:theorem") {
    operation
    revision { tenantId repoId generation headSha }
    result
  }
  codeSearch(query: "GraphStore persistence", repo: "repo:theorem", limit: 10)
  codeContext(query: "GraphStore", repo: "repo:theorem", limit: 10)
  codeExplain(query: "GraphStore", repo: "repo:theorem")
}
```

```graphql
query CodeCompiler {
  codeSpec(repo: "repo:theorem", maxSymbols: 10000) {
    revision { tenantId repoId generation headSha missingEvidence }
    result
  }
  codeDrift(repo: "repo:theorem", maxSymbols: 10000) { revision { generation } result }
  codeFeatures(repo: "repo:theorem", maxFeatures: 128) { revision { generation } result }
  codeObligations(
    repo: "repo:theorem"
    query: "GraphQL code domain"
    maxSymbols: 10000
    maxFeatures: 128
    patternLimit: 16
  ) { revision { generation missingEvidence } result }
}
```

```graphql
mutation RefreshCode {
  ingestCodebase(repo: "https://github.com/Travis-Gilbert/Theorem.git")
  reindexCodebase(repo: "repo:theorem")
}
```

Issue ingest and reindex as separate mutations in ordinary operation; the
combined example only shows both field signatures.
