---
description: Design or evaluate information architecture.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <site-or-feature>
---

# /ia

Design or evaluate information architecture, navigation, and content structure.

## Steps

1. Load the `information-architect` agent from `agents/information-architect.md`.
2. Read `references/information-architecture.md` for IA principles and patterns.
3. Analyze the current content and navigation structure. If the user provides a sitemap, route list, or content inventory, use that as the starting point. If not, ask what content exists and how it is currently organized.
4. Recommend an IA approach covering: navigation model (flat, hierarchical, faceted, or hub-and-spoke), labeling system (vocabulary, format, consistency rules), and search strategy (when applicable).
5. Grep `refs/govuk-design-system/src/patterns/` and `refs/polaris/` for navigation patterns that match the recommendation.
6. Propose validation methods: card sorting (open or closed, with participant count and analysis method), tree testing (tasks, success metrics), or first-click testing. Explain which method fits the project's constraints.
7. If the user requests a sitemap, produce a hierarchical structure showing: page names, content types, cross-links, and depth level.
8. If the user requests a taxonomy, produce: category definitions, example items per category, and rules for handling edge cases.
