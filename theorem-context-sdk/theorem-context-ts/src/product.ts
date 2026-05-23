import type { THGResult } from './types.js';
import {
  AuthError,
  HarnessError,
  RequestTimeoutError,
  ServerUnavailableError,
} from './errors.js';

export interface TheoremHotGraphClientOptions {
  baseUrl: string;
  token: string;
  tenantId: string;
  fetchImpl?: typeof fetch;
}

export type THGProductResult = THGResult & {
  ok: boolean;
  error?: Record<string, unknown> | null;
};

export type InstantKgPayload = {
  manifest?: Record<string, unknown>;
  delta?: Record<string, unknown>;
};

export class TheoremHotGraphClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly tenantId: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TheoremHotGraphClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
    this.tenantId = options.tenantId;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async command(
    command: string,
    args: Record<string, unknown> = {},
  ): Promise<THGProductResult> {
    return this.post('/command', { command, args });
  }

  async batch(
    commands: Array<{ command: string; args?: Record<string, unknown> }>,
  ): Promise<{ ok: boolean; results: THGProductResult[]; state_hash: string }> {
    return this.post('/batch', { commands });
  }

  async run(runId: string): Promise<THGProductResult> {
    const response = await this.request(
      `${this.tenantUrl()}/runs/${encodeURIComponent(runId)}`,
      { method: 'GET', headers: this.headers() },
      'run',
    );
    return this.parseResponse(response);
  }

  async contextPack(args: Record<string, unknown>): Promise<THGProductResult> {
    return this.post('/context/pack', args);
  }

  async graphQuery(
    query: string,
    options: {
      graph?: Record<string, unknown>;
      params?: Record<string, unknown>;
    } = {},
  ): Promise<THGProductResult> {
    return this.post('/graph/query', {
      query,
      graph: options.graph ?? {},
      params: options.params ?? {},
    });
  }

  async instantKgStatus(options: InstantKgPayload = {}): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/status', this.cleanBody(options));
  }

  async instantKgPpr(
    seeds: Record<string, number>,
    options: InstantKgPayload & {
      alpha?: number;
      epsilon?: number;
      maxPushes?: number;
      topK?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/ppr', this.cleanBody({
      manifest: options.manifest,
      delta: options.delta,
      seeds,
      alpha: options.alpha ?? 0.15,
      epsilon: options.epsilon ?? 0.0001,
      max_pushes: options.maxPushes ?? 200000,
      top_k: options.topK ?? 10,
    }));
  }

  async instantKgImpact(options: InstantKgPayload & {
    seed?: string;
    symbolName?: string;
    direction?: 'out' | 'in';
    maxDepth?: number;
  }): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/impact', this.cleanBody({
      manifest: options.manifest,
      delta: options.delta,
      seed: options.seed,
      symbol_name: options.symbolName,
      direction: options.direction ?? 'out',
      max_depth: options.maxDepth ?? 2,
    }));
  }

  async instantKgRelatedObjects(
    seed: string,
    options: InstantKgPayload & {
      kinds?: string[];
      topK?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/related-objects', this.cleanBody({
      manifest: options.manifest,
      delta: options.delta,
      seed,
      kinds: options.kinds ?? [],
      top_k: options.topK ?? 10,
    }));
  }

  async instantKgSearch(
    query: string,
    options: InstantKgPayload & {
      kinds?: string[];
      topK?: number;
    } = {},
  ): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/search', this.cleanBody({
      manifest: options.manifest,
      delta: options.delta,
      query,
      kinds: options.kinds ?? [],
      top_k: options.topK ?? 10,
    }));
  }

  async instantKgExplainEdge(
    src: string,
    dst: string,
    options: InstantKgPayload = {},
  ): Promise<Record<string, unknown>> {
    return this.post('/instant-kg/explain-edge', this.cleanBody({
      manifest: options.manifest,
      delta: options.delta,
      src,
      dst,
    }));
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.request(
      `${this.tenantUrl()}${path}`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      },
      path,
    );
    return this.parseResponse(response) as Promise<T>;
  }

  private async request(
    url: string,
    init: RequestInit,
    action: string,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (error) {
      throw mapProductTransportError(action, error);
    }
    if (!response.ok) {
      throw await mapProductHttpError(action, response);
    }
    return response;
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    return (await response.json()) as T;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  private tenantUrl(): string {
    return `${this.baseUrl}/v1/tenants/${encodeURIComponent(this.tenantId)}`;
  }

  private cleanBody(body: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined && value !== null),
    );
  }
}

async function mapProductHttpError(
  action: string,
  response: Response,
): Promise<Error> {
  const detail = (await safeResponseText(response)).trim();
  const suffix = detail ? ` ${detail}` : '';
  const message = `THG product ${action} failed with HTTP ${response.status}${suffix}`;
  if (response.status === 401 || response.status === 403) {
    return new AuthError(message);
  }
  if (response.status === 408 || response.status === 504) {
    return new RequestTimeoutError(message);
  }
  if (response.status === 502 || response.status === 503) {
    return new ServerUnavailableError(message);
  }
  return new HarnessError(message);
}

function mapProductTransportError(action: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : 'unknown error';
  if (error instanceof Error && isTimeoutError(error)) {
    return new RequestTimeoutError(`THG product ${action} failed: ${message}`);
  }
  if (error instanceof Error && isServerUnavailableError(error)) {
    return new ServerUnavailableError(`THG product ${action} failed: ${message}`);
  }
  return new HarnessError(`THG product ${action} failed: ${message}`);
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
