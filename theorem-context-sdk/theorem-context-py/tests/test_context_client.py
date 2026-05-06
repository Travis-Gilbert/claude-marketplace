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


def test_context_artifacts_fork_and_attach_fail_honestly_when_backend_routes_are_absent() -> None:
    async def run() -> None:
        client = TheoremContextClient(base_url='http://localhost:8000/api/v2/theseus')
        try:
            try:
                await client.context.artifacts.fork('artifact-1')
            except Exception as exc:
                assert 'not implemented' in str(exc).lower() or 'unsupported' in str(exc).lower()
            else:
                raise AssertionError('fork() should not silently succeed')

            try:
                await client.context.artifacts.attach('artifact-1', 'run-1')
            except Exception as exc:
                assert 'not implemented' in str(exc).lower() or 'unsupported' in str(exc).lower()
            else:
                raise AssertionError('attach() should not silently succeed')
        finally:
            await client.aclose()

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
