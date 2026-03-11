---
name: next-tailwind-ux-review
description: Review and improve React and Next.js interfaces built with Tailwind CSS for UX quality, accessibility, responsiveness, state coverage, and interaction clarity. Use when Codex needs to audit or refine flows, forms, navigation, empty/loading/error states, mobile behavior, visual hierarchy, or UI consistency in a React or Next.js codebase, especially when the work should align with shadcn/ui, Radix UI, Vaul, Sonner, Iconoir, Creative Tim, and modern web best practices.
---

# Next Tailwind UX Review

## Workflow
1. Inspect the surface before judging it.
- Identify the route, layout, and shared components involved.
- Read only the components and styles that affect the flow under review.

2. Load the right reference file.
- Primary audit checklist: `references/review-checklist.md`
- Common remediation patterns: `references/fix-patterns.md`

3. Review in severity order.
- Blockers: broken task flow, inaccessible controls, missing state coverage, unusable mobile behavior.
- Major issues: weak hierarchy, ambiguous actions, poor form guidance, inconsistent feedback.
- Polish issues: spacing rhythm, microcopy, animation, icon consistency, visual balance.

4. Evaluate the whole interaction, not only the static frame.
- Check default, hover, focus-visible, pressed, disabled, loading, empty, error, success, and destructive states.
- Check keyboard flow, screen-reader naming, and touch targets.
- Check at least one narrow mobile width and one constrained desktop width.

5. Fix in the host stack.
- Prefer local Tailwind and component edits over introducing a new UI framework.
- Use Radix-style semantics, Sonner-style feedback, and Vaul-style mobile sheets where they improve the flow.
- Keep fixes small and composable when the user asks for review only.

6. Report clearly.
- When asked for review, lead with concrete findings and why they matter.
- Name the affected screen, component, or interaction, then propose the smallest credible fix.

## Review Priorities
- Task clarity over decoration.
- State coverage over static polish.
- Accessibility over convenience hacks.
- Mobile ergonomics over desktop-only assumptions.
- Consistency over one-off flair.

## Quick Triggers
Use this skill for requests such as:
- "Review this page for UX issues."
- "Audit this Next.js form flow."
- "Why does this dashboard feel hard to use?"
- "Improve the mobile behavior and feedback states on this screen."
