"""Async client for the standalone THG product service."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx

from .errors import (
    AuthError,
    HarnessError,
    RequestTimeoutError,
    ServerUnavailableError,
)
from .types import THGResult


def _quote_path(value: str) -> str:
    return quote(str(value), safe='')


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
            f'/runs/{_quote_path(run_id)}',
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

    async def instant_kg_status(
        self,
        *,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/status', {
            'manifest': manifest,
            'delta': delta,
        })

    async def instant_kg_ppr(
        self,
        seeds: dict[str, float],
        *,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
        alpha: float = 0.15,
        epsilon: float = 1e-4,
        max_pushes: int = 200_000,
        top_k: int = 10,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/ppr', {
            'manifest': manifest,
            'delta': delta,
            'seeds': seeds,
            'alpha': alpha,
            'epsilon': epsilon,
            'max_pushes': max_pushes,
            'top_k': top_k,
        })

    async def instant_kg_impact(
        self,
        *,
        seed: str | None = None,
        symbol_name: str | None = None,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
        direction: str = 'out',
        max_depth: int = 2,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/impact', {
            'manifest': manifest,
            'delta': delta,
            'seed': seed,
            'symbol_name': symbol_name,
            'direction': direction,
            'max_depth': max_depth,
        })

    async def instant_kg_related_objects(
        self,
        seed: str,
        *,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
        kinds: list[str] | None = None,
        top_k: int = 10,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/related-objects', {
            'manifest': manifest,
            'delta': delta,
            'seed': seed,
            'kinds': kinds or [],
            'top_k': top_k,
        })

    async def instant_kg_search(
        self,
        query: str,
        *,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
        kinds: list[str] | None = None,
        top_k: int = 10,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/search', {
            'manifest': manifest,
            'delta': delta,
            'query': query,
            'kinds': kinds or [],
            'top_k': top_k,
        })

    async def instant_kg_explain_edge(
        self,
        src: str,
        dst: str,
        *,
        manifest: dict[str, Any] | None = None,
        delta: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return await self._post_dict('/instant-kg/explain-edge', {
            'manifest': manifest,
            'delta': delta,
            'src': src,
            'dst': dst,
        })

    async def _post(self, path: str, body: dict[str, Any]) -> THGResult:
        response = await self._request(
            'POST',
            path,
            action=path,
            json=body,
        )
        return THGResult.model_validate(response.json())

    async def _post_dict(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        response = await self._request(
            'POST',
            path,
            action=path,
            json={key: value for key, value in body.items() if value is not None},
        )
        return response.json()

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
        return f'{self.base_url}/v1/tenants/{_quote_path(self.tenant_id)}'
