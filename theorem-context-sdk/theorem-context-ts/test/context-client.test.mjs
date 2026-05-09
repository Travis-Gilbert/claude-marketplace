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

test('inference namespace maps BGI backend routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/inference/registry/')) {
        return jsonResponse({
          version: '2026.05.01',
          count: 1,
          entries: [
            {
              kernel_id: 'context_web_packer',
              epistemic_job: 'ingest',
              inference_family: 'expression',
              consumes_view: ['text'],
              produces: ['artifact'],
              truth_type: 'relevance',
              validator: 'source corroboration',
              writeback_policy: 'proposal-only',
            },
          ],
          index: {},
        });
      }
      if (String(url).endsWith('/inference/expression/deterministic_brief/')) {
        return jsonResponse({
          engine_id: 'deterministic_brief',
          artifact_type: 'brief',
          payload: { text: 'ready' },
          receipt_hash: 'hash:brief',
          writeback_policy: 'read-only',
        });
      }
      if (String(url).endsWith('/inference/solver/context-capsule/')) {
        return jsonResponse({
          provider: 'z3-reference',
          formula_hash: 'hash:solver',
          input_view_refs: ['artifact:1'],
          status: 'unsat',
          model: {},
          counterexample: {},
          unsat_core_ref: 'core:1',
          unknown_reason: '',
          timeout_ms: null,
          writeback_proposals: [],
        });
      }
      if (String(url).endsWith('/inference/kernel-runs/')) {
        return jsonResponse({
          run_id: 'kernel-1',
          kernel_id: 'bgi_datalog_deriver',
          epistemic_job: 'evaluate',
          inference_family: 'deductive',
          status: 'succeeded',
          request_payload: {},
          result_payload: { derived_count: 1 },
          budget: {},
          metadata: {},
          error_payload: {},
          receipt_hash: 'hash:kernel',
          duration_ms: 4,
          writeback_policy: 'read-only',
          canonical_graph_mutation: false,
          discovery_run_id: 'discovery-1',
          result_receipts: [],
          append_only: true,
        });
      }
      return jsonResponse({
        run_id: 'discovery-1',
        objective: 'find stronger validators',
        status: 'running',
        context_refs: ['artifact:1'],
        candidates: [
          {
            candidate_id: 'candidate-1',
            hypothesis: 'native receipts can compact safely',
            action: { kind: 'benchmark' },
            expected_value: 0.8,
            metadata: {},
          },
        ],
        outcomes: [],
        writeback_proposals: [],
        events: [],
        append_only: true,
        canonical_graph_mutation: false,
        validator_receipts: [],
        kernel_runs: [],
        candidate_archive_entries: [],
      });
    },
  });

  const registry = await client.inference.registry();
  const expression = await client.inference.expression.render(
    'deterministic_brief',
    { result: { status: 'ready' } },
  );
  const solver = await client.inference.solver.contextCapsule({
    capsule: { user_task: { token_count: 5 } },
    budget_tokens: 100,
    input_view_refs: ['artifact:1'],
  });
  const preview = await client.inference.discoveryRuns.preview({
    objective: 'find stronger validators',
    hypothesis: 'native receipts can compact safely',
    action: { kind: 'benchmark' },
    context_refs: ['artifact:1'],
    expected_value: 0.8,
  });
  const created = await client.inference.discoveryRuns.create({
    objective: 'find stronger validators',
    hypothesis: 'native receipts can compact safely',
    action: { kind: 'benchmark' },
  });
  const appended = await client.inference.discoveryRuns.appendValidatorReceipt(
    'discovery-1',
    {
      candidate_id: 'candidate-1',
      validator_id: 'pytest',
      status: 'passed',
    },
  );
  const finished = await client.inference.discoveryRuns.finish('discovery-1', {
    succeeded: true,
  });
  const kernel = await client.inference.kernelRuns.create({
    kernel_id: 'bgi_datalog_deriver',
    discovery_run_id: 'discovery-1',
    payload: { claims: [{ id: 'c1' }] },
  });

  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost:8000/api/v2/theseus/inference/registry/',
    'http://localhost:8000/api/v2/theseus/inference/expression/deterministic_brief/',
    'http://localhost:8000/api/v2/theseus/inference/solver/context-capsule/',
    'http://localhost:8000/api/v2/theseus/inference/discovery-runs/preview/',
    'http://localhost:8000/api/v2/theseus/inference/discovery-runs/',
    'http://localhost:8000/api/v2/theseus/inference/discovery-runs/discovery-1/validator-receipts/',
    'http://localhost:8000/api/v2/theseus/inference/discovery-runs/discovery-1/finish/',
    'http://localhost:8000/api/v2/theseus/inference/kernel-runs/',
  ]);
  assert.equal(registry.entries[0].kernel_id, 'context_web_packer');
  assert.equal(expression.payload.text, 'ready');
  assert.equal(solver.status, 'unsat');
  assert.equal(preview.append_only, true);
  assert.equal(preview.canonical_graph_mutation, false);
  assert.equal(preview.candidates[0].candidate_id, 'candidate-1');
  assert.equal(created.run_id, 'discovery-1');
  assert.deepEqual(appended.validator_receipts, []);
  assert.equal(finished.status, 'running');
  assert.equal(kernel.kernel_id, 'bgi_datalog_deriver');
});

test('orchestrate uses server-authoritative route', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/orchestrate/run/')) {
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
          decision: {
            run_id: 'run:orch',
            task: 'Fix the SDK parity test',
            task_signature: 'sig:1',
            selected_profile_id: 'developer-core',
            selected_pack_ids: ['pack:context-web'],
            selected_skill_ids: [],
            selected_agent_ids: [],
            selected_tool_ids: ['context_web.pack'],
            selected_validator_ids: [],
            selected_renderer_ids: [],
            selected_compute_backend_ids: [],
            rejected_candidates: [],
            context_plan: {
              max_tokens: 6000,
              metadata_tokens: 300,
              skill_body_tokens: 900,
              reference_tokens: 900,
              tool_schema_tokens: 120,
              context_artifact_tokens: 3780,
            },
            risk: {
              shell_risk: 0.2,
              network_risk: 0.2,
              data_exposure_risk: 0.1,
              over_orchestration_risk: 0.2,
            },
            why_selected: { 'developer-core': 'selected' },
            policies_applied: ['server_orchestrate_v1'],
            user_overrides: [],
            federated_priors_used: [],
          },
          context_command: {
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
          },
          artifact: contextArtifactFixture('artifact-orch'),
          artifact_attachment: {
            attached: true,
            harness_attached: true,
            attachment: {
              artifact_id: 'artifact-orch',
              target: 'run:orch',
            },
          },
          action_rail: {
            rail_id: 'rail:1',
            actions: [{ action_id: 'act:1', label: 'Run focused tests' }],
            grouped: {},
            context_summary: {},
            warnings: [],
            metadata: {},
          },
          report: {
            status: 'ready',
            checklist: [{ id: 'ORCH-SERVER-001' }],
            harness_writeback: 'recorded',
            next_actions: [],
          },
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
  assert.equal(result.decision.selected_profile_id, 'developer-core');
  assert.equal(result.context_command.state.command_id, 'ctx:1');
  assert.equal(result.artifact.id, 'artifact-orch');
  assert.equal(result.artifact_attachment.harness_attached, true);
  assert.equal(result.action_rail.rail_id, 'rail:1');
  assert.equal(result.report.checklist[0].id, 'ORCH-SERVER-001');
  assert.equal(result.report.harness_writeback, 'recorded');
  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost:8000/api/v2/theseus/orchestrate/run/',
  ]);
});

test('orchestrate preview uses server preview route', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/orchestrate/preview/')) {
        return jsonResponse({
          decision: {
            run_id: '',
            task: 'Fix the SDK parity test',
            task_signature: 'sig:preview',
            selected_profile_id: 'developer-core',
            selected_pack_ids: ['pack:context-web'],
            selected_skill_ids: [],
            selected_agent_ids: [],
            selected_tool_ids: ['context_web.pack'],
            selected_validator_ids: [],
            selected_renderer_ids: [],
            selected_compute_backend_ids: [],
            rejected_candidates: [],
            context_plan: {
              max_tokens: 6000,
              metadata_tokens: 300,
              skill_body_tokens: 900,
              reference_tokens: 900,
              tool_schema_tokens: 120,
              context_artifact_tokens: 3780,
            },
            risk: {
              shell_risk: 0.2,
              network_risk: 0.2,
              data_exposure_risk: 0.1,
              over_orchestration_risk: 0.2,
            },
            why_selected: { 'developer-core': 'selected' },
            policies_applied: ['server_orchestrate_v1'],
            user_overrides: [],
            federated_priors_used: [],
          },
          toolkit: {
            profile_id: 'developer-core',
            selected_tools: [{ tool_id: 'context_web.pack' }],
          },
          report: {
            status: 'preview',
            checklist: [{ id: 'ORCH-PREVIEW-001' }],
            harness_writeback: 'not_requested',
            next_actions: [],
          },
        });
      }
      return new Response('', { status: 404 });
    },
  });

  const result = await client.orchestratePreview({
    task: 'Fix the SDK parity test',
    mode: 'fix',
  });

  assert.equal(result.decision.selected_profile_id, 'developer-core');
  assert.equal(result.report.status, 'preview');
  assert.equal(result.toolkit.profile_id, 'developer-core');
  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost:8000/api/v2/theseus/orchestrate/preview/',
  ]);
});

test('orchestrate prepare uses server prepare route', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/orchestrate/prepare/')) {
        return jsonResponse({
          decision: {
            run_id: '',
            task: 'Prepare memory recall policy',
            task_signature: 'sig:prepare',
            selected_profile_id: 'developer-core',
            selected_pack_ids: ['pack:context-web'],
            selected_skill_ids: [],
            selected_agent_ids: [],
            selected_tool_ids: ['context_web.pack'],
            selected_validator_ids: [],
            selected_renderer_ids: [],
            selected_compute_backend_ids: [],
            rejected_candidates: [],
            context_plan: {
              max_tokens: 6000,
              metadata_tokens: 300,
              skill_body_tokens: 900,
              reference_tokens: 900,
              tool_schema_tokens: 120,
              context_artifact_tokens: 3780,
            },
            risk: {
              shell_risk: 0.2,
              network_risk: 0.2,
              data_exposure_risk: 0.1,
              over_orchestration_risk: 0.2,
            },
            why_selected: { 'developer-core': 'selected' },
            policies_applied: ['server_orchestrate_v1'],
            user_overrides: [],
            federated_priors_used: [],
          },
          toolkit: {
            profile_id: 'developer-core',
            selected_tools: [{ tool_id: 'context_web.pack' }],
          },
          report: {
            status: 'preview',
            checklist: [{ id: 'ORCH-PREVIEW-001' }],
            harness_writeback: 'not_requested',
            next_actions: ['Review proposed policy before promotion'],
            memory_recall: {
              section: 'memory_recall',
              proposed_policy_count: 1,
            },
          },
          memory: {
            evidence: [],
            operational_policy: [],
            memory_banks: [
              {
                bank_id: 'memory_bank:repo',
                kind: 'repo',
                scope: 'repo',
                selector: 'Travis-Gilbert/Index-API',
                rationale: 'Repository-scoped recall for continuity.',
              },
            ],
            evidence_hash: 'hash:evidence',
            policy_hash: 'hash:policy',
            recall_policy: {
              policy_id: 'recall-policy:developer-core',
              kind: 'runtime_recall_scope',
              scope_filters: ['repo:Travis-Gilbert/Index-API'],
              selected_banks: ['memory_bank:repo'],
              rationale: 'Recall is constrained by selected banks.',
              status: 'active',
            },
          },
          memory_contract: {
            evidence: [],
            operational_policy: [],
            memory_banks: [
              {
                bank_id: 'memory_bank:repo',
                kind: 'repo',
                scope: 'repo',
                selector: 'Travis-Gilbert/Index-API',
                rationale: 'Repository-scoped recall for continuity.',
              },
            ],
            evidence_hash: 'hash:evidence',
            policy_hash: 'hash:policy',
            recall_policy: {
              policy_id: 'recall-policy:developer-core',
              kind: 'runtime_recall_scope',
              scope_filters: ['repo:Travis-Gilbert/Index-API'],
              selected_banks: ['memory_bank:repo'],
              rationale: 'Recall is constrained by selected banks.',
              status: 'active',
            },
          },
          memory_policy_proposals: [
            {
              proposal_id: 'proposal:1',
              proposal_type: 'operational_policy',
              target_scope: 'repo',
              payload: {
                policy_id: 'policy:1',
                kind: 'runtime_permissions',
                scope: 'orchestrate.permissions',
                status: 'proposed',
              },
              proposal_intent: {
                source_category: 'orchestrate_prepare',
                target_category: 'operational_policy',
                proposed_action: 'upsert',
                promotion_intent: 'review',
              },
            },
          ],
          memory_recall: {
            read_first: ['Task signature and selected profile'],
            risks: ['network access'],
            do_not: ['Promote policy automatically'],
            next_actions: ['Review proposed policy before promotion'],
            hydration_handles: [],
            recalled_evidence: ['evidence:1'],
            selected_banks: ['repo:Travis-Gilbert/Index-API'],
            recall_policy: ['repo:Travis-Gilbert/Index-API'],
            active_policy: [],
            proposed_policy: ['policy:1'],
          },
          memory_recall_trace: {
            section: 'memory_recall',
            read_first: ['Task signature and selected profile'],
            risks: ['network access'],
            do_not: ['Promote policy automatically'],
            next_actions: ['Review proposed policy before promotion'],
            selected_banks: ['repo:Travis-Gilbert/Index-API'],
            recall_policy: ['repo:Travis-Gilbert/Index-API'],
            recalled_evidence_count: 1,
            active_policy_count: 0,
            proposed_policy_count: 1,
            selected_bank_count: 1,
            hydration_handle_count: 0,
          },
        });
      }
      return new Response('', { status: 404 });
    },
  });

  const result = await client.orchestratePrepare({
    task: 'Prepare memory recall policy',
    mode: 'plan',
  });

  assert.equal(result.memory_recall.proposed_policy[0], 'policy:1');
  assert.equal(result.memory.memory_banks[0].kind, 'repo');
  assert.equal(result.memory.recall_policy.selected_banks[0], 'memory_bank:repo');
  assert.equal(result.memory_recall.selected_banks[0], 'repo:Travis-Gilbert/Index-API');
  assert.equal(result.memory_policy_proposals[0].proposal_id, 'proposal:1');
  assert.equal(result.memory_recall_trace.selected_bank_count, 1);
  assert.equal(result.memory_recall_trace.proposed_policy_count, 1);
  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost:8000/api/v2/theseus/orchestrate/prepare/',
  ]);
});

test('harness context-web helpers map browser-folio and explain routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/context-web/browser-folio/')) {
        return jsonResponse({
          context_web_pack: {
            run_id: 'run:web',
            query: 'what is active in this folio?',
            mode: 'browser_folio',
            budget: { max_tokens: 4000, max_atoms: 24, max_edges: 48, max_paths: 8, max_tools: 5 },
            atoms: [{ id: 'folio:folio-1', kind: 'context_artifact', title: 'Browser folio folio-1' }],
            edges: [],
            paths: [],
            tools_used: [],
            source_mix: { trusted_repo_memory: 1 },
            token_ledger: {},
            provenance: { mode_semantics: { folio_id: 'folio-1' } },
            spend_plan: {},
            state_hash: 'pack:web',
          },
        });
      }
      return jsonResponse({
        explanation: {
          run_id: 'run:web',
          pack_id: 'pack:web',
          atom_id: 'folio:folio-1',
          included: true,
          why_included: 'Selected as the active browser folio anchor.',
          why_excluded: '',
          policies_applied: ['browser_folio'],
          mode: 'browser_folio',
          source_mix: { trusted_repo_memory: 1 },
          budget: { max_tokens: 4000 },
          provenance: { mode_semantics: { folio_id: 'folio-1' } },
        },
      });
    },
  });

  const pack = await client.harness.contextWebBrowserFolio('run:web', {
    query: 'what is active in this folio?',
    folio_id: 'folio-1',
  });
  const explanation = await client.harness.contextWebExplain(
    'run:web',
    'pack:web',
    'folio:folio-1',
  );

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/harness/runs/run:web/context-web/browser-folio/',
  );
  assert.equal(JSON.parse(requests[0].init.body).folio_id, 'folio-1');
  assert.equal(pack.mode, 'browser_folio');
  assert.equal(pack.provenance.mode_semantics.folio_id, 'folio-1');
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/harness/runs/run:web/context-web/pack:web/explain/',
  );
  assert.equal(explanation.included, true);
  assert.equal(explanation.why_included, 'Selected as the active browser folio anchor.');
});

test('harness context-web spend-plan and THG index update helpers map shipped routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/context-web/spend-plan/')) {
        return jsonResponse({
          run_id: 'run:web',
          mode: 'standard',
          pack_id: 'pack:spend',
          spend_plan: {
            spend_plan_id: 'spend:1',
            budget_allocation: { code_symbols: 1800 },
            hydration_policy: { excerpt: ['file:apps/orchestrate/runtime/orchestrate.py'] },
            expected_savings: { raw_candidate_tokens: 2400, capsule_tokens: 900 },
            cache_keys: { profile_id: 'developer-core' },
            degradations: [],
          },
          evaluation: {
            naive_tokens: 2400,
            context_web_tokens: 900,
            compression_ratio: 2.667,
            graph_overhead: 48,
            trivial_change_penalty: 0,
            useful_when: ['multi_file'],
            not_useful_when: ['tiny_one_file_edit'],
          },
          validation: {
            findings: [],
            scores: { lost_in_middle_risk: 0.12 },
            passed: true,
          },
          top_atoms: [
            {
              id: 'file:apps/orchestrate/runtime/orchestrate.py',
              kind: 'file',
              title: 'orchestrate.py',
              summary: 'Server-authoritative orchestrate runtime.',
              source_ref: 'apps/orchestrate/runtime/orchestrate.py',
              score: 0.88,
              estimated_tokens: 120,
              channels: ['trusted_repo_memory'],
              citations: [],
              labels: ['ContextWebCandidate'],
              hydration_level: 'excerpt',
            },
          ],
        });
      }
      return jsonResponse({
        result: {
          command: 'THG.CONTEXT_WEB.INDEX.UPDATE',
          status: 'ok',
          payload: {
            repo_id: 'Travis-Gilbert/Index-API',
            commit_sha: 'abc123',
            changed_files: ['apps/orchestrate/runtime/orchestrate.py'],
            file_hashes: { 'apps/orchestrate/runtime/orchestrate.py': 'hash:file' },
            symbol_hashes: { orchestrate_prepare: 'hash:symbol' },
            last_incremental_update: '2026-05-08T00:00:00+00:00',
            graph_state_hash: 'hash:graph',
            index_state_hash: 'hash:index',
            update_strategy: 'incremental',
          },
          nodes: [],
          edges: [],
          events: [],
          state_hash: 'hash:result',
        },
      });
    },
  });

  const spendPlan = await client.harness.contextWebSpendPlan('run:web', {
    query: 'What should we spend on context?',
  });
  const index = await client.harness.thg.contextWeb.updateIndex({
    repo_id: 'Travis-Gilbert/Index-API',
    commit_sha: 'abc123',
    changed_files: ['apps/orchestrate/runtime/orchestrate.py'],
    symbols: ['orchestrate_prepare'],
  });

  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/harness/runs/run:web/context-web/spend-plan/',
  );
  assert.equal(spendPlan.spend_plan.spend_plan_id, 'spend:1');
  assert.equal(spendPlan.top_atoms[0].hydration_level, 'excerpt');
  assert.equal(
    JSON.parse(requests[1].init.body).command,
    'THG.CONTEXT_WEB.INDEX.UPDATE',
  );
  assert.equal(index.repo_id, 'Travis-Gilbert/Index-API');
  assert.equal(index.update_strategy, 'incremental');
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

test('product namespace maps bootstrap and saved-context CRUD routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost:8000/api/v2/theseus',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      const parsed = new URL(String(url));
      const path = parsed.pathname;

      if (path.endsWith('/product/bootstrap/')) {
        return jsonResponse({
          account: { id: 1, username: 'travis', email: 'travis@example.com' },
          mode: 'authenticated',
          auth_required: true,
          bootstrap_fallback_allowed: false,
          tenants: [],
          default_tenant_slug: null,
        });
      }

      if (path.endsWith('/saved-contexts/') && init.method === 'POST') {
        return jsonResponse({
          saved_context: {
            id: 11,
            title: 'Core fact',
            slug: 'ctx-1',
            kind: 'note',
            memory_role: 'evidence',
            status: 'active',
            content: 'Memgraph is canonical.',
            summary: 'Canonical reminder',
            scope: {},
            metadata: {},
            tenant_slug: 'tenant-1',
            project_slug: 'proj-1',
            created_at: '2026-05-09T00:00:00Z',
            updated_at: '2026-05-09T00:00:00Z',
          },
        });
      }

      if (path.endsWith('/saved-contexts/ctx-1/') && init.method === 'PUT') {
        return jsonResponse({
          saved_context: {
            id: 11,
            title: 'Updated fact',
            slug: 'ctx-1',
            kind: 'note',
            memory_role: 'evidence',
            status: 'active',
            content: 'Updated content',
            summary: 'Updated summary',
            scope: { layer: 'private' },
            metadata: { source: 'manual' },
            tenant_slug: 'tenant-1',
            project_slug: 'proj-1',
            created_at: '2026-05-09T00:00:00Z',
            updated_at: '2026-05-09T00:05:00Z',
          },
        });
      }

      if (path.endsWith('/saved-contexts/') && init.method === 'GET') {
        return jsonResponse({
          saved_contexts: [
            {
              id: 11,
              title: 'Updated fact',
              slug: 'ctx-1',
              kind: 'note',
              memory_role: 'evidence',
              status: 'active',
              content: 'Updated content',
              summary: 'Updated summary',
              scope: { layer: 'private' },
              metadata: { source: 'manual' },
              tenant_slug: 'tenant-1',
              project_slug: 'proj-1',
              created_at: '2026-05-09T00:00:00Z',
              updated_at: '2026-05-09T00:05:00Z',
            },
          ],
        });
      }

      if (path.endsWith('/mute/')) {
        return jsonResponse({
          saved_context: {
            id: 11,
            title: 'Updated fact',
            slug: 'ctx-1',
            kind: 'note',
            memory_role: 'evidence',
            status: 'muted',
            content: 'Updated content',
            summary: 'Updated summary',
            scope: { layer: 'private' },
            metadata: { source: 'manual' },
            tenant_slug: 'tenant-1',
            project_slug: 'proj-1',
            created_at: '2026-05-09T00:00:00Z',
            updated_at: '2026-05-09T00:05:00Z',
          },
        });
      }

      if (path.endsWith('/activate/')) {
        return jsonResponse({
          saved_context: {
            id: 11,
            title: 'Updated fact',
            slug: 'ctx-1',
            kind: 'note',
            memory_role: 'evidence',
            status: 'active',
            content: 'Updated content',
            summary: 'Updated summary',
            scope: { layer: 'private' },
            metadata: { source: 'manual' },
            tenant_slug: 'tenant-1',
            project_slug: 'proj-1',
            created_at: '2026-05-09T00:00:00Z',
            updated_at: '2026-05-09T00:05:00Z',
          },
        });
      }

      return jsonResponse({
        saved_context: {
          id: 11,
          title: 'Updated fact',
          slug: 'ctx-1',
          kind: 'note',
          memory_role: 'evidence',
          status: 'deleted',
          content: 'Updated content',
          summary: 'Updated summary',
          scope: { layer: 'private' },
          metadata: { source: 'manual' },
          tenant_slug: 'tenant-1',
          project_slug: 'proj-1',
          created_at: '2026-05-09T00:00:00Z',
          updated_at: '2026-05-09T00:05:00Z',
        },
      });
    },
  });

  const bootstrap = await client.product.bootstrap();
  const created = await client.product.savedContexts.create('tenant-1', {
    title: 'Core fact',
    content: 'Memgraph is canonical.',
    project_slug: 'proj-1',
  });
  const updated = await client.product.savedContexts.update('tenant-1', 'ctx-1', {
    title: 'Updated fact',
    content: 'Updated content',
    scope: { layer: 'private' },
    metadata: { source: 'manual' },
  });
  const listed = await client.product.savedContexts.list('tenant-1', {
    projectSlug: 'proj-1',
    includeMuted: true,
  });
  const muted = await client.product.savedContexts.mute('tenant-1', 'ctx-1');
  const activated = await client.product.savedContexts.activate('tenant-1', 'ctx-1');
  const removed = await client.product.savedContexts.delete('tenant-1', 'ctx-1');

  assert.equal(bootstrap.mode, 'authenticated');
  assert.equal(created.slug, 'ctx-1');
  assert.equal(updated.title, 'Updated fact');
  assert.equal(listed.length, 1);
  assert.equal(muted.status, 'muted');
  assert.equal(activated.status, 'active');
  assert.equal(removed.status, 'deleted');
  assert.equal(
    requests[0].url,
    'http://localhost:8000/api/v2/theseus/product/bootstrap/',
  );
  assert.equal(
    requests[1].url,
    'http://localhost:8000/api/v2/theseus/product/tenants/tenant-1/saved-contexts/',
  );
  assert.equal(requests[1].init.method, 'POST');
  assert.equal(
    JSON.parse(requests[2].init.body).title,
    'Updated fact',
  );
  assert.equal(
    requests[3].url,
    'http://localhost:8000/api/v2/theseus/product/tenants/tenant-1/saved-contexts/?project_slug=proj-1&include_muted=true',
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
