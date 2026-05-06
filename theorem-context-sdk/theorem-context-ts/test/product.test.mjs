import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthError,
  HarnessError,
  RequestTimeoutError,
  ServerUnavailableError,
  TheoremHotGraphClient,
} from '../dist/index.js';

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

test('product client normalizes HTTP failures into typed errors', async () => {
  const cases = [
    { status: 401, expectedError: AuthError },
    { status: 503, expectedError: ServerUnavailableError },
    { status: 504, expectedError: RequestTimeoutError },
    { status: 500, expectedError: HarnessError },
  ];

  for (const { status, expectedError } of cases) {
    const client = new TheoremHotGraphClient({
      baseUrl: 'http://localhost:8380/',
      token: 'secret',
      tenantId: 'tenant-a',
      fetchImpl: async () => new Response(`failure-${status}`, { status }),
    });

    await assert.rejects(
      client.command('THG.RUN.BEGIN', { run_id: 'run:1' }),
      (error) =>
        error instanceof expectedError
        && error.message.includes(`THG product /command failed with HTTP ${status}`),
    );
  }
});

test('product client normalizes transport failures into typed errors', async () => {
  const timeoutError = new Error('timed out');
  timeoutError.name = 'AbortError';
  const timeoutClient = new TheoremHotGraphClient({
    baseUrl: 'http://localhost:8380/',
    token: 'secret',
    tenantId: 'tenant-a',
    fetchImpl: async () => {
      throw timeoutError;
    },
  });

  await assert.rejects(
    timeoutClient.command('THG.RUN.BEGIN', { run_id: 'run:1' }),
    (error) =>
      error instanceof RequestTimeoutError
      && /THG product \/command failed: timed out/i.test(error.message),
  );

  const networkClient = new TheoremHotGraphClient({
    baseUrl: 'http://localhost:8380/',
    token: 'secret',
    tenantId: 'tenant-a',
    fetchImpl: async () => {
      throw new TypeError('network failed');
    },
  });

  await assert.rejects(
    networkClient.run('run:1'),
    (error) =>
      error instanceof ServerUnavailableError
      && /THG product run failed: network failed/i.test(error.message),
  );
});
