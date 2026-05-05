from __future__ import annotations

import asyncio
import json

import httpx

from theorem_context import TheoremHotGraphClient


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
