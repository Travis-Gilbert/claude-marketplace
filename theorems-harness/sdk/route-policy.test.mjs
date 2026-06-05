import assert from "node:assert/strict";
import {
  FakeRouteClient,
  HarnessRoutePolicy,
  NativeBindingClient,
  NativeMcpClient,
  ROUTES,
  RoutePolicyError,
} from "./route-policy.mjs";

const BASE_ENV = Object.freeze({});

function policy(options = {}) {
  return new HarnessRoutePolicy({
    env: BASE_ENV,
    ...options,
  });
}

{
  const routePolicy = policy({
    bindingDataDir: "/tmp/theorem-secret-path",
  });
  const selection = routePolicy.select({ verb: "harness_replay" });

  assert.equal(selection.route, ROUTES.NATIVE_BINDING);
  assert.equal(selection.receipt.server, "apps/theorem-harness-node");
  assert.equal(selection.receipt.dataDir, "<redacted>/theorem-secret-path");
}

{
  const routePolicy = policy({
    bindingDataDir: "/tmp/theorem",
  });
  const selection = routePolicy.select({ verb: "remember", scope: "shared" });

  assert.equal(selection.route, ROUTES.NATIVE_MCP);
  assert.equal(selection.receipt.dataDir, null);
}

{
  const routePolicy = policy({
    bindingDataDir: "/tmp/theorem",
  });
  const selection = routePolicy.select({ verb: "remember", scope: "private" });

  assert.equal(selection.route, ROUTES.NATIVE_BINDING);
}

{
  const routePolicy = policy({
    bindingDataDir: "/tmp/theorem",
    nativeMcpUrl: "https://native.example/mcp",
  });
  const selection = routePolicy.select({ verb: "coordinate" });

  assert.equal(selection.route, ROUTES.NATIVE_MCP);
  assert.equal(selection.receipt.server, "https://native.example/mcp");
}

{
  const routePolicy = policy({
    productHttpUrl: "https://product.example",
  });
  const selection = routePolicy.select({ verb: "saved_contexts_list" });

  assert.equal(selection.route, ROUTES.PRODUCT_HTTP);
  assert.equal(selection.receipt.server, "https://product.example");
}

{
  const routePolicy = policy({
    mode: "legacy",
    theseusEngineUrl: "https://theseus.example/api/v2/theseus",
  });
  const selection = routePolicy.select({ verb: "remember" });

  assert.equal(selection.route, ROUTES.THESEUS_ENGINE);
  assert.equal(selection.receipt.fallbackUsed, true);
  assert.equal(selection.receipt.server, "https://theseus.example/api/v2/theseus");
}

{
  const nativeClient = new FakeRouteClient(ROUTES.NATIVE_MCP);
  const routePolicy = policy({
    nativeMcpUrl: "https://native.example/mcp",
    clients: {
      [ROUTES.NATIVE_MCP]: nativeClient,
    },
  });
  const result = await routePolicy.execute(
    { verb: "coordination_intent" },
    { actor: "codex" },
  );

  assert.equal(result.receipt.route, ROUTES.NATIVE_MCP);
  assert.deepEqual(result.result, { ok: true, route: ROUTES.NATIVE_MCP });
  assert.equal(nativeClient.calls.length, 1);
  assert.equal(nativeClient.calls[0].payload.actor, "codex");
}

{
  const requests = [];
  const nativeMcpClient = new NativeMcpClient({
    url: "https://native.example/mcp",
    token: "secret-token",
    fetcher: async (url, request) => {
      requests.push({ url, request });
      return {
        ok: true,
        async text() {
          return JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    ok: true,
                    receipt: { status: "passed" },
                  }),
                },
              ],
            },
          });
        },
      };
    },
  });
  const routePolicy = policy({
    nativeMcpUrl: "https://native.example/mcp",
    clients: {
      [ROUTES.NATIVE_MCP]: nativeMcpClient,
    },
  });
  const selection = routePolicy.select({ verb: "skill_apply" });
  const result = await routePolicy.execute(
    { verb: "skill_apply" },
    { actor: "codex", pack_content_hash: "hash-pack" },
  );

  assert.equal(selection.route, ROUTES.NATIVE_MCP);
  assert.equal(result.receipt.family, "skill");
  assert.equal(result.result.ok, true);
  assert.equal(result.result.receipt.status, "passed");
  assert.equal(result.result.route_receipt.route, ROUTES.NATIVE_MCP);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://native.example/mcp");
  assert.equal(requests[0].request.headers.Authorization, "Bearer secret-token");
  const rpcBody = JSON.parse(requests[0].request.body);
  assert.equal(rpcBody.method, "tools/call");
  assert.equal(rpcBody.params.name, "skill_apply");
  assert.equal(rpcBody.params.arguments.actor, "codex");
  assert.equal(rpcBody.params.arguments.pack_content_hash, "hash-pack");
}

{
  class MockHarness {
    constructor(dataDir) {
      this.dataDir = dataDir;
      this.memories = [];
    }

    eventsJson(runId) {
      assert.equal(runId, "run-native-1");
      return JSON.stringify([
        {
          run_id: runId,
          seq: 1,
          kind: "Created",
          state_hash_after: "hash-created",
        },
        {
          run_id: runId,
          seq: 2,
          kind: "Cancelled",
          state_hash_after: "hash-cancelled",
        },
      ]);
    }

    runStatus(runId) {
      assert.equal(runId, "run-native-1");
      return "cancelled";
    }

    pollText(runId, afterSeq) {
      assert.equal(runId, "run-native-1");
      assert.equal(afterSeq, 0);
      return "native replay text";
    }

    remember(agentId, kind, title, content) {
      assert.equal(agentId, "codex");
      const memory = {
        id: "memory-1",
        item_type: "node",
        kind,
        title,
        content,
        status: "active",
        score: 1,
        provenance: {},
      };
      this.memories.push(memory);
      return JSON.stringify({
        saved_type: "node",
        node: memory,
      });
    }

    recall(agentId, query, limit) {
      assert.equal(agentId, "codex");
      assert.equal(query, "binding");
      assert.equal(limit, 5);
      return JSON.stringify(this.memories);
    }
  }

  const bindingClient = new NativeBindingClient({
    dataDir: "/tmp/harness-store",
    bindingModulePath: "/tmp/fake.node",
    moduleLoader: () => ({ Harness: MockHarness }),
  });
  const routePolicy = policy({
    bindingDataDir: "/tmp/harness-store",
    clients: {
      [ROUTES.NATIVE_BINDING]: bindingClient,
    },
  });
  const replay = await routePolicy.execute(
    { verb: "harness_replay" },
    { run_id: "run-native-1" },
  );

  assert.equal(replay.receipt.route, ROUTES.NATIVE_BINDING);
  assert.equal(replay.result.status, "cancelled");
  assert.equal(replay.result.state_hash, "hash-cancelled");
  assert.equal(replay.result.text, "native replay text");
  assert.equal(replay.result.events.length, 2);
  assert.equal(replay.result.route_receipt.route, ROUTES.NATIVE_BINDING);

  const remembered = await routePolicy.execute(
    { verb: "remember", scope: "private" },
    {
      agent_id: "codex",
      kind: "belief",
      title: "binding memory",
      content: "The native binding can save memory.",
    },
  );

  assert.equal(remembered.receipt.route, ROUTES.NATIVE_BINDING);
  assert.equal(remembered.result.saved_type, "node");
  assert.equal(remembered.result.node.title, "binding memory");
  assert.equal(remembered.result.route_receipt.route, ROUTES.NATIVE_BINDING);

  const recalled = await routePolicy.execute(
    { verb: "recall", scope: "private" },
    {
      agent_id: "codex",
      query: "binding",
      limit: 5,
    },
  );

  assert.equal(recalled.receipt.route, ROUTES.NATIVE_BINDING);
  assert.equal(recalled.result.count, 1);
  assert.equal(recalled.result.items[0].content, "The native binding can save memory.");
  assert.equal(recalled.result.route_receipt.route, ROUTES.NATIVE_BINDING);

  const selfNote = await routePolicy.execute(
    { verb: "self_note", scope: "private" },
    {
      agent_id: "codex",
      kind: "self_note",
      title: "binding note",
      content: "The native binding can save self notes.",
    },
  );

  assert.equal(selfNote.receipt.route, ROUTES.NATIVE_BINDING);
  assert.equal(selfNote.result.saved_type, "node");
  assert.equal(selfNote.result.node.kind, "self_note");
  assert.equal(selfNote.result.route_receipt.verb, "self_note");
}

{
  const routePolicy = policy();

  assert.throws(
    () => routePolicy.select({ verb: "unknown_tool" }),
    RoutePolicyError,
  );
}

console.log("route-policy tests passed");
