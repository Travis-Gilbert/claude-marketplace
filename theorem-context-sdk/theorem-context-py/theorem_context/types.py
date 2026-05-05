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


class OutcomeRequest(BaseModel):
    agentUsed: str | None = None
    accepted: bool | None = None
    testsPassed: bool | None = None
    prMerged: bool | None = None
    userFeedback: str | None = None
    citedAtomIds: list[str] = Field(default_factory=list)
    dismissedAtomIds: list[str] = Field(default_factory=list)


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
