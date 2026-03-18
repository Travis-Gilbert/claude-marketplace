---
name: standards-component-design
description: Component API design standards from Base-UI, Material-UI, and AG Grid — prop design, accessibility, composition, theming. Auto-loads for component library work.
type: context
applies_to: [component-library, design-system, ui-components, base-ui, material-ui, radix, headless-ui]
file_extensions: []
---

# Component API Design Standards

> Based on patterns from Base-UI, Material-UI, and AG Grid source code in `~/.claude/js-pro/refs/`. Verify patterns against source before implementing.

## Core Principles

1. **Accessibility first** — every component must work with keyboard, screen readers, and assistive tech
2. **Composition over configuration** — use render props and slots, not giant prop objects
3. **Controlled + uncontrolled** — support both patterns, never mix
4. **Theme tokens** — never hardcode colors, spacing, or typography

## Prop Design Patterns

### State-Callback Props (Base-UI Pattern)

Props should accept static values OR callbacks that receive component state:

```javascript
// Allow className as string or function of state
interface ButtonProps {
  className?: string | ((state: ButtonState) => string);
  style?: CSSProperties | ((state: ButtonState) => CSSProperties);
}

interface ButtonState {
  active: boolean;
  disabled: boolean;
  focusVisible: boolean;
}
```

This lets consumers style based on internal state without exposing internals.

### Controlled vs Uncontrolled

Support both patterns via paired props. Never allow both simultaneously:

```javascript
// Controlled
<Checkbox checked={isChecked} onCheckedChange={setChecked} />

// Uncontrolled
<Checkbox defaultChecked={true} />
```

Internally, use a `useControlled()` hook for a single source of truth:

```javascript
function useControlled({ controlled, default: defaultValue }) {
  const isControlled = controlled !== undefined;
  const [valueState, setValue] = useState(defaultValue);
  const value = isControlled ? controlled : valueState;
  const setValueIfUncontrolled = useCallback(newValue => {
    if (!isControlled) setValue(newValue);
  }, [isControlled]);
  return [value, setValueIfUncontrolled];
}
```

### Event Detail Objects

Include structured detail objects in event callbacks, not just the raw event:

```javascript
interface CheckboxChangeDetails {
  checked: boolean;
  reason: 'click' | 'keyboard' | 'programmatic';
}

onCheckedChange?: (checked: boolean, details: CheckboxChangeDetails) => void;
```

### Render Prop / Slot Pattern

Allow complete element replacement while preserving component logic:

```javascript
<Select
  render={<CustomDropdown />}           // Element replacement
  renderOption={(props, state) =>       // Function form
    <li {...props} className={state.selected ? 'active' : ''} />
  }
/>
```

## Accessibility Checklist

Every interactive component MUST implement:

### Semantic HTML

- Render native elements when possible (`<button>`, `<input>`, `<select>`)
- If non-semantic, add `role` attribute
- Hidden native inputs for form integration (checkbox, radio, switch)

### ARIA Attributes

| State | Attribute | Components |
|-------|-----------|-----------|
| Checked | `aria-checked` | Checkbox, Radio, Switch |
| Expanded | `aria-expanded` | Accordion, Dropdown, Disclosure |
| Disabled | `aria-disabled` | All interactive |
| Selected | `aria-selected` | Tabs, Listbox, Menu |
| Label | `aria-labelledby` | All (associate with label) |
| Description | `aria-describedby` | Inputs with help text |
| Live updates | `aria-live` | Toast, Alert, Status |

### Keyboard Navigation

| Component | Keys | Behavior |
|-----------|------|----------|
| Button | Space, Enter | Activate |
| Checkbox | Space | Toggle |
| Tabs | Arrow keys | Navigate between tabs |
| Menu | Arrow keys, Escape | Navigate items, close |
| Dialog | Tab (trap), Escape | Focus trap, close |
| Combobox | Arrow keys, Enter, Escape | Navigate, select, close |

### Focus Management

- `focusableWhenDisabled` — allow disabled elements to receive focus (for tooltip access)
- Focus trap in modals/dialogs (Tab cycles within, Escape closes)
- Restore focus to trigger element when closing overlays
- Use `tabIndex` control for composite widgets (roving tabindex)
- Generate unique IDs with `useId()` for label associations

## Theme / Variant System

### CSS Custom Properties (Preferred)

```css
.button {
  background: var(--button-bg);
  color: var(--button-color);
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-radius);
}

.button[data-variant="contained"] {
  --button-bg: var(--color-primary);
  --button-color: var(--color-on-primary);
}

.button[data-variant="outlined"] {
  --button-bg: transparent;
  --button-color: var(--color-primary);
  border: 1px solid currentColor;
}
```

### Variant + Size Props

```javascript
interface ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error';
}
```

### Class Composition (Material-UI Pattern)

```javascript
const classes = composeClasses(
  {
    root: ['root', variant, `${variant}${capitalize(color)}`, size, disabled && 'disabled'],
    label: ['label'],
    icon: ['icon', `icon${capitalize(size)}`],
  },
  getButtonUtilityClass,
  userClasses
);
```

### State-Based Styling

```css
/* Interaction states */
.button:hover { --button-bg: var(--color-primary-hover); }
.button:active { --button-bg: var(--color-primary-active); }
.button:focus-visible { outline: 2px solid var(--color-focus-ring); }

/* Touch device handling */
@media (hover: none) {
  .button:hover { --button-bg: var(--button-bg); }  /* No hover on touch */
}

/* Disabled state */
.button[data-disabled] {
  opacity: 0.38;
  pointer-events: none;
}
```

## Complex Component Patterns (AG Grid)

For data-heavy components (tables, grids, trees):

### Modular Feature Architecture

```javascript
// Features as pluggable modules
const grid = createGrid({
  modules: [ClientSideRowModel, ColumnAutoSize, CsvExport],
  columnDefs: [...],
  rowData: [...],
});
```

### Virtual Rendering

Render only visible items for large datasets:

```javascript
// Only render rows in the viewport
const visibleRows = rowModel.getRowsInRange(
  viewport.firstRow,
  viewport.lastRow
);
```

### Configuration Object Pattern

```javascript
interface GridOptions {
  // Data
  rowData: any[];
  columnDefs: ColDef[];
  // Behavior callbacks
  onCellClicked?: (params: CellClickedEvent) => void;
  getRowId?: (params: GetRowIdParams) => string;
  // Feature flags
  pagination?: boolean;
  rowSelection?: 'single' | 'multiple';
}
```

## Anti-Patterns

| Don't | Do Instead | Why |
|-------|-----------|-----|
| Expose internal state via props | Use State callback pattern | Encapsulation |
| Mix controlled + uncontrolled | `useControlled()` hook | Single source of truth |
| Hardcode colors/spacing | CSS custom properties / theme tokens | Theming support |
| Skip ARIA on custom elements | Always add role + aria-* | Accessibility |
| Use `<div>` for buttons | Use `<button>` or add `role="button"` + keyboard handlers | Semantics |
| Force required children | Support render prop / slot patterns | Composition flexibility |
| Global CSS selectors | Scoped classes or CSS modules | Style isolation |
| Skip focus management in overlays | Implement focus trap + restore | Keyboard accessibility |
| Hardcode media queries | Use theme breakpoint tokens | Responsive consistency |
| Mutate props directly | Merge with `mergeProps()` utility | Predictable behavior |

## Verification Paths

| Library | What to Check | Path |
|---------|--------------|------|
| Base-UI | Unstyled component APIs, hooks, a11y | `~/.claude/js-pro/refs/base-ui-master/` |
| Material-UI | Theme system, styled patterns, variants | `~/.claude/js-pro/refs/material-ui-master/` |
| AG Grid | Complex data component patterns | `~/.claude/js-pro/refs/ag-grid-latest/` |
| XYFlow | Node-based UI, handle/connection API | `~/.claude/js-pro/refs/xyflow-main/` |
| Shadcn | Composition patterns, Radix primitives | `~/.claude/js-pro/refs/components-main/` |
