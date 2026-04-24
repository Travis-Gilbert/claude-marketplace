---
name: codebase-grounding
description: "Read-before-writing discipline. Required before any planning artifact. CLAUDE.md → directory listing → stack detection → representative file read → recent commits. Hard requirement."
---

# Codebase Grounding

Never propose code without reading code. Planning artifacts written without grounding are fiction.

## The five-step check

Run this BEFORE the first question, the first proposal, the first design bullet. Every time.

### 1. Read CLAUDE.md

If the working repo has a `CLAUDE.md`, read it. It contains conventions, constraints, stack, active decisions. Half of the "clarifying questions" you might ask are answered here.

If no CLAUDE.md, note the absence. Don't fabricate one.

### 2. List top-level directory

`ls` or `Glob "*"` at the repo root. Identify the stack from config files:

| File | Stack signal |
|---|---|
| `package.json` | Node / JS / TS; read `"dependencies"` for framework |
| `requirements.txt` / `pyproject.toml` | Python; read for Django/Flask/FastAPI |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `Gemfile` | Ruby |
| `pom.xml` / `build.gradle` | JVM |
| `Package.swift` / `.xcodeproj` | Swift |
| `manage.py` + `settings.py` | Django |
| `next.config.js` / `next.config.ts` | Next.js |
| `tsconfig.json` | TypeScript |

Also note: `Dockerfile`, `docker-compose.yml`, `.github/workflows/*.yml` — deployment and CI conventions.

### 3. Read one representative file per layer

For each architectural layer the feature touches, read 1-2 existing files in that layer:

| Layer | Example |
|---|---|
| Data model | one model / schema file |
| API / view | one endpoint / controller |
| UI component | one component |
| Test | one test file |
| Infra | `Dockerfile` or deploy script |

This tells you: the conventions, the naming, the style, the test framework, the import patterns.

### 4. `git log --oneline -20`

Recent commits show active work, recent decisions, current feature direction. A plan that conflicts with active work is a plan that causes a merge conflict and a confused user.

Also: `git log --oneline --all -10 | head` if the interesting work is on a branch.

### 5. Note what would be a waste of time to ask

After the four steps above, list what the user would NOT need to tell you:
- "We use Django" (you read `manage.py`)
- "Tests go in `tests/`" (you saw the directory)
- "We prefer pytest" (you read `pyproject.toml`)
- "The main model is X" (you read `models.py`)

Cross these off the clarifier's list before engaging the user.

## When to re-ground

- When starting a fresh plan in the same repo (same-session re-use OK, but re-check CLAUDE.md for updates)
- When the task crosses a layer you haven't read yet
- Before /execute if significant time has passed since /plan (commits may have landed)

## Time budget

Under 2 minutes for a familiar repo, under 5 for a first encounter. If you're still reading after 10 minutes, stop — the repo is bigger than the task, and you're over-scoping.

## Output

Grounding doesn't produce a file. Its output is what you don't have to ask about and what you don't have to guess at. The research-brief / design-doc / plan reflects the grounding, not the grounding steps themselves.
