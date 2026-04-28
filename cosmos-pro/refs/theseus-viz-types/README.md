# theseus-viz-types (sync target)

This directory is populated by syncing from the runtime project, not by
cloning. The expected content:

- `SceneDirective.ts` — copied from
  `<travisgilbert.me>/src/lib/theseus-viz/SceneDirective.ts`

Sync command (from the runtime project root):

```bash
cp src/lib/theseus-viz/SceneDirective.ts \
  ../codex-plugins/cosmos-pro/refs/theseus-viz-types/SceneDirective.ts
```

Run this after every change to the SceneDirective contract. The
cosmos-pro adapter (`templates/applyDirective.ts`) is the only consumer;
if the contract drifts, the adapter must move with it.
