# spec-guard

Enforce specification compliance during Claude Code sessions via hooks. Checks every edit against the active spec document and flags deviations before they land.

## Commands

| Command | Description |
|---------|-------------|
| `/spec-guard PATH [--protected files]` | Activate spec enforcement for this session |
| `/spec-grind PATH [--verify CMD] [--max-iterations N]` | Autonomous spec implementation loop |
| `/cancel-grind` | Cancel an active grind loop |

## How It Works

### Spec Guard (edit checking)

A PreToolUse hook fires before every Edit/Write/MultiEdit. It checks whether the file being edited matches a protected path from the spec. If it does, a warning is emitted.

```
/spec-guard specs/collage-hero-design-spec.md --protected src/styles/global.css,src/components/CollageHero
```

### Spec Grind (autonomous loop)

Feed it a spec and a verification command. Claude iterates until every requirement is implemented and verified, then outputs a completion promise to exit the loop.

```
/spec-grind specs/paper-trail-spec.md --verify 'npm test' --max-iterations 25
```

The Stop hook prevents Claude from exiting until the spec is complete or max iterations are reached.

## State Files

All state is session-local and stored in `.claude/`:

- `.claude/spec-guard.local.md` -- active spec content
- `.claude/spec-guard-protected.local.txt` -- protected file paths
- `.claude/spec-grind.local.md` -- grind loop state (iteration, spec, verify command)

These files are ephemeral. Delete them to deactivate.

## Enforcement Model

The PreToolUse hook (check-spec.sh) currently operates in **warn-only mode**. To enable hard blocking, change `exit 0` to `exit 2` on the protected-path match in `hooks/check-spec.sh`.
