---
description: Write or review UI copy and microcopy.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - LS
  - Bash
argument-hint: <component-or-context>
---

# /ux-write

Write, revise, or review UI copy and microcopy.

## Steps

1. Load the `ux-writer` agent from `agents/ux-writer.md`.
2. Read `references/ux-writing-guide.md` for content design principles.
3. Identify the copy type from the user's input: button labels, error messages, empty states, tooltips, onboarding text, form labels, confirmation dialogs, success messages, or other.
4. Apply the relevant content pattern:
   - **Buttons**: Verb-first, specific action ("Save changes", "Delete account"). Destructive actions name what will be destroyed.
   - **Errors**: What happened + why + how to fix. Never blame the user.
   - **Empty states**: What will appear here + why it is empty + how to populate it.
   - **Tooltips**: One sentence. Supplemental information only, not essential instructions.
   - **Onboarding**: Progressive disclosure. One concept per step. Action-oriented.
5. Grep `refs/govuk-design-system/` for content design patterns that match the context.
6. Verify plain language: short sentences, common words, active voice, grade 8 reading level or lower.
7. Check accessibility of the text: button labels meaningful out of context (for screen readers), no placeholder-only labels, error messages associated with their fields.
8. If the user requests a voice and tone guide, define the spectrum along dimensions: formal to casual, serious to playful, respectful to irreverent, enthusiastic to matter-of-fact. Provide examples of each dimension in context.
