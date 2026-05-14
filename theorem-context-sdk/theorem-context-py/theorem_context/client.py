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
)
from .types import (
    ActionRailGenerateRequest,
    ActionRailPreviewRequest,
    ActionSelectedRequest,
    AgentCatalogRequest,
    AgentGraphQLRequest,
    AgentSessionResponse,
    ArtifactExport,
    ArtifactAttachResponse,
    ArtifactForkResponse,
    ArtifactMarkdownExport,
    ArtifactPdfExport,
    ArtifactSignedExport,
    CompileHandoffRequest,
    CompileRequest,
    ContextCommandRequest,
    ContextArtifact,
    DiscoveryFinishRequest,
    DiscoveryPreviewRequest,
    DiscoveryRunCreateRequest,
    DiscoveryRunPreview,
    DiscoveryValidatorReceiptRequest,
    DiscoveryWritebackReviewRequest,
    ExpressionRenderRequest,
    ExpressionRenderResult,
    GraphFocusResponse,
    GraphPatchesListResponse,
    HandoffListResponse,
    HandoffResponse,
    HarnessBeginRequest,
    HarnessCompareRequest,
    HarnessContextRequest,
    HarnessContextWebRequest,
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
    InferenceRegistryReport,
    KernelReceiptRequest,
    KernelRun,
    KernelRunRequest,
    ContextWebIndex,
    ContextWebIndexUpdateRequest,
    ContextWebExplainResponse,
    ContextWebPack,
    ContextWebSpendPlanResponse,
    LearningContextSpendPlanRequest,
    LearningProfileInstallRequest,
    LearningProfileToolkitRequest,
    LearningStructuralSignalRequest,
    OutcomeRequest,
    OrchestrateRequest,
    OrchestratePreviewResult,
    OrchestratePrepareResult,
    OrchestrateResult,
    OrchestrateReport,
    ProductAPIKeyCreateRequest,
    ProductAPIKeySummary,
    ProductBootstrapResponse,
    ProductProjectCreateRequest,
    ProductProjectSummary,
    ProductTenantMemberCreateRequest,
    ProductTenantMemberSummary,
    ProductTenantMemberUpdateRequest,
    ProductTenantCreateRequest,
    ProductTenantSummary,
    ProductTenantUpdateRequest,
    ProductUsageSummary,
    MemoryPatchReviewQueueResponse,
    MemoryPatchReviewUpdateRequest,
    MemoryPatchReviewUpdateResponse,
    SavedContextCreateRequest,
    SavedContextRecallPreviewRequest,
    SavedContextRecallPreviewResponse,
    SavedContextPromoteMemoryPatchRequest,
    SavedContextSummary,
    SavedContextUpdateRequest,
    SolverContextCapsuleRequest,
    SolverResult,
    StartAgentSessionRequest,
    EndAgentSessionRequest,
    THGCommandRequest,
    THGCypherRequest,
    THGResult,
    WorkstreamResolveRequest,
    WorkstreamResolveResponse,
    WorkstreamResponse,
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

    async def fork(
        self,
        artifact_id: str,
        **options: Any,
    ) -> ArtifactForkResponse:
        return await self._client._fork_artifact(artifact_id, options)

    async def attach(
        self,
        artifact_id: str,
        target: str,
        **options: Any,
    ) -> ArtifactAttachResponse:
        return await self._client._attach_artifact(
            artifact_id,
            target,
            options,
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

    async def focus(self, seed_ids: list[int]) -> GraphFocusResponse:
        return await self._client._graph_focus(seed_ids)


class _PatchesNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self) -> GraphPatchesListResponse:
        return await self._client._graph_patches_list()


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


class _ProductTenantsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self) -> list[ProductTenantSummary]:
        return await self._client._product_tenants_list()

    async def create(self, **kwargs: Any) -> ProductTenantSummary:
        request = ProductTenantCreateRequest(**kwargs)
        return await self._client._product_tenant_create(request)

    async def get(self, tenant_slug: str) -> ProductTenantSummary:
        return await self._client._product_tenant_get(tenant_slug)

    async def update(self, tenant_slug: str, **kwargs: Any) -> ProductTenantSummary:
        request = ProductTenantUpdateRequest(**kwargs)
        return await self._client._product_tenant_update(tenant_slug, request)


class _ProductProjectsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self, tenant_slug: str) -> list[ProductProjectSummary]:
        return await self._client._product_projects_list(tenant_slug)

    async def create(self, tenant_slug: str, **kwargs: Any) -> ProductProjectSummary:
        request = ProductProjectCreateRequest(**kwargs)
        return await self._client._product_project_create(tenant_slug, request)


class _ProductKeysNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self, tenant_slug: str) -> list[ProductAPIKeySummary]:
        return await self._client._product_keys_list(tenant_slug)

    async def create(self, tenant_slug: str, **kwargs: Any) -> ProductAPIKeySummary:
        request = ProductAPIKeyCreateRequest(**kwargs)
        return await self._client._product_key_create(tenant_slug, request)


class _ProductUsageNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def get(self, tenant_slug: str, *, days: int | None = None) -> ProductUsageSummary:
        return await self._client._product_usage_get(tenant_slug, days=days)


class _ProductMembersNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self, tenant_slug: str) -> list[ProductTenantMemberSummary]:
        return await self._client._product_tenant_members_list(tenant_slug)

    async def create(
        self,
        tenant_slug: str,
        **kwargs: Any,
    ) -> ProductTenantMemberSummary:
        request = ProductTenantMemberCreateRequest(**kwargs)
        return await self._client._product_tenant_member_create(tenant_slug, request)

    async def update(
        self,
        tenant_slug: str,
        membership_id: int,
        **kwargs: Any,
    ) -> ProductTenantMemberSummary:
        request = ProductTenantMemberUpdateRequest(**kwargs)
        return await self._client._product_tenant_member_update(
            tenant_slug,
            membership_id,
            request,
        )


class _ProductSavedContextsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(
        self,
        tenant_slug: str,
        *,
        project_slug: str | None = None,
        include_muted: bool = False,
    ) -> list[SavedContextSummary]:
        return await self._client._product_saved_contexts_list(
            tenant_slug,
            project_slug=project_slug,
            include_muted=include_muted,
        )

    async def create(self, tenant_slug: str, **kwargs: Any) -> SavedContextSummary:
        request = SavedContextCreateRequest(**kwargs)
        return await self._client._product_saved_context_create(tenant_slug, request)

    async def update(
        self,
        tenant_slug: str,
        entry_slug: str,
        **kwargs: Any,
    ) -> SavedContextSummary:
        request = SavedContextUpdateRequest(**kwargs)
        return await self._client._product_saved_context_update(
            tenant_slug,
            entry_slug,
            request,
        )

    async def promote_memory_patch(
        self,
        tenant_slug: str,
        **kwargs: Any,
    ) -> SavedContextSummary:
        request = SavedContextPromoteMemoryPatchRequest(**kwargs)
        return await self._client._product_saved_context_promote_memory_patch(
            tenant_slug,
            request,
        )

    async def preview_recall(
        self,
        tenant_slug: str,
        **kwargs: Any,
    ) -> SavedContextRecallPreviewResponse:
        request = SavedContextRecallPreviewRequest(**kwargs)
        return await self._client._product_saved_context_preview_recall(
            tenant_slug,
            request,
        )

    async def mute(self, tenant_slug: str, entry_slug: str) -> SavedContextSummary:
        return await self._client._product_saved_context_mute(tenant_slug, entry_slug)

    async def activate(self, tenant_slug: str, entry_slug: str) -> SavedContextSummary:
        return await self._client._product_saved_context_activate(tenant_slug, entry_slug)

    async def delete(self, tenant_slug: str, entry_slug: str) -> SavedContextSummary:
        return await self._client._product_saved_context_delete(tenant_slug, entry_slug)


class _ProductMemoryPatchReviewNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(
        self,
        tenant_slug: str,
        *,
        project_slug: str | None = None,
        review_status: str | None = None,
        limit: int | None = None,
    ) -> MemoryPatchReviewQueueResponse:
        return await self._client._product_memory_patch_review_list(
            tenant_slug,
            project_slug=project_slug,
            review_status=review_status,
            limit=limit,
        )

    async def update(
        self,
        tenant_slug: str,
        run_id: str,
        patch_id: str,
        **kwargs: Any,
    ) -> MemoryPatchReviewUpdateResponse:
        request = MemoryPatchReviewUpdateRequest(**kwargs)
        return await self._client._product_memory_patch_review_update(
            tenant_slug,
            run_id,
            patch_id,
            request,
        )


class _ProductMemoryPatchesNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.review = _ProductMemoryPatchReviewNamespace(client)


class _ProductNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.tenants = _ProductTenantsNamespace(client)
        self.projects = _ProductProjectsNamespace(client)
        self.keys = _ProductKeysNamespace(client)
        self.usage = _ProductUsageNamespace(client)
        self.members = _ProductMembersNamespace(client)
        self.saved_contexts = _ProductSavedContextsNamespace(client)
        self.memory_patches = _ProductMemoryPatchesNamespace(client)

    async def bootstrap(self) -> ProductBootstrapResponse:
        return await self._client._product_bootstrap()


class _InferenceExpressionNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def render(
        self,
        engine_id: str,
        *,
        result: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> ExpressionRenderResult:
        request = ExpressionRenderRequest(
            result=result,
            metadata=metadata or {},
        )
        return await self._client._inference_expression_render(engine_id, request)


class _InferenceSolverNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def context_capsule(self, **kwargs: Any) -> SolverResult:
        request = SolverContextCapsuleRequest(**kwargs)
        return await self._client._inference_solver_context_capsule(request)


class _InferenceDiscoveryRunsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def preview(self, **kwargs: Any) -> DiscoveryRunPreview:
        request = DiscoveryPreviewRequest(**kwargs)
        return await self._client._inference_discovery_preview(request)

    async def list(self, **filters: Any) -> list[DiscoveryRunPreview]:
        return await self._client._inference_discovery_list(filters)

    async def create(self, **kwargs: Any) -> DiscoveryRunPreview:
        request = DiscoveryRunCreateRequest(**kwargs)
        return await self._client._inference_discovery_create(request)

    async def get(self, run_id: str) -> DiscoveryRunPreview:
        return await self._client._inference_discovery_get(run_id)

    async def append_validator_receipt(self, run_id: str, **kwargs: Any) -> DiscoveryRunPreview:
        request = DiscoveryValidatorReceiptRequest(**kwargs)
        return await self._client._inference_discovery_append_validator_receipt(run_id, request)

    async def finish(self, run_id: str, **kwargs: Any) -> DiscoveryRunPreview:
        request = DiscoveryFinishRequest(**kwargs)
        return await self._client._inference_discovery_finish(run_id, request)

    async def cancel(self, run_id: str) -> DiscoveryRunPreview:
        return await self._client._inference_discovery_cancel(run_id)

    async def review_writeback(self, run_id: str, proposal_id: str, **kwargs: Any) -> DiscoveryRunPreview:
        request = DiscoveryWritebackReviewRequest(**kwargs)
        return await self._client._inference_discovery_review_writeback(run_id, proposal_id, request)


class _InferenceKernelRunsNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def list(self, **filters: Any) -> list[KernelRun]:
        return await self._client._inference_kernel_list(filters)

    async def create(self, **kwargs: Any) -> KernelRun:
        request = KernelRunRequest(**kwargs)
        return await self._client._inference_kernel_create(request)

    async def get(self, run_id: str) -> KernelRun:
        return await self._client._inference_kernel_get(run_id)

    async def append_receipt(self, run_id: str, **kwargs: Any) -> KernelRun:
        request = KernelReceiptRequest(**kwargs)
        return await self._client._inference_kernel_append_receipt(run_id, request)


class _InferenceNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.expression = _InferenceExpressionNamespace(client)
        self.solver = _InferenceSolverNamespace(client)
        self.discovery_runs = _InferenceDiscoveryRunsNamespace(client)
        self.kernel_runs = _InferenceKernelRunsNamespace(client)

    async def registry(self) -> InferenceRegistryReport:
        return await self._client._inference_registry()


class _AgentNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def tool_manifest(self) -> dict[str, Any]:
        return await self._client._agent_tool_manifest()

    async def domain_catalog(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_domain_catalog(request)

    async def recommended_toolpack(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_recommended_toolpack(request)

    async def prepare(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_prepare(request)

    async def prepare_agent(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        return await self.prepare(actor=actor, adapter=adapter, **payload)

    async def explain_context(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_explain_context(request)

    async def search_context(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_search_context(request)

    async def hydrate_context(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_hydrate_context(request)

    async def record_step(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_record_step(request)

    async def record_outcome(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_record_outcome(request)

    async def export_artifact(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_export_artifact(request)

    async def review_memory(
        self,
        *,
        actor: str = 'agent',
        adapter: str = 'custom',
        **payload: Any,
    ) -> dict[str, Any]:
        request = AgentCatalogRequest(
            actor=actor,
            adapter=adapter,
            **payload,
        )
        return await self._client._agent_review_memory(request)

    async def harness_run_console(
        self,
        run_id: str,
        actor: str = 'agent',
        adapter: str = 'custom',
    ) -> dict[str, Any]:
        return await self._client._agent_graphql_run(
            operation_name='harnessRunConsole',
            run_id=run_id,
            actor=actor,
            adapter=adapter,
        )

    async def memory_recall_preview(
        self,
        run_id: str,
        actor: str = 'agent',
        adapter: str = 'custom',
    ) -> dict[str, Any]:
        return await self._client._agent_graphql_run(
            operation_name='memoryRecallPreview',
            run_id=run_id,
            actor=actor,
            adapter=adapter,
        )

    async def action_rail(
        self,
        run_id: str,
        actor: str = 'agent',
        adapter: str = 'custom',
    ) -> dict[str, Any]:
        return await self._client._agent_graphql_run(
            operation_name='actionRail',
            run_id=run_id,
            actor=actor,
            adapter=adapter,
        )


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
    class _ContextWebNamespace:
        def __init__(self, client: 'TheoremContextClient') -> None:
            self._client = client

        async def update_index(self, **payload: Any) -> ContextWebIndex:
            request = ContextWebIndexUpdateRequest(**payload)
            result = await self._client._thg_command(
                THGCommandRequest(
                    command='THG.CONTEXT_WEB.INDEX.UPDATE',
                    payload=request.model_dump(exclude_none=True),
                )
            )
            return ContextWebIndex.model_validate(result.payload)

    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.profiles = _THGProfilesNamespace(client)
        self.plugins = _THGPluginsNamespace(client)
        self.context_web = self._ContextWebNamespace(client)

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


class _WorkstreamHandoffNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def current(
        self,
        workstream_id: str,
        **kwargs: Any,
    ) -> HandoffResponse:
        request = CompileHandoffRequest(**kwargs)
        return await self._client._workstream_handoff_current(
            workstream_id,
            request,
        )

    async def list(
        self,
        workstream_id: str,
        *,
        limit: int | None = None,
    ) -> HandoffListResponse:
        return await self._client._workstream_handoffs_list(
            workstream_id,
            limit=limit,
        )


class _WorkstreamNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client
        self.handoff = _WorkstreamHandoffNamespace(client)

    async def resolve(self, **kwargs: Any) -> WorkstreamResolveResponse:
        request = WorkstreamResolveRequest(**kwargs)
        return await self._client._workstream_resolve(request)

    async def get(self, workstream_id: str) -> WorkstreamResponse:
        return await self._client._workstream_get(workstream_id)

    async def start_session(
        self,
        workstream_id: str,
        **kwargs: Any,
    ) -> AgentSessionResponse:
        request = StartAgentSessionRequest(**kwargs)
        return await self._client._workstream_session_start(
            workstream_id,
            request,
        )

    async def end_session(
        self,
        workstream_id: str,
        **kwargs: Any,
    ) -> AgentSessionResponse:
        request = EndAgentSessionRequest(**kwargs)
        return await self._client._workstream_session_end(
            workstream_id,
            request,
        )

    async def handoffs(
        self,
        workstream_id: str,
        *,
        limit: int | None = None,
    ) -> HandoffListResponse:
        return await self.handoff.list(workstream_id, limit=limit)


class _HandoffNamespace:
    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def get(self, handoff_id: str) -> HandoffResponse:
        return await self._client._handoff_get(handoff_id)


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

    async def context_web(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='context-web/',
            surface='harness context-web',
        )

    async def context_web_mini(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='context-web/mini/',
            surface='harness context-web mini',
        )

    async def context_web_review_delta(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='context-web/review-delta/',
            surface='harness context-web review delta',
        )

    async def context_web_research(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='context-web/research/',
            surface='harness context-web research',
        )

    async def context_web_browser_folio(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='context-web/browser-folio/',
            surface='harness context-web browser folio',
        )

    async def context_web_spend_plan(
        self,
        run_id: str,
        **kwargs: Any,
    ) -> ContextWebSpendPlanResponse:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web_spend_plan(run_id, request)

    async def graphrag_context(self, run_id: str, **kwargs: Any) -> ContextWebPack:
        request = HarnessContextWebRequest(**kwargs)
        return await self._client._harness_context_web(
            run_id,
            request,
            path='graphrag-context/',
            surface='harness graphrag context',
        )

    async def context_web_explain(
        self,
        run_id: str,
        pack_id: str,
        *,
        atom_id: str,
    ) -> ContextWebExplainResponse:
        return await self._client._harness_context_web_explain(
            run_id,
            pack_id,
            atom_id=atom_id,
        )

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
        self.product = _ProductNamespace(self)
        self.inference = _InferenceNamespace(self)
        self.agent = _AgentNamespace(self)
        self.workstream = _WorkstreamNamespace(self)
        self.handoff = _HandoffNamespace(self)
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
                'fork': 'live',
                'attach': 'live',
            },
            'graph': {
                'focus': 'live',
                'patches': 'live',
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
            'agent': {
                'tool_manifest': 'live',
                'domain_catalog': 'live',
                'recommended_toolpack': 'live',
                'prepare': 'live',
                'search_context': 'live',
                'hydrate_context': 'live',
                'record_step': 'live',
                'record_outcome': 'live',
                'explain_context': 'live',
                'export_artifact': 'live',
                'review_memory': 'live',
                'graphql': 'live',
            },
            'orchestrate': {
                'run': 'live',
                'preview': 'live',
                'prepare': 'live',
                'authority': 'server',
                'decision_runtime': 'live',
            },
            'workstream': {
                'resolve': 'live',
                'session': 'live',
                'handoff': 'live',
            },
            'thg': {
                'profiles': 'live',
                'plugins': 'live',
            },
            'inference': {
                'registry': 'live',
                'expression': 'live',
                'solver': 'live',
                'discovery_run_preview': 'live',
            },
        }

    async def __aenter__(self) -> 'TheoremContextClient':
        return self

    async def __aexit__(self, *_args: Any) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        await self._http.aclose()

    async def orchestrate(self, **kwargs: Any) -> OrchestrateResult:
        request = OrchestrateRequest(**kwargs)
        task = request.task.strip()
        if not task:
            raise CompileError('orchestrate failed: task is required')
        response = await self._request(
            'POST',
            f'{self.base_url}/orchestrate/run/',
            surface='orchestrate',
            headers=self._headers(),
            content=OrchestrateRequest(
                **{
                    **request.model_dump(),
                    'task': task,
                }
            ).model_dump_json(exclude_none=True),
            kind='harness',
        )
        return OrchestrateResult.model_validate(response.json())

    async def orchestrate_preview(self, **kwargs: Any) -> OrchestratePreviewResult:
        request = OrchestrateRequest(**kwargs)
        task = request.task.strip()
        if not task:
            raise CompileError('orchestrate preview failed: task is required')
        response = await self._request(
            'POST',
            f'{self.base_url}/orchestrate/preview/',
            surface='orchestrate preview',
            headers=self._headers(),
            content=OrchestrateRequest(
                **{
                    **request.model_dump(),
                    'task': task,
                }
            ).model_dump_json(exclude_none=True),
            kind='harness',
        )
        return OrchestratePreviewResult.model_validate(response.json())

    async def orchestrate_prepare(self, **kwargs: Any) -> OrchestratePrepareResult:
        request = OrchestrateRequest(**kwargs)
        task = request.task.strip()
        if not task:
            raise CompileError('orchestrate prepare failed: task is required')
        response = await self._request(
            'POST',
            f'{self.base_url}/orchestrate/prepare/',
            surface='orchestrate prepare',
            headers=self._headers(),
            content=OrchestrateRequest(
                **{
                    **request.model_dump(),
                    'task': task,
                }
            ).model_dump_json(exclude_none=True),
            kind='harness',
        )
        return OrchestratePrepareResult.model_validate(response.json())

    async def _workstream_resolve(
        self,
        request: WorkstreamResolveRequest,
    ) -> WorkstreamResolveResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/workstream/resolve/',
            surface='workstream resolve',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
            kind='harness',
        )
        return WorkstreamResolveResponse.model_validate(response.json())

    async def _workstream_get(self, workstream_id: str) -> WorkstreamResponse:
        response = await self._request(
            'GET',
            f'{self.base_url}/workstream/{workstream_id}/',
            surface='workstream get',
            headers=self._headers(),
            kind='harness',
        )
        return WorkstreamResponse.model_validate(response.json())

    async def _workstream_session_start(
        self,
        workstream_id: str,
        request: StartAgentSessionRequest,
    ) -> AgentSessionResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/workstream/{workstream_id}/session/start/',
            surface='workstream session start',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
            kind='harness',
        )
        return AgentSessionResponse.model_validate(response.json())

    async def _workstream_session_end(
        self,
        workstream_id: str,
        request: EndAgentSessionRequest,
    ) -> AgentSessionResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/workstream/{workstream_id}/session/end/',
            surface='workstream session end',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
            kind='harness',
        )
        return AgentSessionResponse.model_validate(response.json())

    async def _workstream_handoff_current(
        self,
        workstream_id: str,
        request: CompileHandoffRequest,
    ) -> HandoffResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/workstream/{workstream_id}/handoff/current/',
            surface='workstream handoff current',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
            kind='harness',
        )
        return HandoffResponse.model_validate(response.json())

    async def _workstream_handoffs_list(
        self,
        workstream_id: str,
        *,
        limit: int | None = None,
    ) -> HandoffListResponse:
        params = {'limit': str(limit)} if limit is not None else None
        response = await self._request(
            'GET',
            f'{self.base_url}/workstream/{workstream_id}/handoffs/',
            surface='workstream handoffs list',
            headers=self._headers(),
            params=params,
            kind='harness',
        )
        return HandoffListResponse.model_validate(response.json())

    async def _handoff_get(self, handoff_id: str) -> HandoffResponse:
        response = await self._request(
            'GET',
            f'{self.base_url}/handoff/{handoff_id}/',
            surface='handoff get',
            headers=self._headers(),
            kind='harness',
        )
        return HandoffResponse.model_validate(response.json())

    async def _product_bootstrap(self) -> ProductBootstrapResponse:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/bootstrap/',
            surface='product bootstrap',
            headers=self._headers(),
        )
        return ProductBootstrapResponse.model_validate(response.json())

    async def _product_tenants_list(self) -> list[ProductTenantSummary]:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/',
            surface='product tenants list',
            headers=self._headers(),
        )
        return [
            ProductTenantSummary.model_validate(item)
            for item in response.json().get('tenants', [])
        ]

    async def _product_tenant_create(
        self,
        request: ProductTenantCreateRequest,
    ) -> ProductTenantSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/',
            surface='product tenant create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductTenantSummary.model_validate(response.json()['tenant'])

    async def _product_tenant_get(self, tenant_slug: str) -> ProductTenantSummary:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/',
            surface='product tenant get',
            headers=self._headers(),
        )
        return ProductTenantSummary.model_validate(response.json()['tenant'])

    async def _product_tenant_update(
        self,
        tenant_slug: str,
        request: ProductTenantUpdateRequest,
    ) -> ProductTenantSummary:
        response = await self._request(
            'PUT',
            f'{self.base_url}/product/tenants/{tenant_slug}/',
            surface='product tenant update',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductTenantSummary.model_validate(response.json()['tenant'])

    async def _product_projects_list(self, tenant_slug: str) -> list[ProductProjectSummary]:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/projects/',
            surface='product projects list',
            headers=self._headers(),
        )
        return [
            ProductProjectSummary.model_validate(item)
            for item in response.json().get('projects', [])
        ]

    async def _product_project_create(
        self,
        tenant_slug: str,
        request: ProductProjectCreateRequest,
    ) -> ProductProjectSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/projects/',
            surface='product project create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductProjectSummary.model_validate(response.json()['project'])

    async def _product_keys_list(self, tenant_slug: str) -> list[ProductAPIKeySummary]:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/keys/',
            surface='product keys list',
            headers=self._headers(),
        )
        return [
            ProductAPIKeySummary.model_validate(item)
            for item in response.json().get('keys', [])
        ]

    async def _product_key_create(
        self,
        tenant_slug: str,
        request: ProductAPIKeyCreateRequest,
    ) -> ProductAPIKeySummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/keys/',
            surface='product key create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductAPIKeySummary.model_validate(response.json()['api_key'])

    async def _product_usage_get(
        self,
        tenant_slug: str,
        *,
        days: int | None = None,
    ) -> ProductUsageSummary:
        params: dict[str, Any] = {}
        if days is not None:
            params['days'] = days
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/usage/',
            surface='product usage get',
            headers=self._headers(),
            params=params,
        )
        return ProductUsageSummary.model_validate(response.json()['usage'])

    async def _product_tenant_members_list(
        self,
        tenant_slug: str,
    ) -> list[ProductTenantMemberSummary]:
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/members/',
            surface='product tenant members list',
            headers=self._headers(),
        )
        return [
            ProductTenantMemberSummary.model_validate(item)
            for item in response.json().get('members', [])
        ]

    async def _product_tenant_member_create(
        self,
        tenant_slug: str,
        request: ProductTenantMemberCreateRequest,
    ) -> ProductTenantMemberSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/members/',
            surface='product tenant member create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductTenantMemberSummary.model_validate(response.json()['member'])

    async def _product_tenant_member_update(
        self,
        tenant_slug: str,
        membership_id: int,
        request: ProductTenantMemberUpdateRequest,
    ) -> ProductTenantMemberSummary:
        response = await self._request(
            'PUT',
            f'{self.base_url}/product/tenants/{tenant_slug}/members/{membership_id}/',
            surface='product tenant member update',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ProductTenantMemberSummary.model_validate(response.json()['member'])

    async def _product_saved_contexts_list(
        self,
        tenant_slug: str,
        *,
        project_slug: str | None = None,
        include_muted: bool = False,
    ) -> list[SavedContextSummary]:
        params: dict[str, Any] = {}
        if project_slug:
            params['project_slug'] = project_slug
        if include_muted:
            params['include_muted'] = 'true'
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/',
            surface='saved contexts list',
            headers=self._headers(),
            params=params,
        )
        return [
            SavedContextSummary.model_validate(item)
            for item in response.json().get('saved_contexts', [])
        ]

    async def _product_saved_context_create(
        self,
        tenant_slug: str,
        request: SavedContextCreateRequest,
    ) -> SavedContextSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/',
            surface='saved context create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_saved_context_update(
        self,
        tenant_slug: str,
        entry_slug: str,
        request: SavedContextUpdateRequest,
    ) -> SavedContextSummary:
        response = await self._request(
            'PUT',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/{entry_slug}/',
            surface='saved context update',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_saved_context_promote_memory_patch(
        self,
        tenant_slug: str,
        request: SavedContextPromoteMemoryPatchRequest,
    ) -> SavedContextSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/promote-memory-patch/',
            surface='saved context promote memory patch',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_saved_context_preview_recall(
        self,
        tenant_slug: str,
        request: SavedContextRecallPreviewRequest,
    ) -> SavedContextRecallPreviewResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/preview-recall/',
            surface='saved context preview recall',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return SavedContextRecallPreviewResponse.model_validate(response.json())

    async def _product_saved_context_mute(
        self,
        tenant_slug: str,
        entry_slug: str,
    ) -> SavedContextSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/{entry_slug}/mute/',
            surface='saved context mute',
            headers=self._headers(),
            json={},
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_saved_context_activate(
        self,
        tenant_slug: str,
        entry_slug: str,
    ) -> SavedContextSummary:
        response = await self._request(
            'POST',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/{entry_slug}/activate/',
            surface='saved context activate',
            headers=self._headers(),
            json={},
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_saved_context_delete(
        self,
        tenant_slug: str,
        entry_slug: str,
    ) -> SavedContextSummary:
        response = await self._request(
            'DELETE',
            f'{self.base_url}/product/tenants/{tenant_slug}/saved-contexts/{entry_slug}/',
            surface='saved context delete',
            headers=self._headers(),
        )
        return SavedContextSummary.model_validate(response.json()['saved_context'])

    async def _product_memory_patch_review_list(
        self,
        tenant_slug: str,
        *,
        project_slug: str | None = None,
        review_status: str | None = None,
        limit: int | None = None,
    ) -> MemoryPatchReviewQueueResponse:
        params: dict[str, Any] = {}
        if project_slug:
            params['project_slug'] = project_slug
        if review_status:
            params['review_status'] = review_status
        if limit is not None:
            params['limit'] = limit
        response = await self._request(
            'GET',
            f'{self.base_url}/product/tenants/{tenant_slug}/memory-patches/review/',
            surface='product memory patch review list',
            headers=self._headers(),
            params=params,
        )
        return MemoryPatchReviewQueueResponse.model_validate(response.json())

    async def _product_memory_patch_review_update(
        self,
        tenant_slug: str,
        run_id: str,
        patch_id: str,
        request: MemoryPatchReviewUpdateRequest,
    ) -> MemoryPatchReviewUpdateResponse:
        response = await self._request(
            'POST',
            (
                f'{self.base_url}/product/tenants/{tenant_slug}/'
                f'memory-patches/review/{run_id}/{patch_id}/'
            ),
            surface='product memory patch review update',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return MemoryPatchReviewUpdateResponse.model_validate(response.json())

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

    async def _fork_artifact(
        self,
        artifact_id: str,
        options: dict[str, Any] | None = None,
    ) -> ArtifactForkResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/context/artifacts/{artifact_id}/fork/',
            surface='artifact fork',
            headers=self._headers(),
            json=options or {},
        )
        return ArtifactForkResponse.model_validate(response.json())

    async def _attach_artifact(
        self,
        artifact_id: str,
        target: str,
        options: dict[str, Any] | None = None,
    ) -> ArtifactAttachResponse:
        options = options or {}
        response = await self._request(
            'POST',
            f'{self.base_url}/context/artifacts/{artifact_id}/attach/',
            surface='artifact attach',
            headers=self._headers(),
            json={
                'target': target,
                'target_type': options.get('target_type', 'harness_run'),
                'metadata': options.get('metadata', {}),
            },
        )
        return ArtifactAttachResponse.model_validate(response.json())

    async def _graph_focus(self, seed_ids: list[int]) -> GraphFocusResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/context/graph/focus/',
            surface='graph focus',
            headers=self._headers(),
            json={'seed_ids': seed_ids},
        )
        return GraphFocusResponse.model_validate(response.json())

    async def _graph_patches_list(self) -> GraphPatchesListResponse:
        response = await self._request(
            'GET',
            f'{self.base_url}/context/graph/patches/',
            surface='graph patches list',
            headers=self._headers(),
        )
        return GraphPatchesListResponse.model_validate(response.json())

    async def _inference_registry(self) -> InferenceRegistryReport:
        response = await self._request(
            'GET',
            f'{self.base_url}/inference/registry/',
            surface='inference registry',
            headers=self._headers(),
        )
        return InferenceRegistryReport.model_validate(response.json())

    async def _inference_expression_render(
        self,
        engine_id: str,
        request: ExpressionRenderRequest,
    ) -> ExpressionRenderResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/expression/{engine_id}/',
            surface='inference expression render',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ExpressionRenderResult.model_validate(response.json())

    async def _inference_solver_context_capsule(
        self,
        request: SolverContextCapsuleRequest,
    ) -> SolverResult:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/solver/context-capsule/',
            surface='inference solver context capsule',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return SolverResult.model_validate(response.json())

    async def _inference_discovery_preview(
        self,
        request: DiscoveryPreviewRequest,
    ) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/preview/',
            surface='inference discovery run preview',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_list(self, filters: dict[str, Any]) -> list[DiscoveryRunPreview]:
        response = await self._request(
            'GET',
            f'{self.base_url}/inference/discovery-runs/',
            surface='inference discovery runs list',
            headers=self._headers(),
            params=filters,
        )
        return [DiscoveryRunPreview.model_validate(item) for item in response.json()]

    async def _inference_discovery_create(
        self,
        request: DiscoveryRunCreateRequest,
    ) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/',
            surface='inference discovery run create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_get(self, run_id: str) -> DiscoveryRunPreview:
        response = await self._request(
            'GET',
            f'{self.base_url}/inference/discovery-runs/{run_id}/',
            surface='inference discovery run get',
            headers=self._headers(),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_append_validator_receipt(
        self,
        run_id: str,
        request: DiscoveryValidatorReceiptRequest,
    ) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/{run_id}/validator-receipts/',
            surface='inference discovery validator receipt',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_finish(
        self,
        run_id: str,
        request: DiscoveryFinishRequest,
    ) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/{run_id}/finish/',
            surface='inference discovery finish',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_cancel(self, run_id: str) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/{run_id}/cancel/',
            surface='inference discovery cancel',
            headers=self._headers(),
            content='{}',
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_discovery_review_writeback(
        self,
        run_id: str,
        proposal_id: str,
        request: DiscoveryWritebackReviewRequest,
    ) -> DiscoveryRunPreview:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/discovery-runs/{run_id}/writeback-proposals/{proposal_id}/review/',
            surface='inference discovery writeback review',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return DiscoveryRunPreview.model_validate(response.json())

    async def _inference_kernel_list(self, filters: dict[str, Any]) -> list[KernelRun]:
        response = await self._request(
            'GET',
            f'{self.base_url}/inference/kernel-runs/',
            surface='inference kernel runs list',
            headers=self._headers(),
            params=filters,
        )
        return [KernelRun.model_validate(item) for item in response.json()]

    async def _inference_kernel_create(self, request: KernelRunRequest) -> KernelRun:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/kernel-runs/',
            surface='inference kernel run create',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return KernelRun.model_validate(response.json())

    async def _inference_kernel_get(self, run_id: str) -> KernelRun:
        response = await self._request(
            'GET',
            f'{self.base_url}/inference/kernel-runs/{run_id}/',
            surface='inference kernel run get',
            headers=self._headers(),
        )
        return KernelRun.model_validate(response.json())

    async def _inference_kernel_append_receipt(
        self,
        run_id: str,
        request: KernelReceiptRequest,
    ) -> KernelRun:
        response = await self._request(
            'POST',
            f'{self.base_url}/inference/kernel-runs/{run_id}/receipts/',
            surface='inference kernel receipt append',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return KernelRun.model_validate(response.json())

    async def _agent_tool_manifest(self) -> dict[str, Any]:
        response = await self._request(
            'GET',
            f'{self.base_url}/agent/tool-manifest/',
            surface='agent tool manifest',
            headers=self._headers(),
        )
        return response.json()

    async def _agent_domain_catalog(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/domain-catalog/',
            surface='agent domain catalog',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_recommended_toolpack(
        self,
        request: AgentCatalogRequest,
    ) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/recommended-toolpack/',
            surface='agent recommended toolpack',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_prepare(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/prepare/',
            surface='agent prepare',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_explain_context(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/explain-context/',
            surface='agent explain context',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_search_context(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/search-context/',
            surface='agent search context',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_hydrate_context(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/hydrate-context/',
            surface='agent hydrate context',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_record_step(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/record-step/',
            surface='agent record step',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_record_outcome(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/record-outcome/',
            surface='agent record outcome',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_export_artifact(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/export-artifact/',
            surface='agent export artifact',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_review_memory(self, request: AgentCatalogRequest) -> dict[str, Any]:
        response = await self._request(
            'POST',
            f'{self.base_url}/agent/review-memory/',
            surface='agent review memory',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

    async def _agent_graphql_run(
        self,
        *,
        operation_name: str,
        run_id: str,
        actor: str,
        adapter: str,
    ) -> dict[str, Any]:
        _ = actor
        _ = adapter
        request = AgentGraphQLRequest(
            operationName=operation_name,
            variables={'runId': run_id},
        )
        response = await self._request(
            'POST',
            f'{self.base_url}/graphql/',
            surface=f'agent {operation_name}',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return response.json()

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

    async def _harness_context_web(
        self,
        run_id: str,
        request: HarnessContextWebRequest,
        *,
        path: str,
        surface: str,
    ) -> ContextWebPack:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/{path}',
            surface=surface,
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        body = response.json()
        return ContextWebPack.model_validate(
            body.get('context_web_pack') or body.get('context_pack') or {},
        )

    async def _harness_context_web_spend_plan(
        self,
        run_id: str,
        request: HarnessContextWebRequest,
    ) -> ContextWebSpendPlanResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/context-web/spend-plan/',
            surface='harness context-web spend plan',
            kind='harness',
            headers=self._headers(),
            content=request.model_dump_json(exclude_none=True),
        )
        return ContextWebSpendPlanResponse.model_validate(response.json())

    async def _harness_context_web_explain(
        self,
        run_id: str,
        pack_id: str,
        *,
        atom_id: str,
    ) -> ContextWebExplainResponse:
        response = await self._request(
            'POST',
            f'{self.base_url}/harness/runs/{run_id}/context-web/{pack_id}/explain/',
            surface='harness context-web explain',
            kind='harness',
            headers=self._headers(),
            json={'atom_id': atom_id},
        )
        return ContextWebExplainResponse.model_validate(response.json()['explanation'])

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


def _compact_dict(data: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in data.items()
        if value is not None and value != ''
    }


def _task_type_for_orchestrate_mode(mode: str) -> str:
    if mode in {'execute', 'debug'}:
        return 'fix'
    if mode in {'plan', 'review', 'fix', 'refactor', 'research'}:
        return mode
    return 'other'
