/**
 * TheoremContextClient: typed client around the Context Theorem HTTP API.
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
 * Some surfaces are server-side stubs at v0.1.0 (export/fork/attach,
 * graph.focus, graph.patches.list); calling them returns a stub response
 * the caller can branch on with the `stub` field. The compile path,
 * audit, list/get, outcome, and remember are fully wired.
 */

import type {
  CompileEvent,
  CompileRequest,
  ContextArtifact,
  HarnessBeginRequest,
  HarnessCompareRequest,
  HarnessContextRequest,
  HarnessForkRequest,
  HarnessPatchRequest,
  HarnessRun,
  HarnessSearchRequest,
  HarnessSearchRun,
  HarnessStep,
  OutcomeRequest,
  THGCommandRequest,
  THGCypherRequest,
  THGResult,
} from './types.js';

export interface TheoremContextClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL =
  'https://index-api-production-a5f7.up.railway.app/api/v2/theseus';

export class TheoremContextClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TheoremContextClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

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
    patch: this.patchHarness.bind(this),
    replay: this.replayHarness.bind(this),
    fork: this.forkHarness.bind(this),
    compare: this.compareHarness.bind(this),
    thg: {
      command: this.thgCommand.bind(this),
      cypher: this.thgCypher.bind(this),
    },
  };

  readonly thg = {
    command: this.thgCommand.bind(this),
    cypher: this.thgCypher.bind(this),
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

  async compile(request: CompileRequest): Promise<ContextArtifact> {
    const response = await this.fetchImpl(`${this.baseUrl}/context/compile/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`compile failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as ContextArtifact;
  }

  async *compileStream(
    request: CompileRequest,
  ): AsyncIterableIterator<CompileEvent> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/context/compile/stream/`,
      {
        method: 'POST',
        headers: { ...this.headers(), Accept: 'text/event-stream' },
        body: JSON.stringify(request),
      },
    );
    if (!response.ok || !response.body) {
      throw new Error(
        `compile stream failed: ${response.status} ${await response.text()}`,
      );
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

  async remember(input: { observation: string; evidence?: string[] }): Promise<{
    id: number;
    slug: string;
    title: string;
  }> {
    // Remember is exposed via the MCP surface; the canonical write path
    // for non-MCP clients is the workspace capture endpoint. We post to
    // the writeback router which already accepts plain Object writes.
    const response = await this.fetchImpl(`${this.baseUrl}/writeback/object/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        title: input.observation.slice(0, 200),
        knowledge_content: input.observation,
        properties: { evidence: input.evidence ?? [] },
        source_system: 'context_theorem_sdk',
      }),
    });
    if (!response.ok) {
      throw new Error(`remember failed: ${response.status}`);
    }
    return (await response.json()) as { id: number; slug: string; title: string };
  }

  async audit(artifactId: string): Promise<ContextArtifact> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/context/artifacts/${artifactId}/`,
      { method: 'GET', headers: this.headers() },
    );
    if (!response.ok) {
      throw new Error(`audit failed: ${response.status}`);
    }
    return (await response.json()) as ContextArtifact;
  }

  async outcome(artifactId: string, payload: OutcomeRequest): Promise<{
    artifact_id: string;
    status: string;
    feedback_counts: Record<string, number>;
  }> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/context/artifacts/${artifactId}/outcome/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(`outcome failed: ${response.status}`);
    }
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
    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new Error(`list failed: ${response.status}`);
    }
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
    format: 'json' | 'markdown' | 'pdf' = 'json',
  ): Promise<{ stub: true; format: string; artifact_id: string }> {
    return { stub: true, format, artifact_id: artifactId };
  }

  async forkArtifact(artifactId: string): Promise<{ stub: true; artifact_id: string }> {
    return { stub: true, artifact_id: artifactId };
  }

  async attachArtifact(
    artifactId: string,
    target: string,
  ): Promise<{ stub: true; artifact_id: string; target: string }> {
    return { stub: true, artifact_id: artifactId, target };
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

  async graphFocus(_seedIds: number[]): Promise<{ stub: true }> {
    return { stub: true };
  }

  async graphPatchesList(): Promise<{ stub: true; patches: [] }> {
    return { stub: true, patches: [] };
  }

  async beginHarness(request: HarnessBeginRequest): Promise<HarnessRun> {
    const response = await this.fetchImpl(`${this.baseUrl}/harness/runs/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`harness begin failed: ${response.status}`);
    }
    const body = (await response.json()) as { run: HarnessRun };
    return body.run;
  }

  async getHarnessRun(runId: string): Promise<HarnessRun> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/`,
      { method: 'GET', headers: this.headers() },
    );
    if (!response.ok) {
      throw new Error(`harness get failed: ${response.status}`);
    }
    const body = (await response.json()) as { run: HarnessRun };
    return body.run;
  }

  async recordHarnessStep(
    runId: string,
    request: { kind: string; payload?: Record<string, unknown> },
  ): Promise<HarnessStep> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/step/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness step failed: ${response.status}`);
    }
    const body = (await response.json()) as { step: HarnessStep };
    return body.step;
  }

  async searchHarness(
    runId: string,
    request: HarnessSearchRequest,
  ): Promise<HarnessSearchRun> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/search/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness search failed: ${response.status}`);
    }
    const body = (await response.json()) as { search: HarnessSearchRun };
    return body.search;
  }

  async compileHarnessContext(
    runId: string,
    request: HarnessContextRequest,
  ): Promise<ContextArtifact | Record<string, unknown>> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/context/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness context failed: ${response.status}`);
    }
    const body = (await response.json()) as {
      artifact: ContextArtifact | Record<string, unknown>;
    };
    return body.artifact;
  }

  async patchHarness(runId: string, request: HarnessPatchRequest): Promise<{
    patch: Record<string, unknown>;
    validation?: Record<string, unknown>;
    run?: HarnessRun;
  }> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/patch/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness patch failed: ${response.status}`);
    }
    return (await response.json()) as {
      patch: Record<string, unknown>;
      validation?: Record<string, unknown>;
      run?: HarnessRun;
    };
  }

  async replayHarness(runId: string): Promise<HarnessStep[]> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/replay/`,
      { method: 'GET', headers: this.headers() },
    );
    if (!response.ok) {
      throw new Error(`harness replay failed: ${response.status}`);
    }
    const body = (await response.json()) as { steps: HarnessStep[] };
    return body.steps;
  }

  async forkHarness(
    runId: string,
    request: HarnessForkRequest = {},
  ): Promise<HarnessRun> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/${runId}/fork/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness fork failed: ${response.status}`);
    }
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
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/runs/compare/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`harness compare failed: ${response.status}`);
    }
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
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/thg/command/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`thg command failed: ${response.status}`);
    }
    const body = (await response.json()) as { result: THGResult };
    return body.result;
  }

  async thgCypher(request: THGCypherRequest): Promise<THGResult> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/harness/thg/cypher/`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`thg cypher failed: ${response.status}`);
    }
    const body = (await response.json()) as { result: THGResult };
    return body.result;
  }
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
