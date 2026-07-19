# Agent Contracts, Errors, Pagination, and Receipts

There is no single standardized Harness agent envelope yet. The current MCP,
GraphQL, HTTP, stream, and domain surfaces have several real contract layers.
Inspect each layer instead of coercing every result into an invented universal
`status`, `cursor`, or `receipt` shape.

## Discover the active contract

Use MCP `initialize` for server identity/capabilities, `tools/list` for the
active flat catalog, and `graphql_introspect` for the active typed schema.
`GET /version` adds build/deployment identity and a content hash of the active
MCP catalog. Under `graphql_default_surface`, a GraphQL-covered flat name may be
hidden; absence from `tools/list` is not proof the GraphQL capability is absent.

Authenticated admission resolves principal, binding, tenant, actor, scopes,
and budget before dispatch. Ambient admitted values are authoritative and can
replace caller-supplied tenant/actor/binding labels. Preserve the returned
identity and policy receipt rather than reporting the request arguments as
authorization evidence.

## Success and error layers

Normal flat MCP tool results duplicate JSON as human text in
`content[0].text` and as machine-readable `structuredContent`.

There are three different failure shapes:

1. JSON-RPC/MCP protocol failures use the top-level `error` object. Current
   codes include parse `-32700`, invalid request `-32600`, missing method
   `-32601`, invalid params `-32602`, internal/store errors `-32603`, and inline
   payload-too-large `-32004`. Store failures may place a stable domain code in
   `error.data.code`.
2. Policy, scope, read-only, unavailable-live-route, and domain refusals can
   return JSON-RPC success with `result.isError: true` and an explanatory
   `result.structuredContent`. Always inspect `isError`, `error`/`code`, and
   `message` inside the tool result.
3. GraphQL execution returns `{data, errors}` inside `structuredContent`.
   Partial data or a null field can coexist with GraphQL errors; inspect both.

Domain success can still be partial or inapplicable: bulk graph writes have
per-record failures, job actions have `found` and `applied`, replay can return a
typed refusal, and capability invocation can return proof-ineligible receipts.
Do not reduce these to HTTP 200 or JSON-RPC success.

## Pagination is family-specific

- Data API queries return an opaque-to-callers cursor currently encoded as
  `offset:<number>`. Pass the returned cursor back unchanged until it is null.
- Harness replay uses `offset` and `limit` and reports `raw_offset`,
  `raw_limit`, `raw_total_count`, and `raw_truncated`.
- Coordination streams keep server-side per-actor/per-topic cursors and return
  `new_cursors`; explicit delivery additionally requires `stream_ack`.
- Some list/search fields expose only `limit`, `top_k`, or family-specific
  boundaries and have no continuation cursor.

Never feed a stream ordering token to a Data query or describe `limit`-only
results as exhaustively paged. Follow the family contract and preserve sort,
filter, tenant, and snapshot anchors across pages.

## Boundary truncation is not domain pagination

The default MCP result boundary is 16 KiB, with larger family defaults for
Harness run detail and reverse-engineer compose. When a result exceeds its
boundary, `structuredContent` becomes a truncation descriptor containing
`fetch_handle`, byte counts, and `next_cursor`. Call `tool_result_fetch` with
that handle and byte `offset` until `next_offset` is null.

The fetch body is held in the serving process, not a durable tenant artifact.
Fetch promptly against the same process; do not cite a handle as a durable
receipt or confuse byte offsets with the domain's record cursor. If the result
must survive, persist the actual domain artifact through its own write surface.

## Receipt discipline

Receipts are family-specific and only some are content-addressed. Examples
include:

- `theorem.graph.mutation.v1` with operation, affected/failed counts,
  before/after graph versions, and `receipt_hash`;
- replay applied/refused receipts and integrity hashes;
- provider invocation receipts carrying provider/model/transport and cost;
- verification receipts binding evidence and calibration;
- job note receipts with actor, time, text, and refs;
- policy and dynamic-affordance receipts with their own eligibility rules.

Keep schema/version, tenant, principal/binding, operation, inputs or input hash,
graph/run version, counts, provider, evidence refs, outcome, refusal, and receipt
hash whenever the family returns them. A favorable payload without the required
oracle is not proof. Do not synthesize a generic `receipt_id` or claim
content-addressing where the family does not provide it.

Idempotency is also local to the family. Jobs have `idempotency_key`; Harness
transitions accept an idempotency key; other mutations may be set-once,
content-addressed, partially applied, or non-idempotent. Retrying blindly after
a timeout can duplicate effects. Re-read the relevant state and use the
surface's own replay/idempotency field.

## Honest gaps

HCM-028 remains open for a shared signed task/result contract, stable error and
refusal taxonomy, uniform pagination/continuation descriptors, operation
budgets and cancellation, and standardized proof/receipt projection across
MCP, GraphQL, HTTP, providers, A2A, and ACP. HCM-031 must generate the compact
catalog and compatibility projection from source; this hand-written guide is
behavioral teaching, not that generated catalog.
