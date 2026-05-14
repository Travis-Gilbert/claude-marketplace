from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import TheoremContextClient


def test_agent_namespace_maps_rest_routes_with_actor_and_adapter() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/agent/tool-manifest/'):
            return httpx.Response(200, json={'manifest': {'tools': ['chat', 'search']}})
        if request.url.path.endswith('/agent/domain-catalog/'):
            return httpx.Response(200, json={'route': 'domain-catalog'})
        if request.url.path.endswith('/agent/recommended-toolpack/'):
            return httpx.Response(200, json={'route': 'recommended-toolpack'})
        if request.url.path.endswith('/agent/prepare/'):
            return httpx.Response(200, json={'route': 'prepare'})
        if request.url.path.endswith('/agent/explain-context/'):
            return httpx.Response(200, json={'route': 'explain-context'})
        if request.url.path.endswith('/agent/search-context/'):
            return httpx.Response(200, json={'route': 'search-context'})
        if request.url.path.endswith('/agent/hydrate-context/'):
            return httpx.Response(200, json={'route': 'hydrate-context'})
        if request.url.path.endswith('/agent/record-step/'):
            return httpx.Response(200, json={'route': 'record-step'})
        if request.url.path.endswith('/agent/record-outcome/'):
            return httpx.Response(200, json={'route': 'record-outcome'})
        if request.url.path.endswith('/agent/export-artifact/'):
            return httpx.Response(200, json={'route': 'export-artifact'})
        return httpx.Response(200, json={'route': 'review-memory'})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            manifest = await client.agent.tool_manifest()
            domain_catalog = await client.agent.domain_catalog(
                actor='codex',
                adapter='codex',
                catalog='repo',
                catalog_depth='full',
            )
            recommended_toolpack = await client.agent.recommended_toolpack(
                actor='cursor',
                adapter='cursor',
                catalog={'kind': 'candidate'},
                constraints=['fast'],
            )
            prepared = await client.agent.prepare(
                actor='chatgpt',
                adapter='chatgpt',
                task='summarize',
            )
            prepare_alias = await client.agent.prepare_agent(
                actor='custom',
                adapter='custom',
                task='summarize',
            )
            explained = await client.agent.explain_context(
                actor='codex',
                adapter='codex',
                context='run:1',
            )
            search = await client.agent.search_context(
                run_id='run-1',
                query='find context',
            )
            hydrated = await client.agent.hydrate_context(
                run_id='run-1',
                handles=['artifact:1'],
            )
            step = await client.agent.record_step(
                run_id='run-1',
                kind='tool_call',
                payload={'tool': 'pytest'},
            )
            outcome = await client.agent.record_outcome(
                run_id='run-1',
                accepted=True,
                tests_passed=True,
                summary='validated',
            )
            exported = await client.agent.export_artifact(
                artifact_id='artifact-1',
                format='signed',
            )
            reviewed = await client.agent.review_memory(run_id='run-1')
        finally:
            await client.aclose()

        assert manifest == {'manifest': {'tools': ['chat', 'search']}}
        assert domain_catalog['route'] == 'domain-catalog'
        assert recommended_toolpack['route'] == 'recommended-toolpack'
        assert prepared['route'] == 'prepare'
        assert prepare_alias['route'] == 'prepare'
        assert explained['route'] == 'explain-context'
        assert search['route'] == 'search-context'
        assert hydrated['route'] == 'hydrate-context'
        assert step['route'] == 'record-step'
        assert outcome['route'] == 'record-outcome'
        assert exported['route'] == 'export-artifact'
        assert reviewed['route'] == 'review-memory'

        assert requests[0].url.path == '/api/v2/theseus/agent/tool-manifest/'
        assert requests[1].url.path == '/api/v2/theseus/agent/domain-catalog/'
        assert json.loads(requests[1].content) == {
            'actor': 'codex',
            'adapter': 'codex',
            'catalog': 'repo',
            'catalog_depth': 'full',
        }
        assert json.loads(requests[2].content) == {
            'actor': 'cursor',
            'adapter': 'cursor',
            'catalog': {'kind': 'candidate'},
            'constraints': ['fast'],
        }
        assert json.loads(requests[3].content)['actor'] == 'chatgpt'
        assert json.loads(requests[3].content)['adapter'] == 'chatgpt'
        assert json.loads(requests[3].content)['task'] == 'summarize'
        assert json.loads(requests[4].content)['actor'] == 'custom'
        assert json.loads(requests[5].content)['context'] == 'run:1'
        assert requests[6].url.path == '/api/v2/theseus/agent/search-context/'
        assert requests[7].url.path == '/api/v2/theseus/agent/hydrate-context/'
        assert requests[8].url.path == '/api/v2/theseus/agent/record-step/'
        assert requests[9].url.path == '/api/v2/theseus/agent/record-outcome/'
        assert requests[10].url.path == '/api/v2/theseus/agent/export-artifact/'
        assert requests[11].url.path == '/api/v2/theseus/agent/review-memory/'
        assert json.loads(requests[9].content)['tests_passed'] is True
        assert json.loads(requests[10].content)['artifact_id'] == 'artifact-1'

    asyncio.run(run())


def test_agent_namespace_graphql_payloads_post_expected_operations() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        payload = json.loads(request.content)
        operation_name = payload['operationName']
        if operation_name == 'harnessRunConsole':
            return httpx.Response(200, json={'operationName': operation_name, 'runId': payload['variables']['runId']})
        if operation_name == 'memoryRecallPreview':
            return httpx.Response(200, json={'operationName': operation_name, 'runId': payload['variables']['runId']})
        return httpx.Response(200, json={'operationName': operation_name, 'runId': payload['variables']['runId']})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            run_console = await client.agent.harness_run_console('run-1', actor='chatgpt', adapter='chatgpt')
            recall = await client.agent.memory_recall_preview(
                'run-1',
                actor='cursor',
                adapter='cursor',
            )
            rail = await client.agent.action_rail(
                'run-1',
                actor='claude_code',
                adapter='claude_code',
            )
        finally:
            await client.aclose()

        assert run_console['operationName'] == 'harnessRunConsole'
        assert recall['operationName'] == 'memoryRecallPreview'
        assert rail['operationName'] == 'actionRail'
        assert [req.url.path for req in requests] == [
            '/api/v2/theseus/graphql/',
            '/api/v2/theseus/graphql/',
            '/api/v2/theseus/graphql/',
        ]
        assert [json.loads(req.content) for req in requests] == [
            {
                'operationName': 'harnessRunConsole',
                'variables': {'runId': 'run-1'},
            },
            {
                'operationName': 'memoryRecallPreview',
                'variables': {'runId': 'run-1'},
            },
            {
                'operationName': 'actionRail',
                'variables': {'runId': 'run-1'},
            },
        ]

    asyncio.run(run())
