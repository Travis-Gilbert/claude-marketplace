import assert from 'node:assert/strict';
import test from 'node:test';

import { TheoremContextClient } from '../dist/index.js';

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fakeFetch(requests) {
  return async (url, init = {}) => {
    requests.push({ url, init });
    if (url.endsWith('/workstream/resolve/')) {
      return jsonResponse({
        workstream_id: 'workstream:ts',
        tenant_id: 'tenant-x',
        repo: 'Index-API',
        branch: 'main',
        task_state: 'active',
        agent_hosts_seen: [],
        created_at: '2026-05-16T00:00:00Z',
        updated_at: '2026-05-16T00:00:00Z',
        workstream: {
          workstream_id: 'workstream:ts',
          tenant_id: 'tenant-x',
          repo: 'Index-API',
          branch: 'main',
          task_state: 'active',
          agent_hosts_seen: [],
          created_at: '2026-05-16T00:00:00Z',
          updated_at: '2026-05-16T00:00:00Z',
        },
      });
    }
    if (url.endsWith('/workstream/workstream:ts/')) {
      return jsonResponse({
        workstream: {
          workstream_id: 'workstream:ts',
          tenant_id: 'tenant-x',
          repo: 'Index-API',
          branch: 'main',
          task_state: 'blocked',
          agent_hosts_seen: ['codex'],
          created_at: '2026-05-16T00:00:00Z',
          updated_at: '2026-05-16T00:10:00Z',
        },
      });
    }
    if (url.endsWith('/session/start/')) {
      return jsonResponse({
        agent_session_id: 'agentsess:ts',
        harness_run_id: 'run:ts',
        agent_session: {
          agent_session_id: 'agentsess:ts',
          workstream_id: 'workstream:ts',
          agent_host: 'codex',
          harness_run_id: 'run:ts',
          started_at: '2026-05-16T00:01:00Z',
        },
      });
    }
    if (url.endsWith('/session/end/')) {
      return jsonResponse({
        agent_session: {
          agent_session_id: 'agentsess:ts',
          workstream_id: 'workstream:ts',
          ended_at: '2026-05-16T00:02:00Z',
          outcome: { status: 'ready_for_handoff' },
        },
        agent_session_id: 'agentsess:ts',
        workstream_id: 'workstream:ts',
      });
    }
    if (url.endsWith('/handoff/current/')) {
      return jsonResponse({
        handoff_id: 'handoff:ts',
        workstream_id: 'workstream:ts',
        state_hash: 'sha256:ts',
        handoff: {
          handoff_id: 'handoff:ts',
          workstream_id: 'workstream:ts',
          previous_agent: 'codex',
          next_agent_target: 'claude_code',
          task_state: 'active',
          summary: 'TS SDK parity capsule',
          decisions: [],
          assumptions: [],
          resolved_assumptions: [],
          files_touched: [],
          commands_run: [],
          tests_run: [],
          failures: [],
          open_questions: [],
          next_actions: [],
          memory_atoms: [],
          risk_flags: [],
          state_hash: 'sha256:ts',
          created_at: '2026-05-16T00:03:00Z',
        },
      });
    }
    if (url.includes('/handoffs/')) {
      return jsonResponse({
        workstream_id: 'workstream:ts',
        handoffs: [
          {
            handoff_id: 'handoff:ts-2',
            workstream_id: 'workstream:ts',
            created_at: '2026-05-16T00:05:00Z',
            state_hash: 'sha256:b',
          },
          {
            handoff_id: 'handoff:ts-1',
            workstream_id: 'workstream:ts',
            created_at: '2026-05-16T00:04:00Z',
            state_hash: 'sha256:a',
          },
        ],
        count: 2,
        next_cursor: '2026-05-16T00:04:00Z',
      });
    }
    if (url.includes('/handoff/handoff:')) {
      return jsonResponse({
        handoff: {
          handoff_id: 'handoff:ts',
          workstream_id: 'workstream:ts',
          created_at: '2026-05-16T00:03:00Z',
          state_hash: 'sha256:ts',
          task_state: 'active',
        },
      });
    }
    return new Response('not found', { status: 404 });
  };
}

test('workstream.resolve returns the workstream summary', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: fakeFetch(requests),
  });
  const ws = await client.workstream.resolve({
    tenant_id: 'tenant-x',
    repo: 'Index-API',
    branch: 'main',
    title: 'CMH TS SDK parity test',
  });
  assert.equal(ws.workstream_id, 'workstream:ts');
  assert.equal(ws.repo, 'Index-API');
  assert.ok(
    requests.some((r) => r.url.endsWith('/workstream/resolve/')),
  );
});

test('workstream.session.start + end flow through CMH routes', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: fakeFetch(requests),
  });
  const started = await client.workstream.session.start('workstream:ts', {
    agent_host: 'codex',
    agent_model: 'gpt-5.5',
    task: 'continue CMH TS SDK',
  });
  assert.equal(started.agent_session_id, 'agentsess:ts');
  assert.equal(started.harness_run_id, 'run:ts');
  const ended = await client.workstream.session.end('workstream:ts', {
    agent_session_id: 'agentsess:ts',
    outcome: { status: 'ready_for_handoff' },
  });
  assert.equal(
    ended.agent_session.outcome.status,
    'ready_for_handoff',
  );
});

test('workstream.handoff.current returns the handoff artifact', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: fakeFetch(requests),
  });
  const current = await client.workstream.handoff.current('workstream:ts', {
    next_agent_target: 'claude_code',
  });
  assert.equal(current.handoff_id, 'handoff:ts');
  assert.equal(current.next_agent_target, 'claude_code');
});

test('workstream.handoffs paginates with next_cursor', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: fakeFetch(requests),
  });
  const listing = await client.workstream.handoffs('workstream:ts', {
    limit: 2,
  });
  assert.equal(listing.workstream_id, 'workstream:ts');
  assert.equal(listing.count, 2);
  assert.equal(listing.next_cursor, '2026-05-16T00:04:00Z');
  assert.deepEqual(
    listing.handoffs.map((h) => h.handoff_id),
    ['handoff:ts-2', 'handoff:ts-1'],
  );
});

test('handoff.get fetches by handoff_id', async () => {
  const requests = [];
  const client = new TheoremContextClient({
    baseUrl: 'http://localhost/api/v2/theseus',
    fetchImpl: fakeFetch(requests),
  });
  const fetched = await client.handoff.get('handoff:ts');
  assert.equal(fetched.handoff_id, 'handoff:ts');
});
