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
//   - encode / mentions_wait: high-signal memory capture and ping-like
//     cross-agent coordination over the shared harness substrate
//
// Deliberately bounded surface. The fat Theseus MCP at theseus-mcp-production
// is registered separately in plugin.json for Mode 3 power-user access.

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

const BASE_URL =
  process.env.THEOREM_CONTEXT_BASE_URL ||
  "https://index-api-production-a5f7.up.railway.app/api/v2/theseus";
const API_ROOT = BASE_URL.replace(/\/theseus\/?$/, "");
const API_KEY = process.env.THEOREM_CONTEXT_API_KEY || "";
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

function sessionKey() {
  const cwdHash = createHash("sha1").update(PROJECT_DIR).digest("hex").slice(0, 8);
  return `claude:${userInfo().username}@${hostname().split(".")[0]}:${cwdHash}`;
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

function tenantId(args) {
  const value = String(
    args?.tenant_slug ||
    process.env.THEOREMS_HARNESS_TENANT ||
    process.env.RUSTYRED_THG_TENANT ||
    process.env.THEOREM_TENANT_SLUG ||
    ""
  ).trim();
  return value || null;
}

function requiredTenantId(args) {
  const tenant = tenantId(args);
  if (!tenant) {
    throw new Error(
      "tenant_slug is required for direct RustyRed tenant calls; no tenant env fallback is configured."
    );
  }
  return tenant;
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
    const actor = String(match[1] || "").trim();
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
  const tenant = tenantId(args);
  if (!tenant) {
    return {
      ok: false,
      skipped: true,
      error: "tenant_unresolved_for_direct_thg_mirror",
    };
  }
  const node = {
    id: stableNodeId(kind, tenant, properties),
    labels: ["TheoremsHarness", ...labels],
    properties: {
      tenant_slug: tenant,
      harness_kind: kind,
      project_dir: PROJECT_DIR,
      session_key: sessionKey(),
      captured_at: new Date().toISOString(),
      ...properties,
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

const TOOLS = [
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
      "Search ingested code symbols through the CodeCrawler/code graph surface. Use before code_context when you need to discover the exact symbol name or file.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        entity_type: { type: "string" },
        language: { type: "string" },
        repo: { type: "string" },
        limit: { type: "integer", default: 20, minimum: 1, maximum: 100 },
      },
      required: ["query"],
    },
  },
  {
    name: "code_crawl",
    description:
      "Ingest or refresh a repository in the CodeCrawler/code graph surface. Use for operator-approved code graph crawls before Pairformer/code-search work.",
    inputSchema: {
      type: "object",
      properties: {
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
      "Preview saved context recall for a tenant/project/task. Use before prepare when you need to see which durable memory would be injected.",
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
    name: "remember",
    description:
      "Save a durable memory note through the harness memory substrate using launch-facing naming. Prefer encode for lessons/postmortems and remember for reusable context.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
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
    name: "coordinate",
    description:
      "Append a cross-agent coordination message and queue @mentions for target agents.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
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
  { name: "theorems-harness", version: "0.3.1" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const runId = currentRunId();

  try {
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
      const events = await theoremGet(`/harness/runs/${id}/events/`);
      const stateHash = await theoremGet(`/harness/runs/${id}/state-hash/`).catch(() => ({}));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                run_id: id,
                state_hash: stateHash.state_hash || null,
                events: events.events || events,
              },
              null,
              2
            ),
          },
        ],
      };
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

    if (name === "code_search") {
      const query = requireString(args, "query");
      const result = await theoremGet(
        `/code/symbols/${buildQuery({
          search: query,
          entity_type: args?.entity_type,
          language: args?.language,
          repo: args?.repo,
          limit: args?.limit ?? 20,
        })}`
      );
      return jsonText(result);
    }

    if (name === "code_crawl") {
      if (!args?.repo && !args?.path) {
        return {
          content: [{ type: "text", text: "Error: pass either 'repo' or 'path'." }],
          isError: true,
        };
      }
      const result = await theoremPost(
        "/code/ingest/",
        {
          repo: args?.repo ?? null,
          path: args?.path ?? null,
          paths: args?.paths ?? null,
          language: args?.language ?? null,
          notebook_id: args?.notebook_id ?? null,
          graph_write_token: args?.graph_write_token ?? null,
        },
        240_000
      );
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
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
        title: args?.title ?? null,
        content: requireString(args, "content"),
        kind: args?.kind ?? "self_note",
        memory_node_type: args?.memory_node_type ?? "belief",
        tags: args?.tags ?? [],
        links: args?.links ?? [],
        summary: args?.summary ?? "",
      };
      const mirror = await mirrorHarnessNode(
        "self_note",
        args,
        body,
        ["MemoryAtom", "AgentMemory"]
      );
      const result = await theoremPost("/harness/memory/self-note/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "self_revise") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
        doc_id: requireString(args, "doc_id"),
        content: requireString(args, "content"),
        title: args?.title ?? null,
        summary: args?.summary ?? "",
        reason: args?.reason ?? "",
        memory_node_type: args?.memory_node_type ?? null,
        cites_doc_ids: args?.cites_doc_ids ?? [],
        derived_from_doc_ids: args?.derived_from_doc_ids ?? [],
      };
      const mirror = await mirrorHarnessNode(
        "self_revise",
        args,
        body,
        ["MemoryAtom", "AgentMemory", "MemoryRevision"]
      );
      const result = await theoremPost("/harness/memory/self-revise/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "self_archive") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
        doc_id: requireString(args, "doc_id"),
        reason: args?.reason ?? "",
        title: args?.title ?? null,
      };
      const mirror = await mirrorHarnessNode(
        "self_archive",
        args,
        body,
        ["MemoryAtom", "AgentMemory", "MemoryArchive"]
      );
      const result = await theoremPost("/harness/memory/self-archive/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "self_recall_archive") {
      const result = await theoremPost("/harness/memory/self-recall-archive/", {
        tenant_slug: args?.tenant_slug ?? null,
        query: args?.query ?? "",
        actor: args?.actor ?? null,
        limit: args?.limit ?? 10,
      });
      return jsonText(result);
    }

    if (name === "recall") {
      const tenantSlug = requireString(args, "tenant_slug");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/saved-contexts/preview-recall/`,
        {
          task: requireString(args, "task"),
          project_slug: args?.project_slug ?? null,
          mode: args?.mode ?? null,
          modes: args?.modes ?? [],
          profile_id: args?.profile_id ?? null,
          profile_ids: args?.profile_ids ?? [],
          permissions: args?.permissions ?? [],
        }
      );
      return jsonText(result);
    }

    if (name === "remember") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
        title: args?.title ?? null,
        content: requireString(args, "content"),
        kind: "remember",
        memory_node_type: args?.memory_node_type ?? "belief",
        tags: args?.tags ?? [],
        links: args?.links ?? [],
        summary: args?.summary ?? "",
      };
      const mirror = await mirrorHarnessNode(
        "remember",
        args,
        body,
        ["MemoryAtom", "AgentMemory"]
      );
      const result = await theoremPost("/harness/memory/self-note/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "relate") {
      const body = {
        command: "THG.GRAPH.EDGE.UPSERT",
        payload: {
          from_id: requireString(args, "from_id"),
          to_id: requireString(args, "to_id"),
          type: args?.relation ?? "related_to",
          properties: {
            reason: args?.reason ?? "",
            ...(args?.metadata ?? {}),
          },
        },
      };
      const result = await theoremPost("/harness/thg/command/", body);
      return jsonText(result);
    }

    if (name === "encode") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
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
        metadata: args?.metadata ?? {},
        context: args?.context ?? {},
        auto_triggered: args?.auto_triggered === true,
        training_weight: args?.training_weight ?? 1.0,
        training_target: args?.training_target ?? "none",
      };
      const mirror = await mirrorHarnessNode(
        "encode",
        args,
        body,
        ["MemoryAtom", "EncodeEvent"]
      );
      const result = await theoremPost("/harness/encode/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "coordinate") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
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
      const mirror = await mirrorHarnessNode(
        "coordinate",
        args,
        { ...body, mentioned_actors: parseMentions(body.message) },
        ["CoordinationMessage"]
      );
      const result = await theoremPost("/harness/coordinate/", body);
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "mentions") {
      const identity = requestIdentity(args);
      const result = await theoremPost("/harness/mentions/", {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        limit: args?.limit ?? 20,
        consume: args?.consume === true,
        ...identity,
      });
      return jsonText(result);
    }

    if (name === "mentions_wait") {
      const rawTimeoutSeconds = Number(args?.timeout_seconds ?? 30);
      const timeoutSeconds = Number.isFinite(rawTimeoutSeconds) ? rawTimeoutSeconds : 30;
      const identity = requestIdentity(args);
      const result = await theoremPost(
        "/harness/mentions/wait/",
        {
          tenant_slug: args?.tenant_slug ?? null,
          actor: args?.actor ?? null,
          limit: args?.limit ?? 20,
          consume: args?.consume === true,
          timeout_seconds: args?.timeout_seconds ?? 30,
          interval_seconds: args?.interval_seconds ?? 1,
          ...identity,
        },
        Math.max(5_000, Math.min((timeoutSeconds + 5) * 1000, 125_000))
      );
      return jsonText(result);
    }

    if (name === "presence") {
      const identity = requestIdentity(args);
      if (args?.mode === "end") {
        const body = {
          tenant_slug: args?.tenant_slug ?? null,
          actor: args?.actor ?? null,
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
        const result = await theoremPost("/harness/presence/", body);
        const mirror = await mirrorHarnessNode(
          "presence",
          args,
          { ...body, status: "inactive", mode: "end" },
          ["Presence"]
        );
        return jsonText(withThgMirror(result, mirror));
      }
      const result = await theoremPost("/harness/presence/", {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        session_id: identity.session_id,
        surface: args?.surface ?? null,
        worktree: identity.worktree,
        branch: identity.branch,
        head: identity.head,
        changed_files: identity.changed_files,
        ttl_seconds: args?.ttl_seconds ?? 60,
        status: args?.status ?? "active",
        mode: args?.mode ?? "heartbeat",
      });
      const mirror = await mirrorHarnessNode(
        "presence",
        args,
        {
          tenant_slug: args?.tenant_slug ?? null,
          actor: args?.actor ?? null,
          session_id: identity.session_id,
          surface: args?.surface ?? null,
          worktree: identity.worktree,
          branch: identity.branch,
          head: identity.head,
          changed_files: identity.changed_files,
          ttl_seconds: args?.ttl_seconds ?? 60,
          status: args?.status ?? "active",
          mode: args?.mode ?? "heartbeat",
          expires_at: result?.presence?.expires_at ?? null,
        },
        ["Presence"]
      );
      return jsonText(withThgMirror(result, mirror));
    }

    if (name === "subscribe") {
      const body = {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        doc_id: args?.doc_id ?? null,
      };
      const mirror = await mirrorHarnessNode(
        "subscribe",
        args,
        body,
        ["Subscription"]
      );
      const result = await theoremPost("/harness/subscribe/", body);
      return jsonText(withThgMirror(result, mirror));
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
      const tenantSlug = requireString(args, "tenant_slug");
      const result = await theoremPost(
        `/product/tenants/${tenantSlug}/saved-contexts/preview-recall/`,
        {
          task: requireString(args, "task"),
          project_slug: args?.project_slug ?? null,
          mode: args?.mode ?? null,
          modes: args?.modes ?? [],
          profile_id: args?.profile_id ?? null,
          profile_ids: args?.profile_ids ?? [],
          permissions: args?.permissions ?? [],
        }
      );
      return jsonText(result);
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
