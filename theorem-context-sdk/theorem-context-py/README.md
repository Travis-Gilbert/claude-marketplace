# Context-Theorem (Python)

Python SDK for Context Theorem.

## OpenAPI

These package clients target the product-facing Context Theorem v2 API. For
manual HTTP work or generated tooling, use the v2 Django Ninja schema rather
than the legacy DRF compatibility schema.

| Purpose | URL |
| --- | --- |
| SDK `base_url` | `https://<host>/api/v2/theseus` |
| SDK `plugins_base_url` | `https://<host>/api/v2/plugins` |
| v2 OpenAPI JSON | `https://<host>/api/v2/openapi.json` |
| v2 interactive docs | `https://<host>/api/v2/docs` |
| legacy DRF schema | `https://<host>/api/schema/` |
| legacy Swagger / ReDoc | `https://<host>/api/schema/swagger/`, `https://<host>/api/schema/redoc/` |

`TheoremContextClient` expects its `base_url` to include `/api/v2/theseus`,
while the OpenAPI document lives one level higher at `/api/v2/openapi.json`.
`plugins_base_url` is derived automatically from `base_url` unless you
override it explicitly.

### Namespace to path mapping

| SDK surface | HTTP path family |
| --- | --- |
| `cc.context.*` | `/api/v2/theseus/context/*` |
| `cc.context_command.*` | `/api/v2/theseus/context-command/*` |
| `cc.actions.*` | `/api/v2/theseus/action-rail/*` |
| `cc.harness.*` | `/api/v2/theseus/harness/*` |
| `cc.orchestrate()`, `cc.orchestrate_preview()`, `cc.orchestrate_prepare()` | `/api/v2/theseus/orchestrate/*` |
| `cc.inference.*` | `/api/v2/theseus/inference/*` |
| `cc.encode.*` | `/api/v2/theseus/encode/*` |
| `cc.learning.*` | `/api/v2/plugins/learning/*` |
| `cc.product.*` | `/api/v2/theseus/product/*` |
| `cc.thg.*` | `/api/v2/theseus/harness/thg/*` |

### Pull the live spec

```bash
curl \
  -H "Authorization: Bearer $THEOREM_API_KEY" \
  "$THEOREM_CONTEXT_SERVER/api/v2/openapi.json"
```

Set `THEOREM_CONTEXT_SERVER` to the host root, for example
`https://index-api-production-a5f7.up.railway.app`, not the SDK `base_url`.

The SDK is a hand-written typed wrapper over that OpenAPI surface, so method
names are curated for ergonomics rather than mirroring raw operation ids.
When you drop to direct HTTP, keep the v2 trailing-slash convention from the
spec.

Prefer `THEOREM_API_KEY` for agent and MCP wiring. `THEOREM_CONTEXT_API_KEY`
remains accepted as a legacy alias during the transition.

```bash
pip install Context-Theorem
```

```python
import asyncio
import os
from theorem_context import TheoremContextClient

async def main():
    async with TheoremContextClient(
        base_url=os.environ.get('THEOREM_CONTEXT_BASE_URL'),
        api_key=(
            os.environ.get('THEOREM_API_KEY')
            or os.environ.get('THEOREM_CONTEXT_API_KEY')
        ),
    ) as cc:
        artifact = await cc.context.compile(
            task='review the auth module for missing rate limits',
            task_type='review',
            budget_tokens=8000,
        )
        print(artifact.token_ledger.capsuleTokens, artifact.atoms)

asyncio.run(main())
```

## Memory and Harness Facade

The `Harness` class is an additive ergonomic facade over
`TheoremContextClient` that exposes three responsibility-scoped
namespaces matching the conversation's three-MCP split mental model
(memory / action / diagnose). The underlying `TheoremContextClient`
keeps working unchanged; the facade is purely a more-ergonomic surface
on top.

```python
import asyncio
from theorem_context import Harness, TheoremContextClient


async def main():
    client = TheoremContextClient(api_key='...')
    harness = Harness(client=client)
    try:
        memory = await harness.memory.recall(
            query='auth refactor',
            actor='claude-ai',
            kind='session_summary',
            limit=5,
        )
        # {'results': [...], 'count': 5}

        written = await harness.memory.remember(
            'Cluster D shipped; SDK Harness facade is live.',
            evidence=['commit:d4d787af'],
        )

        handoff = await harness.action.handoff(
            workstream_id='ws-123',
            next_agent='claude-code',
            previous_agent='claude-ai',
        )
    finally:
        await client.aclose()


asyncio.run(main())
```

`harness.memory.recall(...)` hits the unified harness recall endpoint
(`POST /api/v2/theseus/harness/recall`) which wraps the cross-surface
memory store. It returns the same shape as the MCP `recall` verb so
MCP-aware callers and SDK callers reach the same store with the same
semantics.

`harness.diagnose` is reserved for an intelligence-diagnostics cluster
(iq / health / stats). Methods are NOT added until their backend
endpoints exist; the SDK harness product rule forbids shipping facade
methods without real backing wiring.

For callers who need the lower-level `client.recall(...)` directly
without the facade:

```python
memory = await client.recall(query='...', kind='session_summary')
```

`client.recall(...)` is a top-level method on `TheoremContextClient`
alongside the existing `client.context.remember(...)`. Both hit the
same backend endpoints the MCP `recall`/`remember` verbs call.

## Artifact exports

```python
signed = await cc.context.artifacts.export('artifact-123', format='signed')
markdown = await cc.context.artifacts.export('artifact-123', format='markdown')
pdf = await cc.context.artifacts.export('artifact-123', format='pdf')

print(signed.signed, markdown.content)

if pdf.stub:
    print(pdf.reason)
```

Signed JSON and Markdown exports call the live backend routes today. PDF
currently returns the backend's explicit stub response.

## Artifact lifecycle and graph context

```python
forked = await cc.context.artifacts.fork(
    'artifact-123',
    title='Redis harness follow-up',
    metadata={'reason': 'branch review context'},
)

attached = await cc.context.artifacts.attach(
    'artifact-123',
    'run-123',
    target_type='harness_run',
    metadata={'adapter': 'codex'},
)

focus = await cc.context.graph.focus([42])
patches = await cc.context.graph.patches.list()
```

Artifact `fork()` clones the compiled artifact and atom rows into a new
artifact with fork provenance. Artifact `attach()` records provenance and, for
harness-run targets, links the artifact into the run state. Graph focus and
graph patches call the live read-only graph context endpoints.

## BGI Inference Substrate

```python
registry = await cc.inference.registry()

solver = await cc.inference.solver.context_capsule(
    capsule={'user_task': {'text': 'prove this context is safe'}},
    budget_tokens=8000,
    input_view_refs=['artifact:123'],
)

brief = await cc.inference.expression.render(
    'deterministic_brief',
    result=solver.model_dump(),
    metadata={'audience': 'operator'},
)

preview = await cc.inference.discovery_runs.preview(
    objective='find stronger validators for this context artifact',
    hypothesis='native parity receipts reduce validation cost',
    action={'kind': 'benchmark', 'target': 'receipt_compaction'},
    context_refs=['artifact:123'],
    expected_value=0.8,
)
```

These methods call the BGI backend substrate under
`/api/v2/theseus/inference/...`. Registry, solver, expression, and
DiscoveryRun preview surfaces are live and read-only/proposal-only by default;
the preview response explicitly reports `append_only` and
`canonical_graph_mutation`.

The SDK also exports typed error classes for higher-level branching:
`AuthError`, `CompileError`, `HarnessError`, `RequestTimeoutError`,
`ServerUnavailableError`, `UnsupportedSurfaceError`, and `StubSurfaceError`.

## Context Command And Action Rail

```python
command = await cc.context_command.resolve(
    goal='Read this page',
    current_url='https://example.com/a',
    selected_text='claim text',
)

preview = await cc.context_command.preview(command['state']['command_id'])

rail = await cc.actions.generate(
    current_url='https://example.com/a',
    selected_text='claim text',
)

action_preview = await cc.actions.preview(action_id='capture_page')
await cc.actions.record_selected(rail['rail_id'], action_id='capture_page')
```

These methods map directly to the existing `/api/v2/theseus/context-command/...`
and `/api/v2/theseus/action-rail/...` routes.

## Learning Profiles And THG

```python
installed = await cc.learning.profiles.install(
    'developer-core',
    enabled_by_default=True,
)

toolkit = await cc.learning.profiles.toolkit(
    'developer-core',
    task_type='python_review',
    permissions=['code_read', 'graph_read'],
    budget_tokens=6000,
)

spend_plan = await cc.learning.context.spend_plan(
    profile_id='developer-core',
    task_signature='review.python.pr',
    budget_tokens=6000,
    candidate_atoms=[],
)

thg_toolkit = await cc.thg.profiles.toolkit(
    profile_id='developer-core',
    task_type='python_review',
    permissions=['code_read'],
)
```

Use `learning.*` for the Django-backed `/api/v2/plugins/learning/...` routes:
profile install, toolkit resolution, spend plans, and structural signals.
Use `thg.profiles.*` and `thg.plugins.*` when you want the THG runtime command
surface with graph-shaped results like `nodes`, `edges`, `events`, and
`state_hash`.

## Orchestrate

```python
result = await cc.orchestrate(
    task='Fix the failing SDK harness parity test',
    mode='fix',
    repo='Travis-Gilbert/Index-API',
    budget_tokens=6000,
)

print(
    result.run.run_id,
    result.decision.selected_profile_id,
    result.artifact.id if result.artifact else None,
    result.action_rail['rail_id'] if result.action_rail else None,
)

preview = await cc.orchestrate_preview(
    task='Fix the failing SDK harness parity test',
    mode='fix',
)

print(preview.decision.selected_tool_ids)
```

CLI:

```bash
context-theorem orchestrate "Fix the failing SDK harness parity test" --mode fix
```

`orchestrate()` now calls the server-authoritative
`/api/v2/theseus/orchestrate/run/` route. The runtime selects a profile,
compiles the visible toolkit, records an Orchestrate decision into the harness
run, resolves a Context Command, compiles and attaches a Context Artifact, and
generates an Action Rail. It still does not promote memory patches or claim
canonical graph writes.

## Codex Bundle

Python is the canonical local wrapper layer for Codex-ready harness setup.

```bash
context-theorem codex prepare \
  --task "Review the database harness SDK gap" \
  --bundle-dir .theorem \
  --task-type review
```

You can also call the adapter directly:

```python
from theorem_context import TheoremContextClient, prepare_codex_bundle

async with TheoremContextClient() as cc:
    await prepare_codex_bundle(
        client=cc,
        task='Review the database harness SDK gap',
        bundle_dir='.theorem',
        task_type='review',
    )
```

This writes the local Codex bundle files:

- `.theorem/current-context.md`
- `.theorem/current-artifact.json`
- `.theorem/current-run.json`
- `.theorem/runs/<run_id>/...`

You can inspect `cc.surface_status` when you need to branch on live, stubbed,
unsupported, or compatibility-only surfaces without probing the server first.

The legacy `theorem-context` console command remains available for local
compatibility.

## Database Harness Compatibility Layer

The same client exposes replayable agent-run harness routes plus the separate
V3 THG command surface:

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
does not promote canonical graph memory directly. The public `harness.*`
namespace still returns the compatibility `AgentRunState` shape. THG is the
separate V3 sidecar/runtime surface for richer graph-shaped state-machine
results, while Redis/cache remains hot run-state storage and not canonical
graph memory.

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
    await thg.instant_kg_ppr(
        {'file:src/lib.rs': 1.0},
        delta={
            'changed_files': ['src/lib.rs'],
            'objects': [],
            'edges': [],
        },
        top_k=5,
    )
```

See the TypeScript SDK at `packages/theorem-context-ts` for an equivalent
surface in JavaScript and TypeScript.
