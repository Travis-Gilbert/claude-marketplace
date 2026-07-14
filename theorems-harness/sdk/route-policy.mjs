import { basename } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const ROUTES = Object.freeze({
  NATIVE_BINDING: "native-binding",
  NATIVE_MCP: "native-mcp",
  PRODUCT_HTTP: "product-http",
  THESEUS_ENGINE: "theseus-engine",
});

export const ROUTE_MODES = Object.freeze({
  COMPAT: "compat",
  NATIVE: "native",
  SHADOW: "shadow",
  LEGACY: "legacy",
});

const DEFAULT_TENANT = "default";
const DEFAULT_NATIVE_MCP_URL = "https://rustyredcore-theorem-production.up.railway.app/mcp";

const VERB_FAMILIES = Object.freeze({
  replay_last_run: "run",
  harness_replay: "run",
  harness_step: "run",
  harness_search: "run",
  harness_patch: "run",
  harness_toolkit: "run",
  multihead_run: "run",
  multihead_task: "run",
  multihead_claim: "run",
  multihead_patch: "run",
  multihead_proof: "run",
  multihead_review: "run",
  remember: "memory",
  recall: "memory",
  self_note: "memory",
  self_revise: "memory",
  self_archive: "memory",
  self_recall_archive: "memory",
  encode: "memory",
  relate: "memory",
  forget: "memory",
  handoff: "memory",
  observe: "memory",
  skill_list: "skill",
  skill_get: "skill",
  skill_publish: "skill",
  skill_apply: "skill",
  coordination_room: "coordination",
  coordination_intent: "coordination",
  write_intent: "coordination",
  read_intents_for_room: "coordination",
  coordination_record: "coordination",
  coordination_reflection: "coordination",
  coordination_decision: "coordination",
  coordination_tension: "coordination",
  coordinate: "coordination",
  mentions: "coordination",
  mentions_wait: "coordination",
  presence: "coordination",
  coordination_context: "coordination",
  saved_contexts_list: "product",
  saved_context_create: "product",
  saved_context_update: "product",
  saved_context_mute: "product",
  saved_context_activate: "product",
  saved_context_delete: "product",
  saved_context_preview_recall: "product",
  memory_patch_review_queue: "product",
  memory_patch_review_update: "product",
  product_bootstrap: "product",
  domain_list: "product",
  domain_install: "product",
  context_compile: "product",
  instant_kg_reingest: "product",
  code_search: "theseus-engine",
  code_crawl: "theseus-engine",
  theseus_code_agent: "theseus-engine",
});

export class HarnessRoutePolicy {
  constructor(options = {}) {
    const env = options.env ?? process.env;
    this.mode = normalizeMode(options.mode ?? env.THEOREM_HARNESS_ROUTE_MODE);
    this.tenant =
      cleanString(
        options.tenant ??
          env.THEOREM_HARNESS_TENANT ??
          env.THEOREMS_HARNESS_TENANT ??
          env.RUSTYRED_THG_TENANT ??
          env.THEOREM_CONTEXT_TENANT_SLUG ??
          env.THEOREM_TENANT_SLUG,
      ) ?? DEFAULT_TENANT;
    this.nativeWriteMode = normalizeWriteMode(
      options.nativeWriteMode ??
        env.THEOREM_HARNESS_NATIVE_WRITE_MODE ??
        env.THEOREMS_HARNESS_THG_WRITES,
    );
    this.bindingDataDir =
      cleanString(options.bindingDataDir ?? env.THEOREM_HARNESS_DATA_DIR) ?? null;
    this.bindingModulePath =
      cleanString(options.bindingModulePath ?? env.THEOREM_HARNESS_NODE_BINDING_PATH) ?? null;
    this.nativeMcpUrl =
      cleanString(
        options.nativeMcpUrl ??
          env.THEOREM_HARNESS_MCP_URL ??
          env.THEOREMS_HARNESS_RUSTYRED_MCP_URL ??
          env.RUSTYRED_THG_MCP_URL,
      ) ?? DEFAULT_NATIVE_MCP_URL;
    this.nativeMcpToken =
      cleanString(
        options.nativeMcpToken ??
          env.THEOREM_HARNESS_API_TOKEN ??
          env.RUSTYRED_THG_API_TOKEN ??
          env.THEOREMS_HARNESS_THG_API_TOKEN,
      ) ?? null;
    this.productHttpUrl =
      cleanString(options.productHttpUrl ?? env.THEOREM_HARNESS_HTTP_URL) ?? null;
    this.theseusEngineUrl =
      cleanString(
        options.theseusEngineUrl ??
          env.THESEUS_ENGINE_MCP_URL ??
          env.THEOREM_CONTEXT_BASE_URL,
      ) ?? null;
    this.clients = Object.freeze({ ...(options.clients ?? {}) });
  }

  select(operation) {
    const verb = cleanString(operation?.verb);
    if (!verb) {
      throw new RoutePolicyError("route policy requires an operation verb");
    }

    const family = operation.family ?? VERB_FAMILIES[verb];
    if (!family) {
      throw new RoutePolicyError(`no route family registered for ${verb}`);
    }

    const scope = cleanString(operation.scope) ?? "shared";
    const route = this.#routeFor({ verb, family, scope });
    const receipt = this.#receipt({ verb, family, route, scope });
    return { family, route, receipt };
  }

  async execute(operation, payload = {}) {
    const selection = this.select(operation);
    const client = this.clients[selection.route];
    if (!client?.call) {
      throw new RoutePolicyError(`no client registered for route ${selection.route}`);
    }

    const result = await client.call(operation, payload, selection.receipt);
    return {
      result,
      receipt: selection.receipt,
    };
  }

  #routeFor({ verb, family, scope }) {
    if (family === "product") return ROUTES.PRODUCT_HTTP;
    if (family === "theseus-engine") return ROUTES.THESEUS_ENGINE;

    if (verb.startsWith("multihead_")) {
      return ROUTES.NATIVE_MCP;
    }

    if (verb === "replay_last_run") {
      return ROUTES.NATIVE_MCP;
    }

    if (family === "skill") {
      return ROUTES.NATIVE_MCP;
    }

    if (this.mode === ROUTE_MODES.LEGACY) {
      return ROUTES.THESEUS_ENGINE;
    }

    if (family === "coordination") {
      return ROUTES.NATIVE_MCP;
    }

    if (family === "run") {
      if (this.bindingDataDir && scope !== "shared-remote") {
        return ROUTES.NATIVE_BINDING;
      }
      return ROUTES.NATIVE_MCP;
    }

    if (family === "memory") {
      if (scope === "private" && this.bindingDataDir) {
        return ROUTES.NATIVE_BINDING;
      }
      return ROUTES.NATIVE_MCP;
    }

    throw new RoutePolicyError(`unsupported route family ${family}`);
  }

  #receipt({ verb, family, route, scope }) {
    const server = this.#serverFor(route);
    return Object.freeze({
      route,
      verb,
      family,
      tenant: this.tenant,
      server,
      readOnly: this.nativeWriteMode !== "enabled" && route === ROUTES.NATIVE_MCP,
      fallbackUsed: this.mode === ROUTE_MODES.LEGACY && route === ROUTES.THESEUS_ENGINE,
      nativeWriteMode: this.nativeWriteMode,
      dataDir: route === ROUTES.NATIVE_BINDING ? redactDataDir(this.bindingDataDir) : null,
      shadowRoute: this.mode === ROUTE_MODES.SHADOW ? shadowRouteFor(route, family) : null,
      mode: this.mode,
      scope,
    });
  }

  #serverFor(route) {
    if (route === ROUTES.NATIVE_BINDING) return "apps/theorem-harness-node";
    if (route === ROUTES.NATIVE_MCP) return this.nativeMcpUrl ?? "native-theorem-mcp";
    if (route === ROUTES.PRODUCT_HTTP) return this.productHttpUrl ?? "product-http";
    if (route === ROUTES.THESEUS_ENGINE) return this.theseusEngineUrl ?? "theseus-engine";
    return route;
  }
}

export class RoutePolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "RoutePolicyError";
  }
}

export class NativeBindingClient {
  #addon = null;
  #harness = null;

  constructor(options = {}) {
    this.dataDir = cleanString(options.dataDir) ?? null;
    this.bindingModulePath = cleanString(options.bindingModulePath) ?? null;
    this.moduleLoader = options.moduleLoader ?? ((modulePath) => require(modulePath));
  }

  async call(operation, payload, receipt) {
    if (operation?.verb === "harness_replay") {
      return this.#replayRun(payload, receipt);
    }
    if (operation?.verb === "remember" || operation?.verb === "self_note") {
      return this.#rememberMemory(payload, receipt);
    }
    if (operation?.verb === "recall") {
      return this.#recallMemory(payload, receipt);
    }

    throw new RoutePolicyError(
      `native binding route does not support ${operation?.verb ?? "unknown operation"}`,
    );
  }

  #replayRun(payload, receipt) {
    const runId = cleanString(payload?.run_id);
    if (!runId) {
      throw new RoutePolicyError("harness_replay through native binding requires run_id");
    }

    const harness = this.#loadHarness();
    const events = parseJsonArray(harness.eventsJson(runId), "eventsJson");
    const status = harness.runStatus(runId);
    const afterSeq = Number.isFinite(Number(payload?.after_seq))
      ? Number(payload.after_seq)
      : 0;
    const text = payload?.include_text === false ? null : harness.pollText(runId, afterSeq);
    const latest = events.length ? events[events.length - 1] : null;

    return {
      run_id: runId,
      state_hash: latest?.state_hash_after ?? null,
      status,
      events,
      text,
      route_receipt: receipt,
    };
  }

  #rememberMemory(payload, receipt) {
    const agentId = cleanString(payload?.agent_id);
    const content = cleanString(payload?.content);
    if (!agentId) {
      throw new RoutePolicyError("remember through native binding requires agent_id");
    }
    if (!content) {
      throw new RoutePolicyError("remember through native binding requires content");
    }

    const harness = this.#loadHarness();
    const kind = cleanString(payload?.kind) ?? "belief";
    const title = cleanString(payload?.title) ?? "Memory";
    const memoryReceipt = parseJsonObject(
      harness.remember(agentId, kind, title, content),
      "remember",
    );

    return {
      ...memoryReceipt,
      route_receipt: receipt,
    };
  }

  #recallMemory(payload, receipt) {
    const agentId = cleanString(payload?.agent_id);
    const query = cleanString(payload?.query);
    if (!agentId) {
      throw new RoutePolicyError("recall through native binding requires agent_id");
    }
    if (!query) {
      throw new RoutePolicyError("recall through native binding requires query");
    }

    const harness = this.#loadHarness();
    const limit = Number.isFinite(Number(payload?.limit)) ? Number(payload.limit) : 10;
    const results = parseJsonArray(harness.recall(agentId, query, limit), "recall");

    return {
      items: results,
      count: results.length,
      route_receipt: receipt,
    };
  }

  #loadHarness() {
    if (this.#harness) return this.#harness;
    if (!this.dataDir) {
      throw new RoutePolicyError("THEOREM_HARNESS_DATA_DIR is required for native binding route");
    }

    const addon = this.#loadAddon();
    this.#harness = new addon.Harness(this.dataDir);
    return this.#harness;
  }

  #loadAddon() {
    if (this.#addon) return this.#addon;
    if (!this.bindingModulePath) {
      throw new RoutePolicyError(
        "THEOREM_HARNESS_NODE_BINDING_PATH is required for native binding route",
      );
    }

    const addon = this.moduleLoader(this.bindingModulePath);
    if (!addon?.Harness) {
      throw new RoutePolicyError("native binding module does not export Harness");
    }

    this.#addon = addon;
    return this.#addon;
  }
}

export class NativeMcpClient {
  #nextId = 1;

  constructor(options = {}) {
    this.url = cleanString(options.url) ?? DEFAULT_NATIVE_MCP_URL;
    this.token = cleanString(options.token) ?? null;
    this.fetcher = options.fetcher ?? globalThis.fetch;
  }

  async call(operation, payload, receipt) {
    const toolName = cleanString(operation?.nativeToolName ?? operation?.verb);
    if (!toolName) {
      throw new RoutePolicyError("native MCP route requires a tool name");
    }
    if (!this.fetcher) {
      throw new RoutePolicyError("native MCP route requires fetch support");
    }

    const result = await this.#rpc("tools/call", {
      name: toolName,
      arguments: payload ?? {},
    });
    return withResultRouteReceipt(parseMcpToolResult(result), receipt);
  }

  async #rpc(method, params) {
    const id = this.#nextId++;
    const response = await this.fetcher(this.url, {
      method: "POST",
      headers: this.#headers(),
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new RoutePolicyError(
        `native MCP ${method} -> ${response.status}: ${text.slice(0, 400)}`,
      );
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new RoutePolicyError(`native MCP ${method} returned invalid JSON: ${error.message}`);
    }

    if (payload.error) {
      const message = payload.error.message || JSON.stringify(payload.error);
      throw new RoutePolicyError(`native MCP ${method} error: ${message}`);
    }
    return payload.result ?? {};
  }

  #headers() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }
}

export class FakeRouteClient {
  constructor(route, result = null) {
    this.route = route;
    this.calls = [];
    this.result = result ?? { ok: true, route };
  }

  async call(operation, payload, receipt) {
    this.calls.push({ operation, payload, receipt });
    return this.result;
  }
}

export function createDefaultRoutePolicy(options = {}) {
  return new HarnessRoutePolicy(options);
}

function normalizeMode(value) {
  const mode = cleanString(value)?.toLowerCase() ?? ROUTE_MODES.COMPAT;
  if (Object.values(ROUTE_MODES).includes(mode)) return mode;
  return ROUTE_MODES.COMPAT;
}

function normalizeWriteMode(value) {
  const mode = cleanString(value)?.toLowerCase();
  if (mode === "enabled" || mode === "write" || mode === "writes") return "enabled";
  if (mode === "mirror" || mode === "shadow") return "mirror";
  return "read-only";
}

function cleanString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function parseJsonArray(raw, label) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new RoutePolicyError(`${label} returned non-array JSON`);
  }
  return parsed;
}

function parseJsonObject(raw, label) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RoutePolicyError(`${label} returned non-object JSON`);
  }
  return parsed;
}

function parseMcpToolResult(result) {
  const content = Array.isArray(result?.content) ? result.content : [];
  if (content.length !== 1 || content[0]?.type !== "text") return result;

  const text = content[0]?.text;
  if (typeof text !== "string") return result;
  try {
    return JSON.parse(text);
  } catch {
    return result;
  }
}

function withResultRouteReceipt(result, receipt) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { result, route_receipt: receipt };
  }
  if (result.route_receipt) return result;
  return { ...result, route_receipt: receipt };
}

function redactDataDir(dataDir) {
  if (!dataDir) return null;
  return `<redacted>/${basename(dataDir)}`;
}

function shadowRouteFor(route, family) {
  if (route === ROUTES.NATIVE_MCP && family === "memory") return ROUTES.THESEUS_ENGINE;
  if (route === ROUTES.NATIVE_BINDING && (family === "memory" || family === "run")) {
    return ROUTES.NATIVE_MCP;
  }
  return null;
}
