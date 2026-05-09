from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import (
    AuthError,
    HarnessError,
    RequestTimeoutError,
    TheoremContextClient,
)


def test_context_artifacts_export_calls_signed_route() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                'node_id': 'node-a',
                'signature': 'sig',
                'payload_hash': 'hash',
                'payload': {'id': 'artifact-1'},
                'signed': True,
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.context.artifacts.export('artifact-1', format='signed')
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context/artifacts/artifact-1/export/signed/'
        assert result.format == 'signed'
        assert result.artifact_id == 'artifact-1'
        assert result.signed is True
        assert result.payload == {'id': 'artifact-1'}

    asyncio.run(run())


def test_context_artifacts_export_wraps_markdown_route_output() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            text='# Context Brief',
            headers={'content-type': 'text/markdown; charset=utf-8'},
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.context.artifacts.export('artifact-1', format='markdown')
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context/artifacts/artifact-1/export/markdown/'
        assert result.format == 'markdown'
        assert result.artifact_id == 'artifact-1'
        assert result.content == '# Context Brief'
        assert result.content_type == 'text/markdown; charset=utf-8'

    asyncio.run(run())


def test_context_artifacts_export_preserves_pdf_stub_response() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                'stub': True,
                'reason': 'PDF rendering pipeline lands post-launch.',
                'artifact_id': 'artifact-1',
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.context.artifacts.export('artifact-1', format='pdf')
        finally:
            await client.aclose()

        assert result.format == 'pdf'
        assert result.artifact_id == 'artifact-1'
        assert result.stub is True
        assert result.reason == 'PDF rendering pipeline lands post-launch.'

    asyncio.run(run())


def test_context_artifacts_fork_and_attach_call_live_backend_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/fork/'):
            return httpx.Response(
                200,
                json={
                    'forked': True,
                    'source_artifact_id': 'artifact-1',
                    'cloned_atom_count': 2,
                    'artifact': {
                        'id': 'artifact-2',
                        'status': 'compiled',
                        'task_type': 'review',
                        'task_description': 'review harness',
                        'budget_tokens': 1000,
                        'capsule': {},
                        'atoms': [],
                        'actions': [],
                        'graph_health': {},
                        'stress_test': {},
                        'provenance': {},
                        'token_ledger': {},
                        'source_graph': {},
                        'cache_key': '',
                        'cache_hit': False,
                        'created_at': None,
                        'updated_at': None,
                    },
                },
            )
        return httpx.Response(
            200,
            json={
                'attached': True,
                'harness_attached': True,
                'attachment': {
                    'artifact_id': 'artifact-1',
                    'target': 'run-1',
                },
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            forked = await client.context.artifacts.fork(
                'artifact-1',
                metadata={'reason': 'test'},
            )
            attached = await client.context.artifacts.attach(
                'artifact-1',
                'run-1',
                metadata={'adapter': 'codex'},
            )
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context/artifacts/artifact-1/fork/'
        assert json.loads(requests[0].content)['metadata']['reason'] == 'test'
        assert forked.artifact.id == 'artifact-2'
        assert requests[1].url.path == '/api/v2/theseus/context/artifacts/artifact-1/attach/'
        assert json.loads(requests[1].content)['target'] == 'run-1'
        assert attached.harness_attached is True

    asyncio.run(run())


def test_context_command_namespace_maps_resolve_and_preview_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/context-command/resolve/'):
            return httpx.Response(
                200,
                json={
                    'state': {'command_id': 'cmd-1', 'goal': 'Read this page', 'working_set': []},
                    'preview': {'command_id': 'cmd-1', 'working_set_count': 2},
                },
            )
        return httpx.Response(
            200,
            json={
                'command_id': 'cmd-1',
                'working_set_count': 2,
                'permissions': {'read': True},
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            resolved = await client.context_command.resolve(
                goal='Read this page',
                current_url='https://example.com/a',
            )
            preview = await client.context_command.preview('cmd-1')
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context-command/resolve/'
        assert requests[0].method == 'POST'
        assert resolved['state']['command_id'] == 'cmd-1'
        assert requests[1].url.path == '/api/v2/theseus/context-command/cmd-1/preview/'
        assert preview['command_id'] == 'cmd-1'

    asyncio.run(run())


def test_action_rail_namespace_maps_generate_preview_and_selected_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/action-rail/generate/'):
            return httpx.Response(
                200,
                json={
                    'rail_id': 'rail-1',
                    'actions': [{'action_id': 'capture_page', 'action_type': 'capture_page'}],
                    'grouped': {'capture': [{'action_id': 'capture_page', 'action_type': 'capture_page'}]},
                    'context_summary': {},
                    'warnings': [],
                    'metadata': {},
                },
            )
        if request.url.path.endswith('/action-rail/preview-action/'):
            return httpx.Response(
                200,
                json={
                    'action_id': 'capture_page',
                    'action_type': 'capture_page',
                    'execution_route': 'capture_api',
                    'confirmation_required': True,
                    'required_permissions': [],
                    'payload': {},
                    'receipt_preview': {
                        'status': 'requires_confirmation',
                        'risk': 'low',
                        'score': 0.9,
                        'does_not_execute': True,
                    },
                },
            )
        return httpx.Response(200, json={'ok': True})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            generated = await client.actions.generate(
                current_url='https://example.com/a',
                selected_text='claim text',
            )
            preview = await client.actions.preview(action_id='capture_page')
            selected = await client.actions.record_selected(
                'rail-1',
                action_id='capture_page',
                user_id='u1',
            )
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/action-rail/generate/'
        assert generated['rail_id'] == 'rail-1'
        assert requests[1].url.path == '/api/v2/theseus/action-rail/preview-action/'
        assert preview['execution_route'] == 'capture_api'
        assert requests[2].url.path == '/api/v2/theseus/action-rail/rail-1/selected/'
        assert selected == {'ok': True}

    asyncio.run(run())


def test_context_graph_namespace_maps_focus_and_patches_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/context/graph/focus/'):
            return httpx.Response(
                200,
                json={
                    'stub': False,
                    'seed_ids': [1],
                    'nodes': [{'id': 1, 'title': 'Redis harness'}],
                    'edges': [],
                },
            )
        return httpx.Response(
            200,
            json={
                'stub': False,
                'patches': [{'id': 1, 'operation': 'object_upsert'}],
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            focus = await client.context.graph.focus([1])
            patches = await client.context.graph.patches.list()
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context/graph/focus/'
        assert json.loads(requests[0].content)['seed_ids'] == [1]
        assert focus.stub is False
        assert requests[1].url.path == '/api/v2/theseus/context/graph/patches/'
        assert patches.patches[0]['operation'] == 'object_upsert'

    asyncio.run(run())


def test_inference_namespace_maps_bgi_backend_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/inference/registry/'):
            return httpx.Response(
                200,
                json={
                    'version': '2026.05.01',
                    'count': 1,
                    'entries': [
                        {
                            'kernel_id': 'context_web_packer',
                            'epistemic_job': 'ingest',
                            'inference_family': 'expression',
                            'consumes_view': ['text'],
                            'produces': ['artifact'],
                            'truth_type': 'relevance',
                            'validator': 'source corroboration',
                            'writeback_policy': 'proposal-only',
                        },
                    ],
                    'index': {},
                },
            )
        if request.url.path.endswith('/inference/expression/deterministic_brief/'):
            return httpx.Response(
                200,
                json={
                    'engine_id': 'deterministic_brief',
                    'artifact_type': 'brief',
                    'payload': {'text': 'ready'},
                    'receipt_hash': 'hash:brief',
                    'writeback_policy': 'read-only',
                },
            )
        if request.url.path.endswith('/inference/solver/context-capsule/'):
            return httpx.Response(
                200,
                json={
                    'provider': 'z3-reference',
                    'formula_hash': 'hash:solver',
                    'input_view_refs': ['artifact:1'],
                    'status': 'unsat',
                    'model': {},
                    'counterexample': {},
                    'unsat_core_ref': 'core:1',
                    'unknown_reason': '',
                    'timeout_ms': None,
                    'writeback_proposals': [],
                },
            )
        return httpx.Response(
            200,
            json={
                'run_id': 'discovery-1',
                'objective': 'find stronger validators',
                'status': 'running',
                'context_refs': ['artifact:1'],
                'candidates': [
                    {
                        'candidate_id': 'candidate-1',
                        'hypothesis': 'native receipts can compact safely',
                        'action': {'kind': 'benchmark'},
                        'expected_value': 0.8,
                        'metadata': {},
                    },
                ],
                'outcomes': [],
                'writeback_proposals': [],
                'events': [],
                'append_only': True,
                'canonical_graph_mutation': False,
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            registry = await client.inference.registry()
            expression = await client.inference.expression.render(
                'deterministic_brief',
                result={'status': 'ready'},
            )
            solver = await client.inference.solver.context_capsule(
                capsule={'user_task': {'token_count': 5}},
                budget_tokens=100,
                input_view_refs=['artifact:1'],
            )
            preview = await client.inference.discovery_runs.preview(
                objective='find stronger validators',
                hypothesis='native receipts can compact safely',
                action={'kind': 'benchmark'},
                context_refs=['artifact:1'],
                expected_value=0.8,
            )
        finally:
            await client.aclose()

        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/inference/registry/',
            '/api/v2/theseus/inference/expression/deterministic_brief/',
            '/api/v2/theseus/inference/solver/context-capsule/',
            '/api/v2/theseus/inference/discovery-runs/preview/',
        ]
        assert registry.entries[0].kernel_id == 'context_web_packer'
        assert expression.payload['text'] == 'ready'
        assert solver.status == 'unsat'
        assert preview.append_only is True
        assert preview.canonical_graph_mutation is False
        assert preview.candidates[0].candidate_id == 'candidate-1'

    asyncio.run(run())


def test_orchestrate_uses_server_authoritative_route() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/orchestrate/run/'):
            return httpx.Response(
                200,
                json={
                    'run': {
                        'run_id': 'run:orch',
                        'task': 'Fix the SDK parity test',
                        'actor': 'codex',
                        'scope': {},
                        'status': 'running',
                        'steps': [],
                        'search_runs': [],
                        'artifacts': [],
                        'memory_patches': [],
                        'validations': [],
                    },
                    'decision': {
                        'run_id': 'run:orch',
                        'task': 'Fix the SDK parity test',
                        'task_signature': 'sig:1',
                        'selected_profile_id': 'developer-core',
                        'selected_pack_ids': ['pack:context-web'],
                        'selected_skill_ids': [],
                        'selected_agent_ids': [],
                        'selected_tool_ids': ['context_web.pack'],
                        'selected_validator_ids': [],
                        'selected_renderer_ids': [],
                        'selected_compute_backend_ids': [],
                        'rejected_candidates': [],
                        'context_plan': {
                            'max_tokens': 6000,
                            'metadata_tokens': 300,
                            'skill_body_tokens': 900,
                            'reference_tokens': 900,
                            'tool_schema_tokens': 120,
                            'context_artifact_tokens': 3780,
                        },
                        'risk': {
                            'shell_risk': 0.2,
                            'network_risk': 0.2,
                            'data_exposure_risk': 0.1,
                            'over_orchestration_risk': 0.2,
                        },
                        'why_selected': {'developer-core': 'selected'},
                        'policies_applied': ['server_orchestrate_v1'],
                        'user_overrides': [],
                        'federated_priors_used': [],
                    },
                    'context_command': {
                        'state': {
                            'command_id': 'ctx:1',
                            'goal': 'Fix the SDK parity test',
                            'working_set': [],
                            'exclusions': [],
                            'hot_context': [],
                            'canonical_context': [],
                            'graph_layers': [],
                            'tool_scope': [],
                            'warnings': [],
                            'metadata': {},
                        },
                        'preview': {
                            'command_id': 'ctx:1',
                            'working_set_count': 0,
                        },
                    },
                    'artifact': _artifact_json('artifact-orch'),
                    'artifact_attachment': {
                        'attached': True,
                        'harness_attached': True,
                        'attachment': {
                            'artifact_id': 'artifact-orch',
                            'target': 'run:orch',
                        },
                    },
                    'action_rail': {
                        'rail_id': 'rail:1',
                        'actions': [{'action_id': 'act:1', 'label': 'Run focused tests'}],
                        'grouped': {},
                        'context_summary': {},
                        'warnings': [],
                        'metadata': {},
                    },
                    'report': {
                        'status': 'ready',
                        'checklist': [{'id': 'ORCH-SERVER-001'}],
                        'harness_writeback': 'recorded',
                        'next_actions': [],
                    },
                },
            )
        return httpx.Response(404)

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.orchestrate(
                task='Fix the SDK parity test',
                mode='fix',
                repo='Travis-Gilbert/Index-API',
            )
        finally:
            await client.aclose()

        assert result.run.run_id == 'run:orch'
        assert result.decision.selected_profile_id == 'developer-core'
        assert result.context_command['state']['command_id'] == 'ctx:1'
        assert result.artifact.id == 'artifact-orch'
        assert result.artifact_attachment.harness_attached is True
        assert result.action_rail['rail_id'] == 'rail:1'
        assert result.report.checklist[0]['id'] == 'ORCH-SERVER-001'
        assert result.report.harness_writeback == 'recorded'
        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/orchestrate/run/',
        ]

    asyncio.run(run())


def test_orchestrate_preview_uses_server_preview_route() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/orchestrate/preview/'):
            return httpx.Response(
                200,
                json={
                    'decision': {
                        'run_id': '',
                        'task': 'Fix the SDK parity test',
                        'task_signature': 'sig:preview',
                        'selected_profile_id': 'developer-core',
                        'selected_pack_ids': ['pack:context-web'],
                        'selected_skill_ids': [],
                        'selected_agent_ids': [],
                        'selected_tool_ids': ['context_web.pack'],
                        'selected_validator_ids': [],
                        'selected_renderer_ids': [],
                        'selected_compute_backend_ids': [],
                        'rejected_candidates': [],
                        'context_plan': {
                            'max_tokens': 6000,
                            'metadata_tokens': 300,
                            'skill_body_tokens': 900,
                            'reference_tokens': 900,
                            'tool_schema_tokens': 120,
                            'context_artifact_tokens': 3780,
                        },
                        'risk': {
                            'shell_risk': 0.2,
                            'network_risk': 0.2,
                            'data_exposure_risk': 0.1,
                            'over_orchestration_risk': 0.2,
                        },
                        'why_selected': {'developer-core': 'selected'},
                        'policies_applied': ['server_orchestrate_v1'],
                        'user_overrides': [],
                        'federated_priors_used': [],
                    },
                    'toolkit': {
                        'profile_id': 'developer-core',
                        'selected_tools': [{'tool_id': 'context_web.pack'}],
                    },
                    'report': {
                        'status': 'preview',
                        'checklist': [{'id': 'ORCH-PREVIEW-001'}],
                        'harness_writeback': 'not_requested',
                        'next_actions': [],
                    },
                },
            )
        return httpx.Response(404)

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.orchestrate_preview(
                task='Fix the SDK parity test',
                mode='fix',
            )
        finally:
            await client.aclose()

        assert result.decision.selected_profile_id == 'developer-core'
        assert result.report.status == 'preview'
        assert result.toolkit['profile_id'] == 'developer-core'
        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/orchestrate/preview/',
        ]

    asyncio.run(run())


def test_orchestrate_prepare_uses_server_prepare_route() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/orchestrate/prepare/'):
            return httpx.Response(
                200,
                json={
                    'decision': {
                        'run_id': '',
                        'task': 'Prepare memory recall policy',
                        'task_signature': 'sig:prepare',
                        'selected_profile_id': 'developer-core',
                        'selected_pack_ids': ['pack:context-web'],
                        'selected_skill_ids': [],
                        'selected_agent_ids': [],
                        'selected_tool_ids': ['context_web.pack'],
                        'selected_validator_ids': [],
                        'selected_renderer_ids': [],
                        'selected_compute_backend_ids': [],
                        'rejected_candidates': [],
                        'context_plan': {
                            'max_tokens': 6000,
                            'metadata_tokens': 300,
                            'skill_body_tokens': 900,
                            'reference_tokens': 900,
                            'tool_schema_tokens': 120,
                            'context_artifact_tokens': 3780,
                        },
                        'risk': {
                            'shell_risk': 0.2,
                            'network_risk': 0.2,
                            'data_exposure_risk': 0.1,
                            'over_orchestration_risk': 0.2,
                        },
                        'why_selected': {'developer-core': 'selected'},
                        'policies_applied': ['server_orchestrate_v1'],
                        'user_overrides': [],
                        'federated_priors_used': [],
                    },
                    'toolkit': {
                        'profile_id': 'developer-core',
                        'selected_tools': [{'tool_id': 'context_web.pack'}],
                    },
                    'report': {
                        'status': 'preview',
                        'checklist': [{'id': 'ORCH-PREVIEW-001'}],
                        'harness_writeback': 'not_requested',
                        'next_actions': ['Review proposed policy before promotion'],
                        'memory_recall': {
                            'section': 'memory_recall',
                            'proposed_policy_count': 1,
                        },
                    },
                    'memory': {
                        'evidence': [],
                        'operational_policy': [],
                        'memory_banks': [
                            {
                                'bank_id': 'memory_bank:repo',
                                'kind': 'repo',
                                'scope': 'repo',
                                'selector': 'Travis-Gilbert/Index-API',
                                'rationale': 'Repository-scoped recall for continuity.',
                            },
                        ],
                        'evidence_hash': 'hash:evidence',
                        'policy_hash': 'hash:policy',
                        'recall_policy': {
                            'policy_id': 'recall-policy:developer-core',
                            'kind': 'runtime_recall_scope',
                            'scope_filters': ['repo:Travis-Gilbert/Index-API'],
                            'selected_banks': ['memory_bank:repo'],
                            'rationale': 'Recall is constrained by selected banks.',
                            'status': 'active',
                        },
                    },
                    'memory_contract': {
                        'evidence': [],
                        'operational_policy': [],
                        'memory_banks': [
                            {
                                'bank_id': 'memory_bank:repo',
                                'kind': 'repo',
                                'scope': 'repo',
                                'selector': 'Travis-Gilbert/Index-API',
                                'rationale': 'Repository-scoped recall for continuity.',
                            },
                        ],
                        'evidence_hash': 'hash:evidence',
                        'policy_hash': 'hash:policy',
                        'recall_policy': {
                            'policy_id': 'recall-policy:developer-core',
                            'kind': 'runtime_recall_scope',
                            'scope_filters': ['repo:Travis-Gilbert/Index-API'],
                            'selected_banks': ['memory_bank:repo'],
                            'rationale': 'Recall is constrained by selected banks.',
                            'status': 'active',
                        },
                    },
                    'memory_policy_proposals': [
                        {
                            'proposal_id': 'proposal:1',
                            'proposal_type': 'operational_policy',
                            'target_scope': 'repo',
                            'payload': {
                                'policy_id': 'policy:1',
                                'kind': 'runtime_permissions',
                                'scope': 'orchestrate.permissions',
                                'status': 'proposed',
                            },
                            'proposal_intent': {
                                'source_category': 'orchestrate_prepare',
                                'target_category': 'operational_policy',
                                'proposed_action': 'upsert',
                                'promotion_intent': 'review',
                            },
                        },
                    ],
                    'memory_recall': {
                        'read_first': ['Task signature and selected profile'],
                        'risks': ['network access'],
                        'do_not': ['Promote policy automatically'],
                        'next_actions': ['Review proposed policy before promotion'],
                        'hydration_handles': [],
                        'recalled_evidence': ['evidence:1'],
                        'selected_banks': ['repo:Travis-Gilbert/Index-API'],
                        'recall_policy': ['repo:Travis-Gilbert/Index-API'],
                        'active_policy': [],
                        'proposed_policy': ['policy:1'],
                    },
                    'memory_recall_trace': {
                        'section': 'memory_recall',
                        'read_first': ['Task signature and selected profile'],
                        'risks': ['network access'],
                        'do_not': ['Promote policy automatically'],
                        'next_actions': ['Review proposed policy before promotion'],
                        'selected_banks': ['repo:Travis-Gilbert/Index-API'],
                        'recall_policy': ['repo:Travis-Gilbert/Index-API'],
                        'recalled_evidence_count': 1,
                        'active_policy_count': 0,
                        'proposed_policy_count': 1,
                        'selected_bank_count': 1,
                        'hydration_handle_count': 0,
                    },
                },
            )
        return httpx.Response(404)

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.orchestrate_prepare(
                task='Prepare memory recall policy',
                mode='plan',
            )
        finally:
            await client.aclose()

        assert result.memory_recall is not None
        assert result.memory_recall.proposed_policy == ['policy:1']
        assert result.memory.memory_banks[0].kind == 'repo'
        assert result.memory.recall_policy is not None
        assert result.memory.recall_policy.selected_banks == ['memory_bank:repo']
        assert result.memory_recall.selected_banks == [
            'repo:Travis-Gilbert/Index-API',
        ]
        assert result.memory_policy_proposals[0].proposal_id == 'proposal:1'
        assert result.memory_recall_trace.selected_bank_count == 1
        assert result.memory_recall_trace.proposed_policy_count == 1
        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/orchestrate/prepare/',
        ]

    asyncio.run(run())


def test_harness_context_web_namespace_maps_modes_and_explain_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/context-web/browser-folio/'):
            return httpx.Response(
                200,
                json={
                    'context_web_pack': {
                        'run_id': 'run:web',
                        'query': 'what is active in this folio?',
                        'mode': 'browser_folio',
                        'budget': {'max_tokens': 4000, 'max_atoms': 24, 'max_edges': 48, 'max_paths': 8, 'max_tools': 5},
                        'atoms': [{'id': 'folio:folio-1', 'kind': 'context_artifact', 'title': 'Browser folio folio-1'}],
                        'edges': [],
                        'paths': [],
                        'tools_used': [],
                        'source_mix': {'trusted_repo_memory': 1},
                        'token_ledger': {},
                        'provenance': {'mode_semantics': {'folio_id': 'folio-1'}},
                        'spend_plan': {},
                        'state_hash': 'pack:web',
                    },
                },
            )
        return httpx.Response(
            200,
            json={
                'explanation': {
                    'run_id': 'run:web',
                    'pack_id': 'pack:web',
                    'atom_id': 'folio:folio-1',
                    'included': True,
                    'why_included': 'Selected as the active browser folio anchor.',
                    'why_excluded': '',
                    'policies_applied': ['browser_folio'],
                    'mode': 'browser_folio',
                    'source_mix': {'trusted_repo_memory': 1},
                    'budget': {'max_tokens': 4000},
                    'provenance': {'mode_semantics': {'folio_id': 'folio-1'}},
                },
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            pack = await client.harness.context_web_browser_folio(
                'run:web',
                query='what is active in this folio?',
                folio_id='folio-1',
            )
            explanation = await client.harness.context_web_explain(
                'run:web',
                'pack:web',
                atom_id='folio:folio-1',
            )
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/harness/runs/run:web/context-web/browser-folio/'
        assert json.loads(requests[0].content)['folio_id'] == 'folio-1'
        assert pack.mode == 'browser_folio'
        assert pack.provenance['mode_semantics']['folio_id'] == 'folio-1'
        assert requests[1].url.path == '/api/v2/theseus/harness/runs/run:web/context-web/pack:web/explain/'
        assert explanation.included is True
        assert explanation.why_included == 'Selected as the active browser folio anchor.'


def test_harness_context_web_spend_plan_and_index_update_helpers() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/context-web/spend-plan/'):
            return httpx.Response(
                200,
                json={
                    'run_id': 'run:web',
                    'mode': 'standard',
                    'pack_id': 'pack:spend',
                    'spend_plan': {
                        'spend_plan_id': 'spend:1',
                        'budget_allocation': {'code_symbols': 1800},
                        'hydration_policy': {
                            'excerpt': ['file:apps/orchestrate/runtime/orchestrate.py'],
                        },
                        'expected_savings': {
                            'raw_candidate_tokens': 2400,
                            'capsule_tokens': 900,
                        },
                        'cache_keys': {'profile_id': 'developer-core'},
                        'degradations': [],
                    },
                    'evaluation': {
                        'naive_tokens': 2400,
                        'context_web_tokens': 900,
                        'compression_ratio': 2.667,
                        'graph_overhead': 48,
                        'trivial_change_penalty': 0,
                        'useful_when': ['multi_file'],
                        'not_useful_when': ['tiny_one_file_edit'],
                    },
                    'validation': {
                        'findings': [],
                        'scores': {'lost_in_middle_risk': 0.12},
                        'passed': True,
                    },
                    'top_atoms': [
                        {
                            'id': 'file:apps/orchestrate/runtime/orchestrate.py',
                            'kind': 'file',
                            'title': 'orchestrate.py',
                            'summary': 'Server-authoritative orchestrate runtime.',
                            'source_ref': 'apps/orchestrate/runtime/orchestrate.py',
                            'score': 0.88,
                            'estimated_tokens': 120,
                            'channels': ['trusted_repo_memory'],
                            'citations': [],
                            'labels': ['ContextWebCandidate'],
                            'hydration_level': 'excerpt',
                        },
                    ],
                },
            )
        return httpx.Response(
            200,
            json={
                'result': {
                    'command': 'THG.CONTEXT_WEB.INDEX.UPDATE',
                    'status': 'ok',
                    'payload': {
                        'repo_id': 'Travis-Gilbert/Index-API',
                        'commit_sha': 'abc123',
                        'changed_files': ['apps/orchestrate/runtime/orchestrate.py'],
                        'file_hashes': {
                            'apps/orchestrate/runtime/orchestrate.py': 'hash:file',
                        },
                        'symbol_hashes': {
                            'orchestrate_prepare': 'hash:symbol',
                        },
                        'last_incremental_update': '2026-05-08T00:00:00+00:00',
                        'graph_state_hash': 'hash:graph',
                        'index_state_hash': 'hash:index',
                        'update_strategy': 'incremental',
                    },
                    'nodes': [],
                    'edges': [],
                    'events': [],
                    'state_hash': 'hash:result',
                },
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            spend_plan = await client.harness.context_web_spend_plan(
                'run:web',
                query='What should we spend on context?',
            )
            index = await client.harness.thg.context_web.update_index(
                repo_id='Travis-Gilbert/Index-API',
                commit_sha='abc123',
                changed_files=['apps/orchestrate/runtime/orchestrate.py'],
                symbols=['orchestrate_prepare'],
            )
        finally:
            await client.aclose()

        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/harness/runs/run:web/context-web/spend-plan/',
            '/api/v2/theseus/harness/thg/command/',
        ]
        assert spend_plan.spend_plan.spend_plan_id == 'spend:1'
        assert spend_plan.top_atoms[0].hydration_level == 'excerpt'
        assert index.repo_id == 'Travis-Gilbert/Index-API'
        assert index.update_strategy == 'incremental'

    asyncio.run(run())


def test_learning_namespace_maps_profile_spend_plan_and_structural_signal_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/learning/profiles/developer-core/install/'):
            return httpx.Response(
                200,
                json={
                    'profile': {
                        'profile_id': 'developer-core',
                        'installed': True,
                        'enabled_by_default': True,
                        'plugin_ids': ['ep.lang.python.core.pro'],
                    },
                },
            )
        if request.url.path.endswith('/learning/profiles/developer-core/toolkit/'):
            return httpx.Response(
                200,
                json={
                    'toolkit': {
                        'profile_id': 'developer-core',
                        'task_type': 'python_review',
                        'budget_tokens': 6000,
                        'selected_tools': [{'tool_id': 'code_search'}],
                        'blocked_tools': [],
                        'validators': ['ruff'],
                        'plugin_ids': ['ep.lang.python.core.pro'],
                    },
                },
            )
        if request.url.path.endswith('/learning/context/spend-plan/'):
            return httpx.Response(
                200,
                json={
                    'spend_plan': {
                        'spend_plan_id': 'spend-1',
                        'profile_id': 'developer-core',
                        'run_id': 'run-1',
                        'task_signature': 'review.python.pr',
                        'budget_tokens': 6000,
                        'budget_allocation': {'code_symbol': 3000},
                        'hydration_policy': {'full_text': ['symbol'], 'snippets': [], 'summaries': [], 'ids_only': []},
                        'expected_savings': {'raw_candidate_tokens': 4400},
                        'cache_keys': {'profile_id': 'developer-core'},
                        'degradations': {},
                    },
                },
            )
        return httpx.Response(
            200,
            json={
                'signal': {
                    'signal_id': 'sig-1',
                    'plugin_id': 'ep.lang.python.core.pro',
                    'profile_id': 'developer-core',
                    'task_type': 'python_review',
                    'privacy': {'tier': 'structural_only'},
                },
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            installed = await client.learning.profiles.install(
                'developer-core',
                enabled_by_default=True,
            )
            toolkit = await client.learning.profiles.toolkit(
                'developer-core',
                task_type='python_review',
                permissions=['code_read', 'graph_read'],
                budget_tokens=6000,
            )
            spend_plan = await client.learning.context.spend_plan(
                profile_id='developer-core',
                run_id='run-1',
                task_signature='review.python.pr',
                budget_tokens=6000,
                candidate_atoms=[{'id': 'symbol', 'kind': 'code_symbol', 'tokens': 1200, 'score': 0.9}],
            )
            signal = await client.learning.structural_signals.record(
                plugin_id='ep.lang.python.core.pro',
                profile_id='developer-core',
                task_signature_hash='e' * 64,
                task_type='python_review',
                graph_motif_hash='f' * 64,
                method_id='python_reviewer_security_pass',
                validator_id='ruff',
                outcome={'bucket': 'success', 'tests_passed': True},
                token_metrics={'capsule_token_bucket': '4k_8k'},
                privacy={'tier': 'structural_only', 'raw_content_included': False},
            )
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/plugins/learning/profiles/developer-core/install/'
        assert installed['profile']['profile_id'] == 'developer-core'
        assert requests[1].url.path == '/api/v2/plugins/learning/profiles/developer-core/toolkit/'
        assert toolkit['toolkit']['profile_id'] == 'developer-core'
        assert requests[2].url.path == '/api/v2/plugins/learning/context/spend-plan/'
        assert spend_plan['spend_plan']['spend_plan_id'] == 'spend-1'
        assert requests[3].url.path == '/api/v2/plugins/learning/structural-signals/'
        assert signal['signal']['signal_id'] == 'sig-1'

    asyncio.run(run())


def test_thg_profile_and_plugin_helpers_map_to_shipped_command_families() -> None:
    requests: list[dict] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(json.loads(request.content))
        return httpx.Response(
            200,
            json={
                'result': {
                    'command': 'THG.TEST',
                    'status': 'ok',
                    'payload': {},
                    'nodes': [],
                    'edges': [],
                    'events': [],
                    'state_hash': 'sha256:test',
                },
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            await client.thg.profiles.install(profile_id='developer-core', plugin_ids=['p1'])
            await client.thg.profiles.resolve(profile_id='developer-core', plugin_ids=['p1'])
            await client.thg.profiles.toolkit(
                profile_id='developer-core',
                task_type='python_review',
                permissions=['code_read'],
            )
            await client.thg.profiles.budget(
                profile_id='developer-core',
                run_id='run-1',
                task_signature='review.python.pr',
                budget_tokens=6000,
                candidate_atoms=[],
            )
            await client.thg.plugins.run_begin(plugin_id='theseus-pro', task='Review harness')
            await client.thg.plugins.run_step(run_id='run-1', kind='observation', payload={})
            await client.thg.plugins.claim_consult(
                plugin_id='theseus-pro',
                run_id='run-1',
                claim_ids=['claim-1'],
            )
            await client.thg.plugins.outcome_record(run_id='run-1', outcome={'bucket': 'success'})
        finally:
            await client.aclose()

        assert [request['command'] for request in requests] == [
            'THG.PROFILE.INSTALL',
            'THG.PROFILE.RESOLVE',
            'THG.PROFILE.TOOLKIT',
            'THG.PROFILE.BUDGET',
            'THG.PLUGIN.RUN.BEGIN',
            'THG.PLUGIN.RUN.STEP',
            'THG.PLUGIN.CLAIM.CONSULT',
            'THG.PLUGIN.OUTCOME.RECORD',
        ]

    asyncio.run(run())


def test_compile_uses_env_base_url_and_exposes_surface_status(monkeypatch) -> None:
    monkeypatch.setenv('THEOREM_CONTEXT_BASE_URL', 'http://env.example/api/v2/theseus')
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                'id': 'artifact-1',
                'status': 'compiled',
                'task_type': 'review',
                'task_description': 'Review harness SDK gap',
            },
        )

    async def run() -> None:
        client = TheoremContextClient(transport=httpx.MockTransport(handler))
        try:
            artifact = await client.context.compile(
                task='Review harness SDK gap',
                task_type='review',
            )
        finally:
            await client.aclose()

        assert requests[0].url.path == '/api/v2/theseus/context/compile/'
        assert artifact.id == 'artifact-1'
        assert client.surface_status['artifacts']['export']['pdf'] == 'stub'
        assert client.surface_status['harness']['public_run_model'] == 'AgentRunState'

    asyncio.run(run())


def test_compile_surfaces_auth_failures_as_auth_error() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, text='missing token')

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            try:
                await client.context.compile(task='Review harness SDK gap')
            except AuthError as exc:
                assert 'compile failed: 401' in str(exc)
            else:
                raise AssertionError('compile() should raise AuthError')
        finally:
            await client.aclose()

    asyncio.run(run())


def test_harness_failures_surface_as_harness_error() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text='server exploded')

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            try:
                await client.harness.begin(task='Review harness SDK gap')
            except HarnessError as exc:
                assert 'harness begin failed: 500' in str(exc)
            else:
                raise AssertionError('harness.begin() should raise HarnessError')
        finally:
            await client.aclose()

    asyncio.run(run())


def test_transport_timeouts_surface_as_request_timeout_error() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout('timed out', request=request)

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            try:
                await client.context.compile(task='Review harness SDK gap')
            except RequestTimeoutError as exc:
                assert 'compile failed: timed out' in str(exc)
            else:
                raise AssertionError('compile() should raise RequestTimeoutError')
        finally:
            await client.aclose()

    asyncio.run(run())


def _artifact_json(artifact_id: str) -> dict:
    return {
        'id': artifact_id,
        'status': 'compiled',
        'task_type': 'fix',
        'task_description': 'Fix the SDK parity test',
        'budget_tokens': 6000,
        'capsule': {},
        'atoms': [],
        'actions': [],
        'graph_health': {},
        'stress_test': {},
        'provenance': {},
        'token_ledger': {},
        'source_graph': {},
        'cache_key': '',
        'cache_hit': False,
        'created_at': None,
        'updated_at': None,
    }
