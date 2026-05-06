"""TheoremContextClient: async client for the Context Compiler API."""

from __future__ import annotations

import json
import os
from typing import Any, AsyncIterator

import httpx

from .errors import (
    AuthError,
    CompileError,
    HarnessError,
    RequestTimeoutError,
    ServerUnavailableError,
    UnsupportedSurfaceError,
)
from .types import (
    ActionRailGenerateRequest,
    ActionRailPreviewRequest,
    ActionSelectedRequest,
    ArtifactExport,
    ArtifactMarkdownExport,
    ArtifactPdfExport,
    ArtifactSignedExport,
    CompileRequest,
    ContextCommandRequest,
    ContextArtifact,
    HarnessBeginRequest,
    HarnessCompareRequest,
    HarnessContextRequest,
    HarnessEvent,
    HarnessForkRequest,
    HarnessPatchRequest,
    HarnessRun,
    HarnessSearchRequest,
    HarnessSearchRun,
    HarnessStateHashResponse,
    HarnessStep,
    HarnessTransitionRequest,
    HarnessTransitionResult,
    LearningContextSpendPlanRequest,
    LearningProfileInstallRequest,
    LearningProfileToolkitRequest,
    LearningStructuralSignalRequest,
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

    async def export(
        self,
        artifact_id: str,
        format: str = 'signed',
    ) -> ArtifactExport:
        return await self._client._export_artifact(artifact_id, format=format)

    async def fork(self, artifact_id: str) -> None:
        raise UnsupportedSurfaceError(
            'context.artifacts.fork',
            'Artifact fork is not implemented by the backend yet.',
        )

    async def attach(self, artifact_id: str, target: str) -> None:
        raise UnsupportedSurfaceError(
            'context.artifacts.attach',
            'Artifact attach is not implemented by the backend yet.',
        )


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


class _ContextCommandNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.latest_folio = _LatestFolioContextCommandNamespace(client)

    async def resolve(self, **kwargs: Any) -> dict:
        request = ContextCommandRequest(**kwargs)
        return await self._client._context_command_resolve(request)

    async def get(self, command_id: str) -> dict:
        return await self._client._context_command_get(command_id)

    async def preview(self, command_id: str) -> dict:
        return await self._client._context_command_preview(command_id)


class _LatestFolioContextCommandNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def resolve(self, folio_id: str, **kwargs: Any) -> dict:
        request = ContextCommandRequest(**kwargs)
        return await self._client._context_command_latest_folio_resolve(
            folio_id,
            request,
        )

    async def get(self, folio_id: str) -> dict:
        return await self._client._context_command_latest_folio_get(folio_id)


class _ActionRailNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def generate(self, **kwargs: Any) -> dict:
        request = ActionRailGenerateRequest(**kwargs)
        return await self._client._action_rail_generate(request)

    async def preview(self, **kwargs: Any) -> dict:
        request = ActionRailPreviewRequest(**kwargs)
        return await self._client._action_rail_preview(request)

    async def record_selected(self, rail_id: str, **kwargs: Any) -> dict:
        request = ActionSelectedRequest(**kwargs)
        return await self._client._action_rail_record_selected(rail_id, request)


class _LearningProfilesNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def install(self, profile_id: str, **kwargs: Any) -> dict:
        request = LearningProfileInstallRequest(**kwargs)
        return await self._client._learning_profile_install(profile_id, request)

    async def toolkit(self, profile_id: str, **kwargs: Any) -> dict:
        request = LearningProfileToolkitRequest(**kwargs)
        return await self._client._learning_profile_toolkit(profile_id, request)


class _LearningContextNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def spend_plan(self, **kwargs: Any) -> dict:
        request = LearningContextSpendPlanRequest(**kwargs)
        return await self._client._learning_context_spend_plan(request)


class _LearningStructuralSignalsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def record(self, **kwargs: Any) -> dict:
        request = LearningStructuralSignalRequest(**kwargs)
        return await self._client._learning_structural_signal(request)


class _LearningNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.profiles = _LearningProfilesNamespace(client)
        self.context = _LearningContextNamespace(client)
        self.structural_signals = _LearningStructuralSignalsNamespace(client)


class _THGProfilesNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def install(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PROFILE.INSTALL', payload=payload),
        )

    async def resolve(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PROFILE.RESOLVE', payload=payload),
        )

    async def toolkit(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PROFILE.TOOLKIT', payload=payload),
        )

    async def budget(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PROFILE.BUDGET', payload=payload),
        )


class _THGPluginsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def run_begin(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PLUGIN.RUN.BEGIN', payload=payload),
        )

    async def run_step(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PLUGIN.RUN.STEP', payload=payload),
        )

    async def claim_consult(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PLUGIN.CLAIM.CONSULT', payload=payload),
        )

    async def outcome_record(self, **payload: Any) -> THGResult:
        return await self._client._thg_command(
            THGCommandRequest(command='THG.PLUGIN.OUTCOME.RECORD', payload=payload),
        )


class _THGNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.profiles = _THGProfilesNamespace(client)
        self.plugins = _THGPluginsNamespace(client)

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

    async def transition(self, run_id: str, **kwargs: Any) -> HarnessTransitionResult:
        request = HarnessTransitionRequest(**kwargs)
        return await self._client._harness_transition(run_id, request)

    async def events(self, run_id: str) -> list[HarnessEvent]:
        return await self._client._harness_events(run_id)

    async def state_hash(self, run_id: str) -> HarnessStateHashResponse:
        return await self._client._harness_state_hash(run_id)

    async def context_injected(
        self,
        run_id: str,
        *,
        artifact_id: str,
        adapter: str = 'codex',
        target: str = 'cli',
    ) -> HarnessTransitionResult:
        return await self._client._harness_context_injected(
            run_id,
            artifact_id=artifact_id,
            adapter=adapter,
            target=target,
        )

    async def outcome(
        self,
        run_id: str,
        **kwargs: Any,
    ) -> HarnessTransitionResult:
        return await self._client._harness_outcome(run_id, kwargs)

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
        base_url: str | None = None,
        plugins_base_url: str | None = None,
        api_key: str | None = None,
        timeout: float = 60.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        resolved_base_url = (
            base_url
            or os.getenv('THEOREM_CONTEXT_BASE_URL')
            or DEFAULT_BASE_URL
        )
        resolved_plugins_base_url = (
            plugins_base_url
            or os.getenv('THEOREM_CONTEXT_PLUGINS_BASE_URL')
            or _derive_plugins_base_url(resolved_base_url)
        )
        self.base_url = resolved_base_url.rstrip('/')
        self.plugins_base_url = (
            resolved_plugins_base_url
        ).rstrip('/')
        self.api_key = api_key or os.getenv('THEOREM_CONTEXT_API_KEY')
        self._http = httpx.AsyncClient(timeout=timeout, transport=transport)
        self.context = _ContextNamespace(self)
        self.context_command = _ContextCommandNamespace(self)
        self.actions = _ActionRailNamespace(self)
        self.learning = _LearningNamespace(self)
        self.harness = _HarnessNamespace(self)
        self.runs = self.harness
        self.thg = _THGNamespace(self)
        self.surface_status = {
            'artifacts': {
                'export': {
                    'signed': 'live',
                    'markdown': 'live',
                    'pdf': 'stub',
                },
                'fork': 'unsupported',
                'attach': 'unsupported',
            },
            'graph': {
                'focus': 'stub',
                'patches': 'stub',
            },
            'harness': {
                'public_run_model': 'AgentRunState',
                'compatibility_layer': True,
                'state_machine_public': False,
                'state_machine_surface': 'thg',
                'state_machine_run_model': 'HarnessRunState',
            },
            'learning': {
                'profiles': 'live',
                'context_spend_plan': 'live',
                'structural_signals': 'live',
            },
            'thg': {
                'profiles': 'live',
                'plugins': 'live',
            },
        }

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

    async def _request(
        self,
        method: str,
        url: str,
        *,
        surface: str,
        kind: str = 'compile',
        **kwargs: Any,
    ) -> httpx.Response:
        try:
            response = await self._http.request(method, url, **kwargs)
        except httpx.TimeoutException as exc:
            raise RequestTimeoutError(f'{surface} failed: {exc}') from exc
        except httpx.RequestError as exc:
            raise ServerUnavailableError(f'{surface} failed: {exc}') from exc
        self._raise_for_status(response, surface=surface, kind=kind)
        return response

    def _raise_for_status(
        self,
        response: httpx.Response,
        *,
        surface: str,
        kind: str,
    ) -> None:
        if response.is_success:
            return
        detail = response.text.strip()
        suffix = f' {detail}' if detail else ''
        message = f'{surface} failed: {response.status_code}{suffix}'
        if response.status_code in {401, 403}:
            raise AuthError(message)
        if response.status_code in {408, 504}:
            raise RequestTimeoutError(message)
        if response.status_code in {502, 503}:
            raise ServerUnavailableError(message)
        if kind == 'harness':
            raise HarnessError(message)
        raise CompileError(message)

    async def _compile(self, request: CompileRequest) -> ContextArtifact:
        response = await self._request(
            'POST',
            f'{self.base_url}/context/compile/',
            surface='compile',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ContextArtifact.model_validate(response.json())

    async def _compile_stream(
        self,
        request: CompileRequest,
    ) -> AsyncIterator[dict]:
        try:
            async with self._http.stream(
                'POST',
                f'{self.base_url}/context/compile/stream/',
                headers={**self._headers(), 'Accept': 'text/event-stream'},
                content=request.model_dump_json(exclude_none=True),
            ) as response:
                self._raise_for_status(
                    response,
                    surface='compile stream',
                    kind='compile',
                )
                buffer = ''
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while '\n\n' in buffer:
                        raw, buffer = buffer.split('\n\n', 1)
                        event = _parse_sse_chunk(raw)
                        if event is not None:
                            yield event
        except httpx.TimeoutException as exc:
            raise RequestTimeoutError(f'compile stream failed: {exc}') from exc
        except httpx.RequestError as exc:
            raise ServerUnavailableError(f'compile stream failed: {exc}') from exc

    async def _audit(self, artifact_id: str) -> ContextArtifact:
        response = await self._request(
            'GET',
            f'{self.base_url}/context/artifacts/{artifact_id}/',
            surface='audit',
            headers=self._headers(),
        )
        return ContextArtifact.model_validate(response.json())

    async def _list(self, filters: dict[str, Any]) -> dict:
        params = {k: v for k, v in filters.items() if v is not None}
        response = await self._request(
            'GET',
            f'{self.base_url}/context/artifacts/',
            surface='artifact list',
            params=params,
            headers=self._headers(),
        )
        return response.json()

    async def _outcome(
        self,
        artifact_id: str,
        request: OutcomeRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/context/artifacts/{artifact_id}/outcome/',
            surface='outcome',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _export_artifact(
        self,
        artifact_id: str,
        *,
        format: str = 'signed',
    ) -> ArtifactExport:
        resolved_format = 'signed' if format == 'json' else format
        response = await self._request(
            'GET',
            f'{self.base_url}/context/artifacts/{artifact_id}/export/{resolved_format}/',
            surface='artifact export',
            headers=self._headers(),
        )

        if resolved_format == 'markdown':
            return ArtifactMarkdownExport(
                artifact_id=artifact_id,
                content=response.text,
                content_type=response.headers.get(
                    'content-type',
                    'text/markdown; charset=utf-8',
                ),
            )

        body = response.json()
        if resolved_format == 'signed':
            payload = body.get('payload')
            return ArtifactSignedExport(
                artifact_id=artifact_id,
                node_id=str(body.get('node_id') or ''),
                signature=str(body.get('signature') or ''),
                payload_hash=str(body.get('payload_hash') or ''),
                payload=payload if isinstance(payload, dict) else {},
                signed=bool(body.get('signed')),
            )

        return ArtifactPdfExport(
            artifact_id=str(body.get('artifact_id') or artifact_id),
            stub=bool(body.get('stub', True)),
            reason=str(body.get('reason') or ''),
            url=body.get('url') if isinstance(body.get('url'), str) else None,
        )

    async def _context_command_resolve(
        self,
        request: ContextCommandRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/context-command/resolve/',
            surface='context command resolve',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _context_command_get(self, command_id: str) -> dict:
        response = await self._request(
            'GET',
            f'{self.base_url}/context-command/{command_id}/',
            surface='context command get',
            headers=self._headers(),
        )
        return response.json()

    async def _context_command_preview(self, command_id: str) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/context-command/{command_id}/preview/',
            surface='context command preview',
            headers=self._headers(),
            json={},
        )
        return response.json()

    async def _context_command_latest_folio_resolve(
        self,
        folio_id: str,
        request: ContextCommandRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/context-command/folio/{folio_id}/latest/',
            surface='latest folio command resolve',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _context_command_latest_folio_get(self, folio_id: str) -> dict:
        response = await self._request(
            'GET',
            f'{self.base_url}/context-command/folio/{folio_id}/latest/',
            surface='latest folio command get',
            headers=self._headers(),
        )
        return response.json()

    async def _action_rail_generate(
        self,
        request: ActionRailGenerateRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/action-rail/generate/',
            surface='action rail generate',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _action_rail_preview(
        self,
        request: ActionRailPreviewRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/action-rail/preview-action/',
            surface='action rail preview',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _action_rail_record_selected(
        self,
        rail_id: str,
        request: ActionSelectedRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/action-rail/{rail_id}/selected/',
            surface='action rail selected',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _learning_profile_install(
        self,
        profile_id: str,
        request: LearningProfileInstallRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.plugins_base_url}/learning/profiles/{profile_id}/install/',
            surface='learning profile install',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _learning_profile_toolkit(
        self,
        profile_id: str,
        request: LearningProfileToolkitRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.plugins_base_url}/learning/profiles/{profile_id}/toolkit/',
            surface='learning profile toolkit',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _learning_context_spend_plan(
        self,
        request: LearningContextSpendPlanRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.plugins_base_url}/learning/context/spend-plan/',
            surface='learning context spend-plan',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _learning_structural_signal(
        self,
        request: LearningStructuralSignalRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.plugins_base_url}/learning/structural-signals/',
            surface='learning structural signal',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _remember(self, observation: str, evidence: list[str]) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/writeback/object/',
            surface='remember',
            headers=self._headers(),
            json={
                'title': observation[:200],
                'knowledge_content': observation,
                'properties': {'evidence': evidence},
                'source_system': 'context_theorem_sdk',
            },
        )
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
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/',
            surface='harness begin',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_get(self, run_id: str) -> HarnessRun:
        response = await self._request(
            'GET',
            f'{self.base_url}/harness/runs/{run_id}/',
            surface='harness get',
            kind='harness',
            headers=self._headers(),
        )
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_step(
        self,
        run_id: str,
        *,
        kind: str,
        payload: dict[str, Any],
    ) -> HarnessStep:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/step/',
            surface='harness step',
            kind='harness',
            headers=self._headers(),
            json={'kind': kind, 'payload': payload},
        )
        return HarnessStep.model_validate(response.json()['step'])

    async def _harness_search(
        self,
        run_id: str,
        request: HarnessSearchRequest,
    ) -> HarnessSearchRun:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/search/',
            surface='harness search',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return HarnessSearchRun.model_validate(response.json()['search'])

    async def _harness_context(
        self,
        run_id: str,
        request: HarnessContextRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/context/',
            surface='harness context',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()['artifact']

    async def _harness_transition(
        self,
        run_id: str,
        request: HarnessTransitionRequest,
    ) -> HarnessTransitionResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/transition/',
            surface='harness transition',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return HarnessTransitionResult.model_validate(response.json())

    async def _harness_events(self, run_id: str) -> list[HarnessEvent]:
        response = await self._request(
            'GET',
            f'{self.base_url}/harness/runs/{run_id}/events/',
            surface='harness events',
            kind='harness',
            headers=self._headers(),
        )
        return [
            HarnessEvent.model_validate(item)
            for item in response.json()['events']
        ]

    async def _harness_state_hash(self, run_id: str) -> HarnessStateHashResponse:
        response = await self._request(
            'GET',
            f'{self.base_url}/harness/runs/{run_id}/state-hash/',
            surface='harness state hash',
            kind='harness',
            headers=self._headers(),
        )
        return HarnessStateHashResponse.model_validate(response.json())

    async def _harness_context_injected(
        self,
        run_id: str,
        *,
        artifact_id: str,
        adapter: str,
        target: str,
    ) -> HarnessTransitionResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/context-injected/',
            surface='harness context injection',
            kind='harness',
            headers=self._headers(),
            json={
                'artifact_id': artifact_id,
                'adapter': adapter,
                'target': target,
            },
        )
        return HarnessTransitionResult.model_validate(response.json())

    async def _harness_outcome(
        self,
        run_id: str,
        payload: dict[str, Any],
    ) -> HarnessTransitionResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/outcome/',
            surface='harness outcome',
            kind='harness',
            headers=self._headers(),
            json=payload,
        )
        return HarnessTransitionResult.model_validate(response.json())

    async def _harness_patch(
        self,
        run_id: str,
        request: HarnessPatchRequest,
    ) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/patch/',
            surface='harness patch',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True, by_alias=True),
        )
        return response.json()

    async def _harness_replay(self, run_id: str) -> list[HarnessStep]:
        response = await self._request(
            'GET',
            f'{self.base_url}/harness/runs/{run_id}/replay/',
            surface='harness replay',
            kind='harness',
            headers=self._headers(),
        )
        return [
            HarnessStep.model_validate(item)
            for item in response.json()['steps']
        ]

    async def _harness_fork(
        self,
        run_id: str,
        request: HarnessForkRequest,
    ) -> HarnessRun:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/fork/',
            surface='harness fork',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return HarnessRun.model_validate(response.json()['run'])

    async def _harness_compare(self, request: HarnessCompareRequest) -> dict:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/compare/',
            surface='harness compare',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()['comparison']

    async def _thg_command(self, request: THGCommandRequest) -> THGResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/thg/command/',
            surface='thg command',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return THGResult.model_validate(response.json()['result'])

    async def _thg_cypher(self, request: THGCypherRequest) -> THGResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/thg/cypher/',
            surface='thg cypher',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
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


def _derive_plugins_base_url(base_url: str) -> str:
    if base_url.endswith('/theseus'):
        return f'{base_url[:-len("/theseus")]}/plugins'
    return f'{base_url}/plugins'
