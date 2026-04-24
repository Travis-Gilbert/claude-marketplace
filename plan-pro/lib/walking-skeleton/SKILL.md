---
name: walking-skeleton
description: "For greenfield projects, first task is the thinnest end-to-end slice touching every architectural layer. Feature tasks come after the skeleton exists. Deploy the skeleton before any feature work."
---

# Walking Skeleton

Cockburn's pattern: ship the skeleton first. Every architectural layer wired, no real business logic. This reveals integration pain early, when it's cheap.

## When to use

- Greenfield projects (no existing codebase)
- Major rewrites where the target stack is new
- First integration with a new external service or new team

Skip for: features added to an existing system whose integration paths are already proven.

## Greenfield detection

Flag as greenfield if any hold:
- No git history, or only an initial commit
- No existing config for the target stack (no `package.json` for a claimed Node project, etc.)
- User explicitly says "new project", "from scratch", "starting fresh"

## What "thinnest slice" means

- ONE concrete request traverses EVERY layer the feature will eventually use
- The request does something trivial (`GET /health` returning `{"status": "ok"}`)
- The response reaches the user through the real pipeline (real frontend, real backend, real DB if it's in the stack, real deploy target)
- No business logic. No auth logic. No validation beyond "is this a valid HTTP request"
- Deployed to a real environment (staging / preview / localhost-via-docker), not just "works in dev"

## Example skeletons

### Django + Next.js
```
Skeleton:
  GET /api/health returns {"ok": true} from Django
  Next.js page calls that endpoint and displays the result
  Both deployed: Django on Railway (staging), Next.js on Vercel (preview)
  One commit, one deploy, one end-to-end test passing
```

### Python ML pipeline
```
Skeleton:
  CLI reads a hardcoded path, loads a toy CSV with pandas, trains sklearn.LinearRegression on 1 feature, writes predictions.csv
  Deployed as a Docker image published to GHCR
  CI runs it on a 10-row fixture and asserts the output file exists
```

### iOS app with Django backend
```
Skeleton:
  SwiftUI screen makes a URLSession request to Django /api/ping
  Django returns current server time
  Swift displays the time on screen
  Deployed: Django on Fly.io, iOS app running in simulator (release mode)
```

## Task 1 template

Insert as Task 1 of `implementation-plan.md`:

```markdown
### Task 1: Walking Skeleton

**Goal**: thinnest end-to-end slice. <specific goal — one sentence>.

**Touches**: <list every layer>

**Exit criteria**: one real HTTP request (or equivalent) traverses every layer. No real business logic. Deployed to <environment>. Passes one integration test.

**Decomposition**:
1. <minimal backend>
2. <minimal frontend>
3. <minimal deploy>
4. <integration test>

**Delegate to**: <primary plugin>
```

All feature tasks come after the skeleton task. No exceptions.

## Why skeleton first

The skeleton surfaces:
- Auth pain (you'll learn CORS, CSRF, token plumbing early)
- Deploy pain (env vars, secrets, DNS, TLS)
- Data pain (migrations, seeding, connection strings)
- Observability pain (logs? metrics? traces? where do they go?)

If you build features first and skeleton last, all four of those hit at once, in production, under deadline.

## Anti-pattern

Do NOT mock the skeleton. Mocked backends defeat the purpose. The skeleton must exercise the real integration points, even if trivially.

Do NOT skip the deploy step. "It works on my machine" is not a skeleton.
