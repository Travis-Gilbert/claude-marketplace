/**
 * claude.ai adapter tests (MEM-040).
 *
 * Pure-function tests: the adapter is a text shaping utility with no
 * HTTP transport. Tests verify the synthesis logic against fixture
 * conversation arrays.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { currentConversation, current_conversation } from '../dist/index.js';

test('currentConversation synthesizes a session_summary observation', () => {
  const messages = [
    {
      role: 'user',
      content: 'Should we ship Cluster D first or Cluster E?',
      timestamp: '2026-05-22T10:00:00Z',
    },
    {
      role: 'assistant',
      content: 'Cluster D first; Cluster E depends on it for the handoff surface.',
      timestamp: '2026-05-22T10:01:00Z',
    },
    {
      role: 'user',
      content: 'OK, let\'s do it.',
      timestamp: '2026-05-22T10:02:00Z',
    },
  ];

  const result = currentConversation(messages);

  assert.equal(result.metadata.surface, 'claude-ai');
  assert.equal(result.metadata.message_count, 3);
  assert.equal(result.metadata.first_message_at, '2026-05-22T10:00:00Z');
  assert.equal(result.metadata.last_message_at, '2026-05-22T10:02:00Z');
  assert.ok(result.metadata.captured_at);
  assert.deepEqual(result.evidence, []);

  // Observation contains the synthesized content with role labels.
  assert.match(result.observation, /Session summary captured from claude\.ai/);
  assert.match(result.observation, /User: Should we ship/);
  assert.match(result.observation, /Assistant: Cluster D first/);
});

test('currentConversation filters out invalid messages', () => {
  const messages = [
    { role: 'user', content: 'real message', timestamp: '2026-01-01T00:00:00Z' },
    { role: 'system', content: 'wrong role' }, // not 'user' or 'assistant'
    { role: 'assistant', content: '   ' }, // empty whitespace
    { role: 'user', content: '' }, // empty
    null, // null entry
    { role: 'assistant', content: 'another real message' },
  ];

  const result = currentConversation(messages);

  // Only the two valid messages survive.
  assert.equal(result.metadata.message_count, 2);
  assert.match(result.observation, /real message/);
  assert.match(result.observation, /another real message/);
  assert.doesNotMatch(result.observation, /wrong role/);
});

test('currentConversation handles empty array cleanly', () => {
  const result = currentConversation([]);

  assert.equal(result.metadata.message_count, 0);
  assert.equal(result.metadata.first_message_at, null);
  assert.equal(result.metadata.last_message_at, null);
  // Observation still contains the header so downstream consumers
  // can identify the capture origin even with zero messages.
  assert.match(result.observation, /Session summary captured from claude\.ai/);
});

test('current_conversation alias matches currentConversation', () => {
  const messages = [
    { role: 'user', content: 'hello' },
  ];
  const camel = currentConversation(messages);
  const snake = current_conversation(messages);

  // captured_at differs by milliseconds; compare everything else.
  assert.equal(camel.observation, snake.observation);
  assert.equal(camel.metadata.message_count, snake.metadata.message_count);
  assert.equal(camel.metadata.surface, snake.metadata.surface);
});
