"""Tests for the Harness facade and client.recall (MEM-030..032 Python).

The facade is a thin delegator over TheoremContextClient. These tests
use httpx.MockTransport to mock at the HTTP layer (matches the
existing test_context_client.py pattern). Real client, real schemas,
mocked transport.
"""

from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import (
    Harness,
    HarnessAction,
    HarnessDiagnose,
    HarnessMemory,
    TheoremContextClient,
)


def test_harness_exposes_three_namespaces() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:  # noqa: ARG001
        return httpx.Response(200, json={'results': [], 'count': 0})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            assert isinstance(harness.memory, HarnessMemory)
            assert isinstance(harness.action, HarnessAction)
            assert isinstance(harness.diagnose, HarnessDiagnose)
            # The underlying client is accessible for the full
            # 13-namespace surface.
            assert harness.client is client
        finally:
            await client.aclose()

    asyncio.run(run())


def test_client_recall_hits_harness_recall_endpoint() -> None:
    captured_requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_requests.append(request)
        return httpx.Response(
            200,
            json={
                'results': [
                    {'id': 'doc-1', 'title': 'session summary', 'kind': 'session_summary'},
                ],
                'count': 1,
            },
        )

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.recall(
                query='auth refactor',
                actor='claude-ai',
                kind='session_summary',
                limit=5,
            )
            assert result['count'] == 1
            assert result['results'][0]['id'] == 'doc-1'
        finally:
            await client.aclose()

    asyncio.run(run())

    assert len(captured_requests) == 1
    req = captured_requests[0]
    assert req.method == 'POST'
    assert req.url.path.endswith('/harness/recall/')
    body = json.loads(req.content.decode())
    assert body['query'] == 'auth refactor'
    assert body['actor'] == 'claude-ai'
    assert body['kind'] == 'session_summary'
    assert body['limit'] == 5
    assert body['consume_handoffs'] is False
    assert body['include_low_fitness'] is False


def test_harness_memory_recall_delegates_to_client_recall() -> None:
    captured_kwargs: dict = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content.decode())
        captured_kwargs.update(body)
        return httpx.Response(200, json={'results': [{'id': 'd'}], 'count': 1})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            result = await harness.memory.recall(
                query='cluster D',
                actor='codex',
                kind='session_summary',
                limit=3,
            )
            assert result['count'] == 1
        finally:
            await client.aclose()

    asyncio.run(run())

    # The Harness facade passed the kwargs straight through to the
    # underlying client.recall and on to the HTTP body.
    assert captured_kwargs['query'] == 'cluster D'
    assert captured_kwargs['actor'] == 'codex'
    assert captured_kwargs['kind'] == 'session_summary'
    assert captured_kwargs['limit'] == 3


def test_harness_memory_remember_delegates_to_context_remember() -> None:
    captured_urls: list[str] = []
    captured_payloads: list[dict] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_urls.append(str(request.url))
        captured_payloads.append(json.loads(request.content.decode()))
        return httpx.Response(200, json={
            'id': 99,
            'slug': 'rem-99',
            'title': 'cluster A shipped',
        })

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            result = await harness.memory.remember(
                'cluster A shipped today',
                evidence=['commit:d4d787af'],
            )
            assert result['id'] == 99
        finally:
            await client.aclose()

    asyncio.run(run())

    # The remember path is the writeback endpoint, not the recall path.
    assert any('/writeback/object/' in url for url in captured_urls)
    payload = captured_payloads[0]
    assert payload['knowledge_content'] == 'cluster A shipped today'
    assert payload['properties']['evidence'] == ['commit:d4d787af']


def test_harness_memory_v2_methods_hit_backing_routes() -> None:
    captured_paths: list[str] = []

    captured_payloads: list[dict] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_paths.append(request.url.path)
        if request.url.path.endswith('/harness/encode/'):
            captured_payloads.append(json.loads(request.content.decode()))
        return httpx.Response(200, json={'document': {'doc_id': 'doc-1'}})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            await harness.memory.self_note(content='Use shared presence keys.')
            await harness.memory.self_revise(doc_id='doc-1', content='Revised.')
            await harness.memory.self_archive(doc_id='doc-2')
            await harness.memory.self_recall_archive(query='presence')
            await harness.memory.encode(
                content='The TTL failure produced a durable postmortem.',
                kind='postmortem',
                outcome='negative',
                training_weight=2.0,
                training_target='personal_b',
            )
        finally:
            await client.aclose()

    asyncio.run(run())

    assert captured_paths == [
        '/api/v2/theseus/harness/memory/self-note/',
        '/api/v2/theseus/harness/memory/self-revise/',
        '/api/v2/theseus/harness/memory/self-archive/',
        '/api/v2/theseus/harness/memory/self-recall-archive/',
        '/api/v2/theseus/harness/encode/',
    ]
    assert captured_payloads[0]['training_weight'] == 2.0
    assert captured_payloads[0]['training_target'] == 'personal_b'


def test_harness_action_handoff_delegates_to_workstream_handoff_current() -> None:
    captured_urls: list[str] = []
    captured_payloads: list[dict] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_urls.append(str(request.url))
        captured_payloads.append(json.loads(request.content.decode()))
        return httpx.Response(200, json={
            'handoff_id': 'h-1',
            'workstream_id': 'ws-123',
            'previous_agent': 'claude-ai',
            'next_agent_target': 'claude-code',
            'task_state': '',
            'summary': 'compiled',
            'decisions': [],
            'assumptions': [],
            'resolved_assumptions': [],
            'files_touched': [],
            'commands_run': [],
            'tests_run': [],
            'failures': [],
            'open_questions': [],
            'next_actions': [],
            'memory_atoms': [],
            'risk_flags': [],
            'state_hash': 'h',
            'created_at': '2026-05-22T00:00:00Z',
        })

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            result = await harness.action.handoff(
                workstream_id='ws-123',
                next_agent='claude-code',
                previous_agent='claude-ai',
                target_tokens=8000,
            )
            assert result.workstream_id == 'ws-123'
        finally:
            await client.aclose()

    asyncio.run(run())

    assert any('/workstream/ws-123/handoff/current' in url for url in captured_urls)
    payload = captured_payloads[0]
    assert payload['next_agent_target'] == 'claude-code'
    assert payload['previous_agent'] == 'claude-ai'
    assert payload['target_tokens'] == 8000


def test_harness_action_coordination_methods_hit_backing_routes() -> None:
    captured_paths: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        captured_paths.append(request.url.path)
        return httpx.Response(200, json={})

    async def run() -> None:
        client = TheoremContextClient(
            base_url='http://localhost:8000/api/v2/theseus',
            transport=httpx.MockTransport(handler),
        )
        try:
            harness = Harness(client=client)
            await harness.action.coordinate(message='@claude-code check TTL')
            await harness.action.mentions(actor='claude-code')
            await harness.action.mentions_wait(actor='claude-code', timeout_seconds=0)
            await harness.action.presence(actor='codex')
            await harness.action.subscribe(actor='codex')
        finally:
            await client.aclose()

    asyncio.run(run())

    assert captured_paths == [
        '/api/v2/theseus/harness/coordinate/',
        '/api/v2/theseus/harness/mentions/',
        '/api/v2/theseus/harness/mentions/wait/',
        '/api/v2/theseus/harness/presence/',
        '/api/v2/theseus/harness/subscribe/',
    ]
