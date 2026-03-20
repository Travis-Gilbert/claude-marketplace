---
description: Tune spring physics on a component's animation.
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash
argument-hint: <component-or-file>
---

Tune spring physics on the specified component's animation.

1. Load the spring-engineer agent.
2. Read the target component to find existing spring configuration.
3. Load `skills/motion-craft/references/spring-physics.md`.
4. Identify the current spring parameters and their effect.
5. Recommend a named preset or custom tuning based on the element's
   role (snappy for buttons, natural for panels, critical for
   destructive confirmations, etc.).
6. Implement the tuned configuration.
7. Verify prefers-reduced-motion still works with new parameters.

Report: before/after spring config, why the new values fit the use case.
