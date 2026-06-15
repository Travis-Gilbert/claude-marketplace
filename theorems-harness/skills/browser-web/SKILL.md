---
name: browser-web
description: Browser-use web tools over RustyWeb. Use when the user wants to navigate to a live page and extract from it, co-browse with a human in the loop, or ingest a page into the graph. Triggers on "browse to", "go to this page and get", "navigate and extract", "co-browse with me", "browse with me", "consume this URL into the graph", "read this page into the substrate", "ingest this page", and "extract from this site". These route through RustyWeb's fetch cascade today; Servo is the heavy render path.
---

# browser-web

The browser-use surface: three ways to bring a live web page into the harness.
They differ along two axes, autonomy and whether the page lands in the graph:

- `browse_for_me`: autonomous. Navigate and extract without a human in the loop.
- `browse_with_me`: supervised. The user stays in the loop while co-browsing.
- `web_consume`: ingestion. Fetch the page, observe it as a `PageState`, and
  write it into the graph.

All three route through RustyWeb's fetch cascade today. Servo is the heavy
render/embedder path and is not the default execution route here; reach for the
substrate browser only when true completed-document rendering is required.
For ingested pages, the landing zone is the quarantined `open_web_unverified`
graph layer: external web content is held apart from trusted substrate facts
until it is promoted, so consuming a page does not contaminate the trusted
graph.

## When To Fire

- "Browse to this URL and pull out the pricing table"
- "Go to this page and get the headings / the main text"
- "Co-browse this with me" / "let me stay in the loop while you navigate"
- "Consume this URL into the graph" / "read this page into the substrate"
- "Ingest this site so I can query it later"
- "Extract from this site and keep it for the graph"

Not a fit:
- A bare URL where the user only wants the raw markdown right now and nothing
  persisted: a plain fetch is lighter.
- Acquisition search over the open web: use `rustyweb_search_acquisition`.
- Reading code into the code graph: use `compute_code` for reads and `code_ingest` for ingest/reindex.

## Tools

| Tool | When | Notes |
|---|---|---|
| `browse_for_me` | Autonomous navigate plus extract | Drives to a live page through the fetch cascade and extracts the asked-for content without a human in the loop. Use when the target and the extraction goal are clear. |
| `browse_with_me` | Supervised co-browsing | Same web route, but the user stays in the loop: use when navigation needs human judgment, the path is ambiguous, or the user wants to watch and steer. |
| `web_consume` | Ingest a page into the graph | Fetches through the cascade, observes the page as a `PageState`, extracts links and text, and ingests it into the quarantined `open_web_unverified` layer. This is the "read it into the substrate" verb; the page becomes queryable but stays quarantined until promoted. |

## Example Calls

Autonomous navigate and extract:

```json
{
  "tool": "browse_for_me",
  "url": "https://example.org/pricing",
  "goal": "extract the pricing tiers and their prices"
}
```

Supervised co-browsing:

```json
{
  "tool": "browse_with_me",
  "url": "https://example.org/login",
  "goal": "reach the account settings page; ask me before submitting anything"
}
```

Consume a page into the graph:

```json
{
  "tool": "web_consume",
  "url": "https://example.org/article"
}
```

## Standard Flow

1. **Pick by autonomy and persistence.** If the goal is clear and unattended,
   use `browse_for_me`. If a human should steer or approve steps, use
   `browse_with_me`. If the point is to land the page in the graph for later
   querying, use `web_consume`.
2. **Know the route.** Execution goes through RustyWeb's fetch cascade, not a
   full browser engine. For pages that only render correctly after heavy
   client-side execution, note that the cascade may not see the completed
   document and Servo is the heavier fallback.
3. **Respect the quarantine.** Pages ingested via `web_consume` live in
   `open_web_unverified`. Treat that content as untrusted: it is queryable but
   has not been promoted into the trusted substrate.
4. **Keep the human in the loop where it matters.** For logins, forms, or
   destructive actions, prefer `browse_with_me` and surface the step rather than
   acting autonomously.

## Output

State which tool ran and the URL. For `browse_for_me` / `browse_with_me`, report
the extracted content the user asked for plus the final page reached. For
`web_consume`, report what was ingested (page id / node count, links extracted)
and that it landed in the quarantined `open_web_unverified` layer, so the user
knows it is queryable but unverified.

## Anti-Patterns

- Using `browse_for_me` for a flow that needs human judgment (login, payment,
  ambiguous navigation). Use `browse_with_me`.
- Calling `web_consume` when the user only wanted to read a page once and
  nothing persisted.
- Treating freshly consumed `open_web_unverified` content as trusted substrate
  fact.
- Assuming a full browser render. The default route is RustyWeb's fetch
  cascade; flag when a page truly needs Servo.
- Reaching for these tools to search the open web for sources; that is
  acquisition search.
