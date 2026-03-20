# Animation Purpose Test

## The Three-Question Test

Before adding any animation, ask these three questions. If the animation does not clearly serve at least one purpose, remove it.

### Question 1: Orientation

**Does this animation help the user understand where they are or where something came from?**

Orientation animations answer spatial questions: Where did this element come from? Where did the old content go? What is the relationship between these two views?

**Good examples:**
- A modal slides up from the button that triggered it. The user understands the modal "belongs to" that button and will return there on dismiss.
- A page transition slides left to right, reinforcing the navigation hierarchy (deeper = slide right, back = slide left).
- A sidebar collapses and the content area expands to fill the space. The user understands the sidebar is still present, just hidden.
- A shared element (product image) morphs from a list card into a detail view header. The user never loses track of which product they selected.

**Bad examples:**
- A modal fades in from the center with no spatial relationship to its trigger. This adds motion without orientation value.
- Every page transition uses the same generic fade. Users gain no spatial model of the app structure.
- A settings panel animates in from the bottom on a desktop app where the trigger is in the top-right corner. The spatial relationship is misleading.

### Question 2: Feedback

**Does this animation confirm that the user's action was received and processed?**

Feedback animations close the loop between action and result. The user pressed a button; the animation confirms "yes, that worked."

**Good examples:**
- A submit button shrinks slightly on press, then expands back with a checkmark. The user knows the form submitted.
- A drag target highlights and pulses when a dragged item enters its bounds. The user knows the drop will be accepted.
- A toggle switch slides to its new position with a spring. The user sees the state change happen.
- A "like" button animates a heart burst. The user sees their action registered.

**Bad examples:**
- A loading spinner that runs for 200ms on an action that completes instantly. The spinner creates false uncertainty.
- A success animation that takes 2 seconds to complete, blocking the user from their next action. The feedback overstays its welcome.
- An error shake animation on a text field that the user has not interacted with yet. Feedback without a preceding action is noise.

### Question 3: Relationship

**Does this animation reveal a connection between elements that would otherwise be invisible?**

Relationship animations make the implicit explicit. They show causality, grouping, hierarchy, or dependency.

**Good examples:**
- Staggered entrance of list items, each appearing 50ms after the previous one. The stagger implies sequence and grouping.
- A parent card expands and its child items fan out from within it. The containment relationship is visible.
- Deleting an item causes the remaining items to slide up and fill the gap. The list's continuity is maintained.
- A slider thumb moves and a related value label updates in sync. The dependency between slider position and value is visible.

**Bad examples:**
- Every card on the page bounces in on load with the same animation. No relationship is communicated because everything moves identically.
- A notification badge pulses continuously. There is no relationship being shown; it is just attention-seeking.
- Unrelated elements on the page all animate simultaneously on scroll. The simultaneous timing implies a relationship that does not exist.

## When NOT to Animate

### Task-Dense Screens

Dashboards, data tables, admin panels, and productivity tools. Users in these contexts are performing repeated, rapid actions. Animation creates friction. Prefer instant state changes with subtle color or opacity shifts for feedback.

### Repeated Actions

Any action the user performs more than 5 times per minute. Example: toggling filters, paginating through results, checking items off a list. The first animation may feel satisfying; the twentieth feels like a tax. Use instant transitions or extremely short (under 100ms) fades.

### Destructive Confirmations

Delete dialogs, payment confirmations, account closures. Playful or elaborate animation at this moment feels inappropriate and erodes trust. Use a simple, fast appearance (opacity fade under 150ms) with no spring or bounce.

### Text-Heavy Content

Articles, documentation, long-form reading. Animation on the content itself (text flying in, paragraphs staggering) interferes with reading flow. The content surface should appear instantly. Limit animation to navigation chrome, not the reading area.

### High-Frequency Updates

Stock tickers, live scores, real-time dashboards, chat messages. If values update multiple times per second, animating each change creates visual chaos. Use instant updates or batch changes with a single subtle transition.

### Already-Visible State Changes

Changing the color of a selected tab, updating a counter value, toggling an icon. If the change is already visible without animation, adding animation does not help. A 100ms color crossfade is sufficient.

## Decision Flowchart (Text Form)

```
START: Considering adding animation to [element/interaction]

1. Does the user perform this action more than 5 times per minute?
   YES -> Do not animate. Use instant state change.
   NO  -> Continue.

2. Is this a destructive or high-stakes confirmation?
   YES -> Use minimal fade only (opacity, < 150ms). No spring, no bounce.
   NO  -> Continue.

3. Does the animation serve Orientation?
   YES -> Proceed to step 6.
   NO  -> Continue.

4. Does the animation serve Feedback?
   YES -> Proceed to step 6.
   NO  -> Continue.

5. Does the animation serve Relationship?
   YES -> Proceed to step 6.
   NO  -> Do not animate. The animation is decorative.

6. Can the purpose be achieved with CSS only (opacity, transform)?
   YES -> Use CSS transition. Done.
   NO  -> Continue.

7. Does the animation require spring physics, gestures, or exit animation?
   YES -> Use Motion or react-spring. See css-vs-js-decision.md.
   NO  -> Use CSS @keyframes.

END
```

## Examples: Good vs Bad Decisions

### Sidebar Navigation Collapse

**Good decision: Animate.** Purpose: Orientation. The content area expanding and the sidebar shrinking shows spatial redistribution. The user maintains their mental model of where the sidebar went.

**Implementation:** Animate width with a critical spring (no bounce). Duration under 300ms equivalent.

### Toast Notification Appearance

**Good decision: Animate.** Purpose: Feedback (action confirmed) and Orientation (toast came from the action area or entered from screen edge).

**Implementation:** Slide in from the edge with a natural spring. Exit with a faster spring (under 200ms).

### Data Table Row Hover

**Bad decision: Animate with spring.** The user hovers dozens of rows per session. A spring animation on background-color is distracting. Use a CSS transition with 100ms duration instead, or an instant color change.

### Hero Image Parallax on Scroll

**Questionable.** Purpose test: no Orientation (the image position does not inform spatial understanding), no Feedback (scrolling is not an "action" that needs confirmation), weak Relationship (parallax layers imply depth, but this is purely decorative). If the brand calls for it, keep it subtle and respect prefers-reduced-motion. Otherwise, skip it.

### Modal Dialog Entry

**Good decision: Animate.** Purpose: Orientation (modal emerged from its trigger point or from the center of the viewport). Also Feedback (user clicked something and the modal appeared in response).

**Implementation:** Scale from 0.95 to 1 with opacity fade. Use a snappy spring. Always animate exit too (faster than entry).

### Infinite Scroll Loading Skeleton

**Bad decision: Animate skeleton shimmer.** The shimmer does not serve Orientation, Feedback, or Relationship. It is decorative. A static skeleton with a subtle pulse (opacity 0.5 to 1, CSS only) communicates "loading" without the visual noise of a moving gradient.

### Form Validation Error

**Good decision: Animate (carefully).** Purpose: Feedback (the user submitted or left a field, and there is an error). A brief horizontal shake (2 to 3 oscillations, under 300ms) on the specific field draws the eye. Do not animate error text appearance; let it appear instantly so the user can read it immediately.

### Accordion Section Expand

**Good decision: Animate.** Purpose: Orientation (the content below the accordion header is revealed, and items below shift down) and Relationship (the expanded content belongs to its header).

**Implementation:** Animate height with a natural spring. Stagger child content appearance by 30ms for the Relationship signal. Keep total duration under 400ms.

### Background Gradient Animation

**Bad decision: Animate.** Purpose test fails all three questions. Background gradients shifting colors do not orient, provide feedback, or reveal relationships. This is purely decorative motion that consumes GPU resources and can trigger vestibular discomfort. Remove it or gate it behind a "decorative motion" preference, always disabled under prefers-reduced-motion.

## Summary Rule

Animation earns its place only when it answers at least one of the three questions. If the best justification is "it looks cool" or "the design comp shows it," apply the test rigorously. Decorative motion has a high cost (bundle size, performance, accessibility) and low value. Purposeful motion is an investment that pays off in usability.
