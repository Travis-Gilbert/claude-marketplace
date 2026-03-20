---
description: Add scroll-driven animation to a section or component.
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash
argument-hint: <section-or-component>
---

Add scroll-driven animation to the specified section or component.

1. Load the scroll-animator agent.
2. Read the target to understand its structure and content.
3. Load `skills/motion-craft/references/scroll-animation.md`.
4. Determine the scroll pattern:
   - Scroll-triggered reveal (IntersectionObserver)
   - Parallax layers (transform-based, never position-based)
   - Scroll-linked progress (scroll position to visual state)
   - Scroll-snapping sections (CSS scroll-snap)
5. Choose the right tool (native CSS/JS vs. Locomotive Scroll).
6. Implement with passive event listeners.
7. Implement prefers-reduced-motion: disable parallax, reduce or
   remove scroll-triggered animation.
8. Test at 60fps with CPU throttling in DevTools.

Report: scroll pattern implemented, tool selected, performance
characteristics, and reduced-motion behavior.
