/**
 * TheoremContextClient: typed client around the Context Compiler HTTP API.
 *
 * Surface mirrors the plan's specification:
 *   cc.context.compile()
 *   cc.context.compileStream()
 *   cc.context.estimate()
 *   cc.context.remember()
 *   cc.context.audit()
 *   cc.context.artifacts.list() / get() / export() / fork() / attach()
 *   cc.context.search.postmortems()
 *   cc.context.graph.focus()
 *   cc.context.graph.patches.list()
 *
 * Artifact exports are live for signed JSON and Markdown. PDF remains a
 * backend stub response. Artifact fork/attach, graph.focus, graph.patches.list,
 * compile, audit, list/get, outcome, and remember are fully wired.
 */

import type {
  ActionRailBundle,
  ActionRailGenerateRequest,
  ActionRailPreview,
  ActionRailPreviewRequest,
  ActionSelectedRequest,
  ArtifactExport,
  ArtifactExportFormat,
  ArtifactAttachResponse,
  ArtifactForkResponse,
  CompileEvent,
  CompileRequest,
  ContextArtifact,
  ContextCommandPayload,
  ContextCommandPreview,
  ContextCommandResolveResponse,
  DiscoveryFinishRequest,
  DiscoveryPreviewRequest,
  DiscoveryRunCreateRequest,
  DiscoveryRunPreview,
  DiscoveryValidatorReceiptRequest,
  DiscoveryWritebackReviewRequest,
  ExpressionRenderRequest,
  ExpressionRenderResult,
  ContextWebIndex,
  ContextWebIndexUpdateRequest,
  ContextWebExplainResponse,
  ContextWebPack,
  ContextWebSpendPlanResponse,
  GraphFocusResponse,
  GraphPatchesListResponse,
  InferenceRegistryReport,
  KernelReceiptRequest,
  KernelRun,
  KernelRunRequest,
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
  LearningContextSpendPlanRequest,
  LearningContextSpendPlanResponse,
  LearningProfileInstallRequest,
  LearningProfileInstallResponse,
  LearningProfileToolkitRequest,
  LearningProfileToolkitResponse,
  LearningStructuralSignalRequest,
  LearningStructuralSignalResponse,
  OutcomeRequest,
  OrchestrateRequest,
  OrchestratePreviewResult,
  OrchestratePrepareResult,
  OrchestrateResult,
  SolverContextCapsuleRequest,
  SolverResult,
  THGCommandRequest,
  THGCypherRequest,
  THGResult,
} from './types.js';
import {
  AuthError,
  CompileError,
  HarnessError,
  RequestTimeoutError,
  ServerUnavailableError,
} from './errors.js';

export interface TheoremContextClientOptions {
  baseUrl?: string;
  pluginsBaseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL =
  'https://index-api-production-a5f7.up.railway.app/api/v2/theseus';

export class TheoremContextClient {
  private readonly baseUrl: string;
  private readonly pluginsBaseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TheoremContextClientOptions = {}) {
    const envBaseUrl = readEnv('THEOREM_CONTEXT_BASE_URL');
    const envPluginsBaseUrl = readEnv('THEOREM_CONTEXT_PLUGINS_BASE_URL');
    this.baseUrl = (
      options.baseUrl ?? envBaseUrl ?? DEFAULT_BASE_URL
    ).replace(/\/$/, '');
    this.pluginsBaseUrl = (
      options.pluginsBaseUrl
      ?? envPluginsBaseUrl
      ?? derivePluginsBaseUrl(this.baseUrl)
    ).replace(/\/$/, '');
    this.apiKey = options.apiKey ?? readEnv('THEOREM_CONTEXT_API_KEY');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  readonly surfaceStatus = {
    artifacts: {
      export: {
        signed: 'live',
        markdown: 'live',
        pdf: 'stub',
      },
      fork: 'live',
      attach: 'live',
    },
    graph: {
      focus: 'live',
      patches: 'live',
    },
    harness: {
      public_run_model: 'AgentRunState',
      compatibility_layer: true,
      state_machine_public: false,
      state_machine_surface: 'thg',
      state_machine_run_model: 'HarnessRunState',
    },
    learning: {
      profiles: 'live',
      context_spend_plan: 'live',
      structural_signals: 'live',
    },
    orchestrate: {
      run: 'live',
      preview: 'live',
      prepare: 'live',
      authority: 'server',
      decision_runtime: 'live',
    },
    thg: {
      profiles: 'live',
      plugins: 'live',
    },
    inference: {
      registry: 'live',
      expression: 'live',
      solver: 'live',
      discovery_run_preview: 'live',
    },
  } as const;

  readonly context = {
    compile: this.compile.bind(this),
    compileStream: this.compileStream.bind(this),
    estimate: this.estimate.bind(this),
    remember: this.remember.bind(this),
    audit: this.audit.bind(this),
    outcome: this.outcome.bind(this),

    artifacts: {
      list: this.listArtifacts.bind(this),
      get: this.getArtifact.bind(this),
      export: this.exportArtifact.bind(this),
      fork: this.forkArtifact.bind(this),
      attach: this.attachArtifact.bind(this),
    },

    search: {
      postmortems: this.searchPostmortems.bind(this),
    },

    graph: {
      focus: this.graphFocus.bind(this),
      patches: {
        list: this.graphPatchesList.bind(this),
      },
    },
  };

  readonly harness = {
    begin: this.beginHarness.bind(this),
    get: this.getHarnessRun.bind(this),
    step: this.recordHarnessStep.bind(this),
    search: this.searchHarness.bind(this),
    context: this.compileHarnessContext.bind(this),
    contextWeb: this.compileHarnessContextWeb.bind(this),
    contextWebMini: this.compileHarnessContextWebMini.bind(this),
    contextWebReviewDelta: this.compileHarnessContextWebReviewDelta.bind(this),
    contextWebResearch: this.compileHarnessContextWebResearch.bind(this),
    contextWebBrowserFolio: this.compileHarnessContextWebBrowserFolio.bind(this),
    contextWebSpendPlan: this.compileHarnessContextWebSpendPlan.bind(this),
    contextWebExplain: this.explainHarnessContextWeb.bind(this),
    graphragContext: this.compileHarnessGraphRAGContext.bind(this),
    transition: this.transitionHarness.bind(this),
    events: this.harnessEvents.bind(this),
    stateHash: this.harnessStateHash.bind(this),
    contextInjected: this.contextInjectedHarness.bind(this),
    outcome: this.outcomeHarness.bind(this),
    patch: this.patchHarness.bind(this),
    replay: this.replayHarness.bind(this),
    fork: this.forkHarness.bind(this),
    compare: this.compareHarness.bind(this),
    thg: {
      command: this.thgCommand.bind(this),
      cypher: this.thgCypher.bind(this),
      profiles: {
        install: this.thgProfileInstall.bind(this),
        resolve: this.thgProfileResolve.bind(this),
        toolkit: this.thgProfileToolkit.bind(this),
        budget: this.thgProfileBudget.bind(this),
      },
      contextWeb: {
        updateIndex: this.thgContextWebUpdateIndex.bind(this),
      },
      plugins: {
        runBegin: this.thgPluginRunBegin.bind(this),
        runStep: this.thgPluginRunStep.bind(this),
        claimConsult: this.thgPluginClaimConsult.bind(this),
        outcomeRecord: this.thgPluginOutcomeRecord.bind(this),
      },
    },
  };

  readonly contextCommand = {
    resolve: this.resolveContextCommand.bind(this),
    get: this.getContextCommand.bind(this),
    preview: this.previewContextCommand.bind(this),
    latestFolio: {
      resolve: this.resolveLatestFolioContextCommand.bind(this),
      get: this.getLatestFolioContextCommand.bind(this),
    },
  };

  readonly actions = {
    generate: this.generateActionRail.bind(this),
    preview: this.previewActionRail.bind(this),
    recordSelected: this.recordSelectedAction.bind(this),
  };

  readonly learning = {
    profiles: {
      install: this.installLearningProfile.bind(this),
      toolkit: this.resolveLearningProfileToolkit.bind(this),
    },
    context: {
      spendPlan: this.createLearningContextSpendPlan.bind(this),
    },
    structuralSignals: {
      record: this.recordLearningStructuralSignal.bind(this),
    },
  };

  readonly inference = {
    registry: this.inferenceRegistry.bind(this),
    expression: {
      render: this.renderInferenceExpression.bind(this),
    },
    solver: {
      contextCapsule: this.solveInferenceContextCapsule.bind(this),
    },
    discoveryRuns: {
      preview: this.previewDiscoveryRun.bind(this),
      list: this.listDiscoveryRuns.bind(this),
      create: this.createDiscoveryRun.bind(this),
      get: this.getDiscoveryRun.bind(this),
      appendValidatorReceipt: this.appendDiscoveryValidatorReceipt.bind(this),
      finish: this.finishDiscoveryRun.bind(this),
      cancel: this.cancelDiscoveryRun.bind(this),
      reviewWriteback: this.reviewDiscoveryWriteback.bind(this),
    },
    kernelRuns: {
      list: this.listKernelRuns.bind(this),
      create: this.createKernelRun.bind(this),
      get: this.getKernelRun.bind(this),
      appendReceipt: this.appendKernelReceipt.bind(this),
    },
  };

  readonly runs = this.harness;

  readonly thg = {
    command: this.thgCommand.bind(this),
    cypher: this.thgCypher.bind(this),
    profiles: {
      install: this.thgProfileInstall.bind(this),
      resolve: this.thgProfileResolve.bind(this),
      toolkit: this.thgProfileToolkit.bind(this),
      budget: this.thgProfileBudget.bind(this),
    },
    contextWeb: {
      updateIndex: this.thgContextWebUpdateIndex.bind(this),
    },
    plugins: {
      runBegin: this.thgPluginRunBegin.bind(this),
      runStep: this.thgPluginRunStep.bind(this),
      claimConsult: this.thgPluginClaimConsult.bind(this),
      outcomeRecord: this.thgPluginOutcomeRecord.bind(this),
    },
  };

  readonly contextWeb = {
    updateIndex: this.thgContextWebUpdateIndex.bind(this),
  };

  private headers(): Record<string, string> {
    const out: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      out['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return out;
  }

  private async request(
    url: string,
    init: RequestInit,
    surface: string,
    kind: 'compile' | 'harness' = 'compile',
  ): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (error) {
      throw mapTransportError(kind, surface, error);
    }
    if (!response.ok) {
      throw await mapHttpError(kind, surface, response);
    }
    return response;
  }

  async compile(request: CompileRequest): Promise<ContextArtifact> {
    const response = await this.request(
      `${this.baseUrl}/context/compile/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'compile',
    );
    return (await response.json()) as ContextArtifact;
  }

  async *compileStream(
    request: CompileRequest,
  ): AsyncIterableIterator<CompileEvent> {
    const response = await this.request(
      `${this.baseUrl}/context/compile/stream/`,
      {
        method: 'POST',
        headers: { ...this.headers(), Accept: 'text/event-stream' },
        body: JSON.stringify(request),
      },
      'compile stream',
    );
    if (!response.body) {
      throw new CompileError('compile stream failed: empty response body');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let separator = buffer.indexOf('\n\n');
      while (separator !== -1) {
        const chunk = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const event = parseSseChunk(chunk);
        if (event) yield event;
        separator = buffer.indexOf('\n\n');
      }
    }
  }

  /**
   * Dry-run: estimate atom count and token shape without packing.
   * Implemented as a compile with budget=0 plus client-side counting; the
   * server returns excluded atoms with reasons so the client can show a
   * cost preview before the agent commits to a full compile.
   */
  async estimate(request: CompileRequest): Promise<{
    estimated_atoms: number;
    estimated_raw_tokens: number;
  }> {
    const result = await this.compile({ ...request, budget_tokens: 0 });
    return {
      estimated_atoms: result.atoms?.length ?? 0,
      estimated_raw_tokens: result.token_ledger?.rawCandidateTokens ?? 0,
    };
  }

  async orchestrate(request: OrchestrateRequest): Promise<OrchestrateResult> {
    const task = request.task.trim();
    if (!task) {
      throw new CompileError('orchestrate failed: task is required');
    }
    const response = await this.request(
      `${this.baseUrl}/orchestrate/run/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          ...request,
          task,
        }),
      },
      'orchestrate',
    );
    return (await response.json()) as OrchestrateResult;
  }

  async orchestratePreview(
    request: OrchestrateRequest,
  ): Promise<OrchestratePreviewResult> {
    const task = request.task.trim();
    if (!task) {
      throw new CompileError('orchestrate preview failed: task is required');
    }
    const response = await this.request(
      `${this.baseUrl}/orchestrate/preview/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          ...request,
          task,
        }),
      },
      'orchestrate preview',
    );
    return (await response.json()) as OrchestratePreviewResult;
  }

  async orchestratePrepare(
    request: OrchestrateRequest,
  ): Promise<OrchestratePrepareResult> {
    const task = request.task.trim();
    if (!task) {
      throw new CompileError('orchestrate prepare failed: task is required');
    }
    const response = await this.request(
      `${this.baseUrl}/orchestrate/prepare/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          ...request,
          task,
        }),
      },
      'orchestrate prepare',
    );
    return (await response.json()) as OrchestratePrepareResult;
  }

  async remember(input: { observation: string; evidence?: string[] }): Promise<{
    id: number;
    slug: string;
    title: string;
  }> {
    // Remember is exposed via the MCP surface; the canonical write path
    // for non-MCP clients is the workspace capture endpoint. We post to
    // the writeback router which already accepts plain Object writes.
    const response = await this.request(
      `${this.baseUrl}/writeback/object/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          title: input.observation.slice(0, 200),
          knowledge_content: input.observation,
          properties: { evidence: input.evidence ?? [] },
          source_system: 'context_theorem_sdk',
        }),
      },
      'remember',
    );
    return (await response.json()) as { id: number; slug: string; title: string };
  }

  async audit(artifactId: string): Promise<ContextArtifact> {
    const response = await this.request(
      `${this.baseUrl}/context/artifacts/${artifactId}/`,
      { method: 'GET', headers: this.headers() },
      'audit',
    );
    return (await response.json()) as ContextArtifact;
  }

  async outcome(artifactId: string, payload: OutcomeRequest): Promise<{
    artifact_id: string;
    status: string;
    feedback_counts: Record<string, number>;
  }> {
    const response = await this.request(
      `${this.baseUrl}/context/artifacts/${artifactId}/outcome/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'outcome',
    );
    return (await response.json()) as {
      artifact_id: string;
      status: string;
      feedback_counts: Record<string, number>;
    };
  }

  async listArtifacts(options: {
    task_type?: string;
    status?: string;
    repo?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    total: number;
    limit: number;
    offset: number;
    artifacts: ContextArtifact[];
  }> {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    const url = `${this.baseUrl}/context/artifacts/?${params.toString()}`;
    const response = await this.request(
      url,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'artifact list',
    );
    return (await response.json()) as {
      total: number;
      limit: number;
      offset: number;
      artifacts: ContextArtifact[];
    };
  }

  async getArtifact(artifactId: string): Promise<ContextArtifact> {
    return this.audit(artifactId);
  }

  async exportArtifact(
    artifactId: string,
    format: ArtifactExportFormat = 'signed',
  ): Promise<ArtifactExport> {
    const resolvedFormat = format === 'json' ? 'signed' : format;
    const response = await this.request(
      `${this.baseUrl}/context/artifacts/${artifactId}/export/${resolvedFormat}/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'artifact export',
    );
    if (resolvedFormat === 'markdown') {
      return {
        format: 'markdown',
        artifact_id: artifactId,
        content: await response.text(),
        content_type:
          response.headers.get('content-type') ?? 'text/markdown; charset=utf-8',
      };
    }

    const body = (await response.json()) as Record<string, unknown>;
    if (resolvedFormat === 'signed') {
      return {
        format: 'signed',
        artifact_id: artifactId,
        node_id: typeof body.node_id === 'string' ? body.node_id : '',
        signature: typeof body.signature === 'string' ? body.signature : '',
        payload_hash:
          typeof body.payload_hash === 'string' ? body.payload_hash : '',
        payload: isRecord(body.payload) ? body.payload : {},
        signed: Boolean(body.signed),
      };
    }

    return {
      format: 'pdf',
      artifact_id:
        typeof body.artifact_id === 'string' ? body.artifact_id : artifactId,
      stub: Boolean(body.stub),
      reason: typeof body.reason === 'string' ? body.reason : '',
      url: typeof body.url === 'string' ? body.url : undefined,
    };
  }

  async forkArtifact(
    artifactId: string,
    options: Record<string, unknown> = {},
  ): Promise<ArtifactForkResponse> {
    const response = await this.request(
      `${this.baseUrl}/context/artifacts/${artifactId}/fork/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(options),
      },
      'artifact fork',
    );
    return (await response.json()) as ArtifactForkResponse;
  }

  async attachArtifact(
    artifactId: string,
    target: string,
    options: { target_type?: string; metadata?: Record<string, unknown> } = {},
  ): Promise<ArtifactAttachResponse> {
    const response = await this.request(
      `${this.baseUrl}/context/artifacts/${artifactId}/attach/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          target,
          target_type: options.target_type ?? 'harness_run',
          metadata: options.metadata ?? {},
        }),
      },
      'artifact attach',
    );
    return (await response.json()) as ArtifactAttachResponse;
  }

  async resolveContextCommand(
    payload: ContextCommandPayload,
  ): Promise<ContextCommandResolveResponse> {
    const response = await this.request(
      `${this.baseUrl}/context-command/resolve/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'context command resolve',
    );
    return (await response.json()) as ContextCommandResolveResponse;
  }

  async getContextCommand(commandId: string): Promise<{
    state: Record<string, unknown>;
  }> {
    const response = await this.request(
      `${this.baseUrl}/context-command/${commandId}/`,
      { method: 'GET', headers: this.headers() },
      'context command get',
    );
    return (await response.json()) as { state: Record<string, unknown> };
  }

  async previewContextCommand(commandId: string): Promise<ContextCommandPreview> {
    const response = await this.request(
      `${this.baseUrl}/context-command/${commandId}/preview/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({}),
      },
      'context command preview',
    );
    return (await response.json()) as ContextCommandPreview;
  }

  async resolveLatestFolioContextCommand(
    folioId: string,
    payload: ContextCommandPayload,
  ): Promise<ContextCommandResolveResponse> {
    const response = await this.request(
      `${this.baseUrl}/context-command/folio/${folioId}/latest/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'latest folio command resolve',
    );
    return (await response.json()) as ContextCommandResolveResponse;
  }

  async getLatestFolioContextCommand(
    folioId: string,
  ): Promise<ContextCommandResolveResponse> {
    const response = await this.request(
      `${this.baseUrl}/context-command/folio/${folioId}/latest/`,
      { method: 'GET', headers: this.headers() },
      'latest folio command get',
    );
    return (await response.json()) as ContextCommandResolveResponse;
  }

  async generateActionRail(
    payload: ActionRailGenerateRequest,
  ): Promise<ActionRailBundle> {
    const response = await this.request(
      `${this.baseUrl}/action-rail/generate/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'action rail generate',
    );
    return (await response.json()) as ActionRailBundle;
  }

  async previewActionRail(
    payload: ActionRailPreviewRequest,
  ): Promise<ActionRailPreview> {
    const response = await this.request(
      `${this.baseUrl}/action-rail/preview-action/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'action rail preview',
    );
    return (await response.json()) as ActionRailPreview;
  }

  async recordSelectedAction(
    railId: string,
    payload: ActionSelectedRequest,
  ): Promise<{ ok: boolean }> {
    const response = await this.request(
      `${this.baseUrl}/action-rail/${railId}/selected/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'action rail selected',
    );
    return (await response.json()) as { ok: boolean };
  }

  async installLearningProfile(
    profileId: string,
    payload: LearningProfileInstallRequest = {},
  ): Promise<LearningProfileInstallResponse> {
    const response = await this.request(
      `${this.pluginsBaseUrl}/learning/profiles/${profileId}/install/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'learning profile install',
    );
    return (await response.json()) as LearningProfileInstallResponse;
  }

  async resolveLearningProfileToolkit(
    profileId: string,
    payload: LearningProfileToolkitRequest,
  ): Promise<LearningProfileToolkitResponse> {
    const response = await this.request(
      `${this.pluginsBaseUrl}/learning/profiles/${profileId}/toolkit/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'learning profile toolkit',
    );
    return (await response.json()) as LearningProfileToolkitResponse;
  }

  async createLearningContextSpendPlan(
    payload: LearningContextSpendPlanRequest,
  ): Promise<LearningContextSpendPlanResponse> {
    const response = await this.request(
      `${this.pluginsBaseUrl}/learning/context/spend-plan/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'learning context spend-plan',
    );
    return (await response.json()) as LearningContextSpendPlanResponse;
  }

  async recordLearningStructuralSignal(
    payload: LearningStructuralSignalRequest,
  ): Promise<LearningStructuralSignalResponse> {
    const response = await this.request(
      `${this.pluginsBaseUrl}/learning/structural-signals/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'learning structural signal',
    );
    return (await response.json()) as LearningStructuralSignalResponse;
  }

  async searchPostmortems(query: string): Promise<{
    results: Array<{ id: number; title: string }>;
  }> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/?q=${encodeURIComponent(query)}&postmortem=1`,
      { method: 'GET', headers: this.headers() },
    );
    if (!response.ok) {
      return { results: [] };
    }
    const body = (await response.json()) as {
      results?: Array<{ id: number; title: string }>;
    };
    return { results: body.results ?? [] };
  }

  async graphFocus(seedIds: number[]): Promise<GraphFocusResponse> {
    const response = await this.request(
      `${this.baseUrl}/context/graph/focus/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ seed_ids: seedIds }),
      },
      'graph focus',
    );
    return (await response.json()) as GraphFocusResponse;
  }

  async graphPatchesList(): Promise<GraphPatchesListResponse> {
    const response = await this.request(
      `${this.baseUrl}/context/graph/patches/`,
      { method: 'GET', headers: this.headers() },
      'graph patches list',
    );
    return (await response.json()) as GraphPatchesListResponse;
  }

  async inferenceRegistry(): Promise<InferenceRegistryReport> {
    const response = await this.request(
      `${this.baseUrl}/inference/registry/`,
      { method: 'GET', headers: this.headers() },
      'inference registry',
    );
    return (await response.json()) as InferenceRegistryReport;
  }

  async renderInferenceExpression(
    engineId: string,
    request: ExpressionRenderRequest,
  ): Promise<ExpressionRenderResult> {
    const response = await this.request(
      `${this.baseUrl}/inference/expression/${engineId}/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference expression render',
    );
    return (await response.json()) as ExpressionRenderResult;
  }

  async solveInferenceContextCapsule(
    request: SolverContextCapsuleRequest,
  ): Promise<SolverResult> {
    const response = await this.request(
      `${this.baseUrl}/inference/solver/context-capsule/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference solver context capsule',
    );
    return (await response.json()) as SolverResult;
  }

  async previewDiscoveryRun(
    request: DiscoveryPreviewRequest,
  ): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/preview/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference discovery run preview',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async listDiscoveryRuns(filters: Record<string, unknown> = {}): Promise<DiscoveryRunPreview[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${suffix}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'inference discovery runs list',
    );
    return (await response.json()) as DiscoveryRunPreview[];
  }

  async createDiscoveryRun(
    request: DiscoveryRunCreateRequest,
  ): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference discovery run create',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async getDiscoveryRun(runId: string): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${runId}/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'inference discovery run get',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async appendDiscoveryValidatorReceipt(
    runId: string,
    request: DiscoveryValidatorReceiptRequest,
  ): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${runId}/validator-receipts/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference discovery validator receipt',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async finishDiscoveryRun(
    runId: string,
    request: DiscoveryFinishRequest = {},
  ): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${runId}/finish/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference discovery finish',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async cancelDiscoveryRun(runId: string): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${runId}/cancel/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: '{}',
      },
      'inference discovery cancel',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async reviewDiscoveryWriteback(
    runId: string,
    proposalId: string,
    request: DiscoveryWritebackReviewRequest,
  ): Promise<DiscoveryRunPreview> {
    const response = await this.request(
      `${this.baseUrl}/inference/discovery-runs/${runId}/writeback-proposals/${proposalId}/review/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference discovery writeback review',
    );
    return (await response.json()) as DiscoveryRunPreview;
  }

  async listKernelRuns(filters: Record<string, unknown> = {}): Promise<KernelRun[]> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/inference/kernel-runs/${suffix}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'inference kernel runs list',
    );
    return (await response.json()) as KernelRun[];
  }

  async createKernelRun(request: KernelRunRequest): Promise<KernelRun> {
    const response = await this.request(
      `${this.baseUrl}/inference/kernel-runs/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference kernel run create',
    );
    return (await response.json()) as KernelRun;
  }

  async getKernelRun(runId: string): Promise<KernelRun> {
    const response = await this.request(
      `${this.baseUrl}/inference/kernel-runs/${runId}/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'inference kernel run get',
    );
    return (await response.json()) as KernelRun;
  }

  async appendKernelReceipt(
    runId: string,
    request: KernelReceiptRequest,
  ): Promise<KernelRun> {
    const response = await this.request(
      `${this.baseUrl}/inference/kernel-runs/${runId}/receipts/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'inference kernel receipt append',
    );
    return (await response.json()) as KernelRun;
  }

  async beginHarness(request: HarnessBeginRequest): Promise<HarnessRun> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness begin',
      'harness',
    );
    const body = (await response.json()) as { run: HarnessRun };
    return body.run;
  }

  async getHarnessRun(runId: string): Promise<HarnessRun> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/`,
      { method: 'GET', headers: this.headers() },
      'harness get',
      'harness',
    );
    const body = (await response.json()) as { run: HarnessRun };
    return body.run;
  }

  async recordHarnessStep(
    runId: string,
    request: { kind: string; payload?: Record<string, unknown> },
  ): Promise<HarnessStep> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/step/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness step',
      'harness',
    );
    const body = (await response.json()) as { step: HarnessStep };
    return body.step;
  }

  async searchHarness(
    runId: string,
    request: HarnessSearchRequest,
  ): Promise<HarnessSearchRun> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/search/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness search',
      'harness',
    );
    const body = (await response.json()) as { search: HarnessSearchRun };
    return body.search;
  }

  async compileHarnessContext(
    runId: string,
    request: HarnessContextRequest,
  ): Promise<ContextArtifact | Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/context/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness context',
      'harness',
    );
    const body = (await response.json()) as {
      artifact: ContextArtifact | Record<string, unknown>;
    };
    return body.artifact;
  }

  async compileHarnessContextWeb(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'context-web/',
      'harness context-web',
    );
  }

  async compileHarnessContextWebMini(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'context-web/mini/',
      'harness context-web mini',
    );
  }

  async compileHarnessContextWebReviewDelta(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'context-web/review-delta/',
      'harness context-web review delta',
    );
  }

  async compileHarnessContextWebResearch(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'context-web/research/',
      'harness context-web research',
    );
  }

  async compileHarnessContextWebBrowserFolio(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'context-web/browser-folio/',
      'harness context-web browser folio',
    );
  }

  async compileHarnessContextWebSpendPlan(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebSpendPlanResponse> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/context-web/spend-plan/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness context-web spend plan',
      'harness',
    );
    return (await response.json()) as ContextWebSpendPlanResponse;
  }

  async explainHarnessContextWeb(
    runId: string,
    packId: string,
    atomId: string,
  ): Promise<ContextWebExplainResponse> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/context-web/${packId}/explain/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ atom_id: atomId }),
      },
      'harness context-web explain',
      'harness',
    );
    const body = (await response.json()) as {
      explanation: ContextWebExplainResponse;
    };
    return body.explanation;
  }

  async compileHarnessGraphRAGContext(
    runId: string,
    request: HarnessContextWebRequest = {},
  ): Promise<ContextWebPack> {
    return this.requestHarnessContextWeb(
      runId,
      request,
      'graphrag-context/',
      'harness graphrag context',
    );
  }

  private async requestHarnessContextWeb(
    runId: string,
    request: HarnessContextWebRequest,
    path: string,
    surface: string,
  ): Promise<ContextWebPack> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/${path}`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      surface,
      'harness',
    );
    const body = (await response.json()) as {
      context_web_pack?: ContextWebPack;
      context_pack?: ContextWebPack;
    };
    return (body.context_web_pack ?? body.context_pack) as ContextWebPack;
  }

  async transitionHarness(
    runId: string,
    request: HarnessTransitionRequest,
  ): Promise<HarnessTransitionResult> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/transition/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness transition',
      'harness',
    );
    return (await response.json()) as HarnessTransitionResult;
  }

  async harnessEvents(runId: string): Promise<HarnessEvent[]> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/events/`,
      { method: 'GET', headers: this.headers() },
      'harness events',
      'harness',
    );
    const body = (await response.json()) as { events: HarnessEvent[] };
    return body.events;
  }

  async harnessStateHash(runId: string): Promise<HarnessStateHashResponse> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/state-hash/`,
      { method: 'GET', headers: this.headers() },
      'harness state hash',
      'harness',
    );
    return (await response.json()) as HarnessStateHashResponse;
  }

  async contextInjectedHarness(
    runId: string,
    request: { artifact_id: string; adapter?: string; target?: string },
  ): Promise<HarnessTransitionResult> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/context-injected/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness context injection',
      'harness',
    );
    return (await response.json()) as HarnessTransitionResult;
  }

  async outcomeHarness(
    runId: string,
    request: Record<string, unknown>,
  ): Promise<HarnessTransitionResult> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/outcome/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness outcome',
      'harness',
    );
    return (await response.json()) as HarnessTransitionResult;
  }

  async patchHarness(runId: string, request: HarnessPatchRequest): Promise<{
    patch: Record<string, unknown>;
    validation?: Record<string, unknown>;
    run?: HarnessRun;
  }> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/patch/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness patch',
      'harness',
    );
    return (await response.json()) as {
      patch: Record<string, unknown>;
      validation?: Record<string, unknown>;
      run?: HarnessRun;
    };
  }

  async replayHarness(runId: string): Promise<HarnessStep[]> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/replay/`,
      { method: 'GET', headers: this.headers() },
      'harness replay',
      'harness',
    );
    const body = (await response.json()) as { steps: HarnessStep[] };
    return body.steps;
  }

  async forkHarness(
    runId: string,
    request: HarnessForkRequest = {},
  ): Promise<HarnessRun> {
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${runId}/fork/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness fork',
      'harness',
    );
    const body = (await response.json()) as { run: HarnessRun };
    return body.run;
  }

  async compareHarness(
    beforeRunIdOrRequest: string | HarnessCompareRequest,
    afterRunId?: string,
  ): Promise<Record<string, unknown>> {
    const request =
      typeof beforeRunIdOrRequest === 'string'
        ? { before_run_id: beforeRunIdOrRequest, after_run_id: afterRunId ?? '' }
        : beforeRunIdOrRequest;
    const response = await this.request(
      `${this.baseUrl}/harness/runs/compare/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'harness compare',
      'harness',
    );
    const body = (await response.json()) as {
      comparison: Record<string, unknown>;
    };
    return body.comparison;
  }

  async thgCommand(
    commandOrRequest: string | THGCommandRequest,
    payload: Record<string, unknown> = {},
  ): Promise<THGResult> {
    const request =
      typeof commandOrRequest === 'string'
        ? { command: commandOrRequest, payload }
        : commandOrRequest;
    const response = await this.request(
      `${this.baseUrl}/harness/thg/command/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'thg command',
      'harness',
    );
    const body = (await response.json()) as { result: THGResult };
    return body.result;
  }

  async thgProfileInstall(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PROFILE.INSTALL', payload);
  }

  async thgProfileResolve(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PROFILE.RESOLVE', payload);
  }

  async thgProfileToolkit(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PROFILE.TOOLKIT', payload);
  }

  async thgProfileBudget(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PROFILE.BUDGET', payload);
  }

  async thgContextWebUpdateIndex(
    payload: ContextWebIndexUpdateRequest,
  ): Promise<ContextWebIndex> {
    const result = await this.thgCommand(
      'THG.CONTEXT_WEB.INDEX.UPDATE',
      payload as Record<string, unknown>,
    );
    return result.payload as unknown as ContextWebIndex;
  }

  async thgPluginRunBegin(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PLUGIN.RUN.BEGIN', payload);
  }

  async thgPluginRunStep(payload: Record<string, unknown>): Promise<THGResult> {
    return this.thgCommand('THG.PLUGIN.RUN.STEP', payload);
  }

  async thgPluginClaimConsult(
    payload: Record<string, unknown>,
  ): Promise<THGResult> {
    return this.thgCommand('THG.PLUGIN.CLAIM.CONSULT', payload);
  }

  async thgPluginOutcomeRecord(
    payload: Record<string, unknown>,
  ): Promise<THGResult> {
    return this.thgCommand('THG.PLUGIN.OUTCOME.RECORD', payload);
  }

  async thgCypher(request: THGCypherRequest): Promise<THGResult> {
    const response = await this.request(
      `${this.baseUrl}/harness/thg/cypher/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'thg cypher',
      'harness',
    );
    const body = (await response.json()) as { result: THGResult };
    return body.result;
  }
}

async function mapHttpError(
  kind: 'compile' | 'harness',
  surface: string,
  response: Response,
): Promise<Error> {
  const detail = (await safeResponseText(response)).trim();
  const suffix = detail ? ` ${detail}` : '';
  const message = `${surface} failed: ${response.status}${suffix}`;
  if (response.status === 401 || response.status === 403) {
    return new AuthError(message);
  }
  if (response.status === 408 || response.status === 504) {
    return new RequestTimeoutError(message);
  }
  if (response.status === 502 || response.status === 503) {
    return new ServerUnavailableError(message);
  }
  if (kind === 'harness') {
    return new HarnessError(message);
  }
  return new CompileError(message);
}

function mapTransportError(
  kind: 'compile' | 'harness',
  surface: string,
  error: unknown,
): Error {
  const message = error instanceof Error ? error.message : 'unknown error';
  if (error instanceof Error && isTimeoutError(error)) {
    return new RequestTimeoutError(`${surface} failed: ${message}`);
  }
  if (error instanceof Error && isServerUnavailableError(error)) {
    return new ServerUnavailableError(`${surface} failed: ${message}`);
  }
  if (kind === 'harness') {
    return new HarnessError(`${surface} failed: ${message}`);
  }
  return new CompileError(`${surface} failed: ${message}`);
}

async function safeResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function isTimeoutError(error: Error): boolean {
  return error.name === 'AbortError' || /timed?\s*out/i.test(error.message);
}

function isServerUnavailableError(error: Error): boolean {
  return (
    error.name === 'TypeError'
    || /ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|network/i.test(error.message)
  );
}

function parseSseChunk(chunk: string): CompileEvent | null {
  const lines = chunk.split(/\r?\n/);
  let event = '';
  let dataPayload = '';
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataPayload += line.slice(5).trim();
    }
  }
  if (!event) return null;
  let data: unknown = {};
  if (dataPayload) {
    try {
      data = JSON.parse(dataPayload);
    } catch {
      data = { raw: dataPayload };
    }
  }
  return { event, data } as CompileEvent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compactRecord(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  );
}

function taskTypeForOrchestrateMode(mode: string): string {
  if (mode === 'execute' || mode === 'debug') return 'fix';
  if (mode === 'plan' || mode === 'review' || mode === 'fix'
    || mode === 'refactor' || mode === 'research') {
    return mode;
  }
  return 'other';
}

function derivePluginsBaseUrl(baseUrl: string): string {
  if (baseUrl.endsWith('/theseus')) {
    return `${baseUrl.slice(0, -'/theseus'.length)}/plugins`;
  }
  return `${baseUrl}/plugins`;
}

function readEnv(name: string): string | undefined {
  const maybeProcess = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return maybeProcess?.env?.[name];
}
