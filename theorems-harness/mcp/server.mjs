// Theorem's Harness: slim MCP server (Mode 2 fallback).
//
// Most context arrives via the UserPromptSubmit hook (Mode 1, no model-visible
// tool). These tools exist for cases the hook can't cover:
//   - orchestrate_refresh: recompile when context goes stale mid-session
//   - harness_replay: show the event timeline of the current or specified run
//   - harness_describe_current: show what artifact is currently injected
//   - product_*: expose the Context Theorem product boundary for saved-context
//     and review-queue work so the plugin can operate the backend that now
//     exists without dropping to raw HTTP
//   - code_search / harness_fractal_expansion: direct code discovery and
//     research-mode expansion without dropping to raw HTTP
//   - coordination_* / mentions_wait: shared room state plus ping-like
//     interrupts over the harness substrate
//
// Deliberately bounded surface. Claude's host manifest registers a local proxy
// for the Theorem-side RustyRed MCP's native graph and coordination tools.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { hostname, userInfo } from "node:os";
import {
  createDefaultRoutePolicy,
  NativeBindingClient,
  NativeMcpClient,
  ROUTES,
} from "../sdk/route-policy.mjs";
import { createMultiheadStore } from "./multihead-state.mjs";

const BASE_URL =
  process.env.THEOREM_CONTEXT_BASE_URL ||
  "https://index-api-production-a5f7.up.railway.app/api/v2/theseus";
const API_ROOT = BASE_URL.replace(/\/theseus\/?$/, "");
const API_KEY =
  process.env.THEOREM_CONTEXT_API_KEY ||
  process.env.THEOREM_API_KEY ||
  "";
const THG_BASE_URL =
  process.env.RUSTYRED_THG_BASE_URL ||
  process.env.THEOREMS_HARNESS_THG_BASE_URL ||
  "https://thg-product-production.up.railway.app";
const THG_API_TOKEN =
  process.env.RUSTYRED_THG_API_TOKEN ||
  process.env.THEOREMS_HARNESS_THG_API_TOKEN ||
  "";
const THG_WRITE_MODE = (
  process.env.THEOREMS_HARNESS_THG_WRITES ||
  process.env.RUSTYRED_THG_WRITES ||
  "mirror"
).toLowerCase();
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_DIR = join(PROJECT_DIR, ".theorem");
const HARNESS_ROUTE_POLICY = createHarnessRoutePolicy();
const MULTIHEAD_STORE = createMultiheadStore({ projectDir: PROJECT_DIR });

function hostActor() {
  const explicit = String(
    process.env.THEOREM_ACTOR ||
    process.env.THEOREM_PEER_REVIEW_ACTOR ||
    ""
  ).trim();
  if (explicit) return explicit;
  if (
    process.env.PLUGIN_ROOT ||
    process.env.CODEX_HOME ||
    process.env.CODEX_SESSION_ID
  ) {
    return "codex";
  }
  return "claude-code";
}

function toolActor(args = {}) {
  return String(args?.actor || hostActor()).trim() || null;
}

function sessionKey() {
  const actor = hostActor();
  const prefix = actor === "codex" ? "codex" : "claude";
  const cwdHash = createHash("sha1").update(PROJECT_DIR).digest("hex").slice(0, 8);
  return `${prefix}:${userInfo().username}@${hostname().split(".")[0]}:${cwdHash}`;
}

function currentRunId() {
  const safe = sessionKey().replace(/[/:]/g, "_");
  const file = join(STATE_DIR, "runs", `${safe}.run_id`);
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8").trim() || null;
}

function authHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  return headers;
}

function thgHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (THG_API_TOKEN) headers.Authorization = `Bearer ${THG_API_TOKEN}`;
  return headers;
}

async function theoremPost(path, body, timeoutMs = 25_000) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

async function apiPost(path, body, timeoutMs = 25_000) {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

async function theoremGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`GET ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

async function apiGet(path) {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: "GET",
    headers: authHeaders(),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`GET ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

async function theoremPut(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`PUT ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

function thgTenantPath(args, path) {
  return `/v1/tenants/${encodeURIComponent(requiredTenantId(args))}${path}`;
}

async function theoremDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`DELETE ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  if (res.status === 204) {
    return { ok: true };
  }
  return res.json();
}

async function thgPost(path, body, timeoutMs = 10_000) {
  const res = await fetch(`${THG_BASE_URL}${path}`, {
    method: "POST",
    headers: thgHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  return res.json();
}

function jsonText(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function createHarnessRoutePolicy() {
  const clients = {};
  if (process.env.THEOREM_HARNESS_DATA_DIR) {
    clients[ROUTES.NATIVE_BINDING] = new NativeBindingClient({
      dataDir: process.env.THEOREM_HARNESS_DATA_DIR,
      bindingModulePath: process.env.THEOREM_HARNESS_NODE_BINDING_PATH,
    });
  }
  clients[ROUTES.NATIVE_MCP] = new NativeMcpClient({
    url:
      process.env.THEOREM_HARNESS_MCP_URL ||
      process.env.THEOREMS_HARNESS_RUSTYRED_MCP_URL ||
      process.env.RUSTYRED_THG_MCP_URL,
    token:
      process.env.THEOREM_HARNESS_API_TOKEN ||
      process.env.RUSTYRED_THG_API_TOKEN ||
      process.env.THEOREMS_HARNESS_THG_API_TOKEN,
  });
  return createDefaultRoutePolicy({ clients });
}

function withRouteReceipt(result, receipt) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { result, route_receipt: receipt };
  }
  return { ...result, route_receipt: receipt };
}

function legacyRouteReceipt(selection, reason) {
  return {
    route: "theseus-engine",
    verb: selection.receipt.verb,
    family: selection.receipt.family,
    tenant: selection.receipt.tenant,
    server: BASE_URL,
    readOnly: false,
    fallbackUsed: true,
    nativeWriteMode: selection.receipt.nativeWriteMode,
    dataDir: null,
    mode: selection.receipt.mode,
    scope: selection.receipt.scope,
    selectedRoute: selection.receipt,
    fallbackReason: reason,
  };
}

function directHttpRouteReceipt(selection, server, extra = {}) {
  return {
    ...selection.receipt,
    server,
    ...extra,
  };
}

async function executeWithRoutePolicy(
  operation,
  payload,
  legacyCall = null,
  options = {},
) {
  const selection = HARNESS_ROUTE_POLICY.select(operation);
  const allowFallback = options.allowFallback !== false;

  if (selection.route === ROUTES.NATIVE_BINDING || selection.route === ROUTES.NATIVE_MCP) {
    try {
      const executed = await HARNESS_ROUTE_POLICY.execute(operation, payload);
      return executed.result;
    } catch (error) {
      if (selection.receipt.mode === "native" || !legacyCall || !allowFallback) {
        throw error;
      }
      const result = await legacyCall();
      return withRouteReceipt(
        result,
        legacyRouteReceipt(selection, `native binding failed: ${error.message}`),
      );
    }
  }

  if (selection.receipt.mode === "native" || !legacyCall || !allowFallback) {
    throw new Error(
      `native route ${selection.route} is not wired for ${operation.verb}`,
    );
  }

  const result = await legacyCall();
  return withRouteReceipt(
    result,
    legacyRouteReceipt(
      selection,
      options.fallbackReason ?? `selected route ${selection.route} is not wired yet`,
    ),
  );
}

async function legacyHarnessReplay(runId) {
  const events = await theoremGet(`/harness/runs/${runId}/events/`);
  const stateHash = await theoremGet(`/harness/runs/${runId}/state-hash/`).catch(() => ({}));
  return {
    run_id: runId,
    state_hash: stateHash.state_hash || null,
    events: events.events || events,
  };
}

async function replayHarnessRun(runId, args = {}) {
  const operation = {
    verb: "harness_replay",
    scope: args?.scope ?? "local",
  };
  const payload = {
    run_id: runId,
    after_seq: args?.after_seq ?? 0,
  };
  return executeWithRoutePolicy(operation, payload, () => legacyHarnessReplay(runId));
}

function memoryAgentId(args = {}) {
  return String(args?.agent_id || args?.actor || toolActor(args) || hostActor()).trim();
}

function nativeMemoryKind(args = {}, defaultKind = "belief") {
  return String(args?.kind || args?.memory_node_type || defaultKind).trim() || defaultKind;
}

function nativeRememberPayload(args = {}, defaultKind = "belief") {
  const payload = {
    agent_id: memoryAgentId(args),
    kind: nativeMemoryKind(args, defaultKind),
    title: String(args?.title || args?.summary || "Memory").trim() || "Memory",
    content: requireString(args, "content"),
  };
  const tenant = tenantId(args);
  if (tenant) payload.tenant_slug = tenant;
  return payload;
}

async function rememberHarnessMemory(args = {}, options = {}) {
  const scope = args?.scope ?? "shared";
  const verb = options.verb ?? "remember";
  const legacyKind = options.legacyKind ?? verb;
  // Native sole path (Travis directive): no Theseus memory fallback.
  return executeWithRoutePolicy(
    { verb, scope },
    nativeRememberPayload(args, options.defaultKind ?? legacyKind),
    null,
    { allowFallback: false },
  );
}

async function recallHarnessMemory(args = {}) {
  const query = requireString(args, "query");
  const payload = {
    agent_id: memoryAgentId(args),
    query,
    limit: args?.limit ?? 10,
  };
  const tenant = tenantId(args);
  if (tenant) payload.tenant_slug = tenant;
  return executeWithRoutePolicy(
    { verb: "recall", scope: args?.scope ?? "private" },
    payload,
    null,
  );
}

async function nativeSkillTool(name, args = {}) {
  return executeWithRoutePolicy(
    { verb: name, scope: "shared" },
    args ?? {},
    null,
    { allowFallback: false },
  );
}

async function nativeCoordinationTool(verb, nativeToolName, body, options = {}) {
  // Native Theorem RustyRed MCP is the SOLE path for coordination (Travis
  // directive: retire Python). No Theseus/Django fallback and no product mirror:
  // the room is durable in the GraphStore and authoritative. allowFallback:false
  // returns an honest error if native is unreachable, never a Python call.
  const operation = { verb, nativeToolName, scope: options.scope ?? "shared" };
  if (options.family) operation.family = options.family;
  return executeWithRoutePolicy(operation, body, null, { allowFallback: false });
}

async function nativeCodeTool(nativeToolName, body) {
  return executeWithRoutePolicy(
    { verb: "code_search", nativeToolName, scope: "shared-remote", family: "run" },
    body,
    null,
    { allowFallback: false },
  );
}

async function multiheadRuntimeTool(name, payload, localFallback) {
  return executeWithRoutePolicy(
    { verb: name, nativeToolName: name, scope: "shared", family: "run" },
    payload,
    localFallback,
    { fallbackReason: "native multi-head runtime tool unavailable; used local spike" },
  );
}

async function multiheadToolResponse(name, payload, localFallback) {
  return jsonText(
    await multiheadRuntimeTool(name, payload, () => localFallback(payload)),
  );
}

async function savedContextPreviewRecall(args = {}) {
  const tenantSlug = requireString(args, "tenant_slug");
  return theoremPost(
    `/product/tenants/${tenantSlug}/saved-contexts/preview-recall/`,
    {
      task: requireString(args, "task"),
      project_slug: args?.project_slug ?? null,
      mode: args?.mode ?? null,
      modes: args?.modes ?? [],
      profile_id: args?.profile_id ?? null,
      profile_ids: args?.profile_ids ?? [],
      permissions: args?.permissions ?? [],
    },
  );
}

function normalizeTenantSlug(value) {
  const tenant = String(value || "").trim();
  if (!tenant || tenant.toLowerCase() === "public") return null;
  return tenant;
}

function tenantId(args) {
  return normalizeTenantSlug(
    args?.tenant_slug ||
    process.env.THEOREMS_HARNESS_TENANT ||
    process.env.RUSTYRED_THG_TENANT ||
    process.env.THEOREM_CONTEXT_TENANT_SLUG ||
    process.env.THEOREM_TENANT_SLUG ||
    ""
  );
}

function requiredTenantId(args) {
  const tenant = tenantId(args);
  if (!tenant) {
    throw new Error(
      "tenant_slug is required for direct RustyRed tenant calls; no product tenant env fallback is configured."
    );
  }
  return tenant;
}

let bootstrapTenantPromise = null;

async function defaultTenantSlugFromBootstrap() {
  if (!API_KEY) return null;
  if (!bootstrapTenantPromise) {
    bootstrapTenantPromise = theoremGet("/product/bootstrap/")
      .then((result) => {
        const direct = normalizeTenantSlug(result?.default_tenant_slug);
        if (direct) return direct;
        const firstTenant = Array.isArray(result?.tenants) ? result.tenants[0] : null;
        return normalizeTenantSlug(firstTenant?.slug);
      })
      .catch(() => null);
  }
  return bootstrapTenantPromise;
}

async function mirrorTenantId(args) {
  return tenantId(args) || (await defaultTenantSlugFromBootstrap());
}

async function requestTenantSlug(args) {
  return tenantId(args) || (await defaultTenantSlugFromBootstrap());
}

function gitOutput(args) {
  try {
    return execFileSync("git", ["-C", PROJECT_DIR, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    }).trim();
  } catch {
    return "";
  }
}

function parseChangedFiles(statusText) {
  const files = [];
  const seen = new Set();
  for (const line of String(statusText || "").split("\n")) {
    const path = line.slice(3).trim();
    if (!path) continue;
    const normalized = path.includes(" -> ") ? path.split(" -> ").pop().trim() : path;
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    files.push(normalized);
  }
  return files;
}

function localWorktreeIdentity() {
  const worktree = gitOutput(["rev-parse", "--show-toplevel"]) || PROJECT_DIR;
  const branch =
    gitOutput(["branch", "--show-current"]) ||
    gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  return {
    session_id: sessionKey(),
    worktree,
    branch,
    head: gitOutput(["rev-parse", "HEAD"]),
    changed_files: parseChangedFiles(gitOutput(["status", "--short"])),
  };
}

function withSourceIdentity(metadata = {}) {
  const identity = localWorktreeIdentity();
  return {
    ...metadata,
    source_session_id: identity.session_id,
    source_worktree: identity.worktree,
    source_branch: identity.branch,
    source_head: identity.head,
    source_changed_files: identity.changed_files,
  };
}

function requestIdentity(args = {}) {
  const identity = localWorktreeIdentity();
  return {
    session_id: args?.session_id ?? identity.session_id,
    worktree: args?.worktree ?? identity.worktree,
    branch: args?.branch ?? identity.branch,
    head: args?.head ?? identity.head,
    changed_files: args?.changed_files ?? identity.changed_files,
  };
}

function coordinationScope(args = {}) {
  const identity = requestIdentity(args);
  return {
    room_id: args?.room_id ?? null,
    repo: args?.repo ?? identity.worktree,
    branch: identity.branch,
    task: args?.task ?? null,
  };
}

function stableNodeId(kind, tenant, seed) {
  const digest = createHash("sha1")
    .update(JSON.stringify({ kind, tenant, seed }))
    .digest("hex")
    .slice(0, 24);
  return `harness:${kind}:${digest}`;
}

function parseMentions(message) {
  const seen = new Set();
  const mentions = [];
  const re = /(?<![\w])@([A-Za-z0-9][A-Za-z0-9_.:-]{0,119})/g;
  const source = String(message || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ");
  for (const match of source.matchAll(re)) {
    const actor = String(match[1] || "").trim().replace(/[.,:;!?]+$/g, "");
    if (!actor || seen.has(actor)) continue;
    seen.add(actor);
    mentions.push(actor);
  }
  return mentions;
}

async function mirrorHarnessNode(kind, args, properties, labels = []) {
  if (THG_WRITE_MODE === "off" || THG_WRITE_MODE === "0" || THG_WRITE_MODE === "false") {
    return null;
  }
  const tenant = await mirrorTenantId(args);
  if (!tenant) {
    return {
      ok: false,
      skipped: true,
      error: "tenant_unresolved_for_direct_thg_mirror",
      attempted_sources: [
        "tenant_slug",
        "THEOREMS_HARNESS_TENANT",
        "RUSTYRED_THG_TENANT",
        "THEOREM_CONTEXT_TENANT_SLUG",
        "THEOREM_TENANT_SLUG",
        "product_bootstrap.default_tenant_slug",
      ],
    };
  }
  const node = {
    id: stableNodeId(kind, tenant, properties),
    labels: ["TheoremsHarness", ...labels],
    properties: {
      ...properties,
      tenant_slug: tenant,
      harness_kind: kind,
      project_dir: PROJECT_DIR,
      session_key: sessionKey(),
      captured_at: new Date().toISOString(),
    },
  };
  try {
    const result = await thgPost(
      `/v1/tenants/${encodeURIComponent(tenant)}/graph/nodes`,
      node
    );
    return { ok: true, node_id: node.id, result };
  } catch (err) {
    if (THG_WRITE_MODE === "primary") throw err;
    return { ok: false, node_id: node.id, error: err.message };
  }
}

function withThgMirror(result, mirror) {
  if (!mirror || typeof result !== "object" || result === null || Array.isArray(result)) {
    return result;
  }
  return { ...result, thg_mirror: mirror };
}

function requireString(args, key) {
  const value = args?.[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`'${key}' is required.`);
  }
  return value.trim();
}

function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      search.set(key, value.join(","));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

const ROUTE_KEYWORDS = Object.freeze({
  coordinate: [
    "coordinate",
    "claude",
    "codex",
    "same time",
    "parallel",
    "mention",
    "ping",
    "handoff",
    "other agent",
  ],
  plan: ["plan", "spec", "design", "roadmap", "migration", "checklist"],
  execute: ["implement", "fix", "ship", "build", "edit", "write", "test", "run"],
  diagnose: ["debug", "failure", "broken", "error", "regression", "trace"],
  research: ["research", "search", "evidence", "discover", "investigate", "compare"],
  review: ["review", "pr", "pull request", "diff", "audit"],
  remember: ["remember", "encode", "postmortem", "lesson", "learning"],
  context: ["context", "refresh", "artifact", "brief", "stale"],
});

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function pushUnique(target, value) {
  if (!target.includes(value)) target.push(value);
}

function routeModeFromCapabilities(capabilities, requestedMode) {
  if (requestedMode) return requestedMode;
  if (capabilities.includes("execute")) return "execute";
  if (capabilities.includes("diagnose")) return "diagnose";
  if (capabilities.includes("plan")) return "plan";
  if (capabilities.includes("research")) return "research";
  if (capabilities.includes("peer_review")) return "review";
  if (capabilities.includes("coordinate")) return "coordinate";
  if (capabilities.includes("remember")) return "remember";
  return "observe";
}

function selectHarnessRoute(args = {}) {
  const task = String(args?.task || args?.intent || args?.prompt || "").trim();
  const text = task.toLowerCase();
  const modeFromTask = task.match(/(?:^|\s)mode=([a-z0-9_-]+)/i)?.[1] || "";
  const requestedMode =
    String(args?.mode || modeFromTask).trim().toLowerCase() || null;
  const signals = args?.signals && typeof args.signals === "object" ? args.signals : {};
  const capabilities = ["observe"];
  const reasons = [];

  const addCapability = (capability, reason) => {
    pushUnique(capabilities, capability);
    if (reason) reasons.push(reason);
  };

  if (!task) {
    return {
      task: null,
      selected_mode: requestedMode || "observe",
      capabilities,
      route_reason: ["No task text supplied; ask for the goal or infer it from the active user turn."],
      first_actions: ["Resolve the current user intent before choosing plan, execute, research, or coordinate."],
      checkpoints: ["Route again after the task is concrete."],
      report_style: "one-line clarification",
      worktree_identity: localWorktreeIdentity(),
    };
  }

  if (requestedMode) addCapability(requestedMode, `Explicit mode requested: ${requestedMode}.`);
  if (signals.multi_agent === true || includesAny(text, ROUTE_KEYWORDS.coordinate)) {
    addCapability("coordinate", "Another agent or shared workstream is part of the task.");
  }
  if (signals.context_stale === true || includesAny(text, ROUTE_KEYWORDS.context)) {
    addCapability("compile_context", "The task asks for context refresh or may need a fresh artifact.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.research)) {
    addCapability("research", "The task asks for discovery or evidence before commitment.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.plan)) {
    addCapability("plan", "The task asks for a plan, design, spec, or checklist.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.diagnose)) {
    addCapability("diagnose", "The task contains a failure or regression signal.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.execute)) {
    addCapability("execute", "The task asks for implementation, tests, or file changes.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.review)) {
    addCapability("peer_review", "The task asks for review or diff inspection.");
  }
  if (includesAny(text, ROUTE_KEYWORDS.remember)) {
    addCapability("remember", "The task asks to preserve a lesson or memory.");
  }

  if (capabilities.length === 1) {
    addCapability("theorize", "Intent is broad; start with a short option pass before acting.");
  }

  if (capabilities.includes("execute")) {
    pushUnique(capabilities, "validate");
  }
  if (capabilities.includes("execute") || capabilities.includes("plan")) {
    pushUnique(capabilities, "report");
  }

  const selectedMode = routeModeFromCapabilities(capabilities, requestedMode);
  const firstActions = [];
  if (capabilities.includes("coordinate")) {
    firstActions.push("Inspect the room digest, write a coordination_intent for the immediate files, heartbeat presence, then use mentions only for interrupts or review requests.");
  }
  if (capabilities.includes("compile_context")) {
    firstActions.push("Refresh or inspect the Context Artifact before relying on older run state.");
  }
  if (capabilities.includes("plan")) {
    firstActions.push("Create the smallest useful checklist only after reading the live repo surface.");
  }
  if (capabilities.includes("execute")) {
    firstActions.push("Take the next bounded edit, validate it, then re-route if new ambiguity appears.");
  }
  if (capabilities.includes("theorize")) {
    firstActions.push("Name the viable approaches and choose a default before implementation.");
  }
  if (firstActions.length === 0) {
    firstActions.push("Observe the current repo/tool state, then choose the next capability at the first checkpoint.");
  }

  return {
    task,
    selected_mode: selectedMode,
    capabilities,
    route_reason: reasons.length ? reasons : ["Defaulted from task text and current harness policy."],
    first_actions: firstActions,
    checkpoints: [
      "Route again after the first material discovery.",
      "Route again before editing files that another agent may touch.",
      "Before closeout, choose validate, peer_review, encode, or concise report based on actual risk.",
    ],
    report_style:
      capabilities.includes("execute") || capabilities.includes("plan")
        ? "focused checklist reconciliation"
        : "concise action/finding/next summary",
    worktree_identity: localWorktreeIdentity(),
  };
}

const TOOLS = [
  {
    name: "harness_route",
    description:
      "Choose the next Theorem's Harness capability mix for a task. Use when /harness is invoked as session opt-in, or when a run should pivot instead of staying locked in plan/execute/research.",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The user's current intent or task.",
        },
        intent: { type: "string" },
        prompt: { type: "string" },
        mode: {
          type: "string",
          description:
            "Optional explicit mode from the user. The router honors this but may add supporting capabilities.",
        },
        signals: {
          type: "object",
          description:
            "Optional booleans such as multi_agent=true, context_stale=true, high_risk=true, or ui_visual=true.",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "orchestrate_refresh",
    description:
      "Recompile the Context Artifact for the current Claude session. Use when the conversation has shifted topics and the context the UserPromptSubmit hook injected at the start of this turn no longer covers what you need. Returns the new artifact body and run id.",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description:
            "What you need context for, in plain language. Mirror the user's current request as closely as possible.",
        },
        budget_tokens: {
          type: "integer",
          description: "Max tokens for the compiled artifact. Default 4000.",
          default: 4000,
        },
      },
      required: ["task"],
    },
  },
  {
    name: "harness_replay",
    description:
      "Return the event timeline for a harness run. Use when the user asks 'what did you actually do' or for audit/debug. Defaults to the current session's run id.",
    inputSchema: {
      type: "object",
      properties: {
        run_id: {
          type: "string",
          description:
            "Run id to replay. Omit to use the current Claude session's run id.",
        },
        after_seq: {
          type: "integer",
          description:
            "Native-binding text cursor. Defaults to 0; ignored by legacy HTTP replay.",
          default: 0,
        },
        scope: {
          type: "string",
          description:
            "Route scope. Use shared-remote to avoid the local native binding when a data dir is configured.",
          enum: ["local", "shared", "shared-remote"],
          default: "local",
        },
      },
    },
  },
  {
    name: "harness_describe_current",
    description:
      "Show the currently-injected Context Artifact for this session: which task it covers, token ledger, and the source atoms it included. Useful for understanding why the model has the working knowledge it has.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "context_compile",
    description:
      "Compile a Context Theorem artifact for a task through the public context compiler route. Use when the hook-prepared context is absent or you need an explicit artifact payload.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
        task_type: { type: "string" },
        repo: { type: "string" },
        budget_tokens: { type: "integer", default: 4000 },
        mode: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["task"],
    },
  },
  {
    name: "code_search",
    description:
      "Native CodeCrawler/code graph operations over the tenant RustyRed graph. Search by default; pass operation=ingest/reindex/context/explore/explain/recognize for the full code graph surface.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        operation: {
          type: "string",
          enum: ["ingest", "reindex", "search", "context", "recognize", "explore", "explain", "record_use_receipt"],
          default: "search",
        },
        repo_path: { type: "string" },
        repo_url: { type: "string" },
        path: { type: "string" },
        query: { type: "string" },
        node_id: { type: "string" },
        repo_id: { type: "string" },
        repo: {
          type: "string",
          description: "Legacy alias. For search it maps to repo_id; for ingest it maps to repo_path.",
        },
        file_path: { type: "string" },
        path_prefix: { type: "string" },
        kinds: { type: "array", items: { type: "string" } },
        entity_type: {
          type: "string",
          description: "Legacy alias for one symbol kind; maps to kinds when kinds is absent.",
        },
        include_extensions: { type: "array", items: { type: "string" } },
        exclude_dirs: { type: "array", items: { type: "string" } },
        limit: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        max_depth: { type: "integer", default: 1 },
        max_files: { type: "integer" },
        max_file_bytes: { type: "integer" },
        max_total_bytes: { type: "integer" },
        max_clone_bytes: { type: "integer" },
        max_repo_bytes: { type: "integer" },
        before_lines: { type: "integer" },
        after_lines: { type: "integer" },
        max_chars: { type: "integer" },
        text: { type: "string" },
        action: { type: "string" },
        outcome: { type: "string" },
        use: { type: "object" },
        actor: { type: "string" },
        timeout_ms: { type: "integer", default: 120000 },
        dry_run: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "compute_code",
    description:
      "Alias for the native CodeCrawler-backed code_search tool. Use for graph-structural code discovery, ingest, context, explain, explore, and compute-code replacement flows.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        operation: {
          type: "string",
          enum: ["ingest", "reindex", "search", "context", "recognize", "explore", "explain", "record_use_receipt"],
          default: "search",
        },
        repo_path: { type: "string" },
        repo_url: { type: "string" },
        path: { type: "string" },
        query: { type: "string" },
        node_id: { type: "string" },
        repo_id: { type: "string" },
        repo: { type: "string" },
        file_path: { type: "string" },
        path_prefix: { type: "string" },
        kinds: { type: "array", items: { type: "string" } },
        entity_type: { type: "string" },
        include_extensions: { type: "array", items: { type: "string" } },
        exclude_dirs: { type: "array", items: { type: "string" } },
        limit: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        max_depth: { type: "integer", default: 1 },
        max_files: { type: "integer" },
        max_file_bytes: { type: "integer" },
        max_total_bytes: { type: "integer" },
        max_clone_bytes: { type: "integer" },
        max_repo_bytes: { type: "integer" },
        before_lines: { type: "integer" },
        after_lines: { type: "integer" },
        max_chars: { type: "integer" },
        text: { type: "string" },
        action: { type: "string" },
        outcome: { type: "string" },
        use: { type: "object" },
        actor: { type: "string" },
        timeout_ms: { type: "integer", default: 120000 },
        dry_run: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "code_crawl",
    description:
      "Compatibility wrapper for native code_search operation=ingest. Ingest or refresh a repository URL/path in the CodeCrawler/code graph surface.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        repo_id: { type: "string" },
        repo: {
          type: "string",
          description: "Public GitHub URL or owner/repo short form to clone and ingest.",
        },
        path: {
          type: "string",
          description: "Server-readable local path to ingest when running as an operator.",
        },
        paths: { type: "array", items: { type: "string" } },
        language: { type: "string" },
        notebook_id: { type: "string" },
        graph_write_token: { type: "string" },
        include_extensions: { type: "array", items: { type: "string" } },
        exclude_dirs: { type: "array", items: { type: "string" } },
        max_files: { type: "integer" },
        max_file_bytes: { type: "integer" },
        max_total_bytes: { type: "integer" },
        max_clone_bytes: { type: "integer" },
        max_repo_bytes: { type: "integer" },
        timeout_ms: { type: "integer", default: 120000 },
        dry_run: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "harness_fractal_expansion",
    description:
      "Run Theorem's Harness research mode: gap-frontier/fractal expansion over the graph. Creates a temporary harness run when run_id is omitted.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        run_id: { type: "string" },
        top_k: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        budget: { type: "object" },
        scope: { type: "object" },
      },
      required: ["query"],
    },
  },
  {
    name: "fractal_expand",
    description:
      "Alias for harness_fractal_expansion with launch-facing naming. Runs gap-frontier/fractal expansion over the graph and returns the active harness run id.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        run_id: { type: "string" },
        top_k: { type: "integer", default: 20, minimum: 1, maximum: 100 },
        budget: { type: "object" },
        scope: { type: "object" },
      },
      required: ["query"],
    },
  },
  {
    name: "instant_kg_status",
    description:
      "Read Instant KG status from the tenant-scoped THG product service. Use to check Pairformer/Instant KG readiness for a tenant graph.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        manifest: { type: "object" },
        delta: { type: "object" },
      },
    },
  },
  {
    name: "instant_kg_reingest",
    description:
      "Enqueue a fresh Instant KG capture/reingest job through Index-API. Use when a URL or document needs to be reprocessed into the graph.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        kind: { type: "string", default: "url" },
        relation_confidence_floor: { type: "number" },
      },
      required: ["input"],
    },
  },
  {
    name: "self_note",
    description:
      "Save a typed agent-memory note for the current actor using the shared harness memory substrate.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        actor: { type: "string" },
        agent_id: { type: "string" },
        scope: {
          type: "string",
          description:
            "Route scope. Shared preserves the existing shared memory path; private uses the local native binding when configured.",
          enum: ["shared", "private"],
          default: "shared",
        },
        kind: { type: "string", default: "self_note" },
        memory_node_type: { type: "string", default: "belief" },
        tags: { type: "array", items: { type: "string" } },
        links: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["content"],
    },
  },
  {
    name: "self_revise",
    description:
      "Create a revision-tracked replacement for a memory atom and supersede the prior version.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        doc_id: { type: "string" },
        content: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        reason: { type: "string" },
        memory_node_type: { type: "string" },
        cites_doc_ids: { type: "array", items: { type: "string" } },
        derived_from_doc_ids: { type: "array", items: { type: "string" } },
      },
      required: ["doc_id", "content"],
    },
  },
  {
    name: "self_archive",
    description:
      "Archive a memory atom out of active recall while preserving an auditable archive wrapper.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        doc_id: { type: "string" },
        reason: { type: "string" },
        title: { type: "string" },
      },
      required: ["doc_id"],
    },
  },
  {
    name: "self_recall_archive",
    description:
      "Recall archived memory atoms on demand without returning them in default active recall.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        query: { type: "string" },
        actor: { type: "string" },
        limit: { type: "integer", default: 10 },
      },
    },
  },
  {
    name: "recall",
    description:
      "Recall native harness memory by query. Compatibility mode: pass tenant_slug and task to preview product saved-context recall.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Memory search query. When present, recall routes to native harness memory.",
        },
        limit: { type: "integer", default: 10 },
        actor: { type: "string" },
        agent_id: { type: "string" },
        scope: {
          type: "string",
          description:
            "Memory route scope. Private uses the local native binding when configured.",
          enum: ["private", "shared"],
          default: "private",
        },
        tenant_slug: { type: "string" },
        task: { type: "string" },
        project_slug: { type: "string" },
        mode: { type: "string" },
        modes: { type: "array", items: { type: "string" } },
        profile_id: { type: "string" },
        profile_ids: { type: "array", items: { type: "string" } },
        permissions: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "remember",
    description:
      "Save a durable memory note through the harness memory substrate using launch-facing naming. Prefer encode for lessons/postmortems and remember for reusable context.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        actor: { type: "string" },
        agent_id: { type: "string" },
        scope: {
          type: "string",
          description:
            "Route scope. Shared preserves the existing shared memory path; private uses the local native binding when configured.",
          enum: ["shared", "private"],
          default: "shared",
        },
        kind: { type: "string" },
        memory_node_type: { type: "string", default: "belief" },
        tags: { type: "array", items: { type: "string" } },
        links: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["content"],
    },
  },
  {
    name: "relate",
    description:
      "Record a typed relationship between two memory or graph references in the THG mirror, without claiming canonical graph promotion.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        from_id: { type: "string" },
        to_id: { type: "string" },
        relation: { type: "string", default: "related_to" },
        reason: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["from_id", "to_id"],
    },
  },
  {
    name: "encode",
    description:
      "Record a feedback item, durable solution, or postmortem in harness memory with outcome metadata and a fitness signal. Use automatically when a session discovers an important good/bad lesson.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        kind: {
          type: "string",
          enum: ["encode", "feedback", "solution", "postmortem"],
          default: "encode",
        },
        outcome: {
          type: "string",
          enum: ["positive", "negative", "mixed", "neutral"],
          default: "neutral",
        },
        signal: { type: "string" },
        reason: { type: "string" },
        event_id: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        links: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
        metadata: { type: "object" },
        context: { type: "object" },
        auto_triggered: { type: "boolean", default: false },
        training_weight: { type: "number", minimum: 0, default: 1.0 },
        training_target: {
          type: "string",
          enum: ["personal_b", "cohort_a", "none"],
          default: "none",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "skill_list",
    description:
      "List native Theorem harness skill packs stored in RustyRed. Use before skill_get when choosing a capability pack for a Rust task.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        status: {
          type: "string",
          enum: ["draft", "shadow", "advisory", "validated", "canonical", "retired"],
        },
        include_retired: { type: "boolean", default: false },
        limit: { type: "integer", default: 20 },
      },
    },
  },
  {
    name: "skill_get",
    description:
      "Read one native Theorem harness skill pack by id or content hash.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        pack_id: { type: "string" },
        packId: { type: "string" },
        id: { type: "string" },
        pack_content_hash: { type: "string" },
        packContentHash: { type: "string" },
        content_hash: { type: "string" },
        contentHash: { type: "string" },
      },
    },
  },
  {
    name: "skill_publish",
    description:
      "Publish a content-addressed skill pack into the native Theorem RustyRed substrate.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        actor_id: { type: "string" },
        pack: { type: "object" },
        capability_pack: { type: "object" },
        pack_content_hash: { type: "string" },
        packContentHash: { type: "string" },
        source_content_hash: { type: "string" },
        sourceContentHash: { type: "string" },
        artifact_hashes: { type: "array", items: { type: "string" } },
        artifactHashes: { type: "array", items: { type: "string" } },
        status: {
          type: "string",
          enum: ["draft", "shadow", "advisory", "validated", "canonical", "retired"],
        },
        metadata: { type: "object" },
        created_at: { type: "string" },
        createdAt: { type: "string" },
      },
      required: ["pack"],
    },
  },
  {
    name: "skill_apply",
    description:
      "Apply a native Theorem harness skill pack and persist a use receipt for the promotion loop.",
    inputSchema: {
      type: "object",
      properties: {
        tenant: { type: "string" },
        tenant_slug: { type: "string" },
        pack_id: { type: "string" },
        packId: { type: "string" },
        id: { type: "string" },
        pack_content_hash: { type: "string" },
        packContentHash: { type: "string" },
        actor: { type: "string" },
        actor_id: { type: "string" },
        run_id: { type: "string" },
        runId: { type: "string" },
        task: { type: "string" },
        context: { type: "object" },
        outcome: { type: "object" },
        allow_retired: { type: "boolean", default: false },
        allowRetired: { type: "boolean", default: false },
        receipt_id: { type: "string" },
        receiptId: { type: "string" },
        metadata: { type: "object" },
        created_at: { type: "string" },
        createdAt: { type: "string" },
      },
      required: ["actor"],
    },
  },
  {
    name: "coordination_intent",
    description:
      "Write this actor's live room intent. Prefer this over a broad lane claim: it tells peers what files or subsystem you are touching now.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        summary: { type: "string" },
        status: {
          type: "string",
          enum: ["working", "paused", "done"],
          default: "working",
        },
        claimed_files: { type: "array", items: { type: "string" } },
        expected_completion: { type: "string" },
      },
      required: ["summary"],
    },
  },
  {
    name: "write_intent",
    description:
      "Alias for coordination_intent. Write this actor's live room intent before acting, using the name taught by the coordination skill.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        summary: { type: "string" },
        status: {
          type: "string",
          enum: ["working", "paused", "done"],
          default: "working",
        },
        claimed_files: { type: "array", items: { type: "string" } },
        expected_completion: { type: "string" },
      },
      required: ["summary"],
    },
  },
  {
    name: "read_intents_for_room",
    description:
      "Read native Theorem harness room intents so agents can see live claims before editing.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        room_id: { type: "string" },
        statuses: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "coordination_reflection",
    description:
      "Write this actor's working-memory reflection for peers to read at their next SessionStart.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        summary: { type: "string" },
        assumptions: { type: "array", items: { type: "string" } },
        open_questions: { type: "array", items: { type: "string" } },
        pointers: { type: "array", items: { type: "string" } },
      },
      required: ["summary"],
    },
  },
  {
    name: "coordination_decision",
    description:
      "Append a room-scoped decision with rationale so future agents inherit the choice without relitigating it.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        title: { type: "string" },
        choice: { type: "string" },
        rationale: { type: "string" },
        alternatives_considered: { type: "array", items: { type: "string" } },
        caused_by: { type: "array", items: { type: "string" } },
        supersedes: { type: "array", items: { type: "string" } },
        decision_id: { type: "string" },
      },
      required: ["title", "choice"],
    },
  },
  {
    name: "coordination_tension",
    description:
      "Open, resolve, or escalate a visible disagreement. Tensions surface forks without blocking the other actor's work.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        action: {
          type: "string",
          enum: ["open", "resolve", "escalate"],
          default: "open",
        },
        title: { type: "string" },
        observed: { type: "string" },
        disagreement: { type: "string" },
        proposed_alternative: { type: "string" },
        tension_id: { type: "string" },
        status: {
          type: "string",
          enum: ["resolved", "escalated"],
          default: "resolved",
        },
        resolved_by_decision_id: { type: "string" },
      },
    },
  },
  {
    name: "coordinate",
    description:
      "Append a cross-agent coordination message and queue @mentions for target agents. Use this for interrupts, review requests, and true asks; use coordination_intent/reflection for normal shared-state handoff.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        doc_id: { type: "string" },
        message: { type: "string" },
        urgency: { type: "string", enum: ["info", "ask", "block"], default: "info" },
        title: { type: "string" },
        metadata: { type: "object" },
        target_session_id: { type: "string" },
        target_worktree: { type: "string" },
        target_branch: { type: "string" },
        target_head: { type: "string" },
        target_changed_files: { type: "array", items: { type: "string" } },
      },
      required: ["message"],
    },
  },
  {
    name: "mentions",
    description:
      "Load or consume pending mentions for the current or requested actor.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        limit: { type: "integer", default: 20 },
        consume: { type: "boolean", default: false },
        session_id: { type: "string" },
        worktree: { type: "string" },
        branch: { type: "string" },
        head: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "mentions_wait",
    description:
      "Block briefly until pending mentions arrive for the current or requested actor. This is the agent-equivalent of a real ping on top of the shared mention queue.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        limit: { type: "integer", default: 20 },
        consume: { type: "boolean", default: false },
        timeout_seconds: { type: "integer", default: 30, minimum: 0, maximum: 120 },
        interval_seconds: { type: "number", default: 1, minimum: 0.1, maximum: 5 },
        session_id: { type: "string" },
        worktree: { type: "string" },
        branch: { type: "string" },
        head: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "presence",
    description:
      "Refresh, end, or read short-TTL actor presence for headless agent coordination.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        session_id: { type: "string" },
        surface: { type: "string" },
        worktree: { type: "string" },
        branch: { type: "string" },
        head: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
        ttl_seconds: { type: "integer", default: 60 },
        status: { type: "string", default: "active" },
        mode: { type: "string", enum: ["heartbeat", "get", "end"], default: "heartbeat" },
      },
    },
  },
  {
    name: "coordination_room",
    description:
      "Join, inspect, pause, resume, or stop durable coordination-room membership. Prefer this for shared task membership; subscribe remains the mention-polling channel.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        action: {
          type: "string",
          enum: ["join", "start", "status", "pause", "resume", "stop", "lane"],
          default: "join",
        },
        room_id: { type: "string" },
        session_id: { type: "string" },
        surface: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        worktree: { type: "string" },
        head: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
        lane: { type: "string" },
      },
    },
  },
  {
    name: "subscribe",
    description:
      "Register the current or requested actor as polling a mention channel.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        doc_id: { type: "string" },
      },
    },
  },
  {
    name: "continuity_pack",
    description:
      "Write a graph-backed and disk-mirrored coordination continuity pack before compaction, handoff, or a long pause.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        room_id: { type: "string" },
        session_id: { type: "string" },
        surface: { type: "string" },
        repo: { type: "string" },
        branch: { type: "string" },
        task: { type: "string" },
        worktree: { type: "string" },
        head: { type: "string" },
        changed_files: { type: "array", items: { type: "string" } },
        objective: { type: "string" },
        summary: { type: "string" },
        next_action: { type: "string" },
        trigger: {
          type: "string",
          enum: ["manual", "precompact", "handoff", "pause", "session_end"],
          default: "manual",
        },
        salient_nodes: { type: "array", items: { type: "object" } },
        validation_receipts: { type: "array", items: { type: "object" } },
        context_web_run_id: { type: "string" },
        context_web_query: { type: "string" },
        context_web_mode: { type: "string", default: "mini" },
        context_web_budget_tokens: { type: "integer", default: 1200 },
      },
      required: ["summary", "next_action"],
    },
  },
  {
    name: "multihead_run",
    description:
      "Start or read a local multi-head run substrate. V0.1 spike: run state is local JSON under .theorem/multihead.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["start", "status"], default: "start" },
        run_id: { type: "string" },
        goal: { type: "string" },
        actor: { type: "string" },
      },
    },
  },
  {
    name: "multihead_task",
    description:
      "Create a claimable task node inside a local multi-head run. The graph can grow during work; this is the v0.1 dynamic frontier seed.",
    inputSchema: {
      type: "object",
      properties: {
        run_id: { type: "string" },
        node_id: { type: "string" },
        goal: { type: "string" },
        description: { type: "string" },
        kind: { type: "string", default: "task" },
        actor: { type: "string" },
        prerequisites: { type: "array", items: { type: "string" } },
        metadata: { type: "object" },
      },
      required: ["run_id", "goal"],
    },
  },
  {
    name: "multihead_claim",
    description:
      "Acquire, renew, or release a leased CAS claim on a task node. Expired leases reopen automatically and stale epochs cannot submit patches.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["claim", "release"], default: "claim" },
        run_id: { type: "string" },
        node_id: { type: "string" },
        claim_id: { type: "string" },
        owner: { type: "string" },
        lease_ttl_seconds: { type: "integer", default: 90 },
      },
      required: ["run_id", "owner"],
    },
  },
  {
    name: "multihead_patch",
    description:
      "Propose or rebase a patch against a claimed task. Receipts bind to patch_id + base_commit and are invalidated on rebase.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["propose", "rebase"], default: "propose" },
        run_id: { type: "string" },
        node_id: { type: "string" },
        patch_id: { type: "string" },
        owner: { type: "string" },
        epoch: { type: "integer" },
        base_commit: { type: "string" },
        new_base_commit: { type: "string" },
        files: { type: "array", items: { type: "string" } },
        patch: { type: "string" },
        patch_ref: { type: "object" },
      },
      required: ["run_id"],
    },
  },
  {
    name: "multihead_proof",
    description:
      "Run a proof command locally through the substrate and attach an actual receipt to a patch. Head assertions are not accepted as proof.",
    inputSchema: {
      type: "object",
      properties: {
        run_id: { type: "string" },
        patch_id: { type: "string" },
        command: { type: "string" },
        args: { type: "array", items: { type: "string" } },
        cwd: { type: "string" },
        timeout_ms: { type: "integer", default: 120000 },
      },
      required: ["run_id", "patch_id", "command"],
    },
  },
  {
    name: "multihead_review",
    description:
      "Open or complete an adversarial review node for a patch. Completed reviews should list falsification attempts, findings, and waived risks.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["open", "complete"], default: "open" },
        run_id: { type: "string" },
        patch_id: { type: "string" },
        review_id: { type: "string" },
        reviewer: { type: "string" },
        status: { type: "string" },
        falsification_attempts: { type: "array", items: { type: "string" } },
        findings: { type: "array", items: { type: "object" } },
        waived_risks: { type: "array", items: { type: "string" } },
      },
      required: ["run_id", "patch_id", "reviewer"],
    },
  },
  {
    name: "provenance_trace",
    description:
      "Read reasoning trace provenance. Pass trace_id for a full trace, trace_id plus object_pk for an object-specific explanation, or query to search traces.",
    inputSchema: {
      type: "object",
      properties: {
        trace_id: { type: "string" },
        object_pk: { type: "integer" },
        query: { type: "string" },
        policy_intent: { type: "string" },
        min_confidence: { type: "number" },
        max_confidence: { type: "number" },
        limit: { type: "integer", default: 20, minimum: 1, maximum: 200 },
      },
    },
  },
  {
    name: "product_bootstrap",
    description:
      "Return the Context Theorem product bootstrap state for the authenticated account: tenants, role, write access, and available projects/keys summary.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "saved_contexts_list",
    description:
      "List saved context entries for a tenant, optionally scoped to a project and optionally including muted entries.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        project_slug: { type: "string" },
        include_muted: { type: "boolean", default: false },
      },
      required: ["tenant_slug"],
    },
  },
  {
    name: "saved_context_create",
    description:
      "Create a saved context entry under a tenant/project. Use for durable context, policy, or evidence that should be recalled later.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        memory_role: { type: "string" },
        summary: { type: "string" },
        project_slug: { type: "string" },
        kind: { type: "string" },
        metadata: { type: "object" },
        scope: { type: "object" },
      },
      required: ["tenant_slug", "title", "content", "memory_role"],
    },
  },
  {
    name: "saved_context_update",
    description:
      "Update an existing saved context entry's content, title, summary, metadata, scope, or role.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        entry_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        memory_role: { type: "string" },
        summary: { type: "string" },
        kind: { type: "string" },
        metadata: { type: "object" },
        scope: { type: "object" },
      },
      required: ["tenant_slug", "entry_slug", "title", "content", "memory_role"],
    },
  },
  {
    name: "saved_context_mute",
    description:
      "Mute a saved context entry so prepare/recall no longer includes it without deleting the record.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        entry_slug: { type: "string" },
      },
      required: ["tenant_slug", "entry_slug"],
    },
  },
  {
    name: "saved_context_activate",
    description:
      "Re-activate a previously muted saved context entry.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        entry_slug: { type: "string" },
      },
      required: ["tenant_slug", "entry_slug"],
    },
  },
  {
    name: "saved_context_delete",
    description:
      "Delete a saved context entry permanently.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        entry_slug: { type: "string" },
      },
      required: ["tenant_slug", "entry_slug"],
    },
  },
  {
    name: "saved_context_preview_recall",
    description:
      "Preview what saved context would be recalled for a tenant/project/task/profile/mode combination before running prepare.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        task: { type: "string" },
        project_slug: { type: "string" },
        mode: { type: "string" },
        modes: { type: "array", items: { type: "string" } },
        profile_id: { type: "string" },
        profile_ids: { type: "array", items: { type: "string" } },
        permissions: { type: "array", items: { type: "string" } },
      },
      required: ["tenant_slug", "task"],
    },
  },
  {
    name: "memory_patch_review_queue",
    description:
      "List reviewable memory patches for a tenant, optionally scoped by project or review status.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        project_slug: { type: "string" },
        review_status: { type: "string" },
        limit: { type: "integer" },
      },
      required: ["tenant_slug"],
    },
  },
  {
    name: "memory_patch_review_update",
    description:
      "Update a memory patch review decision, with optional direct promotion into saved context.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        run_id: { type: "string" },
        patch_id: { type: "string" },
        review_status: { type: "string" },
        promote_to_saved_context: { type: "boolean" },
        title: { type: "string" },
        summary: { type: "string" },
        project_slug: { type: "string" },
        kind: { type: "string" },
        metadata: { type: "object" },
      },
      required: ["tenant_slug", "run_id", "patch_id", "review_status"],
    },
  },
  {
    name: "domain_list",
    description:
      "List available Context Theorem domain packs, optionally including install state for a user.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string" },
      },
    },
  },
  {
    name: "domain_install",
    description:
      "Install one to three Context Theorem domain packs for the requested user.",
    inputSchema: {
      type: "object",
      properties: {
        user: { type: "string", default: "me" },
        pack_slugs: { type: "array", items: { type: "string" } },
      },
      required: ["pack_slugs"],
    },
  },
];

const server = new Server(
  { name: "theorems-harness", version: "0.5.3" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const runId = currentRunId();

  try {
    if (name === "harness_route") {
      return jsonText(selectHarnessRoute(args));
    }

    if (name === "orchestrate_refresh") {
      if (!args?.task) {
        return {
          content: [{ type: "text", text: "Error: 'task' is required." }],
          isError: true,
        };
      }
      const body = {
        task: args.task,
        mode: "prepare",
        repo: PROJECT_DIR,
        run_id: runId,
        budget_tokens: args.budget_tokens ?? 4000,
      };
      const result = await theoremPost("/orchestrate/prepare/", body);
      const artifactBody =
        result.context_brief ||
        result.artifact?.body ||
        result.artifact?.markdown ||
        result.body ||
        result.markdown ||
        "(no artifact body in response)";
      const ledger = result.artifact?.token_ledger || result.token_ledger || {};
      return {
        content: [
          {
            type: "text",
            text:
              artifactBody +
              "\n\n---\n_run " +
              (runId || "(none)") +
              " · refreshed · ledger " +
              JSON.stringify(ledger) +
              "_",
          },
        ],
      };
    }

    if (name === "harness_replay") {
      const id = args?.run_id || runId;
      if (!id) {
        return {
          content: [
            {
              type: "text",
              text: "No run_id available. Either pass run_id explicitly or wait until SessionStart hook completes.",
            },
          ],
          isError: true,
        };
      }
      return jsonText(await replayHarnessRun(id, args));
    }

    if (name === "harness_describe_current") {
      const artifactPath = join(STATE_DIR, "current-artifact.json");
      if (!existsSync(artifactPath)) {
        return {
          content: [
            {
              type: "text",
              text: "No artifact has been injected yet for this session. The UserPromptSubmit hook should run on the next prompt.",
            },
          ],
        };
      }
      const raw = readFileSync(artifactPath, "utf8");
      return { content: [{ type: "text", text: raw }] };
    }

    if (name === "context_compile") {
      const body = {
        ...args,
        task: requireString(args, "task"),
        budget_tokens: args?.budget_tokens ?? 4000,
      };
      const result = await theoremPost("/context/compile/", body, 60_000);
      return jsonText(result);
    }

    if (name === "code_search" || name === "compute_code") {
      const operation = String(args?.operation || "search").trim() || "search";
      const payload = {
        ...args,
        operation,
      };
      const tenant = await requestTenantSlug(args);
      if (tenant && !payload.tenant_slug && !payload.tenant) payload.tenant_slug = tenant;
      if (!payload.repo_id && args?.repo && operation === "search") {
        payload.repo_id = args.repo;
      }
      if (!payload.repo_path && args?.repo && (operation === "ingest" || operation === "reindex")) {
        payload.repo_path = args.repo;
      }
      if (!payload.repo_path && args?.path && (operation === "ingest" || operation === "reindex")) {
        payload.repo_path = args.path;
      }
      if (!payload.kinds && args?.entity_type) {
        payload.kinds = [String(args.entity_type)];
      }
      if (operation === "search" && !payload.query && !payload.text && !payload.node_id) {
        return {
          content: [{ type: "text", text: "Error: pass query, text, or node_id for code search." }],
          isError: true,
        };
      }
      const result = await nativeCodeTool(name, payload);
      return jsonText(result);
    }

    if (name === "code_crawl") {
      if (!args?.repo && !args?.path) {
        return {
          content: [{ type: "text", text: "Error: pass either 'repo' or 'path'." }],
          isError: true,
        };
      }
      const payload = {
        ...args,
        operation: "ingest",
        repo_path: args?.repo ?? args?.path,
      };
      const tenant = await requestTenantSlug(args);
      if (tenant && !payload.tenant_slug && !payload.tenant) payload.tenant_slug = tenant;
      const result = await nativeCodeTool("code_search", payload);
      return jsonText(result);
    }

    if (name === "harness_fractal_expansion" || name === "fractal_expand") {
      const query = requireString(args, "query");
      let activeRunId = args?.run_id || runId;
      if (!activeRunId) {
        const begin = await theoremPost("/harness/runs/", {
          task: `Research: ${query}`,
          actor: "agent",
          scope: { mode: "research", source: "theorems-harness" },
        });
        activeRunId = begin.run_id || begin.id || begin.run?.run_id || begin.run?.id;
      }
      if (!activeRunId) {
        return {
          content: [
            {
              type: "text",
              text: "Unable to start or resolve a harness run for fractal expansion.",
            },
          ],
          isError: true,
        };
      }
      const budget = {
        ...(args?.budget ?? {}),
        top_k: args?.top_k ?? args?.budget?.top_k ?? 20,
      };
      const result = await theoremPost(
        `/harness/runs/${activeRunId}/fractal-expansion/`,
        {
          query,
          budget,
          scope: args?.scope ?? {},
        },
        60_000
      );
      return jsonText({ run_id: activeRunId, ...result });
    }

    if (name === "instant_kg_status") {
      const result = await thgPost(
        thgTenantPath(args, "/instant-kg/status"),
        {
          manifest: args?.manifest ?? undefined,
          delta: args?.delta ?? undefined,
        }
      );
      return jsonText(result);
    }

    if (name === "instant_kg_reingest") {
      const result = await theoremPost("/capture/instant-kg/", {
        input: requireString(args, "input"),
        kind: args?.kind ?? "url",
        relation_confidence_floor: args?.relation_confidence_floor ?? undefined,
      });
      return jsonText(result);
    }

    if (name === "self_note") {
      return jsonText(
        await rememberHarnessMemory(
          { ...args, kind: args?.kind ?? "self_note" },
          {
            verb: "self_note",
            legacyKind: "self_note",
            defaultKind: "self_note",
          },
        ),
      );
    }

    if (name === "self_revise") {
      const payload = {
        actor: toolActor(args),
        doc_id: requireString(args, "doc_id"),
        content: requireString(args, "content"),
        title: args?.title ?? null,
        summary: args?.summary ?? "",
        reason: args?.reason ?? "",
        memory_node_type: args?.memory_node_type ?? null,
        cites_doc_ids: args?.cites_doc_ids ?? [],
        derived_from_doc_ids: args?.derived_from_doc_ids ?? [],
      };
      const tenant = tenantId(args);
      if (tenant) payload.tenant_slug = tenant;
      const result = await executeWithRoutePolicy(
        { verb: "self_revise", scope: "shared" },
        payload,
        null,
        { allowFallback: false },
      );
      return jsonText(result);
    }

    if (name === "self_archive") {
      const payload = {
        actor: toolActor(args),
        doc_id: requireString(args, "doc_id"),
        reason: args?.reason ?? "",
        title: args?.title ?? null,
      };
      const tenant = tenantId(args);
      if (tenant) payload.tenant_slug = tenant;
      const result = await executeWithRoutePolicy(
        { verb: "self_archive", scope: "shared" },
        payload,
        null,
        { allowFallback: false },
      );
      return jsonText(result);
    }

    if (name === "self_recall_archive") {
      const payload = {
        actor: toolActor(args),
        query: args?.query ?? "",
        limit: args?.limit ?? 10,
      };
      const tenant = tenantId(args);
      if (tenant) payload.tenant_slug = tenant;
      const result = await executeWithRoutePolicy(
        { verb: "self_recall_archive", scope: "shared" },
        payload,
        null,
        { allowFallback: false },
      );
      return jsonText(result);
    }

    if (name === "recall") {
      if (args?.query || args?.scope === "private") {
        return jsonText(await recallHarnessMemory(args));
      }
      if (args?.tenant_slug && args?.task) {
        const result = await savedContextPreviewRecall(args);
        const selection = HARNESS_ROUTE_POLICY.select({
          verb: "saved_context_preview_recall",
          scope: "shared",
        });
        return jsonText(
          withRouteReceipt(
            result,
            directHttpRouteReceipt(selection, BASE_URL, { calledAs: "recall" }),
          ),
        );
      }
      return {
        content: [
          {
            type: "text",
            text:
              "Pass query for native memory recall, or tenant_slug and task for saved-context preview compatibility.",
          },
        ],
        isError: true,
      };
    }

    if (name === "remember") {
      return jsonText(await rememberHarnessMemory(args));
    }

    if (name === "relate") {
      // Plugin relate is an edge UPSERT; native `relate` is a neighbor READ, so
      // route this write to the native bulk-edge writer instead. Edge record shape
      // mirrors the prior THG.GRAPH.EDGE.UPSERT payload; verify on first live write.
      const payload = {
        edges: [
          {
            from_id: requireString(args, "from_id"),
            to_id: requireString(args, "to_id"),
            type: args?.relation ?? "related_to",
            properties: {
              reason: args?.reason ?? "",
              ...(args?.metadata ?? {}),
            },
          },
        ],
      };
      const tenant = tenantId(args);
      if (tenant) payload.tenant = tenant;
      const result = await executeWithRoutePolicy(
        { verb: "relate", nativeToolName: "rustyred_thg_bulk_edges", scope: "shared" },
        payload,
        null,
        { allowFallback: false },
      );
      return jsonText(result);
    }

    if (name === "encode") {
      const payload = {
        actor: toolActor(args),
        title: args?.title ?? null,
        content: requireString(args, "content"),
        kind: args?.kind ?? "encode",
        outcome: args?.outcome ?? "neutral",
        signal: args?.signal ?? null,
        reason: args?.reason ?? "",
        event_id: args?.event_id ?? "",
        tags: args?.tags ?? [],
        links: args?.links ?? [],
        summary: args?.summary ?? "",
        context: args?.context ?? {},
        auto_triggered: args?.auto_triggered === true,
        metadata: {
          ...(args?.metadata ?? {}),
          training_weight: args?.training_weight ?? 1.0,
          training_target: args?.training_target ?? "none",
        },
      };
      const tenant = tenantId(args);
      if (tenant) payload.tenant_slug = tenant;
      const result = await executeWithRoutePolicy(
        { verb: "encode", scope: "shared" },
        payload,
        null,
        { allowFallback: false },
      );
      return jsonText(result);
    }

    if (
      name === "skill_list" ||
      name === "skill_get" ||
      name === "skill_publish" ||
      name === "skill_apply"
    ) {
      return jsonText(await nativeSkillTool(name, args));
    }

    if (name === "coordination_intent" || name === "write_intent") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        ...coordinationScope(args),
        summary: requireString(args, "summary"),
        status: args?.status ?? "working",
        claimed_files: args?.claimed_files ?? requestIdentity(args).changed_files,
        expected_completion: args?.expected_completion ?? "",
      };
      const result = await nativeCoordinationTool("coordination_intent", null, body);
      return jsonText(result);
    }

    if (name === "read_intents_for_room") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        room_id: args?.room_id ?? null,
        statuses: args?.statuses ?? [],
      };
      const result = await nativeCoordinationTool("read_intents_for_room", null, body);
      return jsonText(result);
    }

    if (name === "coordination_reflection") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        ...coordinationScope(args),
        summary: requireString(args, "summary"),
        assumptions: args?.assumptions ?? [],
        open_questions: args?.open_questions ?? [],
        pointers: args?.pointers ?? [],
      };
      const nativeBody = {
        ...body,
        record_type: "reflection",
        title: args?.title ?? "Coordination reflection",
        body: args?.body ?? body.summary,
        metadata: {
          assumptions: body.assumptions,
          open_questions: body.open_questions,
          pointers: body.pointers,
        },
      };
      const result = await nativeCoordinationTool(
        "coordination_reflection",
        "coordination_record",
        nativeBody,
      );
      return jsonText(result);
    }

    if (name === "coordination_decision") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        ...coordinationScope(args),
        title: requireString(args, "title"),
        choice: requireString(args, "choice"),
        rationale: args?.rationale ?? "",
        alternatives_considered: args?.alternatives_considered ?? [],
        caused_by: args?.caused_by ?? [],
        supersedes: args?.supersedes ?? [],
        decision_id: args?.decision_id ?? null,
      };
      const nativeBody = {
        ...body,
        record_id: body.decision_id,
        record_type: "decision",
        summary: body.choice,
        body: body.rationale,
        metadata: {
          alternatives_considered: body.alternatives_considered,
          caused_by: body.caused_by,
          supersedes: body.supersedes,
        },
      };
      const result = await nativeCoordinationTool(
        "coordination_decision",
        "coordination_record",
        nativeBody,
      );
      return jsonText(result);
    }

    if (name === "coordination_tension") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        ...coordinationScope(args),
        action: args?.action ?? "open",
        title: args?.title ?? "",
        observed: args?.observed ?? "",
        disagreement: args?.disagreement ?? "",
        proposed_alternative: args?.proposed_alternative ?? "",
        tension_id: args?.tension_id ?? null,
        status: args?.status ?? "resolved",
        resolved_by_decision_id: args?.resolved_by_decision_id ?? "",
      };
      const nativeBody = {
        ...body,
        record_id: body.tension_id,
        record_type: "tension",
        summary: body.title || body.disagreement || body.observed || "Coordination tension",
        body: body.proposed_alternative || body.observed || body.disagreement,
        metadata: {
          action: body.action,
          observed: body.observed,
          disagreement: body.disagreement,
          proposed_alternative: body.proposed_alternative,
          status: body.status,
          resolved_by_decision_id: body.resolved_by_decision_id,
        },
      };
      const result = await nativeCoordinationTool(
        "coordination_tension",
        "coordination_record",
        nativeBody,
      );
      return jsonText(result);
    }

    if (name === "coordinate") {
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        doc_id: args?.doc_id ?? null,
        message: requireString(args, "message"),
        urgency: args?.urgency ?? "info",
        title: args?.title ?? null,
        metadata: withSourceIdentity(args?.metadata ?? {}),
        target_session_id: args?.target_session_id ?? null,
        target_worktree: args?.target_worktree ?? null,
        target_branch: args?.target_branch ?? null,
        target_head: args?.target_head ?? null,
        target_changed_files: args?.target_changed_files ?? [],
      };
      const nativeBody = {
        ...body,
        mentions: args?.mentions ?? parseMentions(body.message),
      };
      const result = await nativeCoordinationTool("coordinate", null, nativeBody);
      return jsonText(result);
    }

    if (name === "mentions") {
      const identity = requestIdentity(args);
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        limit: args?.limit ?? 20,
        consume: args?.consume === true,
        ...identity,
      };
      const result = await nativeCoordinationTool("mentions", null, body);
      return jsonText(result);
    }

    if (name === "mentions_wait") {
      // No native blocking-wait verb exists yet, so poll native mentions
      // client-side. Native sole path: no Python /harness/mentions/wait.
      const rawTimeout = Number(args?.timeout_seconds ?? 30);
      const timeoutSeconds = Number.isFinite(rawTimeout)
        ? Math.max(0, Math.min(rawTimeout, 120))
        : 30;
      const rawInterval = Number(args?.interval_seconds ?? 2);
      const intervalSeconds = Number.isFinite(rawInterval)
        ? Math.max(1, Math.min(rawInterval, 15))
        : 2;
      const identity = requestIdentity(args);
      const body = {
        tenant_slug: tenantId(args),
        actor: toolActor(args),
        limit: args?.limit ?? 20,
        consume: args?.consume === true,
        ...identity,
      };
      const deadline = Date.now() + timeoutSeconds * 1000;
      let last = null;
      for (;;) {
        last = await nativeCoordinationTool("mentions", "mentions", body);
        const items = Array.isArray(last?.mentions)
          ? last.mentions
          : Array.isArray(last?.items)
            ? last.items
            : Array.isArray(last?.pending_mentions)
              ? last.pending_mentions
              : [];
        if (items.length > 0 || Date.now() >= deadline) {
          return jsonText({ ...last, waited: true, timeout_seconds: timeoutSeconds });
        }
        await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
      }
    }

    if (name === "presence") {
      const identity = requestIdentity(args);
      if (args?.mode === "end") {
        const body = {
          tenant_slug: await requestTenantSlug(args),
          actor: toolActor(args),
          session_id: identity.session_id,
          surface: args?.surface ?? null,
          worktree: identity.worktree,
          branch: identity.branch,
          head: identity.head,
          changed_files: identity.changed_files,
          ttl_seconds: args?.ttl_seconds ?? 60,
          status: "inactive",
          mode: "end",
        };
        const result = await nativeCoordinationTool("presence", null, body);
        return jsonText(result);
      }
      const tenantSlug = await requestTenantSlug(args);
      const actor = toolActor(args);
      const body = {
        tenant_slug: tenantSlug,
        actor,
        session_id: identity.session_id,
        surface: args?.surface ?? null,
        worktree: identity.worktree,
        branch: identity.branch,
        head: identity.head,
        changed_files: identity.changed_files,
        ttl_seconds: args?.ttl_seconds ?? 60,
        status: args?.status ?? "active",
        mode: args?.mode ?? "heartbeat",
      };
      const result = await nativeCoordinationTool("presence", null, body);
      return jsonText(result);
    }

    if (name === "coordination_room") {
      const identity = requestIdentity(args);
      const body = {
        tenant_slug: await requestTenantSlug(args),
        actor: toolActor(args),
        action: args?.action ?? "join",
        room_id: args?.room_id ?? null,
        session_id: identity.session_id,
        surface: args?.surface ?? null,
        repo: args?.repo ?? PROJECT_DIR,
        branch: identity.branch,
        task: args?.task ?? null,
        worktree: identity.worktree,
        head: identity.head,
        changed_files: identity.changed_files,
        lane: args?.lane ?? "",
      };
      const result = await nativeCoordinationTool("coordination_room", null, body);
      return jsonText(result);
    }

    if (name === "subscribe") {
      // Folded: the gossip subscription is no longer the awareness path. Turn-start
      // coordination_context, mentions for interrupts, and presence for liveness
      // carry awareness over the shared substrate (coordination-affordances plan).
      return jsonText({
        ok: true,
        folded: true,
        actor: toolActor(args),
        note: "subscribe is folded. Use coordination_context at turn start, mentions for interrupts, and presence for liveness.",
      });
    }

    if (name === "continuity_pack") {
      // Native sole path: persist the continuity pack as a durable native
      // coordination_record (record_type=reflection). No Python session endpoint.
      const identity = requestIdentity(args);
      const summary = requireString(args, "summary");
      const nextAction = requireString(args, "next_action");
      const nativeBody = {
        tenant_slug: tenantId(args),
        actor: toolActor(args),
        room_id: args?.room_id ?? null,
        record_type: "reflection",
        title: args?.objective || args?.task || "Continuity pack",
        summary,
        body: nextAction,
        metadata: {
          kind: "continuity_pack",
          objective: args?.objective ?? args?.task ?? "",
          next_action: nextAction,
          trigger: args?.trigger ?? "manual",
          salient_nodes: args?.salient_nodes ?? [],
          validation_receipts: args?.validation_receipts ?? [],
          session_id: identity.session_id,
          branch: identity.branch,
          head: identity.head,
          changed_files: identity.changed_files,
        },
      };
      const result = await nativeCoordinationTool(
        "continuity_pack",
        "coordination_record",
        nativeBody,
        { family: "coordination" },
      );
      return jsonText(result);
    }

    if (name === "multihead_run") {
      const action = args?.action ?? "start";
      if (action === "status") {
        const payload = {
          ...args,
          action,
          run_id: requireString(args, "run_id"),
          actor: toolActor(args),
        };
        return multiheadToolResponse(name, payload, (body) =>
          MULTIHEAD_STORE.readRun({ run_id: body.run_id }),
        );
      }
      const payload = {
        ...args,
        action,
        actor: toolActor(args),
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.startRun({
          run_id: body.run_id,
          goal: body.goal,
          actor: body.actor,
        }),
      );
    }

    if (name === "multihead_task") {
      const payload = {
        ...args,
        run_id: requireString(args, "run_id"),
        actor: toolActor(args),
        goal: requireString(args, "goal"),
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.createTask(body),
      );
    }

    if (name === "multihead_claim") {
      const action = args?.action ?? "claim";
      if (action === "release") {
        const payload = {
          ...args,
          action,
          run_id: requireString(args, "run_id"),
          claim_id: requireString(args, "claim_id"),
          owner: requireString(args, "owner"),
        };
        return multiheadToolResponse(name, payload, (body) =>
          MULTIHEAD_STORE.releaseClaim(body),
        );
      }
      const payload = {
        ...args,
        action,
        run_id: requireString(args, "run_id"),
        node_id: requireString(args, "node_id"),
        owner: requireString(args, "owner"),
        lease_ttl_seconds: args?.lease_ttl_seconds ?? 90,
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.claimTask(body),
      );
    }

    if (name === "multihead_patch") {
      const action = args?.action ?? "propose";
      if (action === "rebase") {
        const payload = {
          ...args,
          action,
          run_id: requireString(args, "run_id"),
          patch_id: requireString(args, "patch_id"),
          new_base_commit: requireString(args, "new_base_commit"),
        };
        return multiheadToolResponse(name, payload, (body) =>
          MULTIHEAD_STORE.rebasePatch(body),
        );
      }
      const payload = {
        ...args,
        action,
        run_id: requireString(args, "run_id"),
        node_id: requireString(args, "node_id"),
        owner: requireString(args, "owner"),
        epoch: args?.epoch,
        base_commit: requireString(args, "base_commit"),
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.proposePatch(body),
      );
    }

    if (name === "multihead_proof") {
      const payload = {
        ...args,
        run_id: requireString(args, "run_id"),
        patch_id: requireString(args, "patch_id"),
        command: requireString(args, "command"),
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.runProof(body),
      );
    }

    if (name === "multihead_review") {
      const payload = {
        ...args,
        run_id: requireString(args, "run_id"),
        patch_id: requireString(args, "patch_id"),
        reviewer: requireString(args, "reviewer"),
        action: args?.action ?? "open",
      };
      return multiheadToolResponse(name, payload, (body) =>
        MULTIHEAD_STORE.reviewPatch(body),
      );
    }

    if (name === "provenance_trace") {
      if (args?.trace_id && args?.object_pk !== undefined && args?.object_pk !== null) {
        const result = await theoremGet(
          `/trace/${encodeURIComponent(args.trace_id)}/explain/${encodeURIComponent(String(args.object_pk))}/`
        );
        return jsonText(result);
      }
      if (args?.trace_id) {
        const result = await theoremGet(`/trace/${encodeURIComponent(args.trace_id)}/`);
        return jsonText(result);
      }
      const result = await theoremGet(
        `/trace/search/${buildQuery({
          query: args?.query ?? "",
          policy_intent: args?.policy_intent,
          min_confidence: args?.min_confidence,
          max_confidence: args?.max_confidence,
          limit: args?.limit ?? 20,
        })}`
      );
      return jsonText(result);
    }

    if (name === "product_bootstrap") {
      const result = await theoremGet("/product/bootstrap/");
      return jsonText(result);
    }

    if (name === "saved_contexts_list") {
      const tenantSlug = requireString(args, "tenant_slug");
      const query = buildQuery({
        project_slug: args?.project_slug,
        include_muted: args?.include_muted === true ? "true" : undefined,
      });
      const result = await theoremGet(
        `/product/tenants/${tenantSlug}/saved-contexts/${query}`
      );
      return jsonText(result);
    }

    if (name === "saved_context_create") {
      const tenantSlug = requireString(args, "tenant_slug");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/saved-contexts/`,
        {
          title: requireString(args, "title"),
          content: requireString(args, "content"),
          memory_role: requireString(args, "memory_role"),
          summary: args?.summary ?? "",
          project_slug: args?.project_slug ?? null,
          kind: args?.kind ?? "note",
          metadata: args?.metadata ?? {},
          scope: args?.scope ?? {},
        }
      );
      return jsonText(result);
    }

    if (name === "saved_context_update") {
      const tenantSlug = requireString(args, "tenant_slug");
      const entrySlug = requireString(args, "entry_slug");
      const result = await theoremPut(
        `/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/`,
        {
          title: requireString(args, "title"),
          content: requireString(args, "content"),
          memory_role: requireString(args, "memory_role"),
          summary: args?.summary ?? "",
          kind: args?.kind ?? "note",
          metadata: args?.metadata ?? {},
          scope: args?.scope ?? {},
        }
      );
      return jsonText(result);
    }

    if (name === "saved_context_mute") {
      const tenantSlug = requireString(args, "tenant_slug");
      const entrySlug = requireString(args, "entry_slug");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/mute/`,
        {}
      );
      return jsonText(result);
    }

    if (name === "saved_context_activate") {
      const tenantSlug = requireString(args, "tenant_slug");
      const entrySlug = requireString(args, "entry_slug");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/activate/`,
        {}
      );
      return jsonText(result);
    }

    if (name === "saved_context_delete") {
      const tenantSlug = requireString(args, "tenant_slug");
      const entrySlug = requireString(args, "entry_slug");
      const result = await theoremDelete(
        `/product/tenants/${tenantSlug}/saved-contexts/${entrySlug}/`
      );
      return jsonText(result);
    }

    if (name === "saved_context_preview_recall") {
      const result = await savedContextPreviewRecall(args);
      const selection = HARNESS_ROUTE_POLICY.select({
        verb: "saved_context_preview_recall",
        scope: "shared",
      });
      return jsonText(
        withRouteReceipt(result, directHttpRouteReceipt(selection, BASE_URL)),
      );
    }

    if (name === "memory_patch_review_queue") {
      const tenantSlug = requireString(args, "tenant_slug");
      const query = buildQuery({
        project_slug: args?.project_slug,
        review_status: args?.review_status,
        limit: args?.limit,
      });
      const result = await theoremGet(
        `/product/tenants/${tenantSlug}/memory-patches/review/${query}`
      );
      return jsonText(result);
    }

    if (name === "memory_patch_review_update") {
      const tenantSlug = requireString(args, "tenant_slug");
      const runId = requireString(args, "run_id");
      const patchId = requireString(args, "patch_id");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/memory-patches/review/${runId}/${patchId}/`,
        {
          review_status: requireString(args, "review_status"),
          promote_to_saved_context: args?.promote_to_saved_context === true,
          title: args?.title ?? undefined,
          summary: args?.summary ?? undefined,
          project_slug: args?.project_slug ?? undefined,
          kind: args?.kind ?? undefined,
          metadata: args?.metadata ?? undefined,
        }
      );
      return jsonText(result);
    }

    if (name === "domain_list") {
      const result = await apiGet(
        `/packs/${buildQuery({
          user: args?.user,
        })}`
      );
      return jsonText(result);
    }

    if (name === "domain_install") {
      const result = await apiPost("/pack-installs/", {
        user: args?.user ?? "me",
        pack_slugs: args?.pack_slugs ?? [],
      });
      return jsonText(result);
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Theorem Context error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
