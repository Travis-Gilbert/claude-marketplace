// Theorem Context Claude Code: slim MCP server (Mode 2 fallback).
//
// Most context arrives via the UserPromptSubmit hook (Mode 1, no model-visible
// tool). These three tools exist only for cases the hook can't cover:
//   - orchestrate_refresh: recompile when context goes stale mid-session
//   - harness_replay: show the event timeline of the current or specified run
//   - harness_describe_current: show what artifact is currently injected
//
// Deliberately small surface. The fat Theseus MCP at theseus-mcp-production
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
