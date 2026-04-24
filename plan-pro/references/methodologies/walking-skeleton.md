# Walking Skeleton

Source: Alistair Cockburn, [Walking Skeleton](https://wiki.c2.com/?WalkingSkeleton).

"A tiny implementation of the system that performs a small end-to-end function. It need not use the final architecture, but it should link together the main architectural components."

## The pattern

Before any feature code, ship an end-to-end slice that:
- Traverses every layer the feature will eventually use
- Does something trivial (not business logic)
- Is deployed to a real environment
- Has one passing integration test

## Why it works

The hardest part of a new system isn't the features. It's the integration points: auth plumbing, deploy config, observability, secrets, CORS, migrations, DNS, TLS.

Skeleton-first surfaces all of those while the stakes are low. Features-first lets them ambush you during the sprint.

## The skeleton is NOT

- A prototype (prototypes are throwaway; skeletons are the foundation)
- A spike (spikes are learning; skeletons are shippable)
- A mock (mocks hide integration issues; skeletons expose them)
- A "works on my machine" build (skeletons deploy)

## Detection: is this greenfield?

plan-pro treats a project as greenfield if any of:
- No git history (or only initial commit)
- No config for the stated stack
- User said "new project" / "from scratch"

For greenfield, walking-skeleton-planner inserts Task 1 as the skeleton.

## Detection: is this major rewrite?

Also treat as greenfield if:
- Rewriting to a new stack
- First integration with a new external service that's architecturally central
- New team that hasn't shipped together before

## Skeleton example: full-stack app

```
Request path: user → browser → CDN → Next.js page → Django /api/health → Postgres → response

Skeleton tasks:
1. Django: GET /api/health → select 1 from DB → return {"ok": true, "db": "ok"}
2. Next.js: page that fetches /api/health and renders the JSON
3. Docker-compose for local (Postgres + Django + Next.js)
4. Deploy: Railway for Django, Vercel for Next.js, managed Postgres
5. One test: curl the deployed /api/health → 200 + valid JSON
```

No user model. No auth. No business logic. Just: does the request traverse the whole system?

## Skeleton example: ML pipeline

```
Request path: CLI → load CSV → train → save model → predict → write CSV

Skeleton tasks:
1. CLI entry point reads --input, --output
2. Loads 10-row toy CSV with pandas
3. Trains sklearn.LinearRegression on 1 feature
4. Saves model with joblib
5. Loads model, predicts on same 10 rows, writes predictions.csv
6. Docker image, published to GHCR
7. CI: docker run the image against a fixture, assert output file exists
```

## Anti-patterns

- **Mocked skeleton**: defeats the purpose. Real integration or nothing.
- **Skeleton without deploy**: your laptop is not an environment.
- **Skeleton with features**: feature work goes after the skeleton ships. Don't contaminate.
- **Skipping skeleton to "save time"**: you will pay the integration cost later, more expensively.
