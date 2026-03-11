# Review Checklist

## Structure and Hierarchy
- Can a user identify the page purpose within a few seconds?
- Is there one obvious primary action per region?
- Does the layout reflect priority, or do all cards and controls compete equally?

## Navigation and Flow
- Are labels task-based and predictable?
- Does the screen preserve meaningful URL state for tabs, filters, or panels?
- Are modal and drawer flows shorter and clearer than navigating away?

## Forms
- Are labels persistent and helper text concise?
- Are required, optional, and destructive actions obvious?
- Are validation errors close to the field and understandable without guesswork?

## States
- Is there a clear loading state?
- Is the empty state specific about what happened and what to do next?
- Is the error state actionable?
- Does success feedback match the weight of the action?

## Feedback and Status
- Use inline status for local issues.
- Use toast feedback for non-blocking confirmations or background events.
- Avoid silent success or silent failure for meaningful actions.

## Accessibility
- Every interactive control needs a discernible label.
- Keyboard users need visible focus and logical tab order.
- Dialogs, popovers, and drawers need reliable focus management and escape behavior.
- Color alone should not carry essential meaning.

## Responsive and Touch
- Check at least one mobile width under `400px`.
- Keep touch targets generous and reachable.
- Avoid side panels that become unusable when compressed.

## Visual Consistency
- Use one icon set.
- Reuse spacing, radius, and border rules consistently.
- Keep typography contrast meaningful: title, support text, metadata.

## Performance and Motion
- Prefer transform and opacity animations.
- Respect `prefers-reduced-motion` when motion is non-essential.
- Avoid layout shifts caused by missing dimensions or unstable loading placeholders.
