"""Async client for the standalone THG product service."""

from __future__ import annotations

from typing import Any

import httpx

from .errors import (
    AuthError,
    HarnessError,
    RequestTimeoutError,
    ServerUnavailableError,
)
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
        response = await self._request(
            'POST',
            '/batch',
            action='batch',
            json={'commands': commands},
        )
        return response.json()

    async def run(self, run_id: str) -> THGResult:
        response = await self._request(
            'GET',
            f'/runs/{run_id}',
            action='run',
        )
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
        response = await self._request(
            'POST',
            path,
            action=path,
            json=body,
        )
        return THGResult.model_validate(response.json())

    async def _request(
        self,
        method: str,
        path: str,
        *,
        action: str,
        **kwargs: Any,
    ) -> httpx.Response:
        try:
            response = await self._http.request(
                method,
                f'{self._tenant_url()}{path}',
                headers=self._headers(),
                **kwargs,
            )
        except httpx.TimeoutException as exc:
            raise RequestTimeoutError(
                f'THG product {action} failed: {exc}',
            ) from exc
        except httpx.RequestError as exc:
            raise ServerUnavailableError(
                f'THG product {action} failed: {exc}',
            ) from exc
        self._raise_for_status(response, action=action)
        return response

    def _raise_for_status(self, response: httpx.Response, *, action: str) -> None:
        if response.is_success:
            return
        detail = response.text.strip()
        suffix = f' {detail}' if detail else ''
        message = (
            f'THG product {action} failed with HTTP '
            f'{response.status_code}{suffix}'
        )
        if response.status_code in {401, 403}:
            raise AuthError(message)
        if response.status_code in {408, 504}:
            raise RequestTimeoutError(message)
        if response.status_code in {502, 503}:
            raise ServerUnavailableError(message)
        raise HarnessError(message)

    def _headers(self) -> dict[str, str]:
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
        }

    def _tenant_url(self) -> str:
        return f'{self.base_url}/v1/tenants/{self.tenant_id}'
