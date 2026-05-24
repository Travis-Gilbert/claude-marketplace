/**
 * Harness: additive ergonomic facade over TheoremContextClient.
 *
 * MEM-030 of
 * `docs/plans/memory-harness-mcp-post-fractal/implementation-plan.md`.
 *
 * The MD-file conversation described a unified developer-facing API:
 *
 *   const harness = new Harness();
 *   const memory = await harness.memory.recall({ query: 'auth refactor' });
 *
 * This class is purely an additive ergonomic layer on top of
 * `TheoremContextClient`. The underlying client still works unchanged;
 * the existing 13 namespaces on `TheoremContextClient` are accessible
 * via `harness.client`. The Harness adds three responsibility-scoped
 * namespaces that match the MD conversation's three-MCP split mental
 * model:
 *
 *   - `.memory`: read/write/relate the cross-surface memory store.
 *     `recall` hits the new harness recall endpoint (MEM-029) added in
 *     this work.
 *   - `.action`: capture handoffs and queue follow-up actions.
 *   - `.diagnose`: (reserved) intelligence diagnostics surface.
 *
 * Methods that have no real backing endpoint are NOT shipped here.
 * The conversation's seven-verb spec lives in the Theorem MCP at the
 * Form-B short names (recall, remember, relate, forget, timeline,
 * handoff, next plus the three from MEM-001..003). The SDK exposes
 * the subset that has REST endpoints today. The remaining verbs are
 * documented as queued in the plan file; they ship as backend
 * endpoints land.
 */

import type { TheoremContextClient } from './client.js';

export interface HarnessOptions {
  client: TheoremContextClient;
}

/** Memory namespace: cross-surface read/write. */
export class HarnessMemory {
  constructor(private readonly client: TheoremContextClient) {}

  /**
   * Load prior cross-surface memory.
   * Hits POST /v2/harness/recall (MEM-029). Returns inline document
   * content with actor/surface/session provenance, matching the MCP
   * `recall` verb's shape.
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
    return this.client.recall(input);
  }

  /**
   * Save a memory item. Delegates to the existing
   * `client.remember(...)` writeback path. Same contract; the Harness
   * facade exists to give the developer a single ergonomic surface.
   */
  async remember(input: { observation: string; evidence?: string[] }): Promise<{
    id: number;
    slug: string;
    title: string;
  }> {
    return this.client.remember(input);
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
    return this.client.selfNote(input);
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
    return this.client.selfRevise(input);
  }

  async selfArchive(input: {
    docId: string;
    reason?: string;
    title?: string;
    tenantSlug?: string;
  }): Promise<Record<string, unknown>> {
    return this.client.selfArchive(input);
  }

  async selfRecallArchive(input: {
    query?: string;
    actor?: string;
    limit?: number;
    tenantSlug?: string;
  } = {}): Promise<Record<string, unknown>> {
    return this.client.selfRecallArchive(input);
  }

  async encode(input: {
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
    return this.client.encodeMemory(input);
  }
}

/** Action namespace: handoff and follow-up coordination. */
export class HarnessAction {
  constructor(private readonly client: TheoremContextClient) {}

  /**
   * Compile a handoff artifact for the current workstream.
   * Delegates to the existing
   * `client.workstream.handoff.current(...)` compile path. Returns
   * the 18-field HandoffArtifact shape; the SDK consumer can forward
   * it to a runner that spawns a session on a different surface.
   *
   * The CompileHandoffRequest contract takes the agent identifiers
   * and token budget; intent and other content fields are synthesized
   * by the backend from the active workstream state. Callers who need
   * to inject specific intent text should use the lower-level
   * `client.workstream.handoff.*` methods on the underlying client.
   */
  async handoff(input: {
    workstreamId: string;
    nextAgent?: string;
    previousAgent?: string;
    targetTokens?: number;
    hardCap?: number;
  }): Promise<unknown> {
    return this.client.workstream.handoff.current(input.workstreamId, {
      next_agent_target: input.nextAgent,
      previous_agent: input.previousAgent,
      target_tokens: input.targetTokens,
      hard_cap: input.hardCap,
    });
  }

  async coordinate(input: {
    message: string;
    docId?: string;
    urgency?: 'info' | 'ask' | 'block' | string;
    title?: string;
    tenantSlug?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    return this.client.coordinate(input);
  }

  async mentions(input: {
    actor?: string;
    tenantSlug?: string;
    limit?: number;
    consume?: boolean;
  } = {}): Promise<Record<string, unknown>> {
    return this.client.mentions(input);
  }

  async mentionsWait(input: {
    actor?: string;
    tenantSlug?: string;
    limit?: number;
    consume?: boolean;
    timeoutSeconds?: number;
    intervalSeconds?: number;
  } = {}): Promise<Record<string, unknown>> {
    return this.client.mentionsWait(input);
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
    return this.client.presence(input);
  }

  async subscribe(input: {
    actor?: string;
    tenantSlug?: string;
    docId?: string;
  } = {}): Promise<Record<string, unknown>> {
    return this.client.subscribe(input);
  }
}

/** Diagnose namespace: intelligence diagnostics (reserved).
 *
 * Currently a placeholder. The conversation described an IQ/health
 * diagnostic verb cluster; the backend endpoints for these (iq,
 * graph_health, stats) are MCP-only today and have no HTTP wrappers.
 * Methods are NOT added here until those endpoints exist; per the
 * SDK harness product rule, the facade does not ship stubs.
 */
export class HarnessDiagnose {
  constructor(_client: TheoremContextClient) {
    void _client;
  }
}

/**
 * Unified ergonomic facade. Construct with a `TheoremContextClient`
 * instance; access the namespaces via `.memory`, `.action`, `.diagnose`.
 *
 *   const cc = new TheoremContextClient({ apiKey: process.env.THEOREM_API_KEY });
 *   const harness = new Harness({ client: cc });
 *   const memory = await harness.memory.recall({ query: 'auth' });
 *
 * The underlying `cc` client is still accessible at `harness.client`
 * for callers who need the full 13-namespace surface.
 */
export class Harness {
  readonly client: TheoremContextClient;
  readonly memory: HarnessMemory;
  readonly action: HarnessAction;
  readonly diagnose: HarnessDiagnose;

  constructor(options: HarnessOptions) {
    this.client = options.client;
    this.memory = new HarnessMemory(options.client);
    this.action = new HarnessAction(options.client);
    this.diagnose = new HarnessDiagnose(options.client);
  }
}
