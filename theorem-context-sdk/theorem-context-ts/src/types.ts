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
