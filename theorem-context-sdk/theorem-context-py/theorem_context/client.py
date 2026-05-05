"""TheoremContextClient: async client for the Context Compiler API."""

from __future__ import annotations

import json
from typing import Any, AsyncIterator

import httpx

from .types import (
    CompileRequest,
    ContextArtifact,
    HarnessBeginRequest,
    HarnessCompareRequest,
    HarnessContextRequest,
    HarnessForkRequest,
    HarnessPatchRequest,
    HarnessRun,
    HarnessSearchRequest,
    HarnessSearchRun,
    HarnessStep,
    OutcomeRequest,
    THGCommandRequest,
    THGCypherRequest,
    THGResult,
)

DEFAULT_BASE_URL = 'https://index-api-production-a5f7.up.railway.app/api/v2/theseus'


class _ContextNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.artifacts = _ArtifactsNamespace(client)
        self.search = _SearchNamespace(client)
        self.graph = _GraphNamespace(client)

    async def compile(self, **kwargs: Any) -> ContextArtifact:
        request = CompileRequest(**kwargs) if kwargs else CompileRequest(task='')
        return await self._client._compile(request)

    async def compile_stream(self, **kwargs: Any) -> AsyncIterator[dict]:
        request = CompileRequest(**kwargs)
        async for event in self._client._compile_stream(request):
            yield event

    async def estimate(self, **kwargs: Any) -> dict[str, int]:
        request = CompileRequest(**kwargs)
        request.budget_tokens = 0
        result = await self._client._compile(request)
        return {
            'estimated_atoms': len(result.atoms or []),
            'estimated_raw_tokens': result.token_ledger.rawCandidateTokens,
        }

    async def remember(self, observation: str, evidence: list[str] | None = None) -> dict:
        return await self._client._remember(observation, evidence or [])

    async def audit(self, artifact_id: str) -> ContextArtifact:
        return await self._client._audit(artifact_id)

    async def outcome(self, artifact_id: str, **kwargs: Any) -> dict:
        return await self._client._outcome(artifact_id, OutcomeRequest(**kwargs))


class _ArtifactsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self, **filters: Any) -> dict:
        return await self._client._list(filters)

    async def get(self, artifact_id: str) -> ContextArtifact:
        return await self._client._audit(artifact_id)

    async def export(self, artifact_id: str, format: str = 'json') -> dict:
        return {'stub': True, 'format': format, 'artifact_id': artifact_id}

    async def fork(self, artifact_id: str) -> dict:
        return {'stub': True, 'artifact_id': artifact_id}

    async def attach(self, artifact_id: str, target: str) -> dict:
        return {'stub': True, 'artifact_id': artifact_id, 'target': target}


class _SearchNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def postmortems(self, query: str) -> dict:
        return await self._client._search_postmortems(query)


class _GraphNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.patches = _PatchesNamespace(client)

    async def focus(self, seed_ids: list[int]) -> dict:
        return {'stub': True, 'seed_ids': seed_ids}


class _PatchesNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self) -> dict:
        return {'stub': True, 'patches': []}


class _THGNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def command(self, command: str, payload: dict[str, Any] | None = None) -> THGResult:
        request = THGCommandRequest(command=command, payload=payload or {})
        return await self._client._thg_command(request)

    async def cypher(
        self,
        query: str,
        *,
        graph: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> THGResult:
        request = THGCypherRequest(
            query=query,
            graph=graph or {},
            params=params or {},
        )
        return await self._client._thg_cypher(request)


class _HarnessNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.thg = _THGNamespace(client)

    async def begin(self, **kwargs: Any) -> HarnessRun:
        request = HarnessBeginRequest(**kwargs)
        return await self._client._harness_begin(request)

    async def get(self, run_id: str) -> HarnessRun:
        return await self._client._harness_get(run_id)

    async def step(
        self,
        run_id: str,
        *,
        kind: str,
        payload: dict[str, Any] | None = None,
    ) -> HarnessStep:
        return await self._client._harness_step(
            run_id,
            kind=kind,
            payload=payload or {},
        )

    async def search(self, run_id: str, **kwargs: Any) -> HarnessSearchRun:
        request = HarnessSearchRequest(**kwargs)
        return await self._client._harness_search(run_id, request)

    async def context(self, run_id: str, **kwargs: Any) -> dict:
        request = HarnessContextRequest(**kwargs)
        return await self._client._harness_context(run_id, request)

    async def patch(self, run_id: str, **kwargs: Any) -> dict:
        request = HarnessPatchRequest(**kwargs)
        return await self._client._harness_patch(run_id, request)

    async def replay(self, run_id: str) -> list[HarnessStep]:
        return await self._client._harness_replay(run_id)

    async def fork(self, run_id: str, **kwargs: Any) -> HarnessRun:
        request = HarnessForkRequest(**kwargs)
        return await self._client._harness_fork(run_id, request)

    async def compare(self, before_run_id: str, after_run_id: str) -> dict:
        request = HarnessCompareRequest(
            before_run_id=before_run_id,
            after_run_id=after_run_id,
        )
        return await self._client._harness_compare(request)


class TheoremContextClient:
    """Async HTTP client for the Theorem Context Compiler.

    Surface mirrors the TypeScript SDK::

        cc = TheoremContextClient(api_key='...')
        artifact = await cc.context.compile(task='review the auth module')

    The client owns an httpx AsyncClient internally; close it explicitly
    via ``await cc.aclose()`` or use it as an async context manager.
    """

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_BASE_URL,
        api_key: str | None = None,
        timeout: float = 60.0,
    ) -> None:
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self._http = httpx.AsyncClient(timeout=timeout)
        self.context = _ContextNamespace(self)
        self.harness = _HarnessNamespace(self)
        self.thg = _THGNamespace(self)

    async def __aenter__(self) -> 'TheoremContextClient':
        return self

    async def __aexit__(self, *_args: Any) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._http.aclose()

    def _headers(self) -> dict[str, str]:
        out = {'Content-Type': 'application/json'}
        if self.api_key:
            out['Authorization'] = f'Bearer {self.api_key}'
        return out

    async def _compile(self, request: CompileRequest) -> ContextArtifact:
        response = await self._http.post(
            f'{self.base_url}/context/compile/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return ContextArtifact.model_validate(response.json())

    async def _compile_stream(
        self,
        request: CompileRequest,
    ) -> AsyncIterator[dict]:
        async with self._http.stream(
            'POST',
            f'{self.base_url}/context/compile/stream/',
            headers={**self._headers(), 'Accept': 'text/event-stream'},
            content=request.model_dump_json(exclude_none=True),
        ) as response:
            response.raise_for_status()
            buffer = ''
            async for chunk in response.aiter_text():
                buffer += chunk
                while '\n\n' in buffer:
                    raw, buffer = buffer.split('\n\n', 1)
                    event = _parse_sse_chunk(raw)
                    if event is not None:
                        yield event

    async def _audit(self, artifact_id: str) -> ContextArtifact:
        response = await self._http.get(
            f'{self.base_url}/context/artifacts/{artifact_id}/',
            headers=self._headers(),
        )
        response.raise_for_status()
        return ContextArtifact.model_validate(response.json())

    async def _list(self, filters: dict[str, Any]) -> dict:
        params = {k: v for k, v in filters.items() if v is not None}
        response = await self._http.get(
            f'{self.base_url}/context/artifacts/',
            params=params,
            headers=self._headers(),
        )
        response.raise_for_status()
        return response.json()

    async def _outcome(
        self,
        artifact_id: str,
        request: OutcomeRequest,
    ) -> dict:
        response = await self._http.post(
            f'{self.base_url}/context/artifacts/{artifact_id}/outcome/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return response.json()

    async def _remember(self, observation: str, evidence: list[str]) -> dict:
        response = await self._http.post(
            f'{self.base_url}/writeback/object/',
            headers=self._headers(),
            json={
                'title': observation[:200],
                'knowledge_content': observation,
                'properties': {'evidence': evidence},
                'source_system': 'context_theorem_sdk',
            },
        )
        response.raise_for_status()
        return response.json()

    async def _search_postmortems(self, query: str) -> dict:
        response = await self._http.get(
            f'{self.base_url}/',
            params={'q': query, 'postmortem': 1},
            headers=self._headers(),
        )
        if response.status_code != 200:
            return {'results': []}
        return response.json()

    async def _harness_begin(self, request: HarnessBeginRequest) -> HarnessRun:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_get(self, run_id: str) -> HarnessRun:
        response = await self._http.get(
            f'{self.base_url}/harness/runs/{run_id}/',
            headers=self._headers(),
        )
        response.raise_for_status()
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_step(
        self,
        run_id: str,
        *,
        kind: str,
        payload: dict[str, Any],
    ) -> HarnessStep:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/{run_id}/step/',
            headers=self._headers(),
            json={'kind': kind, 'payload': payload},
        )
        response.raise_for_status()
        return HarnessStep.model_validate(response.json()['step'])

    async def _harness_search(
        self,
        run_id: str,
        request: HarnessSearchRequest,
    ) -> HarnessSearchRun:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/{run_id}/search/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return HarnessSearchRun.model_validate(response.json()['search'])

    async def _harness_context(
        self,
        run_id: str,
        request: HarnessContextRequest,
    ) -> dict:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/{run_id}/context/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return response.json()['artifact']

    async def _harness_patch(
        self,
        run_id: str,
        request: HarnessPatchRequest,
    ) -> dict:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/{run_id}/patch/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True, by_alias=True),
        )
        response.raise_for_status()
        return response.json()

    async def _harness_replay(self, run_id: str) -> list[HarnessStep]:
        response = await self._http.get(
            f'{self.base_url}/harness/runs/{run_id}/replay/',
            headers=self._headers(),
        )
        response.raise_for_status()
        return [
            HarnessStep.model_validate(item)
            for item in response.json()['steps']
        ]

    async def _harness_fork(
        self,
        run_id: str,
        request: HarnessForkRequest,
    ) -> HarnessRun:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/{run_id}/fork/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_compare(self, request: HarnessCompareRequest) -> dict:
        response = await self._http.post(
            f'{self.base_url}/harness/runs/compare/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return response.json()['comparison']

    async def _thg_command(self, request: THGCommandRequest) -> THGResult:
        response = await self._http.post(
            f'{self.base_url}/harness/thg/command/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return THGResult.model_validate(response.json()['result'])

    async def _thg_cypher(self, request: THGCypherRequest) -> THGResult:
        response = await self._http.post(
            f'{self.base_url}/harness/thg/cypher/',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        response.raise_for_status()
        return THGResult.model_validate(response.json()['result'])


def _parse_sse_chunk(chunk: str) -> dict | None:
    event_name = ''
    data = ''
    for line in chunk.split('\n'):
        if line.startswith('event:'):
            event_name = line[6:].strip()
        elif line.startswith('data:'):
            data += line[5:].strip()
    if not event_name:
        return None
    try:
        parsed = json.loads(data) if data else {}
    except json.JSONDecodeError:
        parsed = {'raw': data}
    return {'event': event_name, 'data': parsed}
