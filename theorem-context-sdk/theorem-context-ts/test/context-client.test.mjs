import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthError,
  HarnessError,
  RequestTimeoutError,
  TheoremContextClient,
} from '../dist/index.js';

test('context artifacts export calls signed export route', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return new Response(
        JSON.stringify({
          node_id: 'node-a',
          signature: 'sig',
          payload_hash: 'hash',
          payload: { id: 'artifact-1' },
          signed: true,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const result = await client.context.artifacts.export('artifact-1', 'signed');

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/context/artifacts/artifact-1/export/signed/',
  );
  assert.equal(requests[0].init.method, 'GET');
  assert.equal(result.format, 'signed');
  assert.equal(result.artifact_id, 'artifact-1');
  assert.equal(result.signed, true);
  assert.deepEqual(result.payload, { id: 'artifact-1' });
});

test('context artifacts export wraps markdown route output', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return new Response('# Context Brief', {
        status: 200,
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });
    },
  });

  const result = await client.context.artifacts.export('artifact-1', 'markdown');

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/context/artifacts/artifact-1/export/markdown/',
  );
  assert.equal(requests[0].init.method, 'GET');
  assert.equal(result.format, 'markdown');
  assert.equal(result.artifact_id, 'artifact-1');
  assert.equal(result.content, '# Context Brief');
  assert.equal(result.content_type, 'text/markdown; charset=utf-8');
});

test('context artifacts export preserves the pdf stub response', async () => {
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          stub: true,
          reason: 'PDF rendering pipeline lands post-launch.',
          artifact_id: 'artifact-1',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
  });

  const result = await client.context.artifacts.export('artifact-1', 'pdf');

  assert.equal(result.format, 'pdf');
  assert.equal(result.artifact_id, 'artifact-1');
  assert.equal(result.stub, true);
  assert.equal(result.reason, 'PDF rendering pipeline lands post-launch.');
});

test('context artifacts fork and attach call live backend routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/fork/')) {
        return new Response(
          JSON.stringify({
            forked: true,
            source_artifact_id: 'artifact-1',
            cloned_atom_count: 2,
            artifact: {
              id: 'artifact-2',
              status: 'compiled',
              task_type: 'review',
              task_description: 'review harness',
              budget_tokens: 1000,
              capsule: {},
              atoms: [],
              actions: [],
              graph_health: {},
              stress_test: {},
              provenance: {},
              token_ledger: {},
              source_graph: {},
              cache_key: '',
              cache_hit: false,
              created_at: null,
              updated_at: null,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          attached: true,
          harness_attached: true,
          attachment: { artifact_id: 'artifact-1', target: 'run-1' },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const forked = await client.context.artifacts.fork('artifact-1', {
    metadata: { reason: 'test' },
  });
  const attached = await client.context.artifacts.attach(
    'artifact-1',
    'run-1',
    { metadata: { adapter: 'codex' } },
  );

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/context/artifacts/artifact-1/fork/',
  );
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(JSON.parse(requests[0].init.body).metadata.reason, 'test');
  assert.equal(forked.artifact.id, 'artifact-2');
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/context/artifacts/artifact-1/attach/',
  );
  assert.equal(JSON.parse(requests[1].init.body).target, 'run-1');
  assert.equal(attached.harness_attached, true);
});

test('context command namespace maps resolve and preview to existing routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/context-command/resolve/')) {
        return new Response(
          JSON.stringify({
            state: { command_id: 'cmd-1', goal: 'Read this page', working_set: [] },
            preview: { command_id: 'cmd-1', working_set_count: 2 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          command_id: 'cmd-1',
          working_set_count: 2,
          permissions: { read: true },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const resolved = await client.contextCommand.resolve({
    goal: 'Read this page',
    current_url: 'https://example.com/a',
  });
  const preview = await client.contextCommand.preview('cmd-1');

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/context-command/resolve/',
  );
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(JSON.parse(requests[0].init.body).goal, 'Read this page');
  assert.equal(resolved.state.command_id, 'cmd-1');
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/context-command/cmd-1/preview/',
  );
  assert.equal(requests[1].init.method, 'POST');
  assert.equal(preview.command_id, 'cmd-1');
});

test('action rail namespace maps generate, preview, and selected routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/action-rail/generate/')) {
        return new Response(
          JSON.stringify({
            rail_id: 'rail-1',
            actions: [{ action_id: 'capture_page', action_type: 'capture_page' }],
            grouped: { capture: [{ action_id: 'capture_page', action_type: 'capture_page' }] },
            context_summary: {},
            warnings: [],
            metadata: {},
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (String(url).endsWith('/action-rail/preview-action/')) {
        return new Response(
          JSON.stringify({
            action_id: 'capture_page',
            action_type: 'capture_page',
            execution_route: 'capture_api',
            confirmation_required: true,
            required_permissions: [],
            payload: {},
            receipt_preview: {
              status: 'requires_confirmation',
              risk: 'low',
              score: 0.9,
              does_not_execute: true,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const generated = await client.actions.generate({
    current_url: 'https://example.com/a',
    selected_text: 'claim text',
  });
  const preview = await client.actions.preview({ action_id: 'capture_page' });
  const selected = await client.actions.recordSelected('rail-1', {
    action_id: 'capture_page',
    user_id: 'u1',
  });

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/action-rail/generate/',
  );
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(generated.rail_id, 'rail-1');
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/action-rail/preview-action/',
  );
  assert.equal(preview.execution_route, 'capture_api');
  assert.equal(
    requests[2].url,
    'http://localhost:8000/api/v2/theseus/action-rail/rail-1/selected/',
  );
  assert.deepEqual(selected, { ok: true });
});

test('context graph namespace maps focus and patches to live routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/context/graph/focus/')) {
        return new Response(
          JSON.stringify({
            stub: false,
            seed_ids: [1],
            nodes: [{ id: 1, title: 'Redis harness' }],
            edges: [],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          stub: false,
          patches: [{ id: 1, operation: 'object_upsert' }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const focus = await client.context.graph.focus([1]);
  const patches = await client.context.graph.patches.list();

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/context/graph/focus/',
  );
  assert.deepEqual(JSON.parse(requests[0].init.body).seed_ids, [1]);
  assert.equal(focus.stub, false);
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/context/graph/patches/',
  );
  assert.equal(patches.patches[0].operation, 'object_upsert');
});

test('orchestrate composes harness context artifact and action rail routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/harness/runs/')) {
        return jsonResponse({
          run: {
            run_id: 'run:orch',
            task: 'Fix the SDK parity test',
            actor: 'codex',
            scope: {},
            status: 'running',
            steps: [],
            search_runs: [],
            artifacts: [],
            memory_patches: [],
            validations: [],
          },
        });
      }
      if (String(url).endsWith('/context-command/resolve/')) {
        return jsonResponse({
          state: {
            command_id: 'ctx:1',
            goal: 'Fix the SDK parity test',
            working_set: [],
            exclusions: [],
            hot_context: [],
            canonical_context: [],
            graph_layers: [],
            tool_scope: [],
            warnings: [],
            metadata: {},
          },
          preview: {
            command_id: 'ctx:1',
            working_set_count: 0,
          },
        });
      }
      if (String(url).endsWith('/context/compile/')) {
        return jsonResponse(contextArtifactFixture('artifact-orch'));
      }
      if (String(url).endsWith('/attach/')) {
        return jsonResponse({
          attached: true,
          harness_attached: true,
          attachment: {
            artifact_id: 'artifact-orch',
            target: 'run:orch',
          },
        });
      }
      if (String(url).endsWith('/action-rail/generate/')) {
        return jsonResponse({
          rail_id: 'rail:1',
          actions: [{ action_id: 'act:1', label: 'Run focused tests' }],
          grouped: {},
          context_summary: {},
          warnings: [],
          metadata: {},
        });
      }
      return new Response('', { status: 404 });
    },
  });

  const result = await client.orchestrate({
    task: 'Fix the SDK parity test',
    mode: 'fix',
    repo: 'Travis-Gilbert/Index-API',
  });

  assert.equal(result.run.run_id, 'run:orch');
  assert.equal(result.context_command.state.command_id, 'ctx:1');
  assert.equal(result.artifact.id, 'artifact-orch');
  assert.equal(result.artifact_attachment.harness_attached, true);
  assert.equal(result.action_rail.rail_id, 'rail:1');
  assert.equal(result.report.checklist[0].id, 'ORCH-SDK-001');
  assert.equal(result.report.harness_writeback, 'recorded');
  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost:8000/api/v2/theseus/harness/runs/',
    'http://localhost:8000/api/v2/theseus/context-command/resolve/',
    'http://localhost:8000/api/v2/theseus/context/compile/',
    'http://localhost:8000/api/v2/theseus/context/artifacts/artifact-orch/attach/',
    'http://localhost:8000/api/v2/theseus/action-rail/generate/',
  ]);
});

test('learning namespace maps profile, spend-plan, and structural-signal routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/learning/profiles/developer-core/install/')) {
        return new Response(
          JSON.stringify({
            profile: {
              profile_id: 'developer-core',
              installed: true,
              enabled_by_default: true,
              plugin_ids: ['ep.lang.python.core.pro'],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (String(url).endsWith('/learning/profiles/developer-core/toolkit/')) {
        return new Response(
          JSON.stringify({
            toolkit: {
              profile_id: 'developer-core',
              task_type: 'python_review',
              budget_tokens: 6000,
              selected_tools: [{ tool_id: 'code_search' }],
              blocked_tools: [],
              validators: ['ruff'],
              plugin_ids: ['ep.lang.python.core.pro'],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      if (String(url).endsWith('/learning/context/spend-plan/')) {
        return new Response(
          JSON.stringify({
            spend_plan: {
              spend_plan_id: 'spend-1',
              profile_id: 'developer-core',
              run_id: 'run-1',
              task_signature: 'review.python.pr',
              budget_tokens: 6000,
              budget_allocation: { code_symbol: 3000 },
              hydration_policy: { full_text: ['symbol'], snippets: [], summaries: [], ids_only: [] },
              expected_savings: { raw_candidate_tokens: 4400 },
              cache_keys: { profile_id: 'developer-core' },
              degradations: {},
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          signal: {
            signal_id: 'sig-1',
            plugin_id: 'ep.lang.python.core.pro',
            profile_id: 'developer-core',
            task_type: 'python_review',
            privacy: { tier: 'structural_only' },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const installed = await client.learning.profiles.install('developer-core', {
    enabled_by_default: true,
  });
  const toolkit = await client.learning.profiles.toolkit('developer-core', {
    task_type: 'python_review',
    permissions: ['code_read', 'graph_read'],
    budget_tokens: 6000,
  });
  const spendPlan = await client.learning.context.spendPlan({
    profile_id: 'developer-core',
    run_id: 'run-1',
    task_signature: 'review.python.pr',
    budget_tokens: 6000,
    candidate_atoms: [{ id: 'symbol', kind: 'code_symbol', tokens: 1200, score: 0.9 }],
  });
  const signal = await client.learning.structuralSignals.record({
    plugin_id: 'ep.lang.python.core.pro',
    profile_id: 'developer-core',
    task_signature_hash: 'e'.repeat(64),
    task_type: 'python_review',
    graph_motif_hash: 'f'.repeat(64),
    method_id: 'python_reviewer_security_pass',
    validator_id: 'ruff',
    outcome: { bucket: 'success', tests_passed: true },
    token_metrics: { capsule_token_bucket: '4k_8k' },
    privacy: { tier: 'structural_only', raw_content_included: false },
  });

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/plugins/learning/profiles/developer-core/install/',
  );
  assert.equal(installed.profile.profile_id, 'developer-core');
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/plugins/learning/profiles/developer-core/toolkit/',
  );
  assert.equal(toolkit.toolkit.profile_id, 'developer-core');
  assert.equal(
    requests[2].url,
    'http://localhost:8000/api/v2/plugins/learning/context/spend-plan/',
  );
  assert.equal(spendPlan.spend_plan.spend_plan_id, 'spend-1');
  assert.equal(
    requests[3].url,
    'http://localhost:8000/api/v2/plugins/learning/structural-signals/',
  );
  assert.equal(signal.signal.signal_id, 'sig-1');
});

test('thg profile and plugin helpers map to shipped THG command families', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return new Response(
        JSON.stringify({
          command: 'THG.TEST',
          status: 'ok',
          payload: {},
          nodes: [],
          edges: [],
          events: [],
          state_hash: 'sha256:test',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  await client.thg.profiles.install({ profile_id: 'developer-core', plugin_ids: ['p1'] });
  await client.thg.profiles.resolve({ profile_id: 'developer-core', plugin_ids: ['p1'] });
  await client.thg.profiles.toolkit({
    profile_id: 'developer-core',
    task_type: 'python_review',
    permissions: ['code_read'],
  });
  await client.thg.profiles.budget({
    profile_id: 'developer-core',
    run_id: 'run-1',
    task_signature: 'review.python.pr',
    budget_tokens: 6000,
    candidate_atoms: [],
  });
  await client.thg.plugins.runBegin({ plugin_id: 'theseus-pro', task: 'Review harness' });
  await client.thg.plugins.runStep({ run_id: 'run-1', kind: 'observation', payload: {} });
  await client.thg.plugins.claimConsult({
    plugin_id: 'theseus-pro',
    run_id: 'run-1',
    claim_ids: ['claim-1'],
  });
  await client.thg.plugins.outcomeRecord({
    run_id: 'run-1',
    outcome: { bucket: 'success' },
  });

  assert.deepEqual(
    requests.map((request) => request.command),
    [
      'THG.PROFILE.INSTALL',
      'THG.PROFILE.RESOLVE',
      'THG.PROFILE.TOOLKIT',
      'THG.PROFILE.BUDGET',
      'THG.PLUGIN.RUN.BEGIN',
      'THG.PLUGIN.RUN.STEP',
      'THG.PLUGIN.CLAIM.CONSULT',
      'THG.PLUGIN.OUTCOME.RECORD',
    ],
  );
});

test('compile honors env-first base URL resolution and exposes surface status', async () => {
  const previousBaseUrl = process.env.THEOREM_CONTEXT_BASE_URL;
  process.env.THEOREM_CONTEXT_BASE_URL = 'http://env.example/api/v2/theseus';
  const requests = [];

  try {
    const client = new TheoremContextClient({
      fetchImpl: async (url, init) => {
        requests.push({ url, init });
        return new Response(
          JSON.stringify({
            id: 'artifact-1',
            status: 'compiled',
            task_type: 'review',
            task_description: 'Review harness SDK gap',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      },
    });

    const artifact = await client.context.compile({
      task: 'Review harness SDK gap',
      task_type: 'review',
    });

    assert.equal(
      requests[0].url,
      'http://env.example/api/v2/theseus/context/compile/',
    );
    assert.equal(artifact.id, 'artifact-1');
    assert.equal(client.surfaceStatus.artifacts.export.pdf, 'stub');
    assert.equal(
      client.surfaceStatus.harness.public_run_model,
      'AgentRunState',
    );
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.THEOREM_CONTEXT_BASE_URL;
    } else {
      process.env.THEOREM_CONTEXT_BASE_URL = previousBaseUrl;
    }
  }
});

test('compile surfaces auth failures as AuthError', async () => {
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async () => new Response('missing token', { status: 401 }),
  });

  await assert.rejects(
    client.context.compile({ task: 'Review harness SDK gap' }),
    (error) =>
      error instanceof AuthError
      && /compile failed: 401/i.test(error.message),
  );
});

test('harness failures surface as HarnessError', async () => {
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async () => new Response('server exploded', { status: 500 }),
  });

  await assert.rejects(
    client.harness.begin({ task: 'Review harness SDK gap' }),
    (error) =>
      error instanceof HarnessError
      && /harness begin failed: 500/i.test(error.message),
  );
});

test('transport timeouts surface as RequestTimeoutError', async () => {
  const timeoutError = new Error('timed out');
  timeoutError.name = 'AbortError';
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async () => {
      throw timeoutError;
    },
  });

  await assert.rejects(
    client.context.compile({ task: 'Review harness SDK gap' }),
    (error) =>
      error instanceof RequestTimeoutError
      && /compile failed: timed out/i.test(error.message),
  );
});

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function contextArtifactFixture(id) {
  return {
    id,
    status: 'compiled',
    task_type: 'fix',
    task_description: 'Fix the SDK parity test',
    budget_tokens: 6000,
    capsule: {},
    atoms: [],
    actions: [],
    graph_health: {},
    stress_test: {},
    provenance: {},
    token_ledger: {},
    source_graph: {},
    cache_key: '',
    cache_hit: false,
    created_at: null,
    updated_at: null,
  };
}
