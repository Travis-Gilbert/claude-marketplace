from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import (
    HarnessError,
    RequestTimeoutError,
    ServerUnavailableError,
    TheoremContextClient,
)
from theorem_context.cli import main


def test_runs_namespace_targets_state_machine_routes() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if request.url.path.endswith('/harness/runs/'):
            return httpx.Response(
                200,
                json={
                    'run': {
                        'run_id': 'run:1',
                        'task': 'fix failing test',
                        'actor': 'codex',
                        'scope': {},
                        'status': 'running',
                        'steps': [],
                        'search_runs': [],
                        'artifacts': [],
                        'memory_patches': [],
                        'validations': [],
                    }
                },
            )
        if request.url.path.endswith('/transition/'):
            return httpx.Response(
                200,
                json={
                    'run': {'run_id': 'run:1', 'status': 'observed'},
                    'event': {
                        'event_id': 'event:1',
                        'run_id': 'run:1',
                        'seq': 2,
                        'type': 'HOST.OBSERVED',
                        'payload': {},
                        'state_hash_before': 'before',
                        'state_hash_after': 'after',
                    },
                    'effects': [],
                    'state_hash_before': 'before',
                    'state_hash_after': 'after',
                },
            )
        if request.url.path.endswith('/events/'):
            return httpx.Response(200, json={'events': []})
        if request.url.path.endswith('/state-hash/'):
            return httpx.Response(
                200,
                json={'run_id': 'run:1', 'state_hash': 'after'},
            )
        return httpx.Response(404)

    async def run() -> None:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            started = await client.runs.begin(task='fix failing test', actor='codex')
            transitioned = await client.runs.transition(
                started.run_id,
                type='HOST.OBSERVED',
                payload={
                    'repo': 'Index-API',
                    'branch': 'main',
                    'commit_sha': 'abc',
                    'cwd': '/repo',
                },
            )
            events = await client.runs.events(started.run_id)
            state_hash = await client.runs.state_hash(started.run_id)
        finally:
            await client.aclose()

        assert transitioned.event.type == 'HOST.OBSERVED'
        assert events == []
        assert state_hash.state_hash == 'after'
        assert [request.url.path for request in requests] == [
            '/api/v2/theseus/harness/runs/',
            '/api/v2/theseus/harness/runs/run:1/transition/',
            '/api/v2/theseus/harness/runs/run:1/events/',
            '/api/v2/theseus/harness/runs/run:1/state-hash/',
        ]

    asyncio.run(run())


def test_cli_run_dry_run_prints_command_sequence(capsys) -> None:
    assert main(['run', 'fix failing context test', '--dry-run']) == 0

    output = json.loads(capsys.readouterr().out)
    assert output[0]['path'] == '/harness/runs/'
    assert output[1]['path'] == '/harness/runs/{run_id}/transition/'


def test_runs_namespace_normalizes_state_machine_failures_into_typed_errors() -> None:
    cases = [
        (
            500,
            HarnessError,
            lambda client: client.runs.transition(
                'run:1',
                type='HOST.OBSERVED',
                payload={},
            ),
            'harness transition failed: 500',
        ),
        (
            503,
            ServerUnavailableError,
            lambda client: client.runs.events('run:1'),
            'harness events failed: 503',
        ),
        (
            504,
            RequestTimeoutError,
            lambda client: client.runs.state_hash('run:1'),
            'harness state hash failed: 504',
        ),
    ]

    for status_code, expected_error, call, expected_message in cases:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code, text=f'failure-{status_code}')

        async def run() -> None:
            client = TheoremContextClient(base_url='http://test/api/v2/theseus')
            await client._http.aclose()
            client._http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
            try:
                try:
                    await call(client)
                except expected_error as exc:
                    assert expected_message in str(exc)
                else:
                    raise AssertionError(
                        f'expected {expected_error.__name__} for {status_code}',
                    )
            finally:
                await client.aclose()

        asyncio.run(run())


def test_runs_namespace_normalizes_state_machine_transport_timeouts() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout('timed out', request=request)

    async def run() -> None:
        client = TheoremContextClient(base_url='http://test/api/v2/theseus')
        await client._http.aclose()
        client._http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            try:
                await client.runs.state_hash('run:1')
            except RequestTimeoutError as exc:
                assert 'harness state hash failed: timed out' in str(exc)
            else:
                raise AssertionError('state_hash() should raise RequestTimeoutError')
        finally:
            await client.aclose()

    asyncio.run(run())
