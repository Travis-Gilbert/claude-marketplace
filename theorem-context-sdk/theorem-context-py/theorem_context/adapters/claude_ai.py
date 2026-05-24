"""Claude.ai conversation capture adapter (MEM-041).

Python mirror of ``packages/theorem-context-ts/src/adapters/claude_ai.ts``.
Same shape, same synthesis logic. Pure function: no HTTP transport.

Usage::

    from theorem_context import (
        Harness,
        TheoremContextClient,
        current_conversation,
    )

    messages = [
        {'role': 'user', 'content': 'Should we ship Cluster D first?'},
        {'role': 'assistant', 'content': 'Yes, E depends on it.'},
    ]
    captured = current_conversation(messages)

    client = TheoremContextClient(api_key=...)
    harness = Harness(client=client)
    saved = await harness.memory.remember(
        captured['observation'],
        evidence=captured['evidence'],
    )
    handoff = await harness.action.handoff(
        workstream_id='ws-...',
        next_agent='claude-code',
    )

See ``docs/plans/memory-harness-mcp-post-fractal/handoff-demo.md`` for
the end-to-end developer demo (MEM-042).
"""

from __future__ import annotations

from datetime import datetime, timezone as _tz
from typing import Any


def current_conversation(
    messages: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build a session-summary payload from a claude.ai conversation array.

    The synthesis is intentionally simple: it concatenates message
    content with role labels and adds a header that names the
    conversation as a session_summary candidate. Callers who want
    richer extraction (decisions, open questions, references) can
    run the raw ``messages`` through a downstream LLM step before
    calling ``harness.memory.remember(...)``.

    Returns a dict with keys ``observation``, ``evidence``, and
    ``metadata`` matching the TypeScript adapter's ``CapturedConversation``
    interface.
    """
    safe_messages = [
        msg
        for msg in (messages or [])
        if isinstance(msg, dict)
        and isinstance(msg.get('content'), str)
        and msg.get('content', '').strip()
        and msg.get('role') in ('user', 'assistant')
    ]

    timestamps = [
        (msg.get('timestamp') or '').strip()
        for msg in safe_messages
        if isinstance(msg.get('timestamp'), str)
        and (msg.get('timestamp') or '').strip()
    ]

    observation_lines = [
        'Session summary captured from claude.ai conversation.',
    ]
    for msg in safe_messages:
        role = 'User' if msg['role'] == 'user' else 'Assistant'
        observation_lines.append(f"{role}: {msg['content'].strip()}")
    observation = '\n\n'.join(observation_lines)

    return {
        'observation': observation,
        'evidence': [],
        'metadata': {
            'surface': 'claude-ai',
            'captured_at': datetime.now(_tz.utc).isoformat(),
            'message_count': len(safe_messages),
            'first_message_at': timestamps[0] if timestamps else None,
            'last_message_at': timestamps[-1] if timestamps else None,
        },
    }


__all__ = ['current_conversation']
