import assert from 'node:assert/strict';
import test from 'node:test';

import { TheoremHotGraphClient } from '../dist/product.js';

test('product client posts tenant command with bearer auth', async () => {
  const requests = [];
  const client = new TheoremHotGraphClient({
    baseUrl: 'http://localhost:8380/',
    token: 'secret',
    tenantId: 'tenant-a',
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return new Response(
        JSON.stringify({
          ok: true,
          command: 'THG.RUN.BEGIN',
          status: 'ok',
          payload: {},
          nodes: [],
          edges: [],
          events: [],
          state_hash: 'sha256:test',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    },
  });

  const result = await client.command('THG.RUN.BEGIN', { run_id: 'run:1' });

  assert.equal(result.ok, true);
  assert.equal(requests[0].url, 'http://localhost:8380/v1/tenants/tenant-a/command');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer secret');
  assert.equal(JSON.parse(requests[0].init.body).args.run_id, 'run:1');
});
