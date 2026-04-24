---
name: research-methodology
description: "How to search the web, filter SEO noise, audit a codebase, and extract prior art. Use during /research before any design work. Produces findings, not opinions."
---

# Research Methodology

Research is input to design, not design. No recommendations, no opinions. Just findings.

## Sequence

1. **Read the working repo** (see `lib/codebase-grounding/SKILL.md`).
2. **Web search for prior art** (below).
3. **Capture constraints** discovered during 1 + 2.
4. **Write research-brief.md**.

## Web search discipline

Start with 3 distinct query formulations. Don't settle for the first SERP.

### SEO noise filters

SERPs for common topics are poisoned by SEO content farms. Skip:
- Listicles ("10 best ways to X")
- Beginner tutorials when you want implementation detail
- Medium / dev.to articles without citations
- Blog posts from SaaS vendors whose product is the answer
- Auto-translated content (check the root domain)

Prefer:
- Official docs (read the primary source, not a summary of it)
- GitHub repositories (`site:github.com` operator)
- Canonical blog posts (Martin Fowler, Dan Abramov, Julia Evans, Observable team for D3, etc.)
- Academic papers when the topic is algorithmic
- Conference talk transcripts / slides

### Query patterns that work

- `site:github.com "<exact error message>"` — find repos that hit this
- `<topic> filetype:md "README"` — find README-level documentation
- `<tool> source code "<internal function>"` — trace implementation details
- `<pattern> "site:<blog-domain>"` — limit to known-quality sources

### What to capture per source

URL + one-line finding. If you cite a source in research-brief.md, you must have read it — not skimmed the SERP snippet.

## Codebase audit

Run in order:

1. `CLAUDE.md` at the repo root (if present)
2. `ls` top-level — infer stack from config files
3. `git log --oneline -20` — what's being worked on now
4. For each layer the feature touches, read 1-2 representative files
5. `git blame <file>` on the most relevant file (who owns this code's history)

Record findings in the `## In-Codebase Context` section of research-brief.md.

## Constraints

A constraint is anything the feature must fit. Record in the `## Constraints` section:
- Technical: framework, language, runtime, deployment target
- Conventional: patterns the codebase follows (fat models, feature folders, etc.)
- Resource: cost, time, team skill
- External: API limits, data dependencies, browser support

## Output

`docs/plans/<slug>/research-brief.md`. Format specified in `agents/researcher.md`. Keep under 80 lines. Dense prose, citations, no opinions.

## What NOT to do

- Do NOT propose approaches (that's brainstorm).
- Do NOT recommend a library (that's brainstorm).
- Do NOT write "we should" or "I recommend". Write "exists", "common pattern", "constraint".
- Do NOT copy-paste from sources. Cite URL + summarize the finding in your own words.
