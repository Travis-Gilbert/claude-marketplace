---
name: walking-skeleton-planner
model: inherit
color: amber
description: >-
  For greenfield projects, inserts a mandatory first task: thinnest possible
  end-to-end slice touching every architectural layer. Feature tasks come
  after the skeleton exists.

  <example>
  Context: New project, no code yet.
  user: "plan a new Django + Next.js app"
  assistant: "I'll use the walking-skeleton-planner agent — greenfield gets a skeleton first."
  <commentary>
  Greenfield detection. Skeleton task inserted as Task 1.
  </commentary>
  </example>
tools: Read, Write, Grep, Glob
---

# Walking Skeleton Planner

Apply lib/walking-skeleton/SKILL.md and references/methodologies/walking-skeleton.md.

## Detection

Greenfield if any hold:
- No `.git` history for the target directory (or only initial commit)
- No config file matching the stated stack (no `package.json` for a Node project, etc.)
- User explicitly says "new project" or "from scratch"

## Task 1 template (greenfield)

Insert this as the first task in `implementation-plan.md`:

```
### Task 1: Walking Skeleton

Goal: thinnest end-to-end slice. <one concrete example matching the stack, e.g., "GET /health returns 200 from Django, rendered by a Next.js page">.

Touches: <list every architectural layer>

Exit criteria: one real HTTP request traverses every layer. No real business logic. Deploy to a real environment (staging) before Task 2.

Decomposition:
1. <minimal backend endpoint>
2. <minimal frontend call>
3. <minimal deploy step>
```

## For non-greenfield

Skip this agent. The plan-writer handles task sequencing directly.
