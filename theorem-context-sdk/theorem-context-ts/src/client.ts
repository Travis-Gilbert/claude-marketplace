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
  EncodePlanRunRequest,
  EncodePlanRunResult,
  EncodePromotionRequest,
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
  AgentDomainCatalogRequest,
  AgentDomainCatalogResponse,
  AgentExplainContextRequest,
  AgentExplainContextResponse,
  AgentExportArtifactRequest,
  AgentExportArtifactResponse,
  AgentGraphqlResponse,
  AgentHydrateContextRequest,
  AgentHydrateContextResponse,
  AgentPrepareRequest,
  AgentPrepareResponse,
  AgentRecordOutcomeRequest,
  AgentRecordOutcomeResponse,
  AgentRecordStepRequest,
  AgentRecordStepResponse,
  AgentRecommendedToolPackRequest,
  AgentRecommendedToolPackResponse,
  AgentReviewMemoryRequest,
  AgentReviewMemoryResponse,
  AgentSearchContextRequest,
  AgentSearchContextResponse,
  AgentToolManifestResponse,
  ProductAPIKeyCreateRequest,
  ProductAPIKeySummary,
  ProductBootstrapResponse,
  MemoryPatchReviewQueueResponse,
  MemoryPatchReviewUpdateRequest,
  MemoryPatchReviewUpdateResponse,
  ProductProjectCreateRequest,
  ProductProjectSummary,
  ProductTenantMemberCreateRequest,
  ProductTenantMemberSummary,
  ProductTenantMemberUpdateRequest,
  ProductTenantCreateRequest,
  ProductTenantSummary,
  ProductTenantUpdateRequest,
  ProductUsageSummary,
  SavedContextCreateRequest,
  SavedContextRecallPreviewRequest,
  SavedContextRecallPreviewResponse,
  SavedContextPromoteMemoryPatchRequest,
  SavedContextSummary,
  SavedContextUpdateRequest,
  SolverContextCapsuleRequest,
  SolverResult,
  THGCommandRequest,
  THGCypherRequest,
  THGResult,
  Workstream,
  AgentSession,
  HandoffArtifact,
  WorkstreamResolveRequest,
  StartAgentSessionRequest,
  StartAgentSessionResponse,
  EndAgentSessionRequest,
  EndAgentSessionResponse,
  CompileHandoffRequest,
  HandoffListResponse,
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
  apiRootUrl?: string;
  pluginsBaseUrl?: string;
  thgProductBaseUrl?: string;
  thgApiToken?: string;
  thgTenantId?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL =
  'https://index-api-production-a5f7.up.railway.app/api/v2/theseus';
const DEFAULT_THG_PRODUCT_BASE_URL =
  'https://thg-product-production.up.railway.app';

export interface CodeSearchOptions {
  query: string;
  entityType?: string;
  entity_type?: string;
  language?: string;
  repo?: string;
  limit?: number;
}

export interface CodeCrawlOptions {
  repo?: string;
  path?: string;
  paths?: string[];
  language?: string;
  notebookId?: string;
  notebook_id?: string;
  graphWriteToken?: string;
  graph_write_token?: string;
}

export interface InstantKgStatusOptions {
  tenantSlug?: string;
  tenant_slug?: string;
  tenantId?: string;
  tenant_id?: string;
  manifest?: Record<string, unknown>;
  delta?: Record<string, unknown>;
}

export interface InstantKgReingestOptions {
  input: string;
  kind?: string;
  relationConfidenceFloor?: number;
  relation_confidence_floor?: number;
}

export interface FractalExpandOptions {
  query: string;
  runId?: string;
  run_id?: string;
  topK?: number;
  top_k?: number;
  budget?: Record<string, unknown>;
  scope?: Record<string, unknown>;
}

export interface ProvenanceTraceOptions {
  traceId?: string;
  trace_id?: string;
  objectPk?: string | number;
  object_pk?: string | number;
  query?: string;
  policyIntent?: string;
  policy_intent?: string;
  minConfidence?: number;
  min_confidence?: number;
  maxConfidence?: number;
  max_confidence?: number;
  limit?: number;
}

export interface DomainInstallOptions {
  user?: string;
  packSlugs?: string[];
  pack_slugs?: string[];
}

export interface CoordinateMessageOptions {
  message: string;
  docId?: string;
  doc_id?: string;
  urgency?: 'info' | 'ask' | 'block' | string;
  title?: string;
  tenantSlug?: string;
  tenant_slug?: string;
  metadata?: Record<string, unknown>;
}

export class TheoremContextClient {
  private readonly baseUrl: string;
  private readonly apiRootUrl: string;
  private readonly pluginsBaseUrl: string;
  private readonly thgProductBaseUrl: string;
  private readonly thgApiToken: string | undefined;
  private readonly thgTenantId: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TheoremContextClientOptions = {}) {
    const envBaseUrl = readEnv('THEOREM_CONTEXT_BASE_URL');
    const envPluginsBaseUrl = readEnv('THEOREM_CONTEXT_PLUGINS_BASE_URL');
    this.baseUrl = (
      options.baseUrl ?? envBaseUrl ?? DEFAULT_BASE_URL
    ).replace(/\/$/, '');
    this.apiRootUrl = (
      options.apiRootUrl
      ?? deriveApiRootUrl(this.baseUrl)
    ).replace(/\/$/, '');
    this.pluginsBaseUrl = (
      options.pluginsBaseUrl
      ?? envPluginsBaseUrl
      ?? derivePluginsBaseUrl(this.baseUrl)
    ).replace(/\/$/, '');
    this.thgProductBaseUrl = (
      options.thgProductBaseUrl
      ?? readEnv('RUSTYRED_THG_BASE_URL')
      ?? readEnv('THEOREMS_HARNESS_THG_BASE_URL')
      ?? readEnv('THEOREM_HOT_GRAPH_BASE_URL')
      ?? DEFAULT_THG_PRODUCT_BASE_URL
    ).replace(/\/$/, '');
    this.thgApiToken = (
      options.thgApiToken
      ?? readEnv('RUSTYRED_THG_API_TOKEN')
      ?? readEnv('THEOREMS_HARNESS_THG_API_TOKEN')
      ?? readEnv('THEOREM_HOT_GRAPH_API_TOKEN')
      ?? readEnv('THEOREM_THG_API_TOKEN')
    );
    this.thgTenantId = (
      options.thgTenantId
      ?? readEnv('THEOREMS_HARNESS_TENANT')
      ?? readEnv('RUSTYRED_THG_TENANT')
      ?? readEnv('THEOREM_TENANT_SLUG')
      ?? 'default'
    );
    this.apiKey = (
      options.apiKey
      ?? readEnv('THEOREM_API_KEY')
      ?? readEnv('THEOREM_CONTEXT_API_KEY')
    );
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
      mentions_wait: 'live',
      encode_memory: 'live',
    },
    learning: {
      profiles: 'live',
      context_spend_plan: 'live',
      structural_signals: 'live',
    },
    agent: {
      toolManifest: 'live',
      domainCatalog: 'live',
      recommendedToolPack: 'live',
      prepareAgent: 'live',
      searchContext: 'live',
      hydrateContext: 'live',
      recordStep: 'live',
      recordOutcome: 'live',
      explainContext: 'live',
      exportArtifact: 'live',
      reviewMemory: 'live',
      harnessRunConsole: 'live',
      memoryRecallPreview: 'live',
      actionRail: 'live',
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
    encode: {
      planRun: 'live',
      operatorsSearch: 'live',
      schemas: 'live',
      memory: 'live',
    },
    code: {
      search: 'live',
      crawl: 'live',
    },
    instantKg: {
      status: 'thg-product',
      reingest: 'live',
    },
    fractal: {
      expand: 'live',
    },
    provenance: {
      trace: 'live',
    },
    domains: {
      list: 'live',
      install: 'live',
    },
    coordinate: {
      send: 'live',
      mentions: 'live',
      mentionsWait: 'live',
      presence: 'live',
      subscribe: 'live',
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

  readonly agent = {
    toolManifest: this.getAgentToolManifest.bind(this),
    domainCatalog: this.getAgentDomainCatalog.bind(this),
    recommendedToolPack: this.getAgentRecommendedToolPack.bind(this),
    prepareAgent: this.getAgentPrepare.bind(this),
    searchContext: this.searchAgentContext.bind(this),
    hydrateContext: this.hydrateAgentContext.bind(this),
    recordStep: this.recordAgentStep.bind(this),
    recordOutcome: this.recordAgentOutcome.bind(this),
    explainContext: this.getAgentExplainContext.bind(this),
    exportArtifact: this.exportAgentArtifact.bind(this),
    reviewMemory: this.reviewAgentMemory.bind(this),
    harnessRunConsole: this.getAgentHarnessRunConsole.bind(this),
    memoryRecallPreview: this.getAgentMemoryRecallPreview.bind(this),
    actionRail: this.getAgentActionRail.bind(this),
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

  readonly product = {
    bootstrap: this.getProductBootstrap.bind(this),
    tenants: {
      list: this.listProductTenants.bind(this),
      create: this.createProductTenant.bind(this),
      get: this.getProductTenant.bind(this),
      update: this.updateProductTenant.bind(this),
    },
    projects: {
      list: this.listProductProjects.bind(this),
      create: this.createProductProject.bind(this),
    },
    members: {
      list: this.listProductTenantMembers.bind(this),
      create: this.createProductTenantMember.bind(this),
      update: this.updateProductTenantMember.bind(this),
    },
    keys: {
      list: this.listProductKeys.bind(this),
      create: this.createProductKey.bind(this),
    },
    usage: {
      get: this.getProductUsage.bind(this),
    },
    savedContexts: {
      list: this.listSavedContexts.bind(this),
      create: this.createSavedContext.bind(this),
      update: this.updateSavedContext.bind(this),
      previewRecall: this.previewRecall.bind(this),
      promoteMemoryPatch: this.promoteMemoryPatch.bind(this),
      mute: this.muteSavedContext.bind(this),
      activate: this.activateSavedContext.bind(this),
      delete: this.deleteSavedContext.bind(this),
    },
    memoryPatches: {
      review: {
        list: this.listMemoryPatchReviewQueue.bind(this),
        update: this.updateMemoryPatchReview.bind(this),
      },
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

  readonly encode = {
    getPlan: this.getEncodePlan.bind(this),
    runPlan: this.runEncodePlan.bind(this),
    getRun: this.getEncodeRun.bind(this),
    candidates: this.getEncodeRunCandidates.bind(this),
    shadow: this.shadowEncodeRun.bind(this),
    promote: this.promoteEncodeCandidate.bind(this),
    searchOperators: this.searchEncodeOperators.bind(this),
    schemas: this.listEncodeSchemas.bind(this),
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

  readonly code = {
    search: this.searchCode.bind(this),
    crawl: this.crawlCode.bind(this),
  };

  readonly instantKg = {
    status: this.instantKgStatus.bind(this),
    reingest: this.instantKgReingest.bind(this),
  };

  readonly instant_kg = this.instantKg;

  readonly fractal = {
    expand: this.expandFractal.bind(this),
  };

  readonly provenance = {
    trace: this.traceProvenance.bind(this),
  };

  readonly domains = {
    list: this.listDomains.bind(this),
    install: this.installDomains.bind(this),
  };

  readonly coordinate = Object.assign(
    (input: CoordinateMessageOptions) => this.sendCoordinate(input),
    {
      send: this.sendCoordinate.bind(this),
      mentions: this.mentions.bind(this),
      mentionsWait: this.mentionsWait.bind(this),
      mentions_wait: this.mentionsWait.bind(this),
      presence: this.presence.bind(this),
      subscribe: this.subscribe.bind(this),
    },
  );

  private headers(): Record<string, string> {
    const out: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      out['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return out;
  }

  private thgProductHeaders(): Record<string, string> {
    const out: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.thgApiToken) {
      out.Authorization = `Bearer ${this.thgApiToken}`;
    }
    return out;
  }

  private thgTenantUrl(input: {
    tenantSlug?: string;
    tenant_slug?: string;
    tenantId?: string;
    tenant_id?: string;
  } = {}): string {
    const tenantId = (
      input.tenant_id
      ?? input.tenantId
      ?? input.tenant_slug
      ?? input.tenantSlug
      ?? this.thgTenantId
    );
    return `${this.thgProductBaseUrl}/v1/tenants/${encodeURIComponent(tenantId)}`;
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

  async getProductBootstrap(): Promise<ProductBootstrapResponse> {
    const response = await this.request(
      `${this.baseUrl}/product/bootstrap/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product bootstrap',
    );
    return (await response.json()) as ProductBootstrapResponse;
  }

  async listProductTenants(): Promise<ProductTenantSummary[]> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product tenants list',
    );
    const body = (await response.json()) as { tenants: ProductTenantSummary[] };
    return body.tenants ?? [];
  }

  async createProductTenant(
    payload: ProductTenantCreateRequest,
  ): Promise<ProductTenantSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product tenant create',
    );
    const body = (await response.json()) as { tenant: ProductTenantSummary };
    return body.tenant;
  }

  async getProductTenant(tenantSlug: string): Promise<ProductTenantSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product tenant get',
    );
    const body = (await response.json()) as { tenant: ProductTenantSummary };
    return body.tenant;
  }

  async updateProductTenant(
    tenantSlug: string,
    payload: ProductTenantUpdateRequest,
  ): Promise<ProductTenantSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product tenant update',
    );
    const body = (await response.json()) as { tenant: ProductTenantSummary };
    return body.tenant;
  }

  async listProductProjects(tenantSlug: string): Promise<ProductProjectSummary[]> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/projects/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product projects list',
    );
    const body = (await response.json()) as { projects: ProductProjectSummary[] };
    return body.projects ?? [];
  }

  async createProductProject(
    tenantSlug: string,
    payload: ProductProjectCreateRequest,
  ): Promise<ProductProjectSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/projects/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product project create',
    );
    const body = (await response.json()) as { project: ProductProjectSummary };
    return body.project;
  }

  async listProductKeys(tenantSlug: string): Promise<ProductAPIKeySummary[]> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/keys/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product keys list',
    );
    const body = (await response.json()) as { keys: ProductAPIKeySummary[] };
    return body.keys ?? [];
  }

  async createProductKey(
    tenantSlug: string,
    payload: ProductAPIKeyCreateRequest,
  ): Promise<ProductAPIKeySummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/keys/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product key create',
    );
    const body = (await response.json()) as { api_key: ProductAPIKeySummary };
    return body.api_key;
  }

  async getProductUsage(
    tenantSlug: string,
    days?: number,
  ): Promise<ProductUsageSummary> {
    const query = new URLSearchParams();
    if (typeof days === 'number') {
      query.set('days', String(days));
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/usage/${suffix}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product usage get',
    );
    const body = (await response.json()) as { usage: ProductUsageSummary };
    return body.usage;
  }

  async listProductTenantMembers(
    tenantSlug: string,
  ): Promise<ProductTenantMemberSummary[]> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/members/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product tenant members list',
    );
    const body = (await response.json()) as { members: ProductTenantMemberSummary[] };
    return body.members ?? [];
  }

  async createProductTenantMember(
    tenantSlug: string,
    payload: ProductTenantMemberCreateRequest,
  ): Promise<ProductTenantMemberSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/members/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product tenant member create',
    );
    const body = (await response.json()) as { member: ProductTenantMemberSummary };
    return body.member;
  }

  async updateProductTenantMember(
    tenantSlug: string,
    membershipId: number,
    payload: ProductTenantMemberUpdateRequest,
  ): Promise<ProductTenantMemberSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/members/${membershipId}/`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product tenant member update',
    );
    const body = (await response.json()) as { member: ProductTenantMemberSummary };
    return body.member;
  }

  async listSavedContexts(
    tenantSlug: string,
    options: {
      projectSlug?: string;
      includeMuted?: boolean;
    } = {},
  ): Promise<SavedContextSummary[]> {
    const query = new URLSearchParams();
    if (options.projectSlug) {
      query.set('project_slug', options.projectSlug);
    }
    if (options.includeMuted) {
      query.set('include_muted', 'true');
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/${suffix}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'saved contexts list',
    );
    const body = (await response.json()) as {
      saved_contexts: SavedContextSummary[];
    };
    return body.saved_contexts ?? [];
  }

  async createSavedContext(
    tenantSlug: string,
    payload: SavedContextCreateRequest,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'saved context create',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async updateSavedContext(
    tenantSlug: string,
    entrySlug: string,
    payload: SavedContextUpdateRequest,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/`,
      {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'saved context update',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async promoteMemoryPatch(
    tenantSlug: string,
    payload: SavedContextPromoteMemoryPatchRequest,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/promote-memory-patch/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'saved context promote memory patch',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async previewRecall(
    tenantSlug: string,
    payload: SavedContextRecallPreviewRequest,
  ): Promise<SavedContextRecallPreviewResponse> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/preview-recall/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'saved context preview recall',
    );
    return (await response.json()) as SavedContextRecallPreviewResponse;
  }

  async muteSavedContext(
    tenantSlug: string,
    entrySlug: string,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/mute/`,
      {
        method: 'POST',
        headers: this.headers(),
      },
      'saved context mute',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async activateSavedContext(
    tenantSlug: string,
    entrySlug: string,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/activate/`,
      {
        method: 'POST',
        headers: this.headers(),
      },
      'saved context activate',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async deleteSavedContext(
    tenantSlug: string,
    entrySlug: string,
  ): Promise<SavedContextSummary> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/`,
      {
        method: 'DELETE',
        headers: this.headers(),
      },
      'saved context delete',
    );
    const body = (await response.json()) as { saved_context: SavedContextSummary };
    return body.saved_context;
  }

  async listMemoryPatchReviewQueue(
    tenantSlug: string,
    options: {
      projectSlug?: string;
      reviewStatus?: string;
      limit?: number;
    } = {},
  ): Promise<MemoryPatchReviewQueueResponse> {
    const query = new URLSearchParams();
    if (options.projectSlug) {
      query.set('project_slug', options.projectSlug);
    }
    if (options.reviewStatus) {
      query.set('review_status', options.reviewStatus);
    }
    if (typeof options.limit === 'number') {
      query.set('limit', String(options.limit));
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/memory-patches/review/${suffix}`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'product memory patch review list',
    );
    return (await response.json()) as MemoryPatchReviewQueueResponse;
  }

  async updateMemoryPatchReview(
    tenantSlug: string,
    runId: string,
    patchId: string,
    payload: MemoryPatchReviewUpdateRequest,
  ): Promise<MemoryPatchReviewUpdateResponse> {
    const response = await this.request(
      `${this.baseUrl}/product/tenants/${tenantSlug}/memory-patches/review/${runId}/${patchId}/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'product memory patch review update',
    );
    return (await response.json()) as MemoryPatchReviewUpdateResponse;
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

  /**
   * Unified cross-surface memory recall (MEM-032).
   *
   * Hits the harness recall endpoint added in MEM-029
   * (`POST /api/v2/theseus/harness/recall`) which wraps
   * `apps.orchestrate.runtime.cross_surface_memory.recall`. Returns
   * inline document content with actor/surface/session provenance,
   * matching the MCP `recall` verb's shape.
   *
   * Use to load prior cross-surface memory: documents, saved nodes,
   * harness runs, context artifacts. Mirror the MCP verb's input
   * parameters one-to-one so MCP-aware callers and HTTP callers
   * reach the same store with the same semantics.
   */
  async recall(input: {
    query?: string;
    actor?: string;
    surface?: string;
    kind?: string;
    since?: string;
    limit?: number;
    tenantSlug?: string;
    includeLowFitness?: boolean;
    includeConsolidationSources?: boolean;
    consumeHandoffs?: boolean;
  } = {}): Promise<{ results: unknown[]; count: number }> {
    const body: Record<string, unknown> = {
      query: input.query ?? '',
      limit: input.limit ?? 10,
      include_low_fitness: input.includeLowFitness ?? false,
      include_consolidation_sources: input.includeConsolidationSources ?? false,
      consume_handoffs: input.consumeHandoffs ?? false,
    };
    if (input.actor) body.actor = input.actor;
    if (input.surface) body.surface = input.surface;
    if (input.kind) body.kind = input.kind;
    if (input.since) body.since = input.since;
    if (input.tenantSlug) body.tenant_slug = input.tenantSlug;

    const response = await this.request(
      `${this.baseUrl}/harness/recall/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      },
      'recall',
      'harness',
    );
    return (await response.json()) as { results: unknown[]; count: number };
  }

  async selfNote(input: {
    content: string;
    title?: string;
    kind?: string;
    memoryNodeType?: string;
    tenantSlug?: string;
    tags?: string[];
    links?: string[];
    summary?: string;
  }): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/memory/self-note/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          title: input.title,
          content: input.content,
          kind: input.kind ?? 'self_note',
          memory_node_type: input.memoryNodeType ?? 'belief',
          tags: input.tags ?? [],
          links: input.links ?? [],
          summary: input.summary ?? '',
        }),
      },
      'self note',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async selfRevise(input: {
    docId: string;
    content: string;
    title?: string;
    summary?: string;
    reason?: string;
    memoryNodeType?: string;
    tenantSlug?: string;
    citesDocIds?: string[];
    derivedFromDocIds?: string[];
  }): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/memory/self-revise/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          doc_id: input.docId,
          content: input.content,
          title: input.title,
          summary: input.summary ?? '',
          reason: input.reason ?? '',
          memory_node_type: input.memoryNodeType,
          cites_doc_ids: input.citesDocIds ?? [],
          derived_from_doc_ids: input.derivedFromDocIds ?? [],
        }),
      },
      'self revise',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async selfArchive(input: {
    docId: string;
    reason?: string;
    title?: string;
    tenantSlug?: string;
  }): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/memory/self-archive/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          doc_id: input.docId,
          reason: input.reason ?? '',
          title: input.title,
        }),
      },
      'self archive',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async selfRecallArchive(input: {
    query?: string;
    actor?: string;
    limit?: number;
    tenantSlug?: string;
  } = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/memory/self-recall-archive/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          query: input.query ?? '',
          actor: input.actor,
          limit: input.limit ?? 10,
        }),
      },
      'self recall archive',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async encodeMemory(input: {
    content: string;
    title?: string;
    kind?: 'encode' | 'feedback' | 'solution' | 'postmortem' | string;
    outcome?: 'positive' | 'negative' | 'mixed' | 'neutral' | string;
    signal?: string;
    reason?: string;
    eventId?: string;
    tenantSlug?: string;
    tags?: string[];
    links?: string[];
    summary?: string;
    metadata?: Record<string, unknown>;
    context?: Record<string, unknown>;
    autoTriggered?: boolean;
  }): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/encode/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          title: input.title,
          content: input.content,
          kind: input.kind ?? 'encode',
          outcome: input.outcome ?? 'neutral',
          signal: input.signal,
          reason: input.reason ?? '',
          event_id: input.eventId ?? '',
          tags: input.tags ?? [],
          links: input.links ?? [],
          summary: input.summary ?? '',
          metadata: input.metadata ?? {},
          context: input.context ?? {},
          auto_triggered: input.autoTriggered ?? false,
        }),
      },
      'encode memory',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async searchCode(
    queryOrOptions: string | CodeSearchOptions,
  ): Promise<Record<string, unknown>> {
    const input = typeof queryOrOptions === 'string'
      ? { query: queryOrOptions }
      : queryOrOptions;
    const query = new URLSearchParams();
    query.set('search', input.query);
    const optional = {
      entity_type: input.entity_type ?? input.entityType,
      language: input.language,
      repo: input.repo,
      limit: input.limit,
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    }
    const response = await this.request(
      `${this.baseUrl}/code/symbols/?${query.toString()}`,
      { method: 'GET', headers: this.headers() },
      'code search',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async crawlCode(input: CodeCrawlOptions = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/code/ingest/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          repo: input.repo ?? null,
          path: input.path ?? null,
          paths: input.paths ?? null,
          language: input.language ?? null,
          notebook_id: input.notebook_id ?? input.notebookId ?? null,
          graph_write_token: input.graph_write_token ?? input.graphWriteToken ?? null,
        }),
      },
      'code crawl',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async instantKgStatus(
    input: InstantKgStatusOptions = {},
  ): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.thgTenantUrl(input)}/instant-kg/status`,
      {
        method: 'POST',
        headers: this.thgProductHeaders(),
        body: JSON.stringify(compactRecord({
          manifest: input.manifest,
          delta: input.delta,
        })),
      },
      'instant kg status',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async instantKgReingest(
    inputOrUrl: string | InstantKgReingestOptions,
  ): Promise<Record<string, unknown>> {
    const input = typeof inputOrUrl === 'string'
      ? { input: inputOrUrl }
      : inputOrUrl;
    const response = await this.request(
      `${this.baseUrl}/capture/instant-kg/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(compactRecord({
          input: input.input,
          kind: input.kind ?? 'url',
          relation_confidence_floor:
            input.relation_confidence_floor ?? input.relationConfidenceFloor,
        })),
      },
      'instant kg reingest',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async expandFractal(
    queryOrOptions: string | FractalExpandOptions,
  ): Promise<Record<string, unknown>> {
    const input = typeof queryOrOptions === 'string'
      ? { query: queryOrOptions }
      : queryOrOptions;
    let activeRunId = input.run_id ?? input.runId;
    if (!activeRunId) {
      const begin = await this.beginHarness({
        task: `Research: ${input.query}`,
        actor: 'agent',
        scope: { mode: 'research', source: 'theorem-context-sdk' },
      });
      activeRunId = begin.run_id;
    }
    if (!activeRunId) {
      throw new HarnessError('fractal expand failed: unable to resolve harness run id');
    }
    const budget = {
      ...(input.budget ?? {}),
      top_k: input.top_k ?? input.topK ?? input.budget?.top_k ?? 20,
    };
    const response = await this.request(
      `${this.baseUrl}/harness/runs/${activeRunId}/fractal-expansion/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          query: input.query,
          budget,
          scope: input.scope ?? {},
        }),
      },
      'fractal expand',
      'harness',
    );
    return {
      run_id: activeRunId,
      ...((await response.json()) as Record<string, unknown>),
    };
  }

  async traceProvenance(
    input: ProvenanceTraceOptions = {},
  ): Promise<Record<string, unknown>> {
    const traceId = input.trace_id ?? input.traceId;
    const objectPk = input.object_pk ?? input.objectPk;
    if (traceId && objectPk !== undefined && objectPk !== null) {
      const response = await this.request(
        `${this.baseUrl}/trace/${encodeURIComponent(traceId)}/explain/${encodeURIComponent(String(objectPk))}/`,
        { method: 'GET', headers: this.headers() },
        'provenance trace explain',
        'harness',
      );
      return (await response.json()) as Record<string, unknown>;
    }
    if (traceId) {
      const response = await this.request(
        `${this.baseUrl}/trace/${encodeURIComponent(traceId)}/`,
        { method: 'GET', headers: this.headers() },
        'provenance trace',
        'harness',
      );
      return (await response.json()) as Record<string, unknown>;
    }
    const query = new URLSearchParams();
    const optional = {
      query: input.query ?? '',
      policy_intent: input.policy_intent ?? input.policyIntent,
      min_confidence: input.min_confidence ?? input.minConfidence,
      max_confidence: input.max_confidence ?? input.maxConfidence,
      limit: input.limit ?? 20,
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value !== undefined && value !== '') {
        query.set(key, String(value));
      }
    }
    const response = await this.request(
      `${this.baseUrl}/trace/search/?${query.toString()}`,
      { method: 'GET', headers: this.headers() },
      'provenance trace search',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async listDomains(
    userOrOptions: string | { user?: string } = {},
  ): Promise<Record<string, unknown>> {
    const user = typeof userOrOptions === 'string'
      ? userOrOptions
      : userOrOptions.user;
    const query = new URLSearchParams();
    if (user) {
      query.set('user', user);
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.apiRootUrl}/packs/${suffix}`,
      { method: 'GET', headers: this.headers() },
      'domain list',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async installDomains(
    packSlugsOrOptions: string[] | DomainInstallOptions,
  ): Promise<Record<string, unknown>> {
    const input = Array.isArray(packSlugsOrOptions)
      ? { pack_slugs: packSlugsOrOptions }
      : packSlugsOrOptions;
    const response = await this.request(
      `${this.apiRootUrl}/pack-installs/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          user: input.user ?? 'me',
          pack_slugs: input.pack_slugs ?? input.packSlugs ?? [],
        }),
      },
      'domain install',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async sendCoordinate(
    input: CoordinateMessageOptions,
  ): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/coordinate/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenant_slug ?? input.tenantSlug,
          doc_id: input.doc_id ?? input.docId,
          message: input.message,
          urgency: input.urgency ?? 'info',
          title: input.title,
          metadata: input.metadata ?? {},
        }),
      },
      'coordinate',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async mentions(input: {
    actor?: string;
    tenantSlug?: string;
    limit?: number;
    consume?: boolean;
  } = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/mentions/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          actor: input.actor,
          limit: input.limit ?? 20,
          consume: input.consume ?? false,
        }),
      },
      'mentions',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async mentionsWait(input: {
    actor?: string;
    tenantSlug?: string;
    limit?: number;
    consume?: boolean;
    timeoutSeconds?: number;
    intervalSeconds?: number;
  } = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/mentions/wait/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          actor: input.actor,
          limit: input.limit ?? 20,
          consume: input.consume ?? false,
          timeout_seconds: input.timeoutSeconds ?? 30,
          interval_seconds: input.intervalSeconds ?? 1,
        }),
      },
      'mentions wait',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async presence(input: {
    actor?: string;
    tenantSlug?: string;
    sessionId?: string;
    surface?: string;
    ttlSeconds?: number;
    status?: string;
    mode?: 'heartbeat' | 'get' | string;
  } = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/presence/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          actor: input.actor,
          session_id: input.sessionId,
          surface: input.surface,
          ttl_seconds: input.ttlSeconds ?? 60,
          status: input.status ?? 'active',
          mode: input.mode ?? 'heartbeat',
        }),
      },
      'presence',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async subscribe(input: {
    actor?: string;
    tenantSlug?: string;
    docId?: string;
  } = {}): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/harness/subscribe/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          tenant_slug: input.tenantSlug,
          actor: input.actor,
          doc_id: input.docId,
        }),
      },
      'subscribe',
      'harness',
    );
    return (await response.json()) as Record<string, unknown>;
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

  async getAgentToolManifest(): Promise<AgentToolManifestResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/tool-manifest/`,
      {
        method: 'GET',
        headers: this.headers(),
      },
      'agent tool manifest',
    );
    return (await response.json()) as AgentToolManifestResponse;
  }

  async getAgentDomainCatalog(
    actorOrPayload: string | AgentDomainCatalogRequest = {},
  ): Promise<AgentDomainCatalogResponse> {
    const payload =
      typeof actorOrPayload === 'string'
        ? { actor: actorOrPayload }
        : actorOrPayload;
    const response = await this.request(
      `${this.baseUrl}/agent/domain-catalog/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent domain catalog',
    );
    return (await response.json()) as AgentDomainCatalogResponse;
  }

  async getAgentRecommendedToolPack(
    payload: AgentRecommendedToolPackRequest = {},
  ): Promise<AgentRecommendedToolPackResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/recommended-toolpack/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent recommended toolpack',
    );
    return (await response.json()) as AgentRecommendedToolPackResponse;
  }

  async getAgentPrepare(
    payload: AgentPrepareRequest = {},
  ): Promise<AgentPrepareResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/prepare/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent prepare',
    );
    return (await response.json()) as AgentPrepareResponse;
  }

  async searchAgentContext(
    payload: AgentSearchContextRequest = {},
  ): Promise<AgentSearchContextResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/search-context/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent search context',
      'harness',
    );
    return (await response.json()) as AgentSearchContextResponse;
  }

  async hydrateAgentContext(
    payload: AgentHydrateContextRequest = {},
  ): Promise<AgentHydrateContextResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/hydrate-context/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent hydrate context',
      'harness',
    );
    return (await response.json()) as AgentHydrateContextResponse;
  }

  async recordAgentStep(
    payload: AgentRecordStepRequest = {},
  ): Promise<AgentRecordStepResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/record-step/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent record step',
      'harness',
    );
    return (await response.json()) as AgentRecordStepResponse;
  }

  async recordAgentOutcome(
    payload: AgentRecordOutcomeRequest = {},
  ): Promise<AgentRecordOutcomeResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/record-outcome/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent record outcome',
      'harness',
    );
    return (await response.json()) as AgentRecordOutcomeResponse;
  }

  async getAgentExplainContext(
    payload: AgentExplainContextRequest = {},
  ): Promise<AgentExplainContextResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/explain-context/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent explain context',
    );
    return (await response.json()) as AgentExplainContextResponse;
  }

  async exportAgentArtifact(
    payload: AgentExportArtifactRequest = {},
  ): Promise<AgentExportArtifactResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/export-artifact/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent export artifact',
      'harness',
    );
    return (await response.json()) as AgentExportArtifactResponse;
  }

  async reviewAgentMemory(
    payload: AgentReviewMemoryRequest = {},
  ): Promise<AgentReviewMemoryResponse> {
    const response = await this.request(
      `${this.baseUrl}/agent/review-memory/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
      'agent review memory',
      'harness',
    );
    return (await response.json()) as AgentReviewMemoryResponse;
  }

  async getAgentHarnessRunConsole(
    runId: string,
  ): Promise<AgentGraphqlResponse<Record<string, unknown>>> {
    return this.requestAgentGraphql('harnessRunConsole', { runId });
  }

  async getAgentMemoryRecallPreview(
    runId: string,
  ): Promise<AgentGraphqlResponse<Record<string, unknown>>> {
    return this.requestAgentGraphql('memoryRecallPreview', { runId });
  }

  async getAgentActionRail(
    runId: string,
  ): Promise<AgentGraphqlResponse<Record<string, unknown>>> {
    return this.requestAgentGraphql('actionRail', { runId });
  }

  private async requestAgentGraphql<T extends Record<string, unknown> = Record<string, unknown>>(
    operationName: string,
    variables: Record<string, unknown>,
  ): Promise<AgentGraphqlResponse<T>> {
    const response = await this.request(
      `${this.baseUrl}/graphql/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ operationName, variables }),
      },
      `agent graphql ${operationName}`,
      'harness',
    );
    const body = (await response.json()) as AgentGraphqlResponse<T>;
    return body;
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

  async getEncodePlan(planId = 'mcp_protocol_v1'): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/encode/plans/${planId}/`,
      { method: 'GET', headers: this.headers() },
      'encode plan get',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async runEncodePlan(
    request: EncodePlanRunRequest,
  ): Promise<EncodePlanRunResult> {
    const response = await this.request(
      `${this.baseUrl}/encode/plan/run/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'encode plan run',
    );
    return (await response.json()) as EncodePlanRunResult;
  }

  async getEncodeRun(runId: string): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/encode/runs/${runId}/`,
      { method: 'GET', headers: this.headers() },
      'encode run get',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async getEncodeRunCandidates(runId: string): Promise<Array<Record<string, unknown>>> {
    const response = await this.request(
      `${this.baseUrl}/encode/runs/${runId}/candidates/`,
      { method: 'GET', headers: this.headers() },
      'encode run candidates',
    );
    return (await response.json()) as Array<Record<string, unknown>>;
  }

  async shadowEncodeRun(runId: string): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/encode/runs/${runId}/shadow/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: '{}',
      },
      'encode shadow',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async promoteEncodeCandidate(
    candidateId: string,
    request: EncodePromotionRequest = {},
  ): Promise<Record<string, unknown>> {
    const response = await this.request(
      `${this.baseUrl}/encode/proposals/${candidateId}/promote/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'encode promote',
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async searchEncodeOperators(
    filters: Record<string, unknown> = {},
  ): Promise<Array<Record<string, unknown>>> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/encode/operators/search/${suffix}`,
      { method: 'GET', headers: this.headers() },
      'encode operators search',
    );
    return (await response.json()) as Array<Record<string, unknown>>;
  }

  async listEncodeSchemas(
    filters: Record<string, unknown> = {},
  ): Promise<Array<Record<string, unknown>>> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await this.request(
      `${this.baseUrl}/encode/schemas/${suffix}`,
      { method: 'GET', headers: this.headers() },
      'encode schemas',
    );
    return (await response.json()) as Array<Record<string, unknown>>;
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

  // -------------------------------------------------------------------
  // Continuous Agent Memory Harness — workstream + handoff surface.
  // Mirrors apps/orchestrate/api/workstream.py routes; see
  // Index-API/docs/Harness Expansion.md §1, §5, §12.
  // -------------------------------------------------------------------

  readonly workstream = {
    resolve: this.resolveWorkstream.bind(this),
    get: this.getWorkstream.bind(this),
    handoffs: this.listWorkstreamHandoffs.bind(this),
    session: {
      start: this.startAgentSession.bind(this),
      end: this.endAgentSession.bind(this),
    },
    handoff: {
      current: this.compileCurrentHandoff.bind(this),
    },
  };

  readonly handoff = {
    get: this.getHandoff.bind(this),
  };

  async resolveWorkstream(
    request: WorkstreamResolveRequest,
  ): Promise<Workstream> {
    const response = await this.request(
      `${this.baseUrl}/workstream/resolve/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'workstream resolve',
      'harness',
    );
    const body = (await response.json()) as Partial<Workstream> & {
      workstream?: Workstream;
    };
    return (body.workstream ?? (body as Workstream));
  }

  async getWorkstream(workstreamId: string): Promise<Workstream> {
    const response = await this.request(
      `${this.baseUrl}/workstream/${workstreamId}/`,
      { method: 'GET', headers: this.headers() },
      'workstream get',
      'harness',
    );
    const body = (await response.json()) as Partial<Workstream> & {
      workstream?: Workstream;
    };
    return (body.workstream ?? (body as Workstream));
  }

  async startAgentSession(
    workstreamId: string,
    request: StartAgentSessionRequest,
  ): Promise<StartAgentSessionResponse> {
    const response = await this.request(
      `${this.baseUrl}/workstream/${workstreamId}/session/start/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'workstream session start',
      'harness',
    );
    return (await response.json()) as StartAgentSessionResponse;
  }

  async endAgentSession(
    workstreamId: string,
    request: EndAgentSessionRequest,
  ): Promise<EndAgentSessionResponse> {
    const response = await this.request(
      `${this.baseUrl}/workstream/${workstreamId}/session/end/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'workstream session end',
      'harness',
    );
    return (await response.json()) as EndAgentSessionResponse;
  }

  async compileCurrentHandoff(
    workstreamId: string,
    request: CompileHandoffRequest = {},
  ): Promise<HandoffArtifact> {
    const response = await this.request(
      `${this.baseUrl}/workstream/${workstreamId}/handoff/current/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
      'workstream handoff current',
      'harness',
    );
    const body = (await response.json()) as {
      handoff?: HandoffArtifact;
    } & HandoffArtifact;
    return (body.handoff ?? (body as HandoffArtifact));
  }

  async listWorkstreamHandoffs(
    workstreamId: string,
    options: { limit?: number; cursor?: string | null } = {},
  ): Promise<HandoffListResponse> {
    const params = new URLSearchParams();
    params.set('limit', String(options.limit ?? 20));
    if (options.cursor) {
      params.set('cursor', options.cursor);
    }
    const response = await this.request(
      `${this.baseUrl}/workstream/${workstreamId}/handoffs/?${params.toString()}`,
      { method: 'GET', headers: this.headers() },
      'workstream handoffs',
      'harness',
    );
    return (await response.json()) as HandoffListResponse;
  }

  async getHandoff(handoffId: string): Promise<HandoffArtifact> {
    const response = await this.request(
      `${this.baseUrl}/handoff/${handoffId}/`,
      { method: 'GET', headers: this.headers() },
      'handoff get',
      'harness',
    );
    const body = (await response.json()) as {
      handoff?: HandoffArtifact;
    } & HandoffArtifact;
    return (body.handoff ?? (body as HandoffArtifact));
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

function deriveApiRootUrl(baseUrl: string): string {
  if (baseUrl.endsWith('/theseus')) {
    return baseUrl.slice(0, -'/theseus'.length);
  }
  return baseUrl;
}

function readEnv(name: string): string | undefined {
  const maybeProcess = (
    globalThis as unknown as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return maybeProcess?.env?.[name];
}
