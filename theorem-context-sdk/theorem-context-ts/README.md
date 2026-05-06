# @theorem/context (TypeScript)

TypeScript / JavaScript SDK for the Theorem Context Compiler.

```ts
import { TheoremContextClient } from '@theorem/context';

const cc = new TheoremContextClient({
  baseUrl: process.env.THEOREM_CONTEXT_BASE_URL,
  apiKey: process.env.THEOREM_CONTEXT_API_KEY,
});

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

## Artifact exports

```ts
const signed = await cc.context.artifacts.export('artifact-123', 'signed');
const markdown = await cc.context.artifacts.export('artifact-123', 'markdown');
const pdf = await cc.context.artifacts.export('artifact-123', 'pdf');

console.log(signed.signed, markdown.content);

if (pdf.stub) {
  console.log(pdf.reason);
}
```

Signed JSON and Markdown exports call the live backend routes today. PDF
currently returns the backend's explicit stub response.

## Artifact lifecycle and graph context

```ts
const forked = await cc.context.artifacts.fork('artifact-123', {
  title: 'Redis harness follow-up',
  metadata: { reason: 'branch review context' },
});

const attached = await cc.context.artifacts.attach('artifact-123', 'run-123', {
  target_type: 'harness_run',
  metadata: { adapter: 'codex' },
});

const focus = await cc.context.graph.focus([42]);
const patches = await cc.context.graph.patches.list();
```

Artifact `fork()` clones the compiled artifact and atom rows into a new
artifact with fork provenance. Artifact `attach()` records provenance and, for
harness-run targets, links the artifact into the run state. Graph focus and
graph patches call the live read-only graph context endpoints.

The SDK also exports typed error classes for higher-level branching:
`AuthError`, `CompileError`, `HarnessError`, `RequestTimeoutError`,
`ServerUnavailableError`, `UnsupportedSurfaceError`, and `StubSurfaceError`.

## Context Command And Action Rail

```ts
const command = await cc.contextCommand.resolve({
  goal: 'Read this page',
  current_url: 'https://example.com/a',
  selected_text: 'claim text',
});

const preview = await cc.contextCommand.preview(command.state.command_id);

const rail = await cc.actions.generate({
  current_url: 'https://example.com/a',
  selected_text: 'claim text',
});

const actionPreview = await cc.actions.preview({ action_id: 'capture_page' });
await cc.actions.recordSelected(rail.rail_id, { action_id: 'capture_page' });
```

These methods map directly to the existing `/api/v2/theseus/context-command/...`
and `/api/v2/theseus/action-rail/...` routes.

## Learning Profiles And THG

```ts
const installed = await cc.learning.profiles.install('developer-core', {
  enabled_by_default: true,
});

const toolkit = await cc.learning.profiles.toolkit('developer-core', {
  task_type: 'python_review',
  permissions: ['code_read', 'graph_read'],
  budget_tokens: 6000,
});

const spendPlan = await cc.learning.context.spendPlan({
  profile_id: 'developer-core',
  task_signature: 'review.python.pr',
  budget_tokens: 6000,
  candidate_atoms: [],
});

const thgToolkit = await cc.thg.profiles.toolkit({
  profile_id: 'developer-core',
  task_type: 'python_review',
  permissions: ['code_read'],
});
```

Use `learning.*` for the Django-backed `/api/v2/plugins/learning/...` routes:
profile install, toolkit resolution, spend plans, and structural signals.
Use `thg.profiles.*` and `thg.plugins.*` when you want the THG runtime command
surface with graph-shaped results like `nodes`, `edges`, `events`, and
`state_hash`.

## Orchestrate

```ts
const result = await cc.orchestrate({
  task: 'Fix the failing SDK harness parity test',
  mode: 'fix',
  repo: 'Travis-Gilbert/Index-API',
  budget_tokens: 6000,
});

console.log(result.run.run_id, result.artifact?.id, result.action_rail?.rail_id);
```

`orchestrate()` is a composed SDK convenience over shipped routes. It begins a
Redis-backed harness run, resolves a Context Command, compiles and attaches a
Context Artifact, and generates an Action Rail. It does not promote memory
patches or claim canonical graph writes.

## Codex Bundle

```ts
import { prepareCodexBundle, TheoremContextClient } from '@theorem/context';

const cc = new TheoremContextClient({
  baseUrl: process.env.THEOREM_CONTEXT_BASE_URL,
  apiKey: process.env.THEOREM_CONTEXT_API_KEY,
});

await prepareCodexBundle({
  client: cc,
  task: 'Review the database harness SDK gap',
  bundleDir: '.theorem',
  taskType: 'review',
});
```

This writes the local Codex bundle files:

- `.theorem/current-context.md`
- `.theorem/current-artifact.json`
- `.theorem/current-run.json`
- `.theorem/runs/<run_id>/...`

You can inspect `cc.surfaceStatus` when you need to branch on live, stubbed,
unsupported, or compatibility-only surfaces without probing the server first.

## Database Harness Compatibility Layer

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
does not promote canonical graph memory directly. The public `harness.*`
namespace still returns the compatibility `AgentRunState` shape. THG is the
separate V3 sidecar/runtime surface for richer graph-shaped state-machine
results, while Redis/cache remains hot run-state storage and not canonical
graph memory.

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
