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
