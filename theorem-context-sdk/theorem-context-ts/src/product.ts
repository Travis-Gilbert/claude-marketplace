import type { THGResult } from './types.js';

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
    const response = await this.fetchImpl(
      `${this.tenantUrl()}/runs/${encodeURIComponent(runId)}`,
      { method: 'GET', headers: this.headers() },
    );
    return this.parseResponse(response, 'run');
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
    const response = await this.fetchImpl(`${this.tenantUrl()}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parseResponse(response, path) as Promise<T>;
  }

  private async parseResponse<T>(response: Response, action: string): Promise<T> {
    if (!response.ok) {
      throw new Error(`THG product ${action} failed with HTTP ${response.status}`);
    }
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
