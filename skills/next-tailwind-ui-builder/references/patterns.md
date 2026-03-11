# Patterns

## App Shells
- Build a clear frame first: top bar, navigation, page header, primary content, secondary actions.
- Keep page titles, filters, and bulk actions close to the content they control.
- On dashboards, use asymmetric card sizing to establish priority instead of making every panel the same weight.

## Forms
- Prefer one primary action per region.
- Keep labels persistent; do not rely on placeholders as labels.
- Group related fields into titled sections with short helper text.
- Surface validation near the field and summarize blockers near the submit action on long forms.

## Data and Dense Interfaces
- Use Ant Design-style task clarity for tables: visible filters, sortable headers, batch action affordances, and obvious empty states.
- Make destructive actions visually separate from exploration actions.
- Show totals, counts, or active filters near the dataset so users do not need to infer scope.

## Overlays
- Use dialog for blocking confirmation or focused tasks.
- Use drawer or sheet for secondary flows, settings, and mobile details.
- Keep overlay content narrow in purpose; large multipurpose overlays usually hide navigation problems.

## Feedback
- Use Sonner-style toasts for non-blocking confirmation and background events.
- Use inline status for validation, save progress, and contextual warnings.
- Add skeletons or optimistic transitions for actions that complete soon; use empty and error states when data is absent or failed.

## Navigation
- Keep navigation labels task-based, not system-based.
- Preserve URL state for tabs, filters, or deep-linkable panels when the screen is substantial enough to revisit or share.
- On mobile, make open and close affordances obvious and thumb-reachable.

## Visual Language
- Use one icon family and one spacing scale across the feature.
- Favor strong contrast in hierarchy: headline, supporting text, tertiary metadata.
- Keep radius, shadow, border, and color decisions tokenized so blocks feel related.

## Motion and Responsiveness
- Animate state changes with purpose; avoid decorative motion on dense screens.
- Prefer opacity and transform over layout thrash.
- Check narrow desktop widths and small mobile widths, not only full-screen desktop.

## Completion Checklist
- Default state works.
- Hover, focus-visible, pressed, disabled, and loading states exist where relevant.
- Empty, error, and success states are explicit.
- Keyboard navigation and screen-reader naming are intact.
- Layout remains coherent on mobile and tablet widths.
