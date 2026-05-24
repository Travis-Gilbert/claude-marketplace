"""Acceptance tests for the SDK ``workstream`` and ``handoff`` namespaces.

Mirrors the surface added in S2-T17 of
``Index-API/docs/plans/continuous-agent-memory-harness/implementation-plan.md``.
The tests stub the HTTP transport with ``httpx.MockTransport`` so they run
without a live backend.
"""

from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import (
    HandoffArtifact,
    HandoffListResponse,
    TheoremContextClient,
    Workstream,
)


def _capture(requests: list[httpx.Request]) -> 'httpx.MockTransport':
    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        path = request.url.path
        if path.endswith('/workstream/resolve/'):
            return httpx.Response(
                200,
                json={
                    'workstream_id': 'workstream:sdk',
                    'tenant_id': 'tenant-x',
                    'repo': 'Index-API',
                    'branch': 'main',
                    'extra_key': '',
                    'title': 'CMH SDK parity test',
                    'task_state': 'active',
                    'agent_hosts_seen': [],
                    'active_branch': '',
                    'current_handoff_id': '',
                    'last_state_hash': '',
                    'created_at': '2026-05-16T00:00:00Z',
                    'updated_at': '2026-05-16T00:00:00Z',
                    'workstream': {
                        'workstream_id': 'workstream:sdk',
                        'tenant_id': 'tenant-x',
                        'repo': 'Index-API',
                        'branch': 'main',
                        'task_state': 'active',
                        'agent_hosts_seen': [],
                        'created_at': '2026-05-16T00:00:00Z',
                        'updated_at': '2026-05-16T00:00:00Z',
                    },
                },
            )
        if path.endswith('/workstream/workstream:sdk/'):
            return httpx.Response(
                200,
                json={
                    'workstream': {
                        'workstream_id': 'workstream:sdk',
                        'tenant_id': 'tenant-x',
                        'repo': 'Index-API',
                        'branch': 'main',
                        'task_state': 'blocked',
                        'agent_hosts_seen': ['codex'],
                        'created_at': '2026-05-16T00:00:00Z',
                        'updated_at': '2026-05-16T00:10:00Z',
                    },
                },
            )
        if path.endswith('/session/start/'):
            return httpx.Response(
                200,
                json={
                    'agent_session_id': 'agentsess:sdk',
                    'harness_run_id': 'run:sdk',
                    'agent_session': {
                        'agent_session_id': 'agentsess:sdk',
                        'workstream_id': 'workstream:sdk',
                        'agent_host': 'codex',
                        'harness_run_id': 'run:sdk',
                        'started_at': '2026-05-16T00:01:00Z',
                    },
                },
            )
        if path.endswith('/session/end/'):
            return httpx.Response(
                200,
                json={
                    'agent_session': {
                        'agent_session_id': 'agentsess:sdk',
                        'workstream_id': 'workstream:sdk',
                        'ended_at': '2026-05-16T00:02:00Z',
                        'outcome': {'status': 'ready_for_handoff'},
                    },
                    'agent_session_id': 'agentsess:sdk',
                    'workstream_id': 'workstream:sdk',
                },
            )
        if path.endswith('/handoff/current/'):
            return httpx.Response(
                200,
                json={
                    'handoff_id': 'handoff:sdk',
                    'workstream_id': 'workstream:sdk',
                    'state_hash': 'sha256:deadbeef',
                    'handoff': {
                        'handoff_id': 'handoff:sdk',
                        'workstream_id': 'workstream:sdk',
                        'previous_agent': 'codex',
                        'next_agent_target': 'claude_code',
                        'task_state': 'active',
                        'summary': 'SDK parity capsule',
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
                        'state_hash': 'sha256:deadbeef',
                        'created_at': '2026-05-16T00:03:00Z',
                    },
                },
            )
        if path.endswith('/handoffs/'):
            return httpx.Response(
                200,
                json={
                    'workstream_id': 'workstream:sdk',
                    'handoffs': [
                        {
                            'handoff_id': 'handoff:sdk-2',
                            'workstream_id': 'workstream:sdk',
                            'created_at': '2026-05-16T00:05:00Z',
                            'state_hash': 'sha256:b',
                        },
                        {
                            'handoff_id': 'handoff:sdk-1',
                            'workstream_id': 'workstream:sdk',
                            'created_at': '2026-05-16T00:04:00Z',
                            'state_hash': 'sha256:a',
                        },
                    ],
                    'count': 2,
                    'next_cursor': '2026-05-16T00:04:00Z',
                },
            )
        if '/handoff/handoff:' in path:
            return httpx.Response(
                200,
                json={
                    'handoff': {
                        'handoff_id': 'handoff:sdk',
                        'workstream_id': 'workstream:sdk',
                        'created_at': '2026-05-16T00:03:00Z',
                        'state_hash': 'sha256:deadbeef',
                        'task_state': 'active',
                    },
                },
            )
        return httpx.Response(404)

    return httpx.MockTransport(handler)


def test_workstream_resolve_returns_typed_summary() -> None:
    requests: list[httpx.Request] = []

    async def run() -> None:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=_capture(requests))
        try:
            ws = await client.workstream.resolve(
                tenant_id='tenant-x',
                repo='Index-API',
                branch='main',
                title='CMH SDK parity test',
            )
        finally:
            await client.aclose()
        assert isinstance(ws, Workstream)
        assert ws.workstream_id == 'workstream:sdk'
        assert ws.repo == 'Index-API'

    asyncio.run(run())
    assert any(
        req.url.path.endswith('/workstream/resolve/') for req in requests
    )


def test_workstream_session_start_and_end() -> None:
    requests: list[httpx.Request] = []

    async def run() -> dict[str, dict]:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=_capture(requests))
        try:
            started = await client.workstream.session.start(
                'workstream:sdk',
                agent_host='codex',
                agent_model='gpt-5.5',
                task='continue CMH SDK parity',
            )
            ended = await client.workstream.session.end(
                'workstream:sdk',
                'agentsess:sdk',
                outcome={'status': 'ready_for_handoff'},
            )
        finally:
            await client.aclose()
        return {'started': started, 'ended': ended}

    out = asyncio.run(run())
    assert out['started']['agent_session_id'] == 'agentsess:sdk'
    assert out['started']['harness_run_id'] == 'run:sdk'
    assert out['ended']['agent_session']['outcome']['status'] == 'ready_for_handoff'

    bodies = [
        json.loads(req.content)
        for req in requests
        if req.url.path.endswith('/session/start/')
    ]
    assert bodies and bodies[0]['agent_host'] == 'codex'


def test_workstream_handoff_current_and_get() -> None:
    requests: list[httpx.Request] = []

    async def run() -> tuple[HandoffArtifact, HandoffArtifact]:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=_capture(requests))
        try:
            current = await client.workstream.handoff.current(
                'workstream:sdk',
                next_agent_target='claude_code',
            )
            fetched = await client.handoff.get('handoff:sdk')
        finally:
            await client.aclose()
        return current, fetched

    current, fetched = asyncio.run(run())
    assert isinstance(current, HandoffArtifact)
    assert current.handoff_id == 'handoff:sdk'
    assert current.next_agent_target == 'claude_code'
    assert isinstance(fetched, HandoffArtifact)
    assert fetched.handoff_id == 'handoff:sdk'


def test_workstream_handoffs_carries_next_cursor() -> None:
    requests: list[httpx.Request] = []

    async def run() -> HandoffListResponse:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=_capture(requests))
        try:
            return await client.workstream.handoffs(
                'workstream:sdk',
                limit=2,
            )
        finally:
            await client.aclose()

    listing = asyncio.run(run())
    assert isinstance(listing, HandoffListResponse)
    assert listing.workstream_id == 'workstream:sdk'
    assert listing.count == 2
    assert listing.next_cursor == '2026-05-16T00:04:00Z'
    assert [h.handoff_id for h in listing.handoffs] == [
        'handoff:sdk-2', 'handoff:sdk-1',
    ]
