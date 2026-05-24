/**
 * Harness facade tests (MEM-030 + MEM-032).
 *
 * The facade is a thin delegator over TheoremContextClient. These tests
 * use a stub client (duck-typed; same surface the codex-adapter tests
 * use) to verify that each Harness namespace method delegates to the
 * underlying client method with the right shape, without hitting any
 * real HTTP endpoint.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { Harness, HarnessAction, HarnessDiagnose, HarnessMemory } from '../dist/index.js';

function makeStubClient() {
  const calls = {};
  return {
    calls,
    async recall(input) {
      calls.recall = input;
      return { results: [{ id: 'doc-1' }], count: 1 };
    },
    async remember(input) {
      calls.remember = input;
      return { id: 42, slug: 'rem-42', title: 'remembered' };
    },
    async selfNote(input) {
      calls.selfNote = input;
      return { document: { doc_id: 'note-1' } };
    },
    async selfRevise(input) {
      calls.selfRevise = input;
      return { revised: { doc_id: 'note-2' } };
    },
    async selfArchive(input) {
      calls.selfArchive = input;
      return { archived: { doc_id: input.docId } };
    },
    async selfRecallArchive(input) {
      calls.selfRecallArchive = input;
      return { results: [], count: 0 };
    },
    async encodeMemory(input) {
      calls.encodeMemory = input;
      return { document: { doc_id: 'enc-1' }, outcome: input.outcome };
    },
    async coordinate(input) {
      calls.coordinate = input;
      return { mentions: ['claude-code'] };
    },
    async mentions(input) {
      calls.mentions = input;
      return { mentions: [], count: 0 };
    },
    async mentionsWait(input) {
      calls.mentionsWait = input;
      return { mentions: [], count: 0, wait: { timed_out: true } };
    },
    async presence(input) {
      calls.presence = input;
      return { presence: { status: 'active' } };
    },
    async subscribe(input) {
      calls.subscribe = input;
      return { subscription: { actor_id: input.actor } };
    },
    workstream: {
      handoff: {
        async current(workstreamId, options) {
          calls.handoff = { workstreamId, options };
          return {
            handoff_id: 'h-1',
            workstream_id: workstreamId,
            next_agent_target: options.next_agent_target,
          };
        },
      },
    },
  };
}

test('Harness exposes memory, action, diagnose namespaces', () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  assert.ok(harness.memory instanceof HarnessMemory);
  assert.ok(harness.action instanceof HarnessAction);
  assert.ok(harness.diagnose instanceof HarnessDiagnose);
  // The underlying client is accessible for the full 13-namespace surface.
  assert.strictEqual(harness.client, client);
});

test('harness.memory.recall delegates to client.recall with same input', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  const result = await harness.memory.recall({
    query: 'auth refactor',
    actor: 'claude-ai',
    kind: 'session_summary',
    limit: 5,
  });

  assert.deepEqual(client.calls.recall, {
    query: 'auth refactor',
    actor: 'claude-ai',
    kind: 'session_summary',
    limit: 5,
  });
  assert.equal(result.count, 1);
  assert.equal(result.results.length, 1);
});

test('harness.memory.recall with no args returns empty default input', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  await harness.memory.recall();

  // Default input is an empty object; client.recall receives undefined-keyed values.
  assert.deepEqual(client.calls.recall, {});
});

test('harness.memory.remember delegates to client.remember', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  const result = await harness.memory.remember({
    observation: 'cluster A shipped today',
    evidence: ['commit:d4d787af'],
  });

  assert.deepEqual(client.calls.remember, {
    observation: 'cluster A shipped today',
    evidence: ['commit:d4d787af'],
  });
  assert.equal(result.id, 42);
});

test('harness.memory exposes self memory v2 methods', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  await harness.memory.selfNote({ content: 'Use shared presence keys.' });
  await harness.memory.selfRevise({ docId: 'note-1', content: 'Revised.' });
  await harness.memory.selfArchive({ docId: 'note-2' });
  await harness.memory.selfRecallArchive({ query: 'presence' });
  await harness.memory.encode({
    content: 'The TTL failure produced a durable postmortem.',
    kind: 'postmortem',
    outcome: 'negative',
  });

  assert.equal(client.calls.selfNote.content, 'Use shared presence keys.');
  assert.equal(client.calls.selfRevise.docId, 'note-1');
  assert.equal(client.calls.selfArchive.docId, 'note-2');
  assert.equal(client.calls.selfRecallArchive.query, 'presence');
  assert.equal(client.calls.encodeMemory.kind, 'postmortem');
  assert.equal(client.calls.encodeMemory.outcome, 'negative');
});

test('harness.action.handoff delegates to client.workstream.handoff.current', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  const result = await harness.action.handoff({
    workstreamId: 'ws-123',
    nextAgent: 'claude-code',
    previousAgent: 'claude-ai',
    targetTokens: 8000,
  });

  assert.equal(client.calls.handoff.workstreamId, 'ws-123');
  assert.equal(client.calls.handoff.options.next_agent_target, 'claude-code');
  assert.equal(client.calls.handoff.options.previous_agent, 'claude-ai');
  assert.equal(client.calls.handoff.options.target_tokens, 8000);
  assert.equal(result.workstream_id, 'ws-123');
});

test('harness.action exposes coordination methods', async () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  await harness.action.coordinate({
    message: '@claude-code check TTL',
    urgency: 'ask',
  });
  await harness.action.mentions({ actor: 'claude-code' });
  await harness.action.mentionsWait({ actor: 'claude-code', timeoutSeconds: 0 });
  await harness.action.presence({ actor: 'codex' });
  await harness.action.subscribe({ actor: 'codex' });

  assert.equal(client.calls.coordinate.message, '@claude-code check TTL');
  assert.equal(client.calls.coordinate.urgency, 'ask');
  assert.equal(client.calls.mentions.actor, 'claude-code');
  assert.equal(client.calls.mentionsWait.timeoutSeconds, 0);
  assert.equal(client.calls.presence.actor, 'codex');
  assert.equal(client.calls.subscribe.actor, 'codex');
});

test('harness.diagnose is constructed but exposes no methods yet', () => {
  const client = makeStubClient();
  const harness = new Harness({ client });

  // The diagnose namespace exists for future iq/health/stats methods
  // when their backend endpoints land; the SDK harness product rule
  // forbids shipping facade methods without real backing endpoints.
  assert.ok(harness.diagnose);
  // No methods are publicly enumerable; the namespace is intentionally a
  // placeholder until the backend wiring exists.
});
