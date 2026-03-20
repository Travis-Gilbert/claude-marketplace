# Interaction Design Patterns

## Reference Overview

Interaction design patterns are reusable solutions to common user interface challenges. This reference catalogs patterns across six domains: form design, navigation, data display, feedback, onboarding, and complex interactions. Each pattern includes when to apply it, implementation guidelines, and common pitfalls to avoid.

---

## Form Design

### Single-Column Layout

Place all form fields in a single column. Research by the Baymard Institute and CXL consistently shows single-column forms outperform multi-column layouts for completion rate. The only exception: very short, related fields that form a logical unit (city, state, zip).

### Progressive Disclosure

Reveal form fields only when they become relevant. Show conditional fields based on previous selections. Start with the minimum required information and expand based on user choices. This reduces visual complexity and cognitive load at each step.

**Implementation:** Use show/hide transitions (not page loads) for newly revealed fields. Animate field appearance with subtle expansion. Ensure revealed fields are announced to screen readers.

### Inline Validation

Validate input after the user leaves a field (on blur), not while they are still typing. Never validate on keypress for complex rules; it creates a frustrating experience of seeing errors before finishing input.

**Timing rules:**
- Validate on blur (when the user tabs or clicks away from a field)
- For format-sensitive fields (email, phone), validate on blur
- For "must match" fields (password confirmation), validate on blur of the confirmation field
- Once a field has been validated and shows an error, switch to on-input validation so the user sees the error resolve as they correct it
- Never validate empty required fields until form submission or blur

### Error Recovery

When a form submission fails validation:
- Preserve all user input (never clear the form)
- Scroll to the first error and focus it
- Display error count in a summary at the top of the form
- Show inline errors next to each affected field
- Use both color and an icon to indicate errors (not color alone)

### Smart Defaults

Pre-populate fields with the most likely value when data is available:
- Country based on IP geolocation or browser locale
- Date fields defaulting to today or the most common selection
- Shipping address same as billing (pre-checked)
- Return user data from previous interactions

### Required vs. Optional Marking

Mark optional fields, not required ones. In most forms, most fields are required. Marking the few optional fields reduces visual clutter. Use "(optional)" text rather than asterisks, which require a legend to explain.

### Multi-Step Forms

Break long forms into logical steps when they exceed 8 to 10 fields or cross distinct topic boundaries.

**Implementation guidelines:**
- Show a progress indicator (steps completed, steps remaining)
- Allow backward navigation to review and edit previous steps
- Save progress between steps (do not lose data if the user navigates back)
- Validate each step before allowing the user to proceed
- Show a summary/review step before final submission

### Confirmation Patterns

Before irreversible actions, present a confirmation that:
- States exactly what will happen ("This will permanently delete 12 files")
- Requires an intentional action (not just dismissing a modal)
- For critical actions, require typing a confirmation word

### Optimistic Submission

For non-critical submissions, show success immediately and process in the background. If the server operation fails, notify the user and offer retry. Ideal for saves, likes, follows, and similar low-risk actions.

---

## Navigation

### Global Navigation

Persistent navigation visible on every page. Limit to 5 to 7 top-level items. Use clear, specific labels (not generic terms like "Solutions" or "Platform"). Highlight the current section.

### Breadcrumbs

Show the user's path through the hierarchy. Use `>` or `/` as separators. Make all ancestors clickable. Do not show breadcrumbs if the site has only one or two levels of hierarchy.

### Contextual Navigation

In-page links to related content. "See also," "Related articles," or cross-links within content. Position at the end of content or in a sidebar. Use descriptive link text (not "click here").

### Command Palette

A searchable overlay triggered by a keyboard shortcut (typically Ctrl/Cmd + K). Lists all available actions, navigation destinations, and recent items. Implement fuzzy matching. Show keyboard shortcuts next to each action.

**When to use:** Complex applications with many features. Power-user-oriented tools. When the number of possible actions exceeds what a menu hierarchy can present efficiently.

### Search

Position the search input in a consistent, prominent location (typically top right or center of the header). Show search suggestions. Provide scoped search options when the site has distinct content types. See the Information Architecture reference for detailed search UX guidance.

### Pagination vs. Infinite Scroll

**Pagination** is better for:
- Content the user needs to reference by position ("it was on page 3")
- Search results where users want to jump to specific positions
- Situations where the total count matters
- SEO-dependent content

**Infinite scroll** is better for:
- Feed-style content where position does not matter
- Social media, news feeds, image galleries
- Mobile-first experiences where tapping "next page" is awkward

**Hybrid approach:** Load more content automatically as the user scrolls, but provide a "Load more" button as a fallback. Always show a footer accessible without scrolling past all content.

### Tabs

Use for parallel content of equal importance within a page. Limit to 2 to 7 tabs. Tab labels should be short (1 to 2 words). The active tab must be visually distinct. Tabs should not be used for sequential steps (use a stepper instead).

### Sidebar Navigation

Effective for applications with deep navigation hierarchies (documentation, admin panels, developer tools). Collapsible for screen space. Show expand/collapse state for sections with children. Highlight the current page.

### Bottom Navigation (Mobile)

Limit to 3 to 5 destinations. Place the most important/frequent destination in the center. Use icon + label pairs (not icons alone). Highlight the active destination. Do not use for secondary actions.

---

## Data Display

### Tables

**Sorting:** Click column header to sort. Show sort direction indicator (arrow). Support multi-column sort with Shift+click.

**Filtering:** Provide column-level filters or a global filter bar. Show active filter count. Allow clearing all filters with one action.

**Pagination:** Show items per page selector. Display total count. Support keyboard navigation between pages.

**Bulk actions:** Provide row selection checkboxes. Show a "Select all" option. Display selected count. Enable bulk operations (delete, export, status change) in a contextual toolbar.

**Responsive behavior:** On small screens, prioritize essential columns. Hide secondary columns behind a "more" expand. Alternatively, switch to a card or list layout at narrow breakpoints.

### Lists

**Selection:** Support single or multi-select. Use checkboxes for multi-select. Highlight selected items.

**Reordering:** Provide drag handles (not the entire row). Support keyboard reorder (Alt+Arrow). Show drop target indicator during drag.

**Grouping:** Group by a meaningful attribute. Show group headers with item counts. Allow collapsing groups.

### Cards

Use for content with a visual component (image, icon) and multiple metadata fields. Maintain consistent card sizes within a grid. Show the most important information without requiring expansion. Make the primary action obvious (full card click or a prominent button).

### Detail Views

Show comprehensive information about a single item. Use clear section grouping (overview, details, history, related items). Provide editing capability inline or via a dedicated edit mode. Include navigation to previous/next items in the collection.

### Empty States

Every view that can be empty must have an empty state design:
- Explain what would normally appear here
- Explain why it is empty (first time, no results, filtered away)
- Provide a clear action to populate the view ("Create your first project," "Adjust your filters")
- Use illustration or icon to make the empty state visually distinct from an error

### Loading States

- **Skeleton screens.** Show the layout structure with placeholder shapes while content loads. More effective than spinners for perceived performance.
- **Spinners.** Use for actions taking 1 to 5 seconds. Position near the triggering element when possible.
- **Progress bars.** Use for operations with a known duration. Show percentage or estimated time remaining.
- **Inline loading.** Replace the content of the triggering element (e.g., button text changes to "Saving...").

### Error States

- Explain the problem in plain language
- Suggest a resolution (retry, change input, contact support)
- Provide a retry action when applicable
- Do not replace the entire page with an error; show errors inline when possible
- Distinguish between user errors (fixable) and system errors (not the user's fault)

---

## Feedback

### Toasts (Snackbars)

Temporary, non-blocking notifications. Position at the bottom center or top right. Auto-dismiss after 4 to 8 seconds. Provide manual dismiss option. Queue multiple toasts (do not stack more than 2 to 3 visible). Include an action button for undo where applicable.

### Alert Banners

Persistent, page-level messages. Use for system-wide announcements, maintenance warnings, or important context. Position at the top of the content area (below navigation). Provide a dismiss option for non-critical alerts. Use color and icon to indicate severity (info, warning, error, success).

### Inline Messages

Context-specific feedback positioned near the relevant element. Use for field-level validation, section-level errors, or contextual tips. Do not use modals for messages that do not require user action.

### Confirmation Dialogs

Modal interruption requiring explicit user decision. Use sparingly: only for destructive or irreversible actions. State the consequence clearly. Provide distinct action labels ("Delete project" / "Cancel" rather than "Yes" / "No"). Make the destructive action visually distinct (danger color).

### Progress Indicators

**Determinate:** Show percentage, bar, or step count. Use when the total work is known.

**Indeterminate:** Spinner or pulsing animation. Use when the duration is unknown.

**Stepped:** Show current step in a multi-step process. Mark completed, current, and remaining steps visually.

### Status Badges

Small visual indicators showing the state of an item (active, pending, error, archived). Use consistent color coding across the application. Include text labels alongside or available on hover for accessibility.

### Optimistic UI

Update the interface immediately as if the action succeeded, then reconcile with server response. If the server operation fails, revert the UI change and show an error. Best for low-risk, high-frequency actions (like, save, move, toggle). Always have a revert path for failures.

---

## Onboarding

### Progressive Onboarding

Introduce features gradually as the user encounters them. Show tooltips and hints at the moment of relevance, not all at once on first login. Allow users to dismiss and revisit onboarding hints.

### Empty States as Onboarding

Use initial empty states to teach. An empty project list becomes an invitation to create the first project. An empty dashboard becomes a setup guide. Each empty state should have one clear call-to-action.

### Coach Marks (Spotlight Hints)

Highlight specific UI elements with a tooltip or overlay. Use sequentially (not all at once). Provide skip and dismiss options. Limit to 3 to 5 steps per sequence. Do not show on every visit.

### Checklists

Show a getting-started checklist with 4 to 7 items. Mark items as completed. Show progress percentage. Leverage the Goal-Gradient Effect by starting with one item pre-completed. Allow dismissing the checklist permanently.

### Sample Content

Pre-populate the application with sample data that demonstrates features and workflows. Label sample content clearly so users know it is not their own data. Provide a "Clear sample data" option.

---

## Complex Interactions

### Drag and Drop

- Provide a visible drag handle (do not make the entire element the handle unless it has no other interactive elements)
- Show a drag ghost (translucent copy of the dragged element)
- Indicate valid and invalid drop targets during drag
- Animate reordering so the user sees where items will land
- Always provide a keyboard alternative (move up/down buttons, dropdown position selector)
- Announce drag-and-drop state changes for screen readers

### Inline Editing

- Indicate editable areas with a subtle visual cue (pencil icon on hover, dashed underline)
- Click or double-click to enter edit mode
- Support Enter to confirm and Escape to cancel
- Show save/cancel buttons for multi-field inline edit
- Validate input before committing changes
- Show the saving state during persistence

### Bulk Actions

- Provide a select-all checkbox in the header
- Show selected count in a contextual action bar
- Support range selection with Shift+click
- Provide common bulk operations: delete, archive, move, tag, export
- Confirm destructive bulk actions with the count of affected items

### Filtering

- Position filters near the content they control
- Show active filter count
- Allow clearing individual filters and all filters at once
- Update results immediately (or provide an "Apply" button for expensive operations)
- Preserve filter state in the URL for shareability and browser history
- Show the count of results matching current filters

### Sorting

- Click column header or sort control to cycle through: ascending, descending, unsorted
- Show sort direction indicator clearly
- Support multi-level sort where meaningful
- Preserve sort preference across sessions

### Undo/Redo

- Support Ctrl/Cmd+Z for undo and Ctrl/Cmd+Shift+Z for redo
- Show the undoable action in the undo prompt ("Undo delete" not just "Undo")
- Maintain undo history for the current session
- Clear undo history when the context changes fundamentally (navigating to a different page)
- For destructive actions without undo, use soft delete with a recovery period
