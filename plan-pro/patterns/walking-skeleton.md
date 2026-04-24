# Pattern: Walking Skeleton (Task 1)

See: `lib/walking-skeleton/SKILL.md` and `references/methodologies/walking-skeleton.md`.

## Task 1 template

```markdown
### Task 1: Walking Skeleton

**Goal**: <one concrete, trivial end-to-end request>.

**Touches**: <every architectural layer the feature will eventually use>

**Exit criteria**:
- One real HTTP (or equivalent) request traverses every layer.
- No business logic.
- Deployed to <real environment — staging, preview, prod-equivalent>.
- One integration test passes against the deployed skeleton.

**Decomposition**:
1. <minimal backend endpoint that returns trivial data>
2. <minimal frontend that calls the endpoint and displays the result>
3. <minimal deploy step — Docker image, platform config, DNS if needed>
4. <integration test — curl / Playwright / HTTP client, asserts the response>

**Delegate to**: <primary plugin — e.g., plan-pro (self) if cross-cutting, else the plugin for the dominant layer>
```

## Concrete example: full-stack web app

```markdown
### Task 1: Walking Skeleton

**Goal**: GET /api/health returns {"ok": true, "db": "ok"} from Django, rendered by a Next.js page.

**Touches**: Django (view + DB ping), Next.js (page + fetch), Postgres (migration for a dummy table), Railway (Django deploy), Vercel (Next.js deploy).

**Exit criteria**:
- curl https://<staging-django>/api/health → 200 + {"ok": true, "db": "ok"}
- Visit https://<staging-vercel>/health → page displays that JSON
- Playwright smoke test passes

**Decomposition**:
1. Django: create app `health`, view `def health_view(request): return JsonResponse({"ok": True, "db": "ok" if can_connect_to_db() else "fail"})`, URL `path("health/", health_view)`, migration for an empty model (to force DB connection).
2. Next.js: page `app/health/page.tsx` fetches `process.env.NEXT_PUBLIC_API_URL + "/api/health"` server-side and renders the JSON.
3. Deploy: Railway service for Django with DATABASE_URL from Railway Postgres; Vercel project for Next.js with NEXT_PUBLIC_API_URL pointing at Railway.
4. Test: `tests/smoke/test_skeleton.py` uses Playwright to visit /health and assert "ok" appears in the DOM.

**Delegate to**: plan-pro (self) — cross-cutting; decomposed subtasks delegate per-layer.
```

## Rules

- ALL architectural layers the feature will eventually use, touched.
- Deployed to a real environment. Not localhost-only.
- Business logic kept minimal ("ok" / current time / "hello") — the skeleton tests infrastructure, not features.
- Integration test actually runs against the deploy.

## Plan placement

Task 1. Always. Feature tasks come after.

## What if the repo already has some layers?

If the Django service already exists with a healthy staging deploy, the skeleton only needs to add whatever new layer the feature introduces (e.g., RQ worker, new frontend). Don't re-skeleton work that's already proven.

Use judgment: the skeleton exists to expose integration risk. If the risk is zero (layer already proven), skip.

## Anti-patterns

- Skeleton with business logic. Defeats the purpose.
- Mocked dependencies in the skeleton. Defeats the purpose.
- "Skeleton works on my machine." Not a skeleton.
- Feature work before skeleton ships. Integration pain waits for you.
