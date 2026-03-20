---
description: Design interaction patterns or user flows.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <component-or-flow>
---

# /interaction

Design interaction patterns, user flows, and component behaviors.

## Steps

1. Load the `interaction-designer` agent from `agents/interaction-designer.md`.
2. Read `references/interaction-patterns.md` and `references/laws-of-ux.md`.
3. Identify the pattern category from the user's input: form, navigation, data display, search, filtering, content creation, or other.
4. Grep `refs/radix-primitives/` and `refs/react-spectrum/packages/@react-aria/` for relevant implementation patterns.
5. Recommend interaction patterns with specific law or heuristic citations supporting each choice. Explain the tradeoffs of alternative approaches.
6. Specify keyboard behavior: focus order, key bindings (Tab, Enter, Space, Escape, Arrows), and any shortcuts.
7. Verify accessibility: confirm that the recommended pattern supports screen readers, keyboard-only use, and meets WCAG 2.2 requirements.
8. If the user requests a flow diagram, include: entry conditions, decision points with labels, error paths, and success end states.
9. If the user requests a state machine, include: initial state, all valid transitions, guard conditions, and actions triggered per transition.
