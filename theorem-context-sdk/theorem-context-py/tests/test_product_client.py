from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import (
    AuthError,
    HarnessError,
    RequestTimeoutError,
    ServerUnavailableError,
    TheoremHotGraphClient,
)


def test_product_client_posts_tenant_command_with_bearer_auth() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                'ok': True,
                'command': 'THG.RUN.BEGIN',
                'status': 'ok',
                'payload': {},
                'nodes': [],
                'edges': [],
                'events': [],
                'state_hash': 'sha256:test',
            },
        )

    async def run() -> None:
        client = TheoremHotGraphClient(
            base_url='http://localhost:8380/',
            token='secret',
            tenant_id='tenant-a',
            transport=httpx.MockTransport(handler),
        )
        try:
            result = await client.command('THG.RUN.BEGIN', {'run_id': 'run:1'})
        finally:
            await client.aclose()

        assert result.ok is True
        assert requests[0].url.path == '/v1/tenants/tenant-a/command'
        assert requests[0].headers['authorization'] == 'Bearer secret'
        assert json.loads(requests[0].content)['args']['run_id'] == 'run:1'

    asyncio.run(run())


def test_product_client_normalizes_http_failures_into_typed_errors() -> None:
    cases = [
        (401, AuthError),
        (503, ServerUnavailableError),
        (504, RequestTimeoutError),
        (500, HarnessError),
    ]

    for status_code, expected_error in cases:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(status_code, text=f'failure-{status_code}')

        async def run() -> None:
            client = TheoremHotGraphClient(
                base_url='http://localhost:8380/',
                token='secret',
                tenant_id='tenant-a',
                transport=httpx.MockTransport(handler),
            )
            try:
                try:
                    await client.command('THG.RUN.BEGIN', {'run_id': 'run:1'})
                except expected_error as exc:
                    assert (
                        f'THG product /command failed with HTTP {status_code}'
                        in str(exc)
                    )
                else:
                    raise AssertionError(
                        f'expected {expected_error.__name__} for {status_code}',
                    )
            finally:
                await client.aclose()

        asyncio.run(run())


def test_product_client_normalizes_transport_failures_into_typed_errors() -> None:
    async def timeout_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout('timed out', request=request)

    async def network_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError('network failed', request=request)

    async def run_timeout() -> None:
        client = TheoremHotGraphClient(
            base_url='http://localhost:8380/',
            token='secret',
            tenant_id='tenant-a',
            transport=httpx.MockTransport(timeout_handler),
        )
        try:
            try:
                await client.command('THG.RUN.BEGIN', {'run_id': 'run:1'})
            except RequestTimeoutError as exc:
                assert 'THG product /command failed: timed out' in str(exc)
            else:
                raise AssertionError('command() should raise RequestTimeoutError')
        finally:
            await client.aclose()

    async def run_network() -> None:
        client = TheoremHotGraphClient(
            base_url='http://localhost:8380/',
            token='secret',
            tenant_id='tenant-a',
            transport=httpx.MockTransport(network_handler),
        )
        try:
            try:
                await client.run('run:1')
            except ServerUnavailableError as exc:
                assert 'THG product run failed: network failed' in str(exc)
            else:
                raise AssertionError('run() should raise ServerUnavailableError')
        finally:
            await client.aclose()

    asyncio.run(run_timeout())
    asyncio.run(run_network())
