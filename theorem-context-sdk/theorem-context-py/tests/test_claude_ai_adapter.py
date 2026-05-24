"""Tests for the claude.ai capture adapter (MEM-041).

Pure-function tests; no HTTP transport. Verifies synthesis logic
against fixture conversation arrays.
"""

from __future__ import annotations

from theorem_context import current_conversation


def test_current_conversation_synthesizes_session_summary() -> None:
    messages = [
        {
            'role': 'user',
            'content': 'Should we ship Cluster D first or Cluster E?',
            'timestamp': '2026-05-22T10:00:00Z',
        },
        {
            'role': 'assistant',
            'content': "Cluster D first; E depends on it for the handoff surface.",
            'timestamp': '2026-05-22T10:01:00Z',
        },
        {
            'role': 'user',
            'content': "OK, let's do it.",
            'timestamp': '2026-05-22T10:02:00Z',
        },
    ]

    result = current_conversation(messages)

    assert result['metadata']['surface'] == 'claude-ai'
    assert result['metadata']['message_count'] == 3
    assert result['metadata']['first_message_at'] == '2026-05-22T10:00:00Z'
    assert result['metadata']['last_message_at'] == '2026-05-22T10:02:00Z'
    assert result['metadata']['captured_at']
    assert result['evidence'] == []

    assert 'Session summary captured from claude.ai' in result['observation']
    assert 'User: Should we ship' in result['observation']
    assert 'Assistant: Cluster D first' in result['observation']


def test_current_conversation_filters_invalid_messages() -> None:
    messages = [
        {'role': 'user', 'content': 'real message', 'timestamp': '2026-01-01T00:00:00Z'},
        {'role': 'system', 'content': 'wrong role'},
        {'role': 'assistant', 'content': '   '},
        {'role': 'user', 'content': ''},
        None,
        {'role': 'assistant', 'content': 'another real message'},
    ]

    result = current_conversation(messages)

    assert result['metadata']['message_count'] == 2
    assert 'real message' in result['observation']
    assert 'another real message' in result['observation']
    assert 'wrong role' not in result['observation']


def test_current_conversation_empty_array_returns_clean_metadata() -> None:
    result = current_conversation([])

    assert result['metadata']['message_count'] == 0
    assert result['metadata']['first_message_at'] is None
    assert result['metadata']['last_message_at'] is None
    assert 'Session summary captured from claude.ai' in result['observation']


def test_current_conversation_none_input_handled_safely() -> None:
    result = current_conversation(None)

    assert result['metadata']['message_count'] == 0
    assert result['evidence'] == []
