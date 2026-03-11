# Fix Patterns

## When the UI Feels Generic
- Strengthen hierarchy before adding more color or decoration.
- Reduce repeated card chrome when content density is high.
- Use one or two strong surfaces and let supporting content recede.

## When Forms Feel Hard to Complete
- Break long forms into titled sections.
- Move helper text next to the decision it supports.
- Replace vague error copy with direct corrective language.

## When Mobile Behavior Breaks Down
- Convert secondary side panels into drawers or sheets.
- Collapse crowded action rows into a primary action plus overflow menu.
- Re-check sticky headers and sticky footers together; they often fight for limited space.

## When Feedback Is Weak
- Add inline pending or saved status for local actions.
- Add toast confirmation for async actions that complete away from the trigger.
- Distinguish warning, destructive, and neutral messaging with more than color.

## When Dense Screens Feel Overwhelming
- Group controls into logical clusters and label the cluster.
- Expose only the most common filters up front; move advanced controls behind a disclosure.
- Show counts, scope, and current selection near the content they affect.

## When Implementing Fixes
- Prefer the repo's local components and Tailwind utilities.
- Use Radix-backed patterns for overlays and menus.
- Use Sonner-style toast behavior for non-blocking feedback.
- Use Vaul-style sheets for mobile-heavy secondary flows.
- Use Ant Design thinking for information-heavy screens, but keep the local visual language.
