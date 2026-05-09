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
    submit_operational_policy_patches: bool = False
    queue_operational_policy_patches: bool = False


class OrchestrateRejectedCandidate(BaseModel):
    id: str
    kind: str
    reason: str


class OrchestrateContextPlan(BaseModel):
    max_tokens: int = 0
    metadata_tokens: int = 0
    skill_body_tokens: int = 0
    reference_tokens: int = 0
    tool_schema_tokens: int = 0
    context_artifact_tokens: int = 0


class OrchestrateRiskSummary(BaseModel):
    shell_risk: float = 0.0
    network_risk: float = 0.0
    data_exposure_risk: float = 0.0
    over_orchestration_risk: float = 0.0


class OrchestrateDecision(BaseModel):
    run_id: str = ''
    task: str
    task_signature: str = ''
    selected_profile_id: str = ''
    selected_pack_ids: list[str] = Field(default_factory=list)
    selected_skill_ids: list[str] = Field(default_factory=list)
    selected_agent_ids: list[str] = Field(default_factory=list)
    selected_tool_ids: list[str] = Field(default_factory=list)
    selected_validator_ids: list[str] = Field(default_factory=list)
    selected_renderer_ids: list[str] = Field(default_factory=list)
    selected_compute_backend_ids: list[str] = Field(default_factory=list)
    rejected_candidates: list[OrchestrateRejectedCandidate] = Field(default_factory=list)
    context_plan: OrchestrateContextPlan = Field(default_factory=OrchestrateContextPlan)
    risk: OrchestrateRiskSummary = Field(default_factory=OrchestrateRiskSummary)
    why_selected: dict[str, str] = Field(default_factory=dict)
    policies_applied: list[str] = Field(default_factory=list)
    user_overrides: list[str] = Field(default_factory=list)
    federated_priors_used: list[str] = Field(default_factory=list)


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


class InferenceKernelContract(BaseModel):
    kernel_id: str
    epistemic_job: str = ''
    inference_family: str = ''
    consumes_view: list[str] = Field(default_factory=list)
    produces: list[str] = Field(default_factory=list)
    truth_type: str = ''
    validator: str = ''
    writeback_policy: str = ''
    source_module: str = ''
    owner: str = ''
    description: str = ''
    source: str = ''
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class InferenceRegistryReport(BaseModel):
    version: str = ''
    count: int = 0
    entries: list[InferenceKernelContract] = Field(default_factory=list)
    index: dict[str, InferenceKernelContract] = Field(default_factory=dict)


class ExpressionRenderRequest(BaseModel):
    result: dict[str, Any]
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExpressionRenderResult(BaseModel):
    engine_id: str
    artifact_type: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    receipt_hash: str = ''
    writeback_policy: str = 'read-only'


class SolverContextCapsuleRequest(BaseModel):
    capsule: dict[str, Any]
    budget_tokens: int
    token_ledger: dict[str, Any] = Field(default_factory=dict)
    atoms: list[dict[str, Any]] = Field(default_factory=list)
    exports: dict[str, Any] = Field(default_factory=dict)
    input_view_refs: list[str] = Field(default_factory=list)


class SolverResult(BaseModel):
    provider: str = ''
    formula_hash: str = ''
    input_view_refs: list[str] = Field(default_factory=list)
    status: str = ''
    model: dict[str, Any] = Field(default_factory=dict)
    counterexample: dict[str, Any] = Field(default_factory=dict)
    unsat_core_ref: str = ''
    unknown_reason: str = ''
    timeout_ms: int | None = None
    writeback_proposals: list[dict[str, Any]] = Field(default_factory=list)


class DiscoveryPreviewRequest(BaseModel):
    objective: str
    hypothesis: str
    action: dict[str, Any]
    context_refs: list[str] = Field(default_factory=list)
    expected_value: float = 0.0


class DiscoveryEvent(BaseModel):
    event_type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    event_hash: str = ''


class DiscoveryCandidate(BaseModel):
    candidate_id: str
    hypothesis: str
    action: dict[str, Any] = Field(default_factory=dict)
    expected_value: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)


class ValidatorReceipt(BaseModel):
    validator_id: str
    status: str = 'unknown'
    command: str = ''
    output_summary: str = ''
    counterexample: dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0
    receipt_hash: str = ''


class DiscoveryOutcome(BaseModel):
    outcome_id: str
    candidate_id: str
    validator_receipts: list[ValidatorReceipt] = Field(default_factory=list)
    passed: bool = False
    summary: str = ''


class DiscoveryWritebackProposal(BaseModel):
    proposal_id: str
    target: str
    reason: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    review_required: bool = True
    writeback_policy: str = 'proposal-only'


class DiscoveryRunPreview(BaseModel):
    run_id: str
    objective: str
    status: str = 'running'
    context_refs: list[str] = Field(default_factory=list)
    candidates: list[DiscoveryCandidate] = Field(default_factory=list)
    outcomes: list[DiscoveryOutcome] = Field(default_factory=list)
    writeback_proposals: list[DiscoveryWritebackProposal] = Field(default_factory=list)
    events: list[DiscoveryEvent] = Field(default_factory=list)
    append_only: bool = True
    canonical_graph_mutation: bool = False
    validator_receipts: list[ValidatorReceipt] = Field(default_factory=list)
    kernel_runs: list[dict[str, Any]] = Field(default_factory=list)
    candidate_archive_entries: list[dict[str, Any]] = Field(default_factory=list)


class DiscoveryRunCreateRequest(BaseModel):
    objective: str
    run_id: str | None = None
    context_refs: list[str] = Field(default_factory=list)
    hypothesis: str | None = None
    action: dict[str, Any] = Field(default_factory=dict)
    expected_value: float = 0.0
    metadata: dict[str, Any] = Field(default_factory=dict)
    source_artifact_id: str | None = None


class DiscoveryValidatorReceiptRequest(BaseModel):
    candidate_id: str = ''
    outcome_id: str = ''
    validator_id: str
    status: str = 'unknown'
    command: str = ''
    output_summary: str = ''
    counterexample: dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0
    payload: dict[str, Any] = Field(default_factory=dict)
    receipt_hash: str = ''


class DiscoveryFinishRequest(BaseModel):
    succeeded: bool = True
    summary: str = ''
    metadata: dict[str, Any] = Field(default_factory=dict)


class DiscoveryWritebackReviewRequest(BaseModel):
    review_status: str
    reviewer: str = ''
    note: str = ''
    metadata: dict[str, Any] = Field(default_factory=dict)


class KernelResultReceipt(BaseModel):
    receipt_type: str = 'kernel_result'
    status: str = 'unknown'
    validator_id: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    payload_hash: str = ''
    receipt_hash: str = ''
    writeback_proposals: list[dict[str, Any]] = Field(default_factory=list)
    private_content_excluded: bool = True


class KernelRun(BaseModel):
    run_id: str
    kernel_id: str
    epistemic_job: str = ''
    inference_family: str = ''
    status: str = 'running'
    request_payload: dict[str, Any] = Field(default_factory=dict)
    result_payload: dict[str, Any] = Field(default_factory=dict)
    budget: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    error_payload: dict[str, Any] = Field(default_factory=dict)
    receipt_hash: str = ''
    duration_ms: int = 0
    writeback_policy: str = 'proposal-only'
    canonical_graph_mutation: bool = False
    discovery_run_id: str = ''
    result_receipts: list[KernelResultReceipt] = Field(default_factory=list)
    append_only: bool = True


class KernelRunRequest(BaseModel):
    kernel_id: str | None = None
    epistemic_job: str | None = None
    inference_family: str | None = None
    consumes_view: str | None = None
    discovery_run_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    budget: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class KernelReceiptRequest(BaseModel):
    receipt_type: str = 'kernel_result'
    status: str = 'unknown'
    validator_id: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    writeback_proposals: list[dict[str, Any]] = Field(default_factory=list)


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
    status: Literal['ready', 'preview'] = 'ready'
    checklist: list[dict[str, Any]] = Field(default_factory=list)
    harness_writeback: Literal['recorded', 'not_requested'] = 'not_requested'
    next_actions: list[dict[str, Any] | str] = Field(default_factory=list)
    memory_recall: dict[str, Any] | None = None
    memory_policy_patch_requests: list[str] = Field(default_factory=list)


class OrchestrateResult(BaseModel):
    run: HarnessRun
    decision: OrchestrateDecision
    memory: dict[str, Any] = Field(default_factory=dict)
    memory_contract: dict[str, Any] = Field(default_factory=dict)
    memory_policy_proposals: list[dict[str, Any]] = Field(default_factory=list)
    memory_policy_patch_requests: list[dict[str, Any]] = Field(default_factory=list)
    memory_recall: dict[str, Any] | None = None
    memory_recall_trace: dict[str, Any] = Field(default_factory=dict)
    context_command: dict[str, Any] | None = None
    artifact: ContextArtifact | None = None
    artifact_attachment: ArtifactAttachResponse | None = None
    action_rail: dict[str, Any] | None = None
    report: OrchestrateReport = Field(default_factory=OrchestrateReport)


class OrchestratePreviewResult(BaseModel):
    decision: OrchestrateDecision
    toolkit: dict[str, Any] = Field(default_factory=dict)
    report: OrchestrateReport = Field(default_factory=OrchestrateReport)


class OrchestratePrepareHydrationHandle(BaseModel):
    handle_id: str = ''
    handle_type: str = ''
    source: str = ''
    reason: str = ''
    scope: str = ''
    status: str = ''


class OrchestratePrepareRecallPreview(BaseModel):
    read_first: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    do_not: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
    hydration_handles: list[OrchestratePrepareHydrationHandle] = Field(
        default_factory=list,
    )
    recalled_evidence: list[str] = Field(default_factory=list)
    selected_banks: list[str] = Field(default_factory=list)
    recall_policy: list[str] = Field(default_factory=list)
    active_policy: list[str] = Field(default_factory=list)
    proposed_policy: list[str] = Field(default_factory=list)


class OrchestratePrepareMemoryBank(BaseModel):
    bank_id: str = ''
    kind: str = ''
    scope: str = ''
    selector: str = ''
    rationale: str = ''


class OrchestratePrepareRecallPolicy(BaseModel):
    policy_id: str = ''
    kind: str = ''
    scope_filters: list[str] = Field(default_factory=list)
    selected_banks: list[str] = Field(default_factory=list)
    rationale: str = ''
    status: str = 'active'


class OrchestratePrepareMemoryEvidence(BaseModel):
    evidence_id: str = ''
    kind: str = ''
    source: str = ''
    immutable: bool = True
    payload: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ''


class OrchestratePrepareMemoryPolicy(BaseModel):
    policy_id: str = ''
    kind: str = ''
    scope: str = ''
    editable: bool = True
    payload: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ''
    status: str = 'active'


class OrchestratePrepareMemoryContract(BaseModel):
    evidence: list[OrchestratePrepareMemoryEvidence] = Field(default_factory=list)
    operational_policy: list[OrchestratePrepareMemoryPolicy] = Field(
        default_factory=list,
    )
    memory_banks: list[OrchestratePrepareMemoryBank] = Field(default_factory=list)
    evidence_hash: str = ''
    policy_hash: str = ''
    recall_policy: OrchestratePrepareRecallPolicy | None = None
    recall_preview: OrchestratePrepareRecallPreview | None = None


class OrchestrateMemoryPolicyProposalIntent(BaseModel):
    source_category: str = ''
    target_category: str = ''
    proposed_action: str = ''
    promotion_intent: str = ''


class OrchestrateMemoryPolicyProposal(BaseModel):
    proposal_id: str = ''
    proposal_type: str = ''
    target_scope: str = ''
    payload: dict[str, Any] = Field(default_factory=dict)
    proposal_intent: OrchestrateMemoryPolicyProposalIntent = Field(
        default_factory=OrchestrateMemoryPolicyProposalIntent,
    )


class OrchestrateMemoryRecallTrace(BaseModel):
    section: str | None = None
    read_first: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    do_not: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
    selected_banks: list[str] = Field(default_factory=list)
    recall_policy: list[str] = Field(default_factory=list)
    recalled_evidence_count: int = 0
    active_policy_count: int = 0
    proposed_policy_count: int = 0
    selected_bank_count: int = 0
    hydration_handle_count: int = 0
    proposed_policy_patches: int | None = None
    events: list[dict[str, Any]] = Field(default_factory=list)


class OrchestratePrepareResult(BaseModel):
    decision: OrchestrateDecision
    toolkit: dict[str, Any] = Field(default_factory=dict)
    report: OrchestrateReport = Field(default_factory=OrchestrateReport)
    memory: OrchestratePrepareMemoryContract = Field(
        default_factory=OrchestratePrepareMemoryContract,
    )
    memory_contract: OrchestratePrepareMemoryContract = Field(
        default_factory=OrchestratePrepareMemoryContract,
    )
    memory_policy_proposals: list[OrchestrateMemoryPolicyProposal] = Field(
        default_factory=list,
    )
    memory_recall: OrchestratePrepareRecallPreview | None = None
    memory_recall_trace: OrchestrateMemoryRecallTrace = Field(
        default_factory=OrchestrateMemoryRecallTrace,
    )


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
    trigger_description: str = ''
    why_relevant: str = ''
    hydration_level: str = 'summary'
    hydration_handle: str = ''


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


class ContextWebValidatorFinding(BaseModel):
    validator_id: str
    severity: str = 'low'
    score: float = 0.0
    summary: str = ''
    affected_atom_ids: list[str] = Field(default_factory=list)


class ContextWebValidationSummary(BaseModel):
    findings: list[ContextWebValidatorFinding] = Field(default_factory=list)
    scores: dict[str, float] = Field(default_factory=dict)
    passed: bool = True


class ContextWebEvaluation(BaseModel):
    naive_tokens: int = 0
    context_web_tokens: int = 0
    compression_ratio: float = 0.0
    graph_overhead: int = 0
    trivial_change_penalty: int = 0
    useful_when: list[str] = Field(default_factory=list)
    not_useful_when: list[str] = Field(default_factory=list)


class ContextWebIndex(BaseModel):
    repo_id: str = ''
    commit_sha: str = ''
    changed_files: list[str] = Field(default_factory=list)
    file_hashes: dict[str, str] = Field(default_factory=dict)
    symbol_hashes: dict[str, str] = Field(default_factory=dict)
    last_incremental_update: str = ''
    graph_state_hash: str = ''
    index_state_hash: str = ''
    update_strategy: str = 'incremental'


class ContextWebSpendPlanResponse(BaseModel):
    run_id: str = ''
    mode: str = 'standard'
    pack_id: str = ''
    spend_plan: ContextWebSpendPlan = Field(default_factory=ContextWebSpendPlan)
    evaluation: ContextWebEvaluation = Field(default_factory=ContextWebEvaluation)
    validation: ContextWebValidationSummary = Field(default_factory=ContextWebValidationSummary)
    top_atoms: list[ContextWebAtom] = Field(default_factory=list)


class ContextWebIndexUpdateRequest(BaseModel):
    repo_id: str | None = None
    repo: str | None = None
    commit_sha: str | None = None
    commitSha: str | None = None
    changed_files: list[str] = Field(default_factory=list)
    changedFiles: list[str] = Field(default_factory=list)
    file_hashes: dict[str, str] = Field(default_factory=dict)
    fileHashes: dict[str, str] = Field(default_factory=dict)
    symbol_hashes: dict[str, str] = Field(default_factory=dict)
    symbolHashes: dict[str, str] = Field(default_factory=dict)
    symbols: list[str] = Field(default_factory=list)


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
    validation: ContextWebValidationSummary = Field(default_factory=ContextWebValidationSummary)
    evaluation: ContextWebEvaluation = Field(default_factory=ContextWebEvaluation)
    index: ContextWebIndex = Field(default_factory=ContextWebIndex)
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


class ProductAccountSummary(BaseModel):
    id: int
    username: str
    email: str


class ProductTenantSummary(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool = True
    configuration: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    projects_count: int = 0
    api_keys_count: int = 0
    created_at: str = ''
    updated_at: str = ''


class ProductProjectSummary(BaseModel):
    id: int
    name: str
    slug: str
    mode: str = 'knowledge'
    status: str = ''
    description: str = ''
    tenant_slug: str | None = None
    settings_override: dict[str, Any] = Field(default_factory=dict)
    created_at: str = ''
    updated_at: str = ''


class ProductAPIKeyQuota(BaseModel):
    requests_per_hour: int = 0
    requests_this_hour: int = 0
    remaining_this_hour: int = 0


class ProductAPIKeyCapabilities(BaseModel):
    can_import: bool = False
    can_webhook: bool = False
    can_sessions: bool = True


class ProductAPIKeySummary(BaseModel):
    id: int
    name: str
    tier: str = ''
    surface: str = ''
    is_active: bool = True
    requests_per_hour: int = 0
    tenant_slug: str | None = None
    project_slug: str | None = None
    masked_key: str = ''
    last_used_at: str | None = None
    created_at: str = ''
    updated_at: str = ''
    quota: ProductAPIKeyQuota = Field(default_factory=ProductAPIKeyQuota)
    capabilities: ProductAPIKeyCapabilities = Field(default_factory=ProductAPIKeyCapabilities)
    key: str | None = None


class ProductUsagePoint(BaseModel):
    day: str
    count: int = 0


class ProductUsageCategory(BaseModel):
    usage_category: str = ''
    count: int = 0


class ProductUsageKeySummary(BaseModel):
    name: str = ''
    count: int = 0


class ProductUsageSummary(BaseModel):
    tenant_slug: str
    days: int = 0
    total_requests: int = 0
    token_estimate_total: int = 0
    requests_last_hour: int = 0
    quota_limit: int = 0
    quota_remaining_estimate: int = 0
    by_day: list[ProductUsagePoint] = Field(default_factory=list)
    by_category: list[ProductUsageCategory] = Field(default_factory=list)
    by_key: list[ProductUsageKeySummary] = Field(default_factory=list)


class ProductBootstrapResponse(BaseModel):
    account: ProductAccountSummary
    mode: str = 'bootstrap_fallback'
    auth_required: bool = False
    bootstrap_fallback_allowed: bool = False
    tenants: list[ProductTenantSummary] = Field(default_factory=list)
    default_tenant_slug: str | None = None


class ProductTenantCreateRequest(BaseModel):
    name: str
    slug: str | None = None
    configuration: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class ProductProjectCreateRequest(BaseModel):
    name: str
    slug: str | None = None
    description: str = ''
    mode: str = 'knowledge'
    settings_override: dict[str, Any] | None = None


class ProductAPIKeyCreateRequest(BaseModel):
    name: str
    tier: str = 'researcher'
    project_slug: str | None = None
    requests_per_hour: int | None = None
    can_import: bool = False
    can_webhook: bool = False
    can_sessions: bool = True


class SavedContextSummary(BaseModel):
    id: int
    title: str
    slug: str
    kind: str = 'note'
    memory_role: str = 'evidence'
    status: str = 'active'
    content: str = ''
    summary: str = ''
    scope: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    tenant_slug: str = ''
    project_slug: str | None = None
    created_at: str = ''
    updated_at: str = ''


class SavedContextCreateRequest(BaseModel):
    title: str
    slug: str | None = None
    kind: str = 'note'
    memory_role: str = 'evidence'
    content: str
    summary: str = ''
    project_slug: str | None = None
    scope: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class SavedContextUpdateRequest(BaseModel):
    title: str | None = None
    kind: str | None = None
    memory_role: str | None = None
    content: str | None = None
    summary: str | None = None
    project_slug: str | None = None
    scope: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class HarnessPatchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patch: dict[str, Any]
    validate_patch: bool = Field(default=True, alias='validate')
    source_category: str = 'runtime_prepare'
    target_category: str = 'operational_policy'
    target_scope: str = 'global'
    proposed_action: str = 'upsert'
    promotion_intent: str = 'review'
    review_status: str = 'not_queued'
    queue_for_review: bool = False


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
