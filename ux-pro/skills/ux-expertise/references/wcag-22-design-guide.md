# WCAG 2.2 Organized for Designers

## Reference Overview

The Web Content Accessibility Guidelines (WCAG) 2.2 define how to make web content more accessible to people with disabilities. This reference reorganizes the guidelines by designer responsibility rather than by WCAG numbering, making it actionable during design work.

### Conformance Levels

| Level | Meaning |
|-------|---------|
| **A** | Minimum accessibility. Failure to meet these criteria creates severe barriers. |
| **AA** | Standard target for most organizations and legal compliance (ADA, Section 508, EN 301 549, EAA). |
| **AAA** | Enhanced accessibility. Not required as a blanket target but should be applied where feasible. |

Most organizations target **AA conformance**, which includes all A and AA criteria.

---

## Visual Design

### Color Contrast

**Requirement.** Text and images of text must have sufficient contrast against their background.

- Normal text (under 18pt or 14pt bold): minimum 4.5:1 contrast ratio (WCAG 1.4.3, Level AA)
- Large text (18pt+ or 14pt+ bold): minimum 3:1 contrast ratio (WCAG 1.4.3, Level AA)
- Enhanced contrast: 7:1 for normal text, 4.5:1 for large text (WCAG 1.4.6, Level AAA)
- UI components and graphical objects: minimum 3:1 against adjacent colors (WCAG 1.4.11, Level AA)

**Testing method.** Use a contrast checker tool (WebAIM Contrast Checker, Stark, Figma accessibility plugins). Measure the contrast ratio between foreground and background colors.

**Common failures.** Light gray text on white backgrounds. Placeholder text with insufficient contrast. Focus indicators that blend into the background. Disabled state styling that makes content unreadable.

---

### Color Independence

**Requirement.** Color must not be the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element (WCAG 1.4.1, Level A).

**Testing method.** View the interface in grayscale. Can all information, states, and distinctions still be understood?

**Common failures.** Form validation that only uses red/green to indicate errors/success. Charts that rely solely on color to distinguish data series. Links within body text that are only differentiated by color (no underline or other visual cue).

**Design implications.** Pair color with a secondary indicator: icons, patterns, text labels, underlines, border styles, or shape differences.

---

### Text Spacing

**Requirement.** Content must remain readable and functional when users adjust text spacing (WCAG 1.4.12, Level AA):
- Line height to at least 1.5 times the font size
- Paragraph spacing to at least 2 times the font size
- Letter spacing to at least 0.12 times the font size
- Word spacing to at least 0.16 times the font size

**Testing method.** Apply these spacing values to the interface. Verify no content is clipped, overlapped, or lost.

**Common failures.** Fixed-height containers that clip text when spacing increases. Overlapping text in tightly designed layouts.

---

### Reflow (Responsive Design)

**Requirement.** Content must reflow to a single column at 320 CSS pixels width without requiring horizontal scrolling (WCAG 1.4.10, Level AA). Exceptions: data tables, toolbars, and content requiring two-dimensional layout.

**Testing method.** Resize the browser to 320px width (or zoom to 400%). Verify all content is accessible without horizontal scrolling.

**Common failures.** Fixed-width layouts that force horizontal scrolling on mobile or zoomed views. Content that is cut off or overlaps at narrow widths.

---

### Target Size

**Requirement.** Interactive targets must be at least 24x24 CSS pixels (WCAG 2.5.8, Level AA). The enhanced requirement is 44x44 CSS pixels (WCAG 2.5.5, Level AAA).

Exceptions: targets within text (inline links), targets where the size is determined by the user agent, targets with adequate spacing that provides an equivalent target area.

**Testing method.** Measure the clickable/tappable area of all interactive elements. Include padding in the measurement.

**Common failures.** Small icon buttons without adequate padding. Close buttons (X) that are too small to tap accurately. Checkbox and radio button targets that only include the visual indicator, not the label.

---

### Content on Hover or Focus

**Requirement.** If additional content appears on hover or keyboard focus (tooltips, dropdowns), it must be: dismissible (Escape key), hoverable (user can move pointer to the new content without it disappearing), and persistent (stays visible until dismissed, focus moved, or information is no longer valid) (WCAG 1.4.13, Level AA).

**Common failures.** Tooltips that disappear when the user moves the mouse toward them. Dropdown menus with hover gaps that close prematurely.

---

### Motion and Animation

**Requirement.** Any moving, blinking, or scrolling content that starts automatically and lasts more than 5 seconds must have a mechanism to pause, stop, or hide (WCAG 2.2.2, Level A). Content must not flash more than 3 times per second (WCAG 2.3.1, Level A). Where possible, provide a mechanism to disable motion (WCAG 2.3.3, Level AAA).

**Design implications.** Respect `prefers-reduced-motion` media query. Provide pause controls for auto-playing carousels and videos. Avoid using motion as the sole means of conveying information.

---

## Interaction Design

### Keyboard Access

**Requirement.** All functionality must be operable through a keyboard interface (WCAG 2.1.1, Level A). No keyboard trap: users must be able to navigate away from any component using the keyboard (WCAG 2.1.2, Level A).

**Testing method.** Put the mouse aside. Navigate the entire interface using only Tab, Shift+Tab, Enter, Space, Arrow keys, and Escape. Verify every interactive element is reachable and operable.

**Common failures.** Custom components (dropdowns, modals, date pickers) that cannot be operated by keyboard. Infinite scroll that traps keyboard focus. Click-only interactions (drag-and-drop without keyboard alternative).

---

### Focus Visible

**Requirement.** Any keyboard-operable component must have a visible focus indicator (WCAG 2.4.7, Level AA). The focus indicator must have a contrast ratio of at least 3:1 against the unfocused state and the adjacent background (WCAG 2.4.11, Level AA, new in WCAG 2.2). The focus indicator area must be at least as large as a 2px perimeter around the component.

**Testing method.** Tab through the interface. Verify every focused element has a clearly visible indicator.

**Common failures.** `outline: none` applied globally without replacement. Focus indicators that are invisible on certain background colors. Focus indicators that are too subtle (1px light-colored outlines).

---

### Focus Order

**Requirement.** Focus order must follow a meaningful sequence that preserves meaning and operability (WCAG 2.4.3, Level A).

**Testing method.** Tab through the page. Verify the focus order follows the visual reading order and logical flow.

**Common failures.** Modal dialogs that do not trap focus within the modal. Tab order that jumps between unrelated sections due to CSS positioning that differs from DOM order.

---

### Focus Not Obscured

**Requirement.** When a component receives keyboard focus, it must not be entirely hidden by author-created content such as sticky headers, footers, or overlays (WCAG 2.4.11, Level AA, new in WCAG 2.2). Ideally, the focused item is fully visible (WCAG 2.4.12, Level AAA).

**Common failures.** Sticky headers that cover focused links as the user tabs through content below. Chat widgets or cookie banners that obscure focused elements at the bottom of the page.

---

### Consistent Navigation

**Requirement.** Navigation mechanisms that are repeated across multiple pages must appear in the same relative order each time (WCAG 3.2.3, Level AA). Components that have the same functionality must be identified consistently (WCAG 3.2.4, Level AA).

**Testing method.** Compare navigation across 5+ pages. Verify the order and labeling are identical.

---

### Timing

**Requirement.** If a time limit is set, provide the ability to turn off, adjust, or extend the time (WCAG 2.2.1, Level A). Warn users at least 20 seconds before time expires and provide a simple way to extend.

**Common failures.** Session timeouts with no warning. Timed quizzes or forms with no extension option.

---

### Dragging Movements

**Requirement.** Any functionality that uses dragging must also be operable by a single pointer (click/tap) without dragging (WCAG 2.5.7, Level AA, new in WCAG 2.2).

**Design implications.** Always provide an alternative to drag-and-drop: arrow buttons, dropdown reorder menus, or keyboard shortcuts.

---

### Consistent Help

**Requirement.** If a help mechanism (contact info, self-help, chatbot) is provided on multiple pages, it must be in the same relative location on each page (WCAG 3.2.6, Level A, new in WCAG 2.2).

---

### Redundant Entry

**Requirement.** Do not require users to re-enter information they have already provided in the same process, unless the information is no longer valid, re-entry is essential for security, or the user can auto-populate the field (WCAG 3.3.7, Level A, new in WCAG 2.2).

---

## Content and Labeling

### Page Titles

**Requirement.** Each page must have a descriptive, unique title (WCAG 2.4.2, Level A). Titles should identify the specific page and the site. Pattern: "Page Name | Site Name."

---

### Headings and Labels

**Requirement.** Headings and labels must describe the topic or purpose of the content they introduce (WCAG 2.4.6, Level AA). Section headings must be used to organize content (WCAG 2.4.10, Level AAA).

---

### Error Identification

**Requirement.** When an input error is automatically detected, identify the item in error and describe the error in text (WCAG 3.3.1, Level A).

**Common failures.** Highlighting a field in red without any text explanation. Error messages that say "Invalid input" without specifying what is wrong.

---

### Error Suggestion

**Requirement.** When an input error is detected and suggestions for correction are known, provide the suggestion to the user (WCAG 3.3.3, Level AA).

---

### Error Prevention (Legal, Financial, Data)

**Requirement.** For pages that cause legal commitments, financial transactions, or modify/delete user data: provide the ability to reverse, check, or confirm submissions (WCAG 3.3.4, Level AA). For all user input: same requirement at AAA level (WCAG 3.3.6, Level AAA).

---

### Labels or Instructions

**Requirement.** Provide labels or instructions when user input is required (WCAG 3.3.2, Level A). Labels must be programmatically associated with their inputs.

---

### Link Purpose

**Requirement.** The purpose of each link can be determined from the link text alone, or from the link text together with its context (WCAG 2.4.4, Level A). Ideally, the link text alone is sufficient (WCAG 2.4.9, Level AAA).

**Common failures.** "Click here" or "Read more" links with no contextual clue about the destination.

---

### Language

**Requirement.** Specify the language of the page (WCAG 3.1.1, Level A). Identify changes in language within the page for screen reader pronunciation (WCAG 3.1.2, Level AA).

---

## Structure

### Landmarks and Regions

**Requirement.** Use HTML landmarks to identify regions of the page: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, `<section>` with accessible names (WCAG 1.3.1, Level A).

**Testing method.** Use browser accessibility tools or screen reader to verify landmarks are present and correctly labeled.

---

### Heading Hierarchy

**Requirement.** Use heading levels (h1 through h6) in a logical, hierarchical order. Do not skip levels. Each page should have one h1 (WCAG 1.3.1, Level A).

**Testing method.** Extract all headings from the page. Verify they form a logical outline of the content with no skipped levels.

---

### Lists and Tables

**Requirement.** Use semantic markup for lists (`<ul>`, `<ol>`, `<dl>`) and data tables (`<table>`, `<th>`, `<caption>`). Tables must have headers associated with data cells (WCAG 1.3.1, Level A).

---

### Reading Order

**Requirement.** The reading and navigation order must be logical and intuitive (WCAG 1.3.2, Level A). The visual presentation order must match the DOM order.

**Testing method.** Linearize the page (disable CSS). Verify the content reads in a meaningful sequence.

---

### Orientation

**Requirement.** Content must not restrict its view and operation to a single display orientation (portrait or landscape) unless a specific orientation is essential (WCAG 1.3.4, Level AA).

---

## Accessibility Testing Approach

### Automated Testing (Catches ~30% of Issues)

Run axe, Lighthouse, or WAVE on every page. Automated tools catch: missing alt text, contrast failures, missing labels, heading order violations, and missing landmarks.

### Manual Testing (Catches ~50% of Issues)

- Keyboard-only navigation test
- Screen reader walkthrough (VoiceOver, NVDA, or JAWS)
- Zoom to 200% and 400%
- Text spacing override test
- Forced colors mode (Windows High Contrast)

### User Testing (Catches Remaining ~20%)

Include people with disabilities in usability testing. No automated or manual test replaces the insight of users who rely on assistive technology daily.
