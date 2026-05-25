import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HarnessError,
  RequestTimeoutError,
  ServerUnavailableError,
  TheoremContextClient,
} from '../dist/index.js';

test('runs namespace targets state-machine routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: async (url, init = {}) => {
      requests.push({ url, init });
      const path = new URL(url).pathname;
      if (path.endsWith('/harness/runs/') && init.method === 'GET') {
        return jsonResponse({
          runs: [
            {
              run_id: 'run:1',
              task: 'fix failing test',
              actor: 'codex',
              scope: {},
              status: 'running',
              steps: [],
              search_runs: [],
              artifacts: [],
              memory_patches: [],
              validations: [],
            },
            {
              run_id: 'run:2',
              task: 'completed launch review',
              actor: 'claude-code',
              scope: {},
              status: 'completed',
              steps: [],
              search_runs: [],
              artifacts: [],
              memory_patches: [],
              validations: [],
            },
          ],
        });
      }
      if (path.endsWith('/harness/runs/') && init.method === 'POST') {
        return jsonResponse({
          run: {
            run_id: 'run:1',
            task: 'fix failing test',
            actor: 'codex',
            scope: {},
            status: 'running',
            steps: [],
            search_runs: [],
            artifacts: [],
            memory_patches: [],
            validations: [],
          },
        });
      }
      if (url.endsWith('/transition/')) {
        return jsonResponse({
          run: { run_id: 'run:1', status: 'observed' },
          event: {
            event_id: 'event:1',
            run_id: 'run:1',
            seq: 2,
            type: 'HOST.OBSERVED',
            payload: {},
            state_hash_before: 'before',
            state_hash_after: 'after',
          },
          effects: [],
          state_hash_before: 'before',
          state_hash_after: 'after',
        });
      }
      if (url.endsWith('/events/')) {
        return jsonResponse({ events: [] });
      }
      if (url.endsWith('/state-hash/')) {
        return jsonResponse({ run_id: 'run:1', state_hash: 'after' });
      }
      return new Response('', { status: 404 });
    },
  });

  const completedRuns = await client.runs.list({ limit: 10, status: 'completed' });
  const run = await client.runs.begin({ task: 'fix failing test', actor: 'codex' });
  const transition = await client.runs.transition(run.run_id, {
    type: 'HOST.OBSERVED',
    payload: {
      repo: 'Index-API',
      branch: 'main',
      commit_sha: 'abc',
      cwd: '/repo',
    },
  });
  const events = await client.runs.events(run.run_id);
  const stateHash = await client.runs.stateHash(run.run_id);

  assert.deepEqual(
    completedRuns.map((completedRun) => completedRun.run_id),
    ['run:2'],
  );
  assert.equal(transition.event.type, 'HOST.OBSERVED');
  assert.deepEqual(events, []);
  assert.equal(stateHash.state_hash, 'after');
  assert.deepEqual(requests.map((request) => request.url), [
    'http://localhost/api/v2/theseus/harness/runs/?limit=10',
    'http://localhost/api/v2/theseus/harness/runs/',
    'http://localhost/api/v2/theseus/harness/runs/run:1/transition/',
    'http://localhost/api/v2/theseus/harness/runs/run:1/events/',
    'http://localhost/api/v2/theseus/harness/runs/run:1/state-hash/',
  ]);
});

test('harness namespace targets credit cost forecast route', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: async (url, init = {}) => {
      requests.push({ url, init });
      const parsed = new URL(url);
      if (
        parsed.pathname.endsWith('/harness/pricing/credit-costs/')
        && init.method === 'GET'
      ) {
        return jsonResponse({
          credit_definition: '1 credit represents $0.001 in measured operation cost components, rounded up.',
          credit_unit_cogs_dollars: '0.001000',
          rounding: 'ceil',
          source: 'observed',
          generated_at: '2026-05-24T21:00:00+00:00',
          sample_window_days: 14,
          min_observed_events: 3,
          total_observed_events: 3,
          operations: [
            {
              operation: 'encode',
              label: 'Context compilation',
              meter: 'per encoded memory or compiled context artifact',
              display_credits: '2 credits',
              forecast_credits_min: 2,
              forecast_credits_max: 2,
              median_credits: 2,
              median_cogs_dollars: '0.002000',
              fallback_cogs_dollars_min: '0.001000',
              fallback_cogs_dollars_max: '0.001000',
              sample_count: 3,
              sample_window_days: 14,
              min_observed_events: 3,
              always_free: false,
              source: 'observed',
            },
          ],
        });
      }
      return new Response('', { status: 404 });
    },
  });

  const forecast = await client.harness.creditCosts({ days: 14, minEvents: 3 });

  assert.equal(forecast.operations[0].operation, 'encode');
  assert.equal(forecast.operations[0].median_credits, 2);
  assert.equal(requests[0].url, 'http://localhost/api/v2/theseus/harness/pricing/credit-costs/?days=14&min_events=3');
});

test('runs namespace normalizes state-machine failures into typed errors', async () => {
  const cases = [
    {
      status: 500,
      expectedError: HarnessError,
      call: (client) =>
        client.runs.transition('run:1', {
          type: 'HOST.OBSERVED',
          payload: {},
        }),
      message: 'harness transition failed: 500',
    },
    {
      status: 503,
      expectedError: ServerUnavailableError,
      call: (client) => client.runs.events('run:1'),
      message: 'harness events failed: 503',
    },
    {
      status: 504,
      expectedError: RequestTimeoutError,
      call: (client) => client.runs.stateHash('run:1'),
      message: 'harness state hash failed: 504',
    },
  ];

  for (const { status, expectedError, call, message } of cases) {
    const client = new TheoremContextClient({
      baseUrl: 'http://localhost/api/v2/theseus',
      fetchImpl: async () => new Response(`failure-${status}`, { status }),
    });

    await assert.rejects(
      call(client),
      (error) =>
        error instanceof expectedError
        && error.message.includes(message),
    );
  }
});

test('runs namespace normalizes state-machine transport timeouts', async () => {
  const timeoutError = new Error('timed out');
  timeoutError.name = 'AbortError';
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: async () => {
      throw timeoutError;
    },
  });

  await assert.rejects(
    client.runs.stateHash('run:1'),
    (error) =>
      error instanceof RequestTimeoutError
      && /harness state hash failed: timed out/i.test(error.message),
  );
});

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
