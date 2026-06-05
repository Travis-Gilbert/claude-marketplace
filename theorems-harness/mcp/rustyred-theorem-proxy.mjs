// Compatibility proxy for the Theorem-side RustyRed MCP.
//
// Claude rejects tool schemas with top-level anyOf/oneOf/allOf. The native
// Rust MCP runtime accepts several snake_case/camelCase aliases, and older
// deployments advertised those aliases with top-level combinators. This proxy
// keeps the plugin pointed at the Theorem-side RustyRed MCP while normalizing
// the advertised schemas into Claude-compatible object schemas.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_MCP_URL = "https://rustyredcore-theorem-production.up.railway.app/mcp";
const MCP_URL =
  process.env.THEOREMS_HARNESS_RUSTYRED_MCP_URL ||
  process.env.RUSTYRED_THG_MCP_URL ||
  DEFAULT_MCP_URL;
const API_TOKEN =
  process.env.RUSTYRED_THG_API_TOKEN ||
  process.env.THEOREMS_HARNESS_THG_API_TOKEN ||
  "";

let nextId = 1;

function remoteHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (API_TOKEN) headers.Authorization = `Bearer ${API_TOKEN}`;
  return headers;
}

async function remoteRpc(method, params = {}) {
  const id = nextId++;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: remoteHeaders(),
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`RustyRed MCP ${method} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (err) {
    throw new Error(`RustyRed MCP ${method} returned invalid JSON: ${err.message}`);
  }
  if (payload.error) {
    const message = payload.error.message || JSON.stringify(payload.error);
    throw new Error(`RustyRed MCP ${method} error: ${message}`);
  }
  return payload.result ?? {};
}

function cloneJson(value) {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeTopLevelSchema(schema) {
  const normalized = cloneJson(schema) || { type: "object", properties: {} };
  if (typeof normalized !== "object" || Array.isArray(normalized)) {
    return { type: "object", properties: {} };
  }
  if (!normalized.type) normalized.type = "object";
  if (!normalized.properties) normalized.properties = {};

  for (const key of ["anyOf", "oneOf", "allOf"]) {
    const branches = normalized[key];
    if (!Array.isArray(branches)) continue;
    if (!Array.isArray(normalized.required)) {
      const branchWithRequired = branches.find((branch) =>
        Array.isArray(branch?.required)
      );
      if (branchWithRequired) {
        normalized.required = [...branchWithRequired.required];
      }
    }
    delete normalized[key];
  }

  return normalized;
}

function normalizeTool(tool) {
  return {
    ...tool,
    inputSchema: normalizeTopLevelSchema(tool.inputSchema),
  };
}

const server = new Server(
  {
    name: "rustyred-thg-theorem-proxy",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const result = await remoteRpc("tools/list", {});
  return {
    tools: Array.isArray(result.tools) ? result.tools.map(normalizeTool) : [],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  return remoteRpc("tools/call", req.params || {});
});

const transport = new StdioServerTransport();
await server.connect(transport);
