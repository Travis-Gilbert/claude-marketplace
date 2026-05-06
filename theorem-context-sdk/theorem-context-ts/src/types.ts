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

export interface HarnessPatchRequest {
  patch: Record<string, unknown>;
  validate?: boolean;
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
