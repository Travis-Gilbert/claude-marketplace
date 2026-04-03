# Design Primitives — Sonner, Vaul, CMDK

## Sonner (Toasts)

Engine status notifications. Minimal and informative.

**Purpose:** Notify user of background engine events
**Position:** Bottom-right
**Theme:** Dark, VIE tokens

**Usage examples:**
- "Model saved."
- "2 new connections discovered."
- "Web search complete. 14 sources gathered."
- "Confidence updated: 0.72 → 0.84"

**Configuration:**
```tsx
<Toaster
  position="bottom-right"
  theme="dark"
  toastOptions={{
    style: {
      background: 'rgba(15, 16, 18, 0.86)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      color: 'var(--vie-text)',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  }}
/>
```

**Grepping Sonner source:**
```bash
grep -r "Toaster\|toast" refs/sonner/src/
```

## Vaul (Drawer)

Bottom-up slide panels for detail exploration.

**Purpose:** When a user clicks a node and wants to read the full evidence chain or reasoning, a drawer slides up. This preserves the visual model on screen while allowing deep reading. Especially important on mobile.

**Trigger:** Node click (single click for summary, double click for full detail)

**Content:**
- Full reasoning chain for the selected node
- Evidence sources with confidence scores
- Related objects and connections
- Actions: explore deeper, validate, remove

**Configuration:**
```tsx
<Vaul.Root>
  <Vaul.Portal>
    <Vaul.Overlay
      style={{
        background: 'rgba(15, 16, 18, 0.4)',
      }}
    />
    <Vaul.Content
      style={{
        background: 'rgba(15, 16, 18, 0.92)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px 20px 0 0',
        backdropFilter: 'blur(18px)',
        boxShadow: 'var(--vie-shadow-xl)',
      }}
    >
      {/* Node detail content */}
    </Vaul.Content>
  </Vaul.Portal>
</Vaul.Root>
```

**Grepping Vaul source:**
```bash
grep -r "Drawer\|Root\|Content" refs/vaul/src/
```

## CMDK (Command Palette)

Quick access via `Cmd+K`. Power-user feature, not primary interaction.

**Commands:**
- Search the graph
- Save current model
- Switch between 2D/3D view
- Export visualization
- Toggle text panel
- Navigate to homepage
- Open settings

**Configuration:**
```tsx
<Command.Dialog
  style={{
    background: 'rgba(15, 16, 18, 0.92)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    backdropFilter: 'blur(18px)',
    boxShadow: 'var(--vie-shadow-xl)',
  }}
>
  <Command.Input
    placeholder="Search or run a command..."
    style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: 'var(--vie-text)',
    }}
  />
  <Command.List>
    <Command.Group heading="Navigation">
      <Command.Item>Search graph</Command.Item>
      <Command.Item>Go home</Command.Item>
    </Command.Group>
    <Command.Group heading="View">
      <Command.Item>Switch to 2D</Command.Item>
      <Command.Item>Toggle text panel</Command.Item>
    </Command.Group>
    <Command.Group heading="Actions">
      <Command.Item>Save model</Command.Item>
      <Command.Item>Export</Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

**Grepping CMDK source:**
```bash
grep -r "Command\|Dialog\|Input" refs/cmdk/src/
```

## Integration Notes

- All primitives use VIE tokens exclusively (never hardcode colors)
- All surfaces use glass-morphism treatment
- System-voice labels in JetBrains Mono, uppercase, letter-spaced
- Sonner toasts should be brief (under 60 characters)
- Vaul drawers should load content lazily (don't fetch until opened)
- CMDK should fuzzy-match commands
