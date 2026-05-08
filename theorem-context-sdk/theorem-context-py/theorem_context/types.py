"""Pydantic v2 contracts for the Theorem Context Python SDK.

Mirrors the TypeScript types in the npm package. Using pydantic models
gives us free validation when consumers parse responses.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


TaskType = Literal[
    'plan', 'review', 'fix', 'refactor', 'search', 'research', 'other',
]
ArtifactStatus = Literal[
    'draft', 'compiled', 'used', 'outcome_recorded', 'archived',
]
AtomKind = Literal[
    'file', 'postmortem', 'claim', 'webdoc', 'code_symbol', 'test', 'policy',
]


class Atom(BaseModel):
    kind: str
    title: str = ''
    score: float = 0.0
    reason: str = ''
    included: bool = False
    object_pk: int | None = None
    content_hash: str = ''


class CapsuleChannel(BaseModel):
    text: str = ''
    token_count: int = 0
    atoms: list[dict[str, Any]] = Field(default_factory=list)
    actions: list[dict[str, Any]] = Field(default_factory=list)


class Capsule(BaseModel):
    system_invariants: CapsuleChannel = Field(default_factory=CapsuleChannel)
    user_task: CapsuleChannel = Field(default_factory=CapsuleChannel)
    team_policy: CapsuleChannel = Field(default_factory=CapsuleChannel)
    trusted_repo_memory: CapsuleChannel = Field(default_factory=CapsuleChannel)
    external_content: CapsuleChannel = Field(default_factory=CapsuleChannel)
    tool_outputs: CapsuleChannel = Field(default_factory=CapsuleChannel)
    suggested_actions: CapsuleChannel | None = None


class Action(BaseModel):
    action_id: str
    action_type: str
    category: str = ''
    label: str = ''
    description: str = ''
    status: str = ''
    risk: str = ''
    score: float = 0.0
    confidence: float = 0.0
    execution_route: str = ''


class SavingsBreakdown(BaseModel):
    compressionTokens: int = 0
    artifactCacheTokens: int = 0
    stageCacheTokens: int = 0
    toolSchemaTokens: int = 0
    capturedDocTokens: int = 0
    pluginMethodTokens: int = 0
    compilerOverheadTokens: int = 0
    cacheLookupCostTokens: int = 0
    estimatedNetSavings: int = 0


class TokenLedger(BaseModel):
    rawCandidateTokens: int = 0
    capsuleTokens: int = 0
    compressionRatio: float = 0.0
    estimatedTokensAvoided: int = 0
    savingsBreakdown: SavingsBreakdown = Field(default_factory=SavingsBreakdown)
    budgetTokens: int = 0
    tokenizer: str = 'approx_4cpt'


class GraphHealth(BaseModel):
    composite: float | None = None
    scores: dict[str, float] = Field(default_factory=dict)
    measured_at: str | None = None
    object_count: int | None = None
    edge_count: int | None = None
    snapshot_id: int | None = None


class StressTestFinding(BaseModel):
    severity: str
    text: str


class StressTest(BaseModel):
    status: str | None = None
    findings: list[StressTestFinding] = Field(default_factory=list)
    mode: str | None = None


class ContextArtifact(BaseModel):
    id: str
    status: str = 'draft'
    task_type: str = 'other'
    task_description: str = ''
    budget_tokens: int = 8000
    capsule: dict[str, Any] = Field(default_factory=dict)
    atoms: list[Atom] = Field(default_factory=list)
    actions: list[Action] = Field(default_factory=list)
    graph_health: GraphHealth = Field(default_factory=GraphHealth)
    stress_test: StressTest = Field(default_factory=StressTest)
    provenance: dict[str, Any] = Field(default_factory=dict)
    token_ledger: TokenLedger = Field(default_factory=TokenLedger)
    source_graph: dict[str, Any] = Field(default_factory=dict)
    cache_key: str = ''
    cache_hit: bool = False
    created_at: str | None = None
    updated_at: str | None = None
    reasoning_trace: list[str] | None = None
    elapsed_ms: int | None = None


class CompileRequest(BaseModel):
    task: str
    target: str | None = None
    repo: str | None = None
    task_type: str | None = None
    budget_tokens: int = 8000
    invariants: str | None = None
    pro_tier: bool = False
    use_cache: bool = True
    user_overlay: dict[str, Any] | None = None
    commit: str | None = None
    metadata: dict[str, Any] | None = None


class OrchestrateRequest(BaseModel):
    task: str
    mode: str = 'plan'
    actor: str = 'codex'
    repo: str | None = None
    target: str | None = None
    profile_id: str | None = None
    risk_mode: str | None = None
    budget_tokens: int = 6000
    invariants: str | None = None
    scope: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    max_actions: int = 8
    resolve_context_command: bool = True
    compile_context: bool = True
    attach_artifact: bool = True
    generate_action_rail: bool = True


class OutcomeRequest(BaseModel):
    agentUsed: str | None = None
    accepted: bool | None = None
    testsPassed: bool | None = None
    prMerged: bool | None = None
    userFeedback: str | None = None
    citedAtomIds: list[str] = Field(default_factory=list)
    dismissedAtomIds: list[str] = Field(default_factory=list)


ArtifactExportFormat = Literal['signed', 'markdown', 'pdf', 'json']


class ArtifactSignedExport(BaseModel):
    format: Literal['signed'] = 'signed'
    artifact_id: str
    node_id: str = ''
    signature: str = ''
    payload_hash: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    signed: bool = False


class ArtifactMarkdownExport(BaseModel):
    format: Literal['markdown'] = 'markdown'
    artifact_id: str
    content: str = ''
    content_type: str = 'text/markdown; charset=utf-8'


class ArtifactPdfExport(BaseModel):
    format: Literal['pdf'] = 'pdf'
    artifact_id: str
    stub: bool = True
    reason: str = ''
    url: str | None = None


ArtifactExport = ArtifactSignedExport | ArtifactMarkdownExport | ArtifactPdfExport


class ArtifactForkResponse(BaseModel):
    forked: bool = False
    source_artifact_id: str = ''
    cloned_atom_count: int = 0
    artifact: ContextArtifact


class ArtifactAttachResponse(BaseModel):
    attached: bool = False
    harness_attached: bool = False
    attachment: dict[str, Any] = Field(default_factory=dict)


class GraphFocusNode(BaseModel):
    id: int
    title: str = ''
    slug: str = ''
    url: str = ''
    source_system: str = ''
    object_type: str = ''
    object_type_name: str = ''
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphFocusEdge(BaseModel):
    id: int
    from_object: int
    to_object: int
    edge_type: str = ''
    reason: str = ''
    strength: float = 0.0
    engine: str = ''


class GraphFocusResponse(BaseModel):
    stub: bool = False
    seed_ids: list[int] = Field(default_factory=list)
    nodes: list[GraphFocusNode] = Field(default_factory=list)
    edges: list[GraphFocusEdge] = Field(default_factory=list)


class GraphPatchesListResponse(BaseModel):
    stub: bool = False
    patches: list[dict[str, Any]] = Field(default_factory=list)


class ContextCommandRequest(BaseModel):
    goal: str | None = None
    query: str | None = None
    user_id: str | None = None
    session_id: str | None = None
    folio_id: str | None = None
    notebook_id: str | None = None
    project_id: str | None = None
    current_url: str | None = None
    current_title: str | None = None
    selected_text: str | None = None
    open_tabs: list[dict[str, Any]] = Field(default_factory=list)
    working_set: list[dict[str, Any]] = Field(default_factory=list)
    exclusions: list[dict[str, Any]] = Field(default_factory=list)
    memory_scope: str | None = None
    graph_layers: list[str] | None = None
    tool_scope: list[str] | None = None
    retrieval_policy: dict[str, Any] | None = None
    output_target: str | None = None
    risk_mode: str | None = None
    permission_policy: dict[str, Any] | None = None
    trace_policy: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class ActionRailGenerateRequest(BaseModel):
    context_command_id: str | None = None
    context_command: dict[str, Any] | None = None
    perception_bundle: dict[str, Any] | None = None
    user_id: str | None = None
    session_id: str | None = None
    folio_id: str | None = None
    current_url: str | None = None
    selected_text: str | None = None
    max_actions: int = 20
    include_disabled: bool = True
    metadata: dict[str, Any] | None = None


class ActionRailPreviewRequest(BaseModel):
    action_id: str | None = None
    action: dict[str, Any] | None = None


class ActionSelectedRequest(BaseModel):
    action_id: str
    user_id: str | None = None
    session_id: str | None = None
    folio_id: str | None = None


class LearningProfileInstallRequest(BaseModel):
    enabled_by_default: bool = False


class LearningProfileToolkitRequest(BaseModel):
    task_type: str
    permissions: list[str] | None = None
    budget_tokens: int | None = None


class LearningContextSpendPlanRequest(BaseModel):
    profile_id: str
    run_id: str = ''
    task_signature: str
    budget_tokens: int
    candidate_atoms: list[dict[str, Any]] = Field(default_factory=list)


class LearningStructuralSignalRequest(BaseModel):
    plugin_id: str
    profile_id: str = ''
    task_signature_hash: str
    task_type: str
    graph_motif_hash: str
    method_id: str
    validator_id: str
    outcome: dict[str, Any]
    token_metrics: dict[str, Any] | None = None
    privacy: dict[str, Any]
    plugin_version: str = ''


class HarnessStep(BaseModel):
    step_id: str
    run_id: str
    kind: str
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: str | None = None


class HarnessSearchRun(BaseModel):
    search_run_id: str
    plan_id: str = ''
    query: str
    status: str = 'complete'
    result_payload: dict[str, Any] = Field(default_factory=dict)
    admission_proposals: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str | None = None


class HarnessRun(BaseModel):
    run_id: str
    task: str
    actor: str = 'agent'
    scope: dict[str, Any] = Field(default_factory=dict)
    status: str = 'running'
    steps: list[HarnessStep] = Field(default_factory=list)
    search_runs: list[HarnessSearchRun] = Field(default_factory=list)
    artifacts: list[dict[str, Any]] = Field(default_factory=list)
    memory_patches: list[dict[str, Any]] = Field(default_factory=list)
    validations: list[dict[str, Any]] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


class OrchestrateReport(BaseModel):
    status: Literal['ready'] = 'ready'
    checklist: list[dict[str, Any]] = Field(default_factory=list)
    harness_writeback: Literal['recorded', 'not_requested'] = 'not_requested'
    next_actions: list[dict[str, Any]] = Field(default_factory=list)


class OrchestrateResult(BaseModel):
    run: HarnessRun
    context_command: dict[str, Any] | None = None
    artifact: ContextArtifact | None = None
    artifact_attachment: ArtifactAttachResponse | None = None
    action_rail: dict[str, Any] | None = None
    report: OrchestrateReport = Field(default_factory=OrchestrateReport)


class HarnessEvent(BaseModel):
    event_id: str
    run_id: str
    seq: int
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    state_hash_before: str = ''
    state_hash_after: str = ''
    created_at: str | None = None


class HarnessGuardViolation(BaseModel):
    code: str
    message: str
    required_state: str = ''
    received_state: str = ''
    missing_fields: list[str] = Field(default_factory=list)
    details: dict[str, Any] = Field(default_factory=dict)


class HarnessTransitionRequest(BaseModel):
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    actor: str | None = None
    idempotency_key: str | None = None


class HarnessTransitionResult(BaseModel):
    run: dict[str, Any]
    event: HarnessEvent
    effects: list[dict[str, Any]] = Field(default_factory=list)
    state_hash_before: str = ''
    state_hash_after: str = ''


class HarnessStateHashResponse(BaseModel):
    run_id: str
    state_hash: str


class HarnessBeginRequest(BaseModel):
    task: str
    actor: str = 'agent'
    scope: dict[str, Any] = Field(default_factory=dict)


class HarnessSearchRequest(BaseModel):
    query: str
    budget: dict[str, Any] = Field(default_factory=dict)
    scope: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = None
    folio_id: str | None = None


class HarnessContextRequest(BaseModel):
    task: str | None = None
    budget_tokens: int = 8000
    repo: str | None = None
    task_type: str = 'search'
    invariants: str | None = None


class HarnessContextWebRequest(BaseModel):
    query: str | None = None
    mode: str = 'standard'
    budget_tokens: int = 4000
    explicit_targets: list[str] = Field(default_factory=list)
    allow_generated_artifacts: bool = False
    folio_id: str | None = None


class ContextWebBudget(BaseModel):
    max_tokens: int = 4000
    max_atoms: int = 24
    max_edges: int = 48
    max_paths: int = 8
    max_tools: int = 5


class ContextWebCitation(BaseModel):
    source_id: str
    source_type: str
    locator: str = ''
    excerpt_hash: str = ''


class ContextWebAtom(BaseModel):
    id: str
    kind: str = 'file'
    title: str = ''
    summary: str = ''
    source_ref: str = ''
    score: float = 0.0
    estimated_tokens: int = 0
    channels: list[str] = Field(default_factory=list)
    citations: list[ContextWebCitation] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)


class ContextWebEdge(BaseModel):
    from_id: str
    to_id: str
    relation: str
    reason: str = ''
    score: float = 0.0


class ContextWebPath(BaseModel):
    node_ids: list[str] = Field(default_factory=list)
    edge_relations: list[str] = Field(default_factory=list)
    score: float = 0.0


class ContextWebTokenLedger(BaseModel):
    raw_candidate_tokens: int = 0
    packed_tokens: int = 0
    saved_tokens: int = 0
    tool_schema_tokens_avoided: int = 0
    hydration_tokens_avoided: int = 0
    cache_hits: int = 0


class ContextWebSpendPlan(BaseModel):
    spend_plan_id: str = ''
    budget_allocation: dict[str, int] = Field(default_factory=dict)
    hydration_policy: dict[str, list[str]] = Field(default_factory=dict)
    expected_savings: dict[str, Any] = Field(default_factory=dict)
    cache_keys: dict[str, Any] = Field(default_factory=dict)
    degradations: list[str] = Field(default_factory=list)


class ContextWebPack(BaseModel):
    run_id: str
    query: str
    mode: str = 'standard'
    budget: ContextWebBudget = Field(default_factory=ContextWebBudget)
    atoms: list[ContextWebAtom] = Field(default_factory=list)
    edges: list[ContextWebEdge] = Field(default_factory=list)
    paths: list[ContextWebPath] = Field(default_factory=list)
    tools_used: list[dict[str, Any]] = Field(default_factory=list)
    source_mix: dict[str, int] = Field(default_factory=dict)
    token_ledger: ContextWebTokenLedger = Field(default_factory=ContextWebTokenLedger)
    provenance: dict[str, Any] = Field(default_factory=dict)
    spend_plan: ContextWebSpendPlan = Field(default_factory=ContextWebSpendPlan)
    state_hash: str = ''


class ContextWebExplainResponse(BaseModel):
    run_id: str
    pack_id: str
    atom_id: str
    included: bool = False
    why_included: str = ''
    why_excluded: str = ''
    policies_applied: list[str] = Field(default_factory=list)
    mode: str = ''
    source_mix: dict[str, int] = Field(default_factory=dict)
    budget: dict[str, Any] = Field(default_factory=dict)
    provenance: dict[str, Any] = Field(default_factory=dict)


class HarnessPatchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patch: dict[str, Any]
    validate_patch: bool = Field(default=True, alias='validate')


class HarnessForkRequest(BaseModel):
    through_step_id: str | None = None
    actor: str | None = None


class HarnessCompareRequest(BaseModel):
    before_run_id: str
    after_run_id: str


class THGNode(BaseModel):
    id: str
    labels: list[str] = Field(default_factory=list)
    properties: dict[str, Any] = Field(default_factory=dict)


class THGEdge(BaseModel):
    from_id: str
    type: str
    to_id: str
    id: str | None = None
    properties: dict[str, Any] = Field(default_factory=dict)


class THGResult(BaseModel):
    ok: bool | None = None
    command: str
    status: str
    payload: dict[str, Any] = Field(default_factory=dict)
    nodes: list[THGNode] = Field(default_factory=list)
    edges: list[THGEdge] = Field(default_factory=list)
    events: list[dict[str, Any]] = Field(default_factory=list)
    state_hash: str = ''
    error: dict[str, Any] | None = None


class THGCommandRequest(BaseModel):
    command: str
    payload: dict[str, Any] = Field(default_factory=dict)


class THGCypherRequest(BaseModel):
    query: str
    graph: dict[str, Any] = Field(default_factory=dict)
    params: dict[str, Any] = Field(default_factory=dict)
