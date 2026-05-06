# theorem-context (Python)

Python SDK for the Context Theorem Compiler.

```python
import asyncio
from theorem_context import TheoremContextClient

async def main():
    async with TheoremContextClient(api_key='...') as cc:
        artifact = await cc.context.compile(
            task='review the auth module for missing rate limits',
            task_type='review',
            budget_tokens=8000,
        )
        print(artifact.token_ledger.capsuleTokens, artifact.atoms)

asyncio.run(main())
```

## Database Harness V3

The same client exposes replayable agent-run harness routes and the V3 THG
custom database command surface:

```python
async with TheoremContextClient(
    base_url='http://localhost:8000/api/v2/theseus',
) as cc:
    run = await cc.harness.begin(
        task='research Database Harness V3',
        actor='codex',
        scope={
            'task_type': 'research',
            'permissions': ['web_browse', 'graph_read'],
        },
    )
    search = await cc.harness.search(
        run.run_id,
        query='Database Harness V3 replay',
        budget={'top_k': 3},
    )
    artifact = await cc.harness.context(
        run.run_id,
        task='brief Database Harness V3 replay',
    )
    thg = await cc.thg.command(
        'THG.RUN.BEGIN',
        {'run_id': 'run:sdk', 'task': 'execute THG'},
    )
```

Harness memory patches are proposals; validation returns review state and
does not promote canonical graph memory directly. THG is the V3 sidecar/runtime
surface; Redis/cache remains hot run-state storage, not canonical graph memory.

## THG Product Service

```python
from theorem_context import TheoremHotGraphClient

async with TheoremHotGraphClient(
    base_url='https://thg-product.example.com',
    tenant_id='tenant-a',
    token='...',
) as thg:
    await thg.command(
        'THG.RUN.BEGIN',
        {'run_id': 'run:sdk', 'task': 'execute product THG'},
    )
```

See the TypeScript SDK at `packages/theorem-context-ts` for an equivalent
surface in JavaScript and TypeScript.
