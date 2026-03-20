# ARIA Authoring Practices

## Reference Overview

The WAI-ARIA Authoring Practices Guide defines how to build accessible rich internet applications. This reference covers keyboard interaction models, required ARIA roles and properties, and focus management rules for common interactive patterns. Follow these patterns to ensure custom components are operable by keyboard users and understandable by screen readers.

## General Principles

### Roving Tabindex

For composite widgets (toolbars, tab lists, menus, trees) that contain multiple focusable items, use roving tabindex rather than making every item a tab stop.

**How it works:**
- The container is a single tab stop (only one child has `tabindex="0"` at a time)
- All other children have `tabindex="-1"`
- Arrow keys move focus between children within the container
- When focus moves, update `tabindex="0"` to the new target and set the previous to `tabindex="-1"`

**Benefits:** Reduces the number of tab stops. Users tab into the widget, use arrow keys to navigate within it, then tab out to the next widget.

### aria-activedescendant

An alternative to roving tabindex for composite widgets. The container maintains focus while `aria-activedescendant` points to the visually focused child.

**How it works:**
- The container has `tabindex="0"` and maintains DOM focus
- Set `aria-activedescendant` to the `id` of the currently "active" child
- Visually style the active child as focused
- Arrow keys change the `aria-activedescendant` value

**When to use:** Prefer `aria-activedescendant` when the container needs to maintain focus (e.g., a combobox input that must keep focus for typing while highlighting listbox options).

### Typeahead

Implement type-ahead (also called typeahead or type-to-select) in lists, trees, menus, and grids. When a user types one or more characters, move focus to the next item whose label starts with those characters. Reset the typed string after a short timeout (typically 500ms).

### Escape Dismissal

For all overlay patterns (dialogs, menus, tooltips, popovers), pressing Escape must dismiss the overlay and return focus to the trigger element.

### Return Focus

When an overlay (dialog, menu, popover) closes, return focus to the element that triggered it. If the trigger no longer exists, move focus to a logical predecessor.

---

## Component Patterns

### Accordion

**Roles and properties:**
- Accordion headers: `<button>` (or element with `role="button"`)
- Each button has `aria-expanded="true"` or `"false"`
- Each button has `aria-controls` pointing to the associated panel `id`
- Each panel has `role="region"` and `aria-labelledby` pointing to the header button

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Enter / Space | Toggle the accordion panel associated with the focused header |
| Tab | Move focus to the next focusable element |
| Shift+Tab | Move focus to the previous focusable element |
| Down Arrow (optional) | Move focus to the next accordion header |
| Up Arrow (optional) | Move focus to the previous accordion header |
| Home (optional) | Move focus to the first accordion header |
| End (optional) | Move focus to the last accordion header |

---

### Alert and Alert Dialog

**Alert (non-modal notification):**
- `role="alert"` on the container
- Automatically announced by screen readers via live region behavior
- Do not require user interaction; purely informational
- Equivalent to `aria-live="assertive"` and `aria-atomic="true"`

**Alert Dialog (modal requiring response):**
- `role="alertdialog"` on the container
- `aria-modal="true"`
- `aria-labelledby` pointing to the dialog title
- `aria-describedby` pointing to the alert message
- Focus management: move focus into the dialog on open; trap focus within; return focus on close

---

### Breadcrumb

**Roles and properties:**
- Container: `<nav>` with `aria-label="Breadcrumb"`
- List: `<ol>` with `<li>` items
- Current page: `aria-current="page"` on the last item

**Keyboard interaction:** Standard link navigation (Tab between links).

---

### Carousel (Slide Show)

**Roles and properties:**
- Container: `role="region"` with `aria-roledescription="carousel"` and `aria-label`
- Each slide: `role="group"` with `aria-roledescription="slide"` and `aria-label="N of M"`
- Rotation control: button with `aria-label="Stop auto-rotation"` / `"Start auto-rotation"`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Move between carousel controls and slide content |
| Enter/Space on rotation button | Toggle auto-rotation |
| Next/Previous buttons | Navigate between slides |

**Focus management:** Stop auto-rotation when any element within the carousel receives focus or the mouse hovers over the carousel.

---

### Combobox

**Roles and properties:**
- Input: `role="combobox"`, `aria-expanded`, `aria-controls` (pointing to the listbox), `aria-activedescendant`
- Popup: `role="listbox"` with `role="option"` children
- Selected option: `aria-selected="true"`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Down Arrow | Open the listbox (if closed); move to next option |
| Up Arrow | Move to previous option |
| Enter | Accept the focused option and close the listbox |
| Escape | Close the listbox without selecting; clear input if listbox was already closed |
| Home / End | Move to first / last option |
| Printable characters | Type-ahead filtering or text input |

---

### Dialog (Modal)

**Roles and properties:**
- Container: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title), `aria-describedby` (description, optional)

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Move focus to next focusable element within the dialog (wrap from last to first) |
| Shift+Tab | Move focus to previous focusable element within the dialog (wrap from first to last) |
| Escape | Close the dialog |

**Focus management rules:**
1. On open: move focus to the first focusable element, or to the dialog element itself if no focusable element is appropriate
2. Trap focus: Tab and Shift+Tab cycle only through elements within the dialog
3. On close: return focus to the element that opened the dialog

---

### Disclosure (Show/Hide)

**Roles and properties:**
- Trigger: `<button>` with `aria-expanded="true"` or `"false"`, `aria-controls` pointing to the content

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Enter / Space | Toggle visibility of the controlled content |

---

### Feed

**Roles and properties:**
- Container: `role="feed"`
- Articles: `role="article"` with `aria-labelledby`, `aria-describedby`, `aria-posinset`, `aria-setsize`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Page Down | Move focus to next article |
| Page Up | Move focus to previous article |
| Ctrl+End | Move focus to the first focusable element after the feed |

---

### Grid and Treegrid

**Roles and properties:**
- Container: `role="grid"` or `role="treegrid"`
- Rows: `role="row"`, optionally `aria-expanded` for treegrid
- Cells: `role="gridcell"`, `role="rowheader"`, or `role="columnheader"`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Right Arrow | Move focus one cell to the right |
| Left Arrow | Move focus one cell to the left |
| Down Arrow | Move focus one row down |
| Up Arrow | Move focus one row up |
| Home | Move focus to the first cell in the row |
| End | Move focus to the last cell in the row |
| Ctrl+Home | Move focus to the first cell in the first row |
| Ctrl+End | Move focus to the last cell in the last row |
| Page Down | Move focus down by a page of rows |
| Page Up | Move focus up by a page of rows |

---

### Listbox

**Roles and properties:**
- Container: `role="listbox"`, optionally `aria-multiselectable="true"`
- Options: `role="option"`, `aria-selected`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Down Arrow | Move focus to next option |
| Up Arrow | Move focus to previous option |
| Home | Move focus to first option |
| End | Move focus to last option |
| Space | Toggle selection (multiselect) |
| Shift+Down/Up | Extend selection (multiselect) |
| Ctrl+A | Select all (multiselect) |
| Type-ahead | Focus matching option |

---

### Menu and Menubar

**Roles and properties:**
- Menubar: `role="menubar"`
- Menu: `role="menu"`
- Items: `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"`
- Submenu trigger: `aria-haspopup="true"`, `aria-expanded`

**Keyboard interaction:**

| Key | Action (Menubar) | Action (Menu) |
|-----|-------------------|---------------|
| Right Arrow | Next menubar item | Open submenu |
| Left Arrow | Previous menubar item | Close submenu, move to parent |
| Down Arrow | Open menu | Next menu item |
| Up Arrow | Open menu (last item) | Previous menu item |
| Enter / Space | Activate item | Activate item |
| Escape | Close menu, focus trigger | Close menu, focus parent |
| Home | First item | First item |
| End | Last item | Last item |

---

### Meter and Progressbar

**Meter** (`role="meter"`): Represents a scalar value within a known range. Properties: `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (optional human-readable value).

**Progressbar** (`role="progressbar"`): Represents completion of a task. Properties: same as meter. For indeterminate progress, omit `aria-valuenow`.

---

### Radio Group

**Roles and properties:**
- Container: `role="radiogroup"` with `aria-labelledby` or `aria-label`
- Options: `role="radio"`, `aria-checked="true"` or `"false"`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Right/Down Arrow | Move to and select next radio |
| Left/Up Arrow | Move to and select previous radio |
| Space | Select the focused radio (if not already selected) |
| Tab | Move focus into/out of the radio group (only the selected radio is in tab order) |

---

### Slider

**Roles and properties:**
- Thumb: `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (optional), `aria-label` or `aria-labelledby`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Right/Up Arrow | Increase by one step |
| Left/Down Arrow | Decrease by one step |
| Home | Set to minimum |
| End | Set to maximum |
| Page Up | Increase by large step |
| Page Down | Decrease by large step |

---

### Spinbutton

**Roles and properties:**
- Input: `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (optional)

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Up Arrow | Increment value |
| Down Arrow | Decrement value |
| Home | Set to minimum |
| End | Set to maximum |
| Page Up | Increment by larger step |
| Page Down | Decrement by larger step |

---

### Tabs

**Roles and properties:**
- Container: `role="tablist"`
- Tabs: `role="tab"`, `aria-selected`, `aria-controls` (pointing to panel)
- Panels: `role="tabpanel"`, `aria-labelledby` (pointing to tab)

**Keyboard interaction (automatic activation):**

| Key | Action |
|-----|--------|
| Right Arrow | Focus and activate next tab |
| Left Arrow | Focus and activate previous tab |
| Home | Focus and activate first tab |
| End | Focus and activate last tab |
| Tab | Move focus from tab into the associated panel |

**Manual activation variant:** Arrow keys move focus only; Enter/Space activates the focused tab.

---

### Toolbar

**Roles and properties:**
- Container: `role="toolbar"`, `aria-label` or `aria-labelledby`
- Controls: buttons, toggles, dropdowns within the toolbar

**Keyboard interaction:** Use roving tabindex. Left/Right Arrow keys move between toolbar items. Tab moves focus out of the toolbar.

---

### Tooltip

**Roles and properties:**
- Tooltip: `role="tooltip"`
- Trigger: `aria-describedby` pointing to the tooltip element

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Focus (Tab to trigger) | Show tooltip |
| Escape | Dismiss tooltip |
| Blur (Tab away) | Hide tooltip |

**Requirements:** Tooltip content must be hoverable (mouse can move to tooltip without it disappearing). Must be dismissible with Escape. Must be persistent until dismissed or focus/hover is removed.

---

### Tree View

**Roles and properties:**
- Container: `role="tree"`
- Groups: `role="group"`
- Items: `role="treeitem"`, `aria-expanded` (for parent nodes), `aria-selected`

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Down Arrow | Move to next visible treeitem |
| Up Arrow | Move to previous visible treeitem |
| Right Arrow | Expand collapsed node; if expanded, move to first child |
| Left Arrow | Collapse expanded node; if collapsed, move to parent |
| Home | Move to first treeitem |
| End | Move to last visible treeitem |
| Enter | Activate treeitem |
| Space | Toggle selection |
| * (asterisk) | Expand all siblings at the current level |

---

### Window Splitter

**Roles and properties:**
- Separator: `role="separator"` (when focusable, it is a widget; when not focusable, it is purely decorative)
- `aria-valuenow` (current position as percentage), `aria-valuemin`, `aria-valuemax`
- `aria-label` describing what the splitter controls

**Keyboard interaction:**

| Key | Action |
|-----|--------|
| Left/Up Arrow | Move splitter toward start (decrease value) |
| Right/Down Arrow | Move splitter toward end (increase value) |
| Home | Move splitter to minimum |
| End | Move splitter to maximum |
| Enter | Toggle between current position and a previous position |

---

## ARIA Rules of Thumb

1. **Use native HTML first.** A native `<button>` is always better than `<div role="button">`. ARIA adds semantics but not behavior (no keyboard events, no focus management).

2. **Every interactive ARIA role needs keyboard support.** Adding `role="button"` to a `<div>` does not make it focusable or responsive to Enter/Space. Add `tabindex="0"` and key event handlers.

3. **Do not change native semantics.** Do not add `role="heading"` to a `<button>`. Use the element that matches the intended semantics.

4. **All interactive elements must have an accessible name.** Use `aria-label`, `aria-labelledby`, or visible label text.

5. **Do not use `aria-hidden="true"` on focusable elements.** This creates a confusing state where the element is invisible to assistive technology but receives focus.

6. **Test with real assistive technology.** ARIA support varies between screen readers and browsers. Automated tools catch missing attributes but not broken interaction patterns.
