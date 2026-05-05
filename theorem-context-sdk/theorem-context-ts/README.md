# @theorem/context (TypeScript)

TypeScript / JavaScript SDK for the Theorem Context Compiler.

```ts
import { TheoremContextClient } from '@theorem/context';

const cc = new TheoremContextClient({ apiKey: '...' });

const artifact = await cc.context.compile({
  task: 'review the auth module for missing rate limits',
  task_type: 'review',
  budget_tokens: 8000,
});

console.log(artifact.token_ledger.capsuleTokens, artifact.atoms);

for await (const event of cc.context.compileStream({ task: '...' })) {
  console.log(event.event, event.data);
}
```

## Database Harness V3

```ts
const run = await cc.harness.begin({
  task: 'research Database Harness V3',
  actor: 'claude-code',
  scope: {
    task_type: 'research',
    permissions: ['web_browse', 'graph_read'],
  },
});

const search = await cc.harness.search(run.run_id, {
  query: 'Database Harness V3 replay',
  budget: { top_k: 3 },
});

const replay = await cc.harness.replay(run.run_id);

const thg = await cc.thg.command('THG.RUN.BEGIN', {
  run_id: 'run:sdk',
  task: 'execute THG',
});
```

Harness memory patches are proposals; validation returns review state and
does not promote canonical graph memory directly. THG is the V3 sidecar/runtime
surface; Redis/cache remains hot run-state storage, not canonical graph memory.

## THG Product Service

```ts
import { TheoremHotGraphClient } from '@theorem/context';

const thg = new TheoremHotGraphClient({
  baseUrl: 'https://thg-product.example.com',
  tenantId: 'tenant-a',
  token: process.env.THG_PRODUCT_TOKEN!,
});

await thg.command('THG.RUN.BEGIN', {
  run_id: 'run:sdk',
  task: 'execute product THG',
});
```

See the Python SDK at `packages/theorem-context-py` for an equivalent
surface in Python.
