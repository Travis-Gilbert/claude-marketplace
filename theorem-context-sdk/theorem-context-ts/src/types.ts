/**
 * Theorem Context SDK: typed contracts.
 *
 * These mirror the shape returned by POST /api/v2/theseus/context/compile/
 * and the SSE stage events. Keeping them stable is part of the SDK's
 * promise to consumers.
 */

export type TaskType =
  | 'plan'
  | 'review'
  | 'fix'
  | 'refactor'
  | 'search'
  | 'research'
  | 'other';

export type ArtifactStatus =
  | 'draft'
  | 'compiled'
  | 'used'
  | 'outcome_recorded'
  | 'archived';

export type AtomKind =
  | 'file'
  | 'postmortem'
  | 'claim'
  | 'webdoc'
  | 'code_symbol'
  | 'test'
  | 'policy';

export interface Atom {
  kind: AtomKind | string;
  title: string;
  score: number;
  reason: string;
  included: boolean;
  object_pk: number | null;
  content_hash: string;
}

export interface CapsuleChannel {
  text: string;
  token_count: number;
  atoms?: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
}

export interface Capsule {
  system_invariants: CapsuleChannel;
  user_task: CapsuleChannel;
  team_policy: CapsuleChannel;
  trusted_repo_memory: CapsuleChannel;
  external_content: CapsuleChannel;
  tool_outputs: CapsuleChannel;
  suggested_actions?: CapsuleChannel;
}

export interface Action {
  action_id: string;
  action_type: string;
  category: string;
  label: string;
  description: string;
  status: string;
  risk: string;
  score: number;
  confidence: number;
  execution_route: string;
}

export interface TokenLedger {
  rawCandidateTokens: number;
  capsuleTokens: number;
  compressionRatio: number;
  estimatedTokensAvoided: number;
  savingsBreakdown?: SavingsBreakdown;
  budgetTokens: number;
  tokenizer: string;
}

export interface SavingsBreakdown {
  compressionTokens: number;
  artifactCacheTokens: number;
  stageCacheTokens: number;
  toolSchemaTokens: number;
  capturedDocTokens: number;
  pluginMethodTokens: number;
  compilerOverheadTokens: number;
  cacheLookupCostTokens: number;
  estimatedNetSavings: number;
}

export interface GraphHealth {
  composite?: number;
  scores?: Record<string, number>;
  measured_at?: string | null;
  object_count?: number;
  edge_count?: number;
  snapshot_id?: number;
}

export interface StressTestFinding {
  severity: 'high' | 'medium' | 'low' | string;
  text: string;
}

export interface StressTest {
  status?: string;
  findings?: StressTestFinding[];
  mode?: string;
}

export interface ContextArtifact {
  id: string;
  status: ArtifactStatus | string;
  task_type: TaskType | string;
  task_description: string;
  budget_tokens: number;
  capsule: Capsule | Record<string, CapsuleChannel>;
  atoms: Atom[];
  actions: Action[];
  graph_health: GraphHealth;
  stress_test: StressTest;
  provenance: Record<string, unknown>;
  token_ledger: TokenLedger;
  source_graph: Record<string, unknown>;
  cache_key: string;
  cache_hit: boolean;
  created_at: string | null;
  updated_at: string | null;
  reasoning_trace?: string[];
  elapsed_ms?: number;
}

export interface CompileRequest {
  task: string;
  target?: string;
  repo?: string;
  task_type?: TaskType | string;
  budget_tokens?: number;
  invariants?: string;
  pro_tier?: boolean;
  use_cache?: boolean;
  user_overlay?: Record<string, unknown>;
  commit?: string;
  metadata?: Record<string, unknown>;
}

export type OrchestrateMode =
  | 'plan'
  | 'review'
  | 'fix'
  | 'refactor'
  | 'research'
  | 'execute'
  | 'debug'
  | 'other'
  | string;

export interface OrchestrateRequest {
  task: string;
  mode?: OrchestrateMode;
  actor?: string;
  repo?: string;
  target?: string;
  profile_id?: string;
  risk_mode?: string;
  budget_tokens?: number;
  invariants?: string;
  scope?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  max_actions?: number;
  resolve_context_command?: boolean;
  compile_context?: boolean;
  attach_artifact?: boolean;
  generate_action_rail?: boolean;
  submit_operational_policy_patches?: boolean;
  queue_operational_policy_patches?: boolean;
}

export interface OrchestrateRejectedCandidate {
  id: string;
  kind: string;
  reason: string;
}

export interface OrchestrateContextPlan {
  max_tokens: number;
  metadata_tokens: number;
  skill_body_tokens: number;
  reference_tokens: number;
  tool_schema_tokens: number;
  context_artifact_tokens: number;
}

export interface OrchestrateRiskSummary {
  shell_risk: number;
  network_risk: number;
  data_exposure_risk: number;
  over_orchestration_risk: number;
}

export interface OrchestrateDecision {
  run_id: string;
  task: string;
  task_signature: string;
  selected_profile_id: string;
  selected_pack_ids: string[];
  selected_skill_ids: string[];
  selected_agent_ids: string[];
  selected_tool_ids: string[];
  selected_validator_ids: string[];
  selected_renderer_ids: string[];
  selected_compute_backend_ids: string[];
  rejected_candidates: OrchestrateRejectedCandidate[];
  context_plan: OrchestrateContextPlan;
  risk: OrchestrateRiskSummary;
  why_selected: Record<string, string>;
  policies_applied: string[];
  user_overrides: string[];
  federated_priors_used: string[];
}

export interface OrchestrateReport {
  status: 'ready' | 'preview';
  checklist: Array<Record<string, unknown>>;
  harness_writeback: 'recorded' | 'not_requested';
  next_actions: Array<Record<string, unknown> | string>;
  memory_recall?: OrchestrateMemoryRecallTrace;
  memory_policy_patch_requests?: string[];
}

export interface OrchestrateResult {
  run: HarnessRun;
  decision: OrchestrateDecision;
  memory?: OrchestratePrepareMemoryContract;
  memory_contract?: OrchestratePrepareMemoryContract;
  memory_policy_proposals?: OrchestrateMemoryPolicyProposal[];
  memory_policy_patch_requests?: Array<Record<string, unknown>>;
  memory_recall?: OrchestratePrepareRecallPreview | null;
  memory_recall_trace?: OrchestrateMemoryRecallTrace;
  context_command: ContextCommandResolveResponse | null;
  artifact: ContextArtifact | null;
  artifact_attachment: ArtifactAttachResponse | null;
  action_rail: ActionRailBundle | null;
  report: OrchestrateReport;
}

export interface OrchestratePreviewResult {
  decision: OrchestrateDecision;
  toolkit: Record<string, unknown>;
  report: OrchestrateReport;
}

export interface OrchestratePrepareHydrationHandle {
  handle_id: string;
  handle_type: string;
  source: string;
  reason: string;
  scope: string;
  status: string;
}

export interface OrchestratePrepareRecallPreview {
  read_first: string[];
  risks: string[];
  do_not: string[];
  next_actions: string[];
  hydration_handles: OrchestratePrepareHydrationHandle[];
  recalled_evidence: string[];
  selected_banks: string[];
  recall_policy: string[];
  active_policy: string[];
  proposed_policy: string[];
}

export interface OrchestratePrepareMemoryBank {
  bank_id: string;
  kind: string;
  scope: string;
  selector: string;
  rationale: string;
}

export interface OrchestratePrepareRecallPolicy {
  policy_id: string;
  kind: string;
  scope_filters: string[];
  selected_banks: string[];
  rationale: string;
  status: string;
}

export interface OrchestratePrepareMemoryEvidence {
  evidence_id: string;
  kind: string;
  source: string;
  immutable: boolean;
  payload: Record<string, unknown>;
  rationale: string;
}

export interface OrchestratePrepareMemoryPolicy {
  policy_id: string;
  kind: string;
  scope: string;
  editable: boolean;
  payload: Record<string, unknown>;
  rationale: string;
  status: string;
}

export interface OrchestratePrepareMemoryContract {
  evidence: OrchestratePrepareMemoryEvidence[];
  operational_policy: OrchestratePrepareMemoryPolicy[];
  memory_banks: OrchestratePrepareMemoryBank[];
  evidence_hash: string;
  policy_hash: string;
  recall_policy?: OrchestratePrepareRecallPolicy | null;
  recall_preview?: OrchestratePrepareRecallPreview | null;
}

export interface OrchestrateMemoryPolicyProposalIntent {
  source_category: string;
  target_category: string;
  proposed_action: string;
  promotion_intent: string;
}

export interface OrchestrateMemoryPolicyProposal {
  proposal_id: string;
  proposal_type: string;
  target_scope: string;
  payload: Record<string, unknown>;
  proposal_intent: OrchestrateMemoryPolicyProposalIntent;
}

export interface OrchestrateMemoryRecallTrace {
  section?: string;
  read_first?: string[];
  risks?: string[];
  do_not?: string[];
  next_actions?: string[];
  selected_banks?: string[];
  recall_policy?: string[];
  recalled_evidence_count?: number;
  active_policy_count?: number;
  proposed_policy_count?: number;
  selected_bank_count?: number;
  hydration_handle_count?: number;
  proposed_policy_patches?: number;
  events?: Array<Record<string, unknown>>;
}

export interface OrchestratePrepareResult extends OrchestratePreviewResult {
  memory: OrchestratePrepareMemoryContract;
  memory_contract: OrchestratePrepareMemoryContract;
  memory_policy_proposals: OrchestrateMemoryPolicyProposal[];
  memory_recall: OrchestratePrepareRecallPreview | null;
  memory_recall_trace: OrchestrateMemoryRecallTrace;
}

export interface OutcomeRequest {
  agentUsed?: string;
  accepted?: boolean;
  testsPassed?: boolean;
  prMerged?: boolean;
  userFeedback?: string;
  citedAtomIds?: string[];
  dismissedAtomIds?: string[];
}

export type ArtifactExportFormat = 'signed' | 'markdown' | 'pdf' | 'json';

export interface ArtifactSignedExport {
  format: 'signed';
  artifact_id: string;
  node_id: string;
  signature: string;
  payload_hash: string;
  payload: Record<string, unknown>;
  signed: boolean;
}

export interface ArtifactMarkdownExport {
  format: 'markdown';
  artifact_id: string;
  content: string;
  content_type: string;
}

export interface ArtifactPdfExport {
  format: 'pdf';
  artifact_id: string;
  stub: boolean;
  reason: string;
  url?: string;
}

export type ArtifactExport =
  | ArtifactSignedExport
  | ArtifactMarkdownExport
  | ArtifactPdfExport;

export interface ArtifactForkResponse {
  forked: boolean;
  source_artifact_id: string;
  cloned_atom_count: number;
  artifact: ContextArtifact;
}

export interface ArtifactAttachResponse {
  attached: boolean;
  harness_attached: boolean;
  attachment: Record<string, unknown>;
}

export interface GraphFocusNode {
  id: number;
  title: string;
  slug: string;
  url: string;
  source_system: string;
  object_type: string;
  object_type_name: string;
  properties: Record<string, unknown>;
}

export interface GraphFocusEdge {
  id: number;
  from_object: number;
  to_object: number;
  edge_type: string;
  reason: string;
  strength: number;
  engine: string;
}

export interface GraphFocusResponse {
  stub: false;
  seed_ids: number[];
  nodes: GraphFocusNode[];
  edges: GraphFocusEdge[];
}

export interface GraphPatchesListResponse {
  stub: false;
  patches: Array<Record<string, unknown>>;
}

export interface InferenceKernelContract {
  kernel_id: string;
  epistemic_job: string;
  inference_family: string;
  consumes_view: string[];
  produces: string[];
  truth_type: string;
  validator: string;
  writeback_policy: string;
  source_module?: string;
  owner?: string;
  description?: string;
  source?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface InferenceRegistryReport {
  version: string;
  count: number;
  entries: InferenceKernelContract[];
  index: Record<string, InferenceKernelContract>;
}

export interface ExpressionRenderRequest {
  result: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ExpressionRenderResult {
  engine_id: string;
  artifact_type: string;
  payload: Record<string, unknown>;
  receipt_hash: string;
  writeback_policy: string;
}

export interface SolverContextCapsuleRequest {
  capsule: Record<string, unknown>;
  budget_tokens: number;
  token_ledger?: Record<string, unknown>;
  atoms?: Array<Record<string, unknown>>;
  exports?: Record<string, unknown>;
  input_view_refs?: string[];
}

export interface SolverResult {
  provider: string;
  formula_hash: string;
  input_view_refs: string[];
  status: string;
  model: Record<string, unknown>;
  counterexample: Record<string, unknown>;
  unsat_core_ref: string;
  unknown_reason: string;
  timeout_ms?: number | null;
  writeback_proposals: Array<Record<string, unknown>>;
}

export interface DiscoveryPreviewRequest {
  objective: string;
  hypothesis: string;
  action: Record<string, unknown>;
  context_refs?: string[];
  expected_value?: number;
}

export interface DiscoveryEvent {
  event_type: string;
  payload: Record<string, unknown>;
  event_hash: string;
}

export interface DiscoveryCandidate {
  candidate_id: string;
  hypothesis: string;
  action: Record<string, unknown>;
  expected_value: number;
  metadata: Record<string, unknown>;
}

export interface ValidatorReceipt {
  validator_id: string;
  status: string;
  command: string;
  output_summary: string;
  counterexample: Record<string, unknown>;
  duration_ms: number;
  receipt_hash: string;
}

export interface DiscoveryOutcome {
  outcome_id: string;
  candidate_id: string;
  validator_receipts: ValidatorReceipt[];
  passed: boolean;
  summary: string;
}

export interface DiscoveryWritebackProposal {
  proposal_id: string;
  target: string;
  reason: string;
  payload: Record<string, unknown>;
  review_required: boolean;
  writeback_policy: string;
}

export interface DiscoveryRunPreview {
  run_id: string;
  objective: string;
  status: string;
  context_refs: string[];
  candidates: DiscoveryCandidate[];
  outcomes: DiscoveryOutcome[];
  writeback_proposals: DiscoveryWritebackProposal[];
  events: DiscoveryEvent[];
  append_only: boolean;
  canonical_graph_mutation: boolean;
  validator_receipts?: ValidatorReceipt[];
  kernel_runs?: Record<string, unknown>[];
  candidate_archive_entries?: Record<string, unknown>[];
}

export interface DiscoveryRunCreateRequest {
  objective: string;
  run_id?: string;
  context_refs?: string[];
  hypothesis?: string;
  action?: Record<string, unknown>;
  expected_value?: number;
  metadata?: Record<string, unknown>;
  source_artifact_id?: string;
}

export interface DiscoveryValidatorReceiptRequest {
  candidate_id?: string;
  outcome_id?: string;
  validator_id: string;
  status?: string;
  command?: string;
  output_summary?: string;
  counterexample?: Record<string, unknown>;
  duration_ms?: number;
  payload?: Record<string, unknown>;
  receipt_hash?: string;
}

export interface DiscoveryFinishRequest {
  succeeded?: boolean;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface DiscoveryWritebackReviewRequest {
  review_status: string;
  reviewer?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface KernelResultReceipt {
  receipt_type: string;
  status: string;
  validator_id: string;
  payload: Record<string, unknown>;
  payload_hash: string;
  receipt_hash: string;
  writeback_proposals: Record<string, unknown>[];
  private_content_excluded: boolean;
}

export interface KernelRun {
  run_id: string;
  kernel_id: string;
  epistemic_job: string;
  inference_family: string;
  status: string;
  request_payload: Record<string, unknown>;
  result_payload: Record<string, unknown>;
  budget: Record<string, unknown>;
  metadata: Record<string, unknown>;
  error_payload: Record<string, unknown>;
  receipt_hash: string;
  duration_ms: number;
  writeback_policy: string;
  canonical_graph_mutation: boolean;
  discovery_run_id: string;
  result_receipts: KernelResultReceipt[];
  append_only: boolean;
}

export interface KernelRunRequest {
  kernel_id?: string;
  epistemic_job?: string;
  inference_family?: string;
  consumes_view?: string;
  discovery_run_id?: string;
  payload?: Record<string, unknown>;
  budget?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface KernelReceiptRequest {
  receipt_type?: string;
  status?: string;
  validator_id?: string;
  payload?: Record<string, unknown>;
  writeback_proposals?: Record<string, unknown>[];
}

export interface ContextCommandPayload {
  goal?: string;
  query?: string;
  user_id?: string;
  session_id?: string;
  folio_id?: string;
  notebook_id?: string;
  project_id?: string;
  current_url?: string;
  current_title?: string;
  selected_text?: string;
  open_tabs?: Array<Record<string, unknown>>;
  working_set?: Array<Record<string, unknown>>;
  exclusions?: Array<Record<string, unknown>>;
  memory_scope?: string;
  graph_layers?: string[];
  tool_scope?: string[];
  retrieval_policy?: Record<string, unknown>;
  output_target?: string;
  risk_mode?: string;
  permission_policy?: Record<string, unknown>;
  trace_policy?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ContextCommandState {
  command_id: string;
  goal?: string | null;
  query?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  folio_id?: string | null;
  notebook_id?: string | null;
  project_id?: string | null;
  current_page?: Record<string, unknown> | null;
  selected_text?: string | null;
  working_set: Array<Record<string, unknown>>;
  exclusions: Array<Record<string, unknown>>;
  hot_context: Array<Record<string, unknown>>;
  canonical_context: Array<Record<string, unknown>>;
  memory_scope?: string;
  graph_layers: string[];
  tool_scope: string[];
  retrieval_policy?: Record<string, unknown>;
  output_target?: string;
  risk_mode?: string;
  permission_policy?: Record<string, unknown>;
  trace_policy?: Record<string, unknown>;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface ContextCommandPreview {
  command_id: string;
  goal?: string | null;
  memory_scope?: string;
  risk_mode?: string;
  graph_layers?: string[];
  tool_scope?: string[];
  working_set_count: number;
  hot_context_count?: number;
  canonical_context_count?: number;
  excluded_count?: number;
  permissions?: Record<string, boolean>;
  warnings?: string[];
}

export interface ContextCommandResolveResponse {
  state: ContextCommandState;
  preview: ContextCommandPreview;
}

export interface ActionRailGenerateRequest {
  context_command_id?: string;
  context_command?: Record<string, unknown>;
  perception_bundle?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  folio_id?: string;
  current_url?: string;
  selected_text?: string;
  max_actions?: number;
  include_disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ActionRailAction extends Action {
  input_refs?: Array<Record<string, unknown>>;
  required_permissions?: Array<Record<string, unknown>>;
  confirmation_required?: boolean;
  payload?: Record<string, unknown>;
  disabled_reason?: string | null;
  provenance?: Record<string, unknown>;
  trace?: string[];
}

export interface ActionRailBundle {
  rail_id: string;
  actions: ActionRailAction[];
  grouped: Record<string, ActionRailAction[]>;
  context_summary: Record<string, unknown>;
  warnings: string[];
  metadata: Record<string, unknown>;
}

export interface ActionRailPreviewRequest {
  action_id?: string;
  action?: Record<string, unknown>;
}

export interface ActionRailPreview {
  action_id: string;
  action_type: string;
  execution_route: string;
  confirmation_required: boolean;
  required_permissions: Array<Record<string, unknown>>;
  payload: Record<string, unknown>;
  receipt_preview: {
    status: string;
    risk: string;
    score: number;
    does_not_execute: boolean;
  };
}

export interface ActionSelectedRequest {
  action_id: string;
  user_id?: string;
  session_id?: string;
  folio_id?: string;
}

export interface LearningProfileInstallRequest {
  enabled_by_default?: boolean;
}

export interface LearningProfileInstallResponse {
  profile: {
    profile_id: string;
    installed: boolean;
    enabled_by_default: boolean;
    plugin_ids: string[];
  };
}

export interface LearningProfileToolkitRequest {
  task_type: string;
  permissions?: string[];
  budget_tokens?: number;
}

export interface LearningToolkit {
  profile_id: string;
  task_type: string;
  budget_tokens: number;
  selected_tools: Array<Record<string, unknown>>;
  blocked_tools: Array<Record<string, unknown>>;
  validators: string[];
  plugin_ids: string[];
}

export interface LearningProfileToolkitResponse {
  toolkit: LearningToolkit;
}

export interface LearningContextSpendPlanRequest {
  profile_id: string;
  run_id?: string;
  task_signature: string;
  budget_tokens: number;
  candidate_atoms: Array<Record<string, unknown>>;
}

export interface LearningContextSpendPlan {
  spend_plan_id: string;
  profile_id: string;
  run_id: string;
  task_signature: string;
  budget_tokens: number;
  budget_allocation: Record<string, number>;
  hydration_policy: Record<string, string[]>;
  expected_savings: Record<string, unknown>;
  cache_keys: Record<string, unknown>;
  degradations: Record<string, unknown>;
}

export interface LearningContextSpendPlanResponse {
  spend_plan: LearningContextSpendPlan;
}

export interface LearningStructuralSignalRequest {
  plugin_id: string;
  profile_id?: string;
  task_signature_hash: string;
  task_type: string;
  graph_motif_hash: string;
  method_id: string;
  validator_id: string;
  outcome: Record<string, unknown>;
  token_metrics?: Record<string, unknown>;
  privacy: Record<string, unknown>;
  plugin_version?: string;
}

export interface LearningStructuralSignalResponse {
  signal: {
    signal_id: string;
    plugin_id: string;
    profile_id: string;
    task_type: string;
    privacy: Record<string, unknown>;
  };
}

export interface HarnessStep {
  step_id: string;
  run_id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at?: string | null;
}

export interface HarnessSearchRun {
  search_run_id: string;
  plan_id: string;
  query: string;
  status: string;
  result_payload: Record<string, unknown>;
  admission_proposals: Array<Record<string, unknown>>;
  created_at?: string | null;
}

export interface HarnessRun {
  run_id: string;
  task: string;
  actor: string;
  scope: Record<string, unknown>;
  status: string;
  steps: HarnessStep[];
  search_runs: HarnessSearchRun[];
  artifacts: Array<Record<string, unknown>>;
  memory_patches: Array<Record<string, unknown>>;
  validations: Array<Record<string, unknown>>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface HarnessEvent {
  event_id: string;
  run_id: string;
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  state_hash_before: string;
  state_hash_after: string;
  created_at?: string | null;
}

export interface HarnessGuardViolation {
  code: string;
  message: string;
  required_state: string;
  received_state: string;
  missing_fields: string[];
  details: Record<string, unknown>;
}

export interface HarnessTransitionRequest {
  type: string;
  payload?: Record<string, unknown>;
  actor?: string;
  idempotency_key?: string;
}

export interface HarnessTransitionResult {
  run: Record<string, unknown>;
  event: HarnessEvent;
  effects: Array<Record<string, unknown>>;
  state_hash_before: string;
  state_hash_after: string;
}

export interface HarnessStateHashResponse {
  run_id: string;
  state_hash: string;
}

export interface HarnessBeginRequest {
  task: string;
  actor?: string;
  scope?: Record<string, unknown>;
}

export interface HarnessSearchRequest {
  query: string;
  budget?: Record<string, unknown>;
  scope?: Record<string, unknown>;
  session_id?: string;
  folio_id?: string;
}

export interface HarnessContextRequest {
  task?: string;
  budget_tokens?: number;
  repo?: string;
  task_type?: TaskType | string;
  invariants?: string;
}

export interface HarnessContextWebRequest {
  query?: string;
  mode?: string;
  budget_tokens?: number;
  explicit_targets?: string[];
  allow_generated_artifacts?: boolean;
  folio_id?: string;
}

export interface ContextWebBudget {
  max_tokens: number;
  max_atoms: number;
  max_edges: number;
  max_paths: number;
  max_tools: number;
}

export interface ContextWebCitation {
  source_id: string;
  source_type: string;
  locator: string;
  excerpt_hash: string;
}

export interface ContextWebAtom {
  id: string;
  kind: string;
  title: string;
  summary: string;
  source_ref: string;
  score: number;
  estimated_tokens: number;
  channels: string[];
  citations: ContextWebCitation[];
  labels: string[];
  trigger_description?: string;
  why_relevant?: string;
  hydration_level?: string;
  hydration_handle?: string;
}

export interface ContextWebEdge {
  from_id: string;
  to_id: string;
  relation: string;
  reason: string;
  score: number;
}

export interface ContextWebPath {
  node_ids: string[];
  edge_relations: string[];
  score: number;
}

export interface ContextWebTokenLedger {
  raw_candidate_tokens: number;
  packed_tokens: number;
  saved_tokens: number;
  tool_schema_tokens_avoided: number;
  hydration_tokens_avoided: number;
  cache_hits: number;
}

export interface ContextWebSpendPlan {
  spend_plan_id: string;
  budget_allocation: Record<string, number>;
  hydration_policy: Record<string, string[]>;
  expected_savings: Record<string, unknown>;
  cache_keys: Record<string, unknown>;
  degradations: string[];
}

export interface ContextWebValidatorFinding {
  validator_id: string;
  severity: string;
  score: number;
  summary: string;
  affected_atom_ids: string[];
}

export interface ContextWebValidationSummary {
  findings: ContextWebValidatorFinding[];
  scores: Record<string, number>;
  passed: boolean;
}

export interface ContextWebEvaluation {
  naive_tokens: number;
  context_web_tokens: number;
  compression_ratio: number;
  graph_overhead: number;
  trivial_change_penalty: number;
  useful_when: string[];
  not_useful_when: string[];
}

export interface ContextWebIndex {
  repo_id: string;
  commit_sha: string;
  changed_files: string[];
  file_hashes: Record<string, string>;
  symbol_hashes: Record<string, string>;
  last_incremental_update: string;
  graph_state_hash: string;
  index_state_hash: string;
  update_strategy: string;
}

export interface ContextWebSpendPlanResponse {
  run_id: string;
  mode: string;
  pack_id: string;
  spend_plan: ContextWebSpendPlan;
  evaluation: ContextWebEvaluation;
  validation: ContextWebValidationSummary;
  top_atoms: ContextWebAtom[];
}

export interface ContextWebIndexUpdateRequest {
  repo_id?: string;
  repo?: string;
  commit_sha?: string;
  commitSha?: string;
  changed_files?: string[];
  changedFiles?: string[];
  file_hashes?: Record<string, string>;
  fileHashes?: Record<string, string>;
  symbol_hashes?: Record<string, string>;
  symbolHashes?: Record<string, string>;
  symbols?: string[];
}

export interface ContextWebPack {
  run_id: string;
  query: string;
  mode: string;
  budget: ContextWebBudget;
  atoms: ContextWebAtom[];
  edges: ContextWebEdge[];
  paths: ContextWebPath[];
  tools_used: Array<Record<string, unknown>>;
  source_mix: Record<string, number>;
  token_ledger: ContextWebTokenLedger;
  provenance: Record<string, unknown>;
  spend_plan: ContextWebSpendPlan;
  validation?: ContextWebValidationSummary;
  evaluation?: ContextWebEvaluation;
  index?: ContextWebIndex;
  state_hash: string;
}

export interface ContextWebExplainResponse {
  run_id: string;
  pack_id: string;
  atom_id: string;
  included: boolean;
  why_included: string;
  why_excluded: string;
  policies_applied: string[];
  mode: string;
  source_mix: Record<string, number>;
  budget: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface ProductAccountSummary {
  id: number;
  username: string;
  email: string;
}

export interface ProductTenantSummary {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  configuration: Record<string, unknown>;
  metadata: Record<string, unknown>;
  projects_count: number;
  api_keys_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductProjectSummary {
  id: number;
  name: string;
  slug: string;
  mode: string;
  status: string;
  description: string;
  tenant_slug: string | null;
  settings_override: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductAPIKeyQuota {
  requests_per_hour: number;
  requests_this_hour: number;
  remaining_this_hour: number;
}

export interface ProductAPIKeyCapabilities {
  can_import: boolean;
  can_webhook: boolean;
  can_sessions: boolean;
}

export interface ProductAPIKeySummary {
  id: number;
  name: string;
  tier: string;
  surface: string;
  is_active: boolean;
  requests_per_hour: number;
  tenant_slug: string | null;
  project_slug: string | null;
  masked_key: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  quota: ProductAPIKeyQuota;
  capabilities: ProductAPIKeyCapabilities;
  key?: string;
}

export interface ProductUsagePoint {
  day: string;
  count: number;
}

export interface ProductUsageCategory {
  usage_category: string;
  count: number;
}

export interface ProductUsageKeySummary {
  name: string;
  count: number;
}

export interface ProductUsageSummary {
  tenant_slug: string;
  days: number;
  total_requests: number;
  token_estimate_total: number;
  requests_last_hour: number;
  quota_limit: number;
  quota_remaining_estimate: number;
  by_day: ProductUsagePoint[];
  by_category: ProductUsageCategory[];
  by_key: ProductUsageKeySummary[];
}

export interface ProductBootstrapResponse {
  account: ProductAccountSummary;
  mode: string;
  auth_required: boolean;
  bootstrap_fallback_allowed: boolean;
  tenants: ProductTenantSummary[];
  default_tenant_slug: string | null;
}

export interface ProductTenantCreateRequest {
  name: string;
  slug?: string;
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ProductProjectCreateRequest {
  name: string;
  slug?: string;
  description?: string;
  mode?: string;
  settings_override?: Record<string, unknown>;
}

export interface ProductAPIKeyCreateRequest {
  name: string;
  tier?: string;
  project_slug?: string;
  requests_per_hour?: number;
  can_import?: boolean;
  can_webhook?: boolean;
  can_sessions?: boolean;
}

export interface SavedContextSummary {
  id: number;
  title: string;
  slug: string;
  kind: string;
  memory_role: string;
  status: string;
  content: string;
  summary: string;
  scope: Record<string, unknown>;
  metadata: Record<string, unknown>;
  tenant_slug: string;
  project_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedContextCreateRequest {
  title: string;
  slug?: string;
  kind?: string;
  memory_role?: string;
  content: string;
  summary?: string;
  project_slug?: string;
  scope?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SavedContextUpdateRequest {
  title?: string;
  kind?: string;
  memory_role?: string;
  content?: string;
  summary?: string;
  project_slug?: string | null;
  scope?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface HarnessPatchRequest {
  patch: Record<string, unknown>;
  validate?: boolean;
  source_category?: string;
  target_category?: string;
  target_scope?: string;
  proposed_action?: string;
  promotion_intent?: string;
  review_status?: string;
  queue_for_review?: boolean;
}

export interface HarnessForkRequest {
  through_step_id?: string;
  actor?: string;
}

export interface HarnessCompareRequest {
  before_run_id: string;
  after_run_id: string;
}

export interface THGNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface THGEdge {
  from_id: string;
  type: string;
  to_id: string;
  id?: string | null;
  properties: Record<string, unknown>;
}

export interface THGResult {
  ok?: boolean;
  command: string;
  status: string;
  payload: Record<string, unknown>;
  nodes: THGNode[];
  edges: THGEdge[];
  events: Array<Record<string, unknown>>;
  state_hash: string;
  error?: Record<string, unknown> | null;
}

export interface THGCommandRequest {
  command: string;
  payload?: Record<string, unknown>;
}

export interface THGCypherRequest {
  query: string;
  graph?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export type CompileStageName =
  | 'cache_hit'
  | 'routing'
  | 'retrieval'
  | 'evidence_assembly'
  | 'deliberation'
  | 'packing';

export type CompileEvent =
  | { event: 'stage'; data: { name: CompileStageName | string } }
  | { event: 'ready'; data: { artifact: ContextArtifact } }
  | { event: 'error'; data: { message: string } }
  | { event: 'done'; data: Record<string, never> };
