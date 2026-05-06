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


def test_orchestrate_composes_harness_context_artifact_and_action_rail_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/harness/runs/'):
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
                },
            )
        if request.url.path.endswith('/context-command/resolve/'):
            return httpx.Response(
                200,
                json={
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
            )
        if request.url.path.endswith('/harness/runs/run:orch/context/'):
            return httpx.Response(
                200,
                json={
                    'artifact': _artifact_json('artifact-orch'),
                    'contract': {},
                },
            )
        if request.url.path.endswith('/attach/'):
            return httpx.Response(
                200,
                json={
                    'attached': True,
                    'harness_attached': True,
                    'attachment': {
                        'artifact_id': 'artifact-orch',
                        'target': 'run:orch',
                    },
                },
            )
        if request.url.path.endswith('/action-rail/generate/'):
            return httpx.Response(
                200,
                json={
                    'rail_id': 'rail:1',
                    'actions': [{'action_id': 'act:1', 'label': 'Run focused tests'}],
                    'grouped': {},
                    'context_summary': {},
                    'warnings': [],
                    'metadata': {},
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
        assert result.context_command['state']['command_id'] == 'ctx:1'
        assert result.artifact.id == 'artifact-orch'
        assert result.artifact_attachment.harness_attached is True
        assert result.action_rail['rail_id'] == 'rail:1'
        assert result.report.checklist[0]['id'] == 'ORCH-SDK-001'
        assert result.report.harness_writeback == 'recorded'
        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/harness/runs/',
            '/api/v2/theseus/context-command/resolve/',
            '/api/v2/theseus/harness/runs/run:orch/context/',
            '/api/v2/theseus/context/artifacts/artifact-orch/attach/',
            '/api/v2/theseus/action-rail/generate/',
        ]

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
