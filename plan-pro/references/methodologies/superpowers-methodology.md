# Superpowers Methodology

Source: [obra/superpowers](https://github.com/obra/superpowers), MIT license.

Superpowers is the spine of plan-pro. It provides the brainstorm → plan → execute loop, plus disciplined skills for writing plans, executing plans via subagents, TDD, systematic debugging, and code review.

## What plan-pro inherits verbatim

Seeded into `lib/`:
- `brainstorming` (modified — see skill file for diffs)
- `writing-plans` (modified — domain-router integration)
- `executing-plans` (modified — domain-router integration, auto-/review)
- `subagent-driven-development` (modified — domain-router integration)
- `test-driven-development` (verbatim)
- `systematic-debugging` (verbatim)
- `verification-before-completion` (verbatim)
- `requesting-code-review` (verbatim)
- `receiving-code-review` (verbatim)
- `finishing-a-development-branch` (verbatim)

## Core superpowers tenets plan-pro preserves

### Bite-sized tasks
2-5 minutes per task. Each task = failing test → run → minimal implementation → run → commit.

### Complete code in every step
No placeholders. No "similar to Task N". No "follow the pattern". Copy-paste-ready.

### Fresh subagent per task
Execute plans by dispatching a new subagent for each task. Don't inherit session context into the implementation agent.

### Two-stage review
Spec compliance first, code quality second. Never collapse them.

### File structure first
Before tasks, map the full directory tree the plan produces. The reader sees the destination before the journey.

## What plan-pro changes

- Scope-evaluation gate ("is this worth building?") removed. If the user showed up with an idea, it is worth building.
- Visual-companion tool omitted. Not used.
- Codebase-grounding prepended to brainstorming (CLAUDE.md → tree → stack → representative file → commits).
- Clarifier ban list enforced (no tech-stack or best-practices questions).
- Domain-router inserted per task in /execute, routing to specialist plugins (django-engine-pro, next-pro, etc.).
- Auto-/review at the end of every /execute.
- Compound-learning layer hooked in (auto-capture on solve signals; /learn pipeline at end).
- Response and independence discipline baked into CLAUDE.md.

## When to read upstream

`refs/superpowers/` is the full clone. Grep it when:
- You need the source of truth for a skill's format
- You want to see what was removed from a modified skill
- You're updating a seeded skill to match upstream changes

Upstream updates: `cd refs/superpowers && git pull`. Re-syncing `lib/` copies is a manual merge — the copies are plan-pro's now.

## Attribution

Every adapted skill has a line at the top:

```
> Adapted from obra/superpowers (MIT). Modifications: <list>. See refs/superpowers/skills/<name>/ for upstream.
```
