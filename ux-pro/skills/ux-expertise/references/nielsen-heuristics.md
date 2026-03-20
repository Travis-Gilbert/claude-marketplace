# Nielsen's 10 Usability Heuristics

## Reference Overview

Jakob Nielsen's 10 usability heuristics are general principles for interaction design. Originally published in 1994 and updated in 2020, they remain the most widely used framework for expert evaluation of user interfaces. These are broad rules of thumb, not specific usability guidelines.

## Severity Rating Scale

Use this scale when reporting heuristic violations during evaluation.

| Rating | Label | Description |
|--------|-------|-------------|
| 0 | Not a usability problem | Evaluator disagrees this is a problem |
| 1 | Cosmetic problem only | Fix only if extra time is available |
| 2 | Minor usability problem | Low priority; fix is desirable |
| 3 | Major usability problem | High priority; important to fix before release |
| 4 | Usability catastrophe | Imperative to fix before product can ship |

Severity depends on three factors: frequency (how common), impact (how difficult to overcome), and persistence (is it a one-time or repeated problem).

---

## Heuristic 1: Visibility of System Status

### Definition

Keep users informed about what is going on through appropriate feedback within a reasonable time. The system should always communicate its current state so users are never left guessing.

### Implementation Checklist

- [ ] Display loading indicators for any operation exceeding 1 second
- [ ] Show progress bars for multi-step or long-running processes
- [ ] Highlight the currently active page or section in navigation
- [ ] Provide confirmation feedback after user actions (save, submit, delete)
- [ ] Display character or word counts for constrained input fields
- [ ] Show upload progress with file size and estimated time remaining
- [ ] Indicate online/offline status in applications that depend on connectivity
- [ ] Mark the current step in multi-step workflows

### Common Violations

**Silent failures.** A form submission fails but shows no error message. The user assumes the action succeeded and moves on.

**No loading indication.** Clicking a button triggers a network request but nothing visible changes. Users click again, creating duplicate requests.

**Ambiguous state.** A toggle switch has no visual distinction between on and off states. Users cannot tell the current configuration.

**Missing progress.** A file export runs for 30 seconds with no progress bar. Users assume the application has frozen and force-quit.

**Stale data indicators.** A dashboard displays data but never indicates when it was last refreshed. Users make decisions on outdated information.

### Evaluation Questions

1. Can the user always tell what the system is doing right now?
2. After performing an action, does the user receive confirmation that it worked?
3. Are wait times accompanied by visual feedback proportional to the expected duration?
4. Does the interface communicate errors clearly and immediately?
5. Can the user identify their current location within the application?

---

## Heuristic 2: Match Between System and the Real World

### Definition

Speak the users' language. Use words, phrases, and concepts familiar to the user rather than internal system terms. Follow real-world conventions, making information appear in a natural and logical order.

### Implementation Checklist

- [ ] Use domain-specific language that matches user vocabulary
- [ ] Order information following real-world expectations (chronological, alphabetical, by importance)
- [ ] Use familiar icons and metaphors appropriate to the target audience
- [ ] Replace technical error codes with human-readable messages
- [ ] Display dates, currencies, and units in the user's locale format
- [ ] Label form fields with terms users actually use, not database column names

### Common Violations

**Technical jargon in user-facing text.** Error message reads "500 Internal Server Error" or "null reference exception" instead of explaining what went wrong in plain language.

**System-oriented labeling.** A field labeled "SKU" in a consumer shopping interface. Users searching for products do not think in stock-keeping units.

**Unintuitive ordering.** A list of countries sorted by ISO code rather than alphabetically. Users scan for their country and cannot find it.

**Unfamiliar metaphors.** Using a floppy disk icon for "save" in an application targeting users born after 2000.

### Evaluation Questions

1. Would a new user understand all labels without referring to documentation?
2. Do error messages use language the target audience speaks?
3. Does the information follow a natural, expected ordering?
4. Are metaphors and icons culturally appropriate and recognizable?

---

## Heuristic 3: User Control and Freedom

### Definition

Users often perform actions by mistake. Provide a clearly marked "emergency exit" to leave an unwanted state without going through an extended process. Support undo and redo.

### Implementation Checklist

- [ ] Provide an undo option for destructive or significant actions
- [ ] Include a "Cancel" button on all dialogs and multi-step processes
- [ ] Allow users to go back to previous steps in wizards and workflows
- [ ] Support browser back button behavior in web applications
- [ ] Offer a "Reset" or "Clear" option for form inputs
- [ ] Allow users to dismiss modal dialogs by pressing Escape or clicking outside
- [ ] Implement soft delete (trash/archive) before permanent deletion
- [ ] Allow users to edit or retract recently submitted content

### Common Violations

**No undo for deletion.** Clicking "Delete" permanently removes a file with no way to recover it and no confirmation step.

**Trapped in a modal.** A modal dialog has no close button, no cancel button, and clicking outside does nothing. The only way forward is to complete the entire flow.

**Irreversible wizard.** A setup wizard that does not allow returning to previous steps. Users who realize they made an error on step 2 must restart from step 1.

**Forced commitment.** A subscription flow that collects payment information before showing the full terms, with no way to review the previous screen.

### Evaluation Questions

1. Can users easily reverse or undo their last action?
2. Is there always a clear way to exit or cancel the current operation?
3. Can users navigate backward in multi-step flows?
4. Are destructive actions recoverable or at least confirmed?

---

## Heuristic 4: Consistency and Standards

### Definition

Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.

### Implementation Checklist

- [ ] Use consistent terminology throughout the interface (do not alternate between "Remove" and "Delete" for the same action)
- [ ] Follow platform conventions for common interactions (swipe, long press, right-click)
- [ ] Maintain consistent placement of navigation, actions, and feedback elements across pages
- [ ] Use the same visual treatment for elements with the same function
- [ ] Follow established design patterns for common features (search, settings, profile)
- [ ] Align with external standards (WCAG, platform human interface guidelines)

### Common Violations

**Inconsistent vocabulary.** One page says "Shopping Cart," another says "Basket," and checkout says "Your Items." All refer to the same concept.

**Nonstandard icon placement.** Placing the search icon on the left side of the header on one page and the right side on another.

**Breaking platform conventions.** Implementing swipe-to-delete in a web application where users expect swipe to navigate between items.

**Visual inconsistency.** Primary action buttons are blue on some screens, green on others, with no systematic reason for the difference.

### Evaluation Questions

1. Are the same words used for the same concepts throughout?
2. Do similar elements look and behave the same way across the interface?
3. Does the interface follow established platform conventions?
4. Would a user familiar with similar products feel at home immediately?

---

## Heuristic 5: Error Prevention

### Definition

Even better than good error messages is a careful design that prevents problems from occurring in the first place. Eliminate error-prone conditions or check for them and present users with a confirmation option before they commit to an action.

### Implementation Checklist

- [ ] Use input constraints (date pickers, dropdowns, sliders) instead of free-text fields where possible
- [ ] Disable or hide unavailable actions rather than showing error after the fact
- [ ] Show confirmation dialogs before destructive actions
- [ ] Provide real-time input validation and formatting guidance
- [ ] Use smart defaults to reduce the chance of misconfiguration
- [ ] Implement autosave to prevent data loss
- [ ] Suggest corrections for common errors (did you mean?)
- [ ] Prevent double-submission of forms by disabling the submit button after first click

### Common Violations

**Free-text date entry.** Requiring users to type dates in a specific format (MM/DD/YYYY) instead of providing a date picker, leading to constant format errors.

**No confirmation for bulk delete.** A "Delete All" button that immediately executes without asking "Are you sure you want to delete 247 items?"

**Allowing invalid states.** A scheduling interface that allows users to set an end time before the start time, only showing an error upon submission.

**No autosave.** A long form with no save mechanism. If the browser crashes or the session expires, all entered data is lost.

### Evaluation Questions

1. Does the design prevent common errors through input constraints?
2. Are destructive actions protected by confirmation?
3. Does validation happen in real time rather than only on submission?
4. Are smart defaults used to reduce the burden of correct input?

---

## Heuristic 6: Recognition Rather Than Recall

### Definition

Minimize the user's memory load by making objects, actions, and options visible. The user should not have to remember information from one part of the interface to another. Instructions for use should be visible or easily retrievable.

### Implementation Checklist

- [ ] Show recently used items, searches, or files
- [ ] Provide autocomplete for text inputs with known value sets
- [ ] Display contextual help and tooltips near complex controls
- [ ] Use visible labels on icons (not icon-only buttons for primary actions)
- [ ] Show breadcrumbs so users can see their navigation path
- [ ] Keep relevant information visible during multi-step processes
- [ ] Pre-populate forms with known user data

### Common Violations

**Unlabeled icon toolbar.** A row of 12 icons with no labels or tooltips. Users must hover over each icon and experiment to discover its function.

**Hidden navigation.** All navigation is inside a hamburger menu on desktop, requiring users to remember what sections exist.

**Context-free reference.** A confirmation page says "Order #38291 has been placed" but does not show what items were in the order. Users must navigate elsewhere to verify.

**Cryptic identifiers.** Requiring users to remember and type a project code (e.g., "PRJ-2024-Q3-ALPHA") instead of offering a searchable dropdown.

### Evaluation Questions

1. Are all available actions visible or easily discoverable?
2. Can users complete tasks without memorizing information from previous screens?
3. Are instructions and labels present where users need them?
4. Does the interface offer recognition aids like autocomplete, recent items, and contextual cues?

---

## Heuristic 7: Flexibility and Efficiency of Use

### Definition

Accelerators, unseen by the novice user, may speed up interaction for the expert user. Allow users to tailor frequent actions. The interface should cater to both inexperienced and experienced users.

### Implementation Checklist

- [ ] Provide keyboard shortcuts for frequent actions
- [ ] Support customizable toolbars or workspaces
- [ ] Allow users to set preferences and defaults
- [ ] Implement command palettes or quick-access search
- [ ] Enable bulk actions for operations frequently performed on multiple items
- [ ] Provide templates or presets for common configurations
- [ ] Support touch gestures as shortcuts for mobile interactions
- [ ] Allow power users to create macros or saved workflows

### Common Violations

**No keyboard shortcuts.** A professional tool requiring heavy mouse usage with no keyboard alternatives. Expert users are slowed to the speed of point-and-click.

**No bulk operations.** An admin interface requiring users to edit items one at a time. Changing a setting across 50 items requires 50 individual interactions.

**One-size-fits-all.** A dashboard that cannot be customized. Every user sees the same layout regardless of their role or priorities.

**No saved preferences.** Users must reconfigure filters and view settings every time they return to the application.

### Evaluation Questions

1. Are there shortcuts or accelerators for experienced users?
2. Can users customize the interface to match their workflow?
3. Are bulk operations available for repetitive tasks?
4. Does the design accommodate both beginners and experts?

---

## Heuristic 8: Aesthetic and Minimalist Design

### Definition

Interfaces should not contain information that is irrelevant or rarely needed. Every extra unit of information competes with the relevant units of information and diminishes their relative visibility.

### Implementation Checklist

- [ ] Remove or de-emphasize information not relevant to the current task
- [ ] Use progressive disclosure to reveal details on demand
- [ ] Maintain clear visual hierarchy through typography, spacing, and contrast
- [ ] Limit color palette to functional, meaningful use
- [ ] Avoid decorative elements that do not aid comprehension
- [ ] Keep the primary action visually prominent on each screen

### Common Violations

**Information overload.** A settings page displaying every possible option simultaneously with no grouping, progressive disclosure, or search.

**Visual noise.** Heavy use of borders, shadows, gradients, and decorative elements that compete for attention and obscure the actual content.

**Competing calls to action.** A page with five buttons of equal visual weight, none clearly the primary action.

**Unnecessary content.** A checkout page that shows recommended products, newsletter signups, social media links, and promotional banners alongside the payment form.

### Evaluation Questions

1. Does every element on the screen serve a clear purpose?
2. Is the most important information immediately visible?
3. Are secondary options available but not competing with primary ones?
4. Does the visual design support the content hierarchy?

---

## Heuristic 9: Help Users Recognize, Diagnose, and Recover from Errors

### Definition

Express error messages in plain language (not error codes), precisely indicate the problem, and constructively suggest a solution.

### Implementation Checklist

- [ ] Write error messages in plain, non-technical language
- [ ] Identify the specific field or input that caused the error
- [ ] Explain what went wrong (the problem)
- [ ] Suggest how to fix it (the solution)
- [ ] Place error messages near the source of the error
- [ ] Use visual indicators (color, icons) alongside text to draw attention to errors
- [ ] Preserve user input when displaying errors so users do not have to re-enter data
- [ ] Log technical details separately for debugging; do not display them to users

### Common Violations

**Generic error messages.** "An error has occurred. Please try again later." No indication of what failed or what the user can do about it.

**Technical error codes.** "Error 0x80070005: Access Denied." Meaningless to most users.

**Clearing the form on error.** Validation fails and the entire form resets. Users must re-enter all fields from scratch.

**Invisible errors.** Validation error messages appear at the top of a long form. Users do not scroll up and do not realize submission failed.

**Blaming the user.** "Invalid input" or "Wrong format." No indication of what format is expected.

### Evaluation Questions

1. Do error messages explain the problem in user-friendly language?
2. Do error messages suggest a specific corrective action?
3. Is user input preserved when errors occur?
4. Are errors visually associated with the field that caused them?

---

## Heuristic 10: Help and Documentation

### Definition

It is better if the system can be used without documentation, but it may be necessary to provide help and documentation. Such information should be easy to search, focused on the user's task, list concrete steps to be carried out, and not be too large.

### Implementation Checklist

- [ ] Provide contextual help near complex features (tooltips, inline hints)
- [ ] Make help documentation searchable
- [ ] Include task-oriented walkthroughs, not just feature descriptions
- [ ] Offer onboarding flows for first-time users
- [ ] Provide FAQs for common questions and issues
- [ ] Ensure help content is up to date with the current version of the product
- [ ] Support multiple help formats: text, video, interactive tutorials

### Common Violations

**No help at all.** A complex feature with no documentation, tooltips, or onboarding guidance.

**Help is hard to find.** Documentation exists but is buried four levels deep in a settings menu.

**Feature-oriented rather than task-oriented.** Help documentation describes what every button does but never explains how to accomplish common tasks.

**Outdated documentation.** Screenshots show a previous version of the interface. Instructions reference buttons and labels that no longer exist.

### Evaluation Questions

1. Is help content available where and when users need it?
2. Is help content task-oriented (how to accomplish goals) rather than only feature-oriented?
3. Can users search the documentation effectively?
4. Is the documentation current with the product's actual interface?

---

## How to Conduct a Heuristic Evaluation

### Process Overview

1. **Planning.** Define the scope (entire product, specific flow, or single feature). Select the heuristic set (Nielsen's 10 is standard). Prepare scenarios or tasks for evaluators to follow.

2. **Individual Evaluation.** Each evaluator inspects the interface independently, comparing elements against the heuristic set. Evaluators record each issue with: the heuristic violated, the location in the interface, a description of the problem, and a severity rating.

3. **Consolidation.** After all evaluators complete their independent reviews, combine findings into a single report. Merge duplicate issues. Average severity ratings across evaluators.

4. **Prioritization.** Sort issues by severity. Group by heuristic or by screen/flow. Identify patterns (e.g., if multiple issues trace to the same root cause).

5. **Reporting.** Present findings with screenshots, severity ratings, and recommended fixes. Separate quick wins (severity 3 or 4, low effort) from longer-term improvements.

### Number of Evaluators

Research by Nielsen and Molich (1990) established the following guidance:

- **3 evaluators** find approximately 60% of usability problems
- **5 evaluators** find approximately 75% of usability problems
- **10 evaluators** find approximately 90% of usability problems

Diminishing returns set in after 5 evaluators. For most projects, 3 to 5 evaluators provide the best cost-benefit ratio.

### Evaluator Selection

The most effective evaluation teams combine:
- UX specialists who understand interaction design principles
- Domain experts who understand the user's context and tasks
- Developers who understand technical constraints and feasibility

### Reporting Template

For each issue, record:

| Field | Content |
|-------|---------|
| Issue ID | Sequential number |
| Heuristic | Which heuristic is violated |
| Location | Screen, component, or flow step |
| Description | What the problem is |
| Severity | 0 to 4 rating |
| Evidence | Screenshot or description of the violation |
| Recommendation | Suggested fix |

### Timing and Integration

Conduct heuristic evaluations at multiple stages:
- During wireframe review (catch structural issues early)
- After visual design but before development (catch interaction issues)
- After development but before release (catch implementation issues)
- Periodically on live products (catch accumulated drift)

A single evaluation of a medium-complexity interface typically takes 1 to 2 hours per evaluator. Plan 2 to 4 hours for consolidation and reporting.
