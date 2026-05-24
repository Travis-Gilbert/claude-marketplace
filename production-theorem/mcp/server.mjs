// Theorem Context Claude Code: slim MCP server (Mode 2 fallback).
//
// Most context arrives via the UserPromptSubmit hook (Mode 1, no model-visible
// tool). These tools exist for cases the hook can't cover:
//   - orchestrate_refresh: recompile when context goes stale mid-session
//   - harness_replay: show the event timeline of the current or specified run
//   - harness_describe_current: show what artifact is currently injected
//   - product_*: expose the Context Theorem product boundary for saved-context
//     and review-queue work so the plugin can operate the backend that now
//     exists without dropping to raw HTTP
//
// Deliberately bounded surface. The fat Theseus MCP at theseus-mcp-production
// is registered separately in plugin.json for Mode 3 power-user access.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { hostname, userInfo } from "node:os";

const BASE_URL =
  process.env.THEOREM_CONTEXT_BASE_URL ||
  "https://index-api-production-a5f7.up.railway.app/api/v2/theseus";
const API_KEY = process.env.THEOREM_CONTEXT_API_KEY || "";
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

async function theoremPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
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

function jsonText(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
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
      },
    },
  },
  {
    name: "presence",
    description:
      "Refresh or read short-TTL actor presence for headless agent coordination.",
    inputSchema: {
      type: "object",
      properties: {
        tenant_slug: { type: "string" },
        actor: { type: "string" },
        session_id: { type: "string" },
        surface: { type: "string" },
        ttl_seconds: { type: "integer", default: 60 },
        status: { type: "string", default: "active" },
        mode: { type: "string", enum: ["heartbeat", "get"], default: "heartbeat" },
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
];

const server = new Server(
  { name: "theorem-context-claude", version: "0.1.0" },
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

    if (name === "self_note") {
      const result = await theoremPost("/harness/memory/self-note/", {
        tenant_slug: args?.tenant_slug ?? null,
        title: args?.title ?? null,
        content: requireString(args, "content"),
        kind: args?.kind ?? "self_note",
        memory_node_type: args?.memory_node_type ?? "belief",
        tags: args?.tags ?? [],
        links: args?.links ?? [],
        summary: args?.summary ?? "",
      });
      return jsonText(result);
    }

    if (name === "self_revise") {
      const result = await theoremPost("/harness/memory/self-revise/", {
        tenant_slug: args?.tenant_slug ?? null,
        doc_id: requireString(args, "doc_id"),
        content: requireString(args, "content"),
        title: args?.title ?? null,
        summary: args?.summary ?? "",
        reason: args?.reason ?? "",
        memory_node_type: args?.memory_node_type ?? null,
        cites_doc_ids: args?.cites_doc_ids ?? [],
        derived_from_doc_ids: args?.derived_from_doc_ids ?? [],
      });
      return jsonText(result);
    }

    if (name === "self_archive") {
      const result = await theoremPost("/harness/memory/self-archive/", {
        tenant_slug: args?.tenant_slug ?? null,
        doc_id: requireString(args, "doc_id"),
        reason: args?.reason ?? "",
        title: args?.title ?? null,
      });
      return jsonText(result);
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

    if (name === "coordinate") {
      const result = await theoremPost("/harness/coordinate/", {
        tenant_slug: args?.tenant_slug ?? null,
        doc_id: args?.doc_id ?? null,
        message: requireString(args, "message"),
        urgency: args?.urgency ?? "info",
        title: args?.title ?? null,
        metadata: args?.metadata ?? {},
      });
      return jsonText(result);
    }

    if (name === "mentions") {
      const result = await theoremPost("/harness/mentions/", {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        limit: args?.limit ?? 20,
        consume: args?.consume === true,
      });
      return jsonText(result);
    }

    if (name === "presence") {
      const result = await theoremPost("/harness/presence/", {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        session_id: args?.session_id ?? null,
        surface: args?.surface ?? null,
        ttl_seconds: args?.ttl_seconds ?? 60,
        status: args?.status ?? "active",
        mode: args?.mode ?? "heartbeat",
      });
      return jsonText(result);
    }

    if (name === "subscribe") {
      const result = await theoremPost("/harness/subscribe/", {
        tenant_slug: args?.tenant_slug ?? null,
        actor: args?.actor ?? null,
        doc_id: args?.doc_id ?? null,
      });
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
