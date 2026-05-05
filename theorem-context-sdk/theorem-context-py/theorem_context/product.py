"""Async client for the standalone THG product service."""

from __future__ import annotations

from typing import Any

import httpx

from .types import THGResult


class TheoremHotGraphClient:
    """Tenant-scoped client for the THG product service."""

    def __init__(
        self,
        *,
        base_url: str,
        token: str,
        tenant_id: str,
        timeout: float = 30.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.tenant_id = tenant_id
        self._http = httpx.AsyncClient(timeout=timeout, transport=transport)

    async def __aenter__(self) -> 'TheoremHotGraphClient':
        return self

    async def __aexit__(self, *_args: Any) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._http.aclose()

    async def command(
        self,
        command: str,
        args: dict[str, Any] | None = None,
    ) -> THGResult:
        return await self._post('/command', {
            'command': command,
            'args': args or {},
        })

    async def batch(
        self,
        commands: list[dict[str, Any]],
    ) -> dict[str, Any]:
        response = await self._http.post(
            f'{self._tenant_url()}/batch',
            headers=self._headers(),
            json={'commands': commands},
        )
        response.raise_for_status()
        return response.json()

    async def run(self, run_id: str) -> THGResult:
        response = await self._http.get(
            f'{self._tenant_url()}/runs/{run_id}',
            headers=self._headers(),
        )
        response.raise_for_status()
        return THGResult.model_validate(response.json())

    async def context_pack(self, args: dict[str, Any]) -> THGResult:
        return await self._post('/context/pack', args)

    async def graph_query(
        self,
        query: str,
        *,
        graph: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> THGResult:
        return await self._post('/graph/query', {
            'query': query,
            'graph': graph or {},
            'params': params or {},
        })

    async def _post(self, path: str, body: dict[str, Any]) -> THGResult:
        response = await self._http.post(
            f'{self._tenant_url()}{path}',
            headers=self._headers(),
            json=body,
        )
        response.raise_for_status()
        return THGResult.model_validate(response.json())

    def _headers(self) -> dict[str, str]:
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
        }

    def _tenant_url(self) -> str:
        return f'{self.base_url}/v1/tenants/{self.tenant_id}'
