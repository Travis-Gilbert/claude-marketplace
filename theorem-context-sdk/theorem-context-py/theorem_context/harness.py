"""Harness: additive ergonomic facade over TheoremContextClient.

MEM-031 of
``docs/plans/memory-harness-mcp-post-fractal/implementation-plan.md``.
Python mirror of ``packages/theorem-context-ts/src/harness.ts``.

The MD-file conversation described a unified developer-facing API::

    from theorem_context import Harness, TheoremContextClient

    client = TheoremContextClient(api_key=...)
    harness = Harness(client=client)
    memory = await harness.memory.recall(query='auth refactor')

This class is purely an additive ergonomic layer on top of
``TheoremContextClient``. The underlying client still works
unchanged; the existing 13 namespaces on ``TheoremContextClient`` are
accessible via ``harness.client``. The Harness adds three
responsibility-scoped namespaces that match the MD conversation's
three-MCP split mental model:

- ``.memory``: read/write the cross-surface memory store. ``recall``
  hits the new harness recall endpoint (MEM-029) added in this work.
- ``.action``: capture handoffs and queue follow-up actions.
- ``.diagnose``: (reserved) intelligence diagnostics surface.

Methods that have no real backing endpoint are NOT shipped here.
The conversation's seven-verb spec lives in the Theorem MCP at the
Form-B short names. The SDK exposes the subset that has REST
endpoints today.
"""

from __future__ import annotations

from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from .client import TheoremContextClient


class HarnessMemory:
    """Memory namespace: cross-surface read/write."""

    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def recall(
        self,
        *,
        query: str = '',
        actor: str | None = None,
        surface: str | None = None,
        kind: str | None = None,
        since: str | None = None,
        limit: int = 10,
        tenant_slug: str | None = None,
        include_low_fitness: bool = False,
        include_consolidation_sources: bool = False,
        consume_handoffs: bool = False,
    ) -> dict[str, Any]:
        """Load prior cross-surface memory.

        Delegates to ``client.recall(...)`` which hits the harness
        recall endpoint added in MEM-029. Returns inline document
        content with actor/surface/session provenance, matching the
        MCP ``recall`` verb's shape.
        """
        return await self._client.recall(
            query=query,
            actor=actor,
            surface=surface,
            kind=kind,
            since=since,
            limit=limit,
            tenant_slug=tenant_slug,
            include_low_fitness=include_low_fitness,
            include_consolidation_sources=include_consolidation_sources,
            consume_handoffs=consume_handoffs,
        )

    async def remember(
        self,
        observation: str,
        evidence: list[str] | None = None,
    ) -> dict[str, Any]:
        """Save a memory item. Delegates to the existing writeback path."""
        return await self._client.context.remember(observation, evidence or [])

    async def self_note(self, **kwargs: Any) -> dict[str, Any]:
        """Save a typed agent-memory note."""
        return await self._client.self_note(**kwargs)

    async def self_revise(self, **kwargs: Any) -> dict[str, Any]:
        """Create a revision-tracked replacement for a memory atom."""
        return await self._client.self_revise(**kwargs)

    async def self_archive(self, **kwargs: Any) -> dict[str, Any]:
        """Archive a memory atom out of active recall."""
        return await self._client.self_archive(**kwargs)

    async def self_recall_archive(self, **kwargs: Any) -> dict[str, Any]:
        """Recall archived memory on demand."""
        return await self._client.self_recall_archive(**kwargs)

    async def encode(self, **kwargs: Any) -> dict[str, Any]:
        """Record a feedback, solution, or postmortem memory."""
        return await self._client.encode_memory(**kwargs)


class HarnessAction:
    """Action namespace: handoff and follow-up coordination."""

    def __init__(self, client: 'TheoremContextClient') -> None:
        self._client = client

    async def handoff(
        self,
        *,
        workstream_id: str,
        next_agent: str | None = None,
        previous_agent: str | None = None,
        target_tokens: int | None = None,
        hard_cap: int | None = None,
    ) -> Any:
        """Compile a handoff artifact for the current workstream.

        Delegates to ``client.workstream.handoff.current(...)``.
        Returns the 18-field HandoffArtifact shape; the SDK consumer
        can forward it to a runner that spawns a session on a
        different surface.

        Per the CompileHandoffRequest contract, the input takes the
        agent identifiers and token budget; intent and other content
        fields are synthesized by the backend from the active
        workstream state.
        """
        kwargs: dict[str, Any] = {}
        if next_agent is not None:
            kwargs['next_agent_target'] = next_agent
        if previous_agent is not None:
            kwargs['previous_agent'] = previous_agent
        if target_tokens is not None:
            kwargs['target_tokens'] = target_tokens
        if hard_cap is not None:
            kwargs['hard_cap'] = hard_cap
        return await self._client.workstream.handoff.current(
            workstream_id,
            **kwargs,
        )

    async def coordinate(self, **kwargs: Any) -> dict[str, Any]:
        """Append a coordination message and queue @mentions."""
        return await self._client.coordinate(**kwargs)

    async def mentions(self, **kwargs: Any) -> dict[str, Any]:
        """Load pending mentions for an agent."""
        return await self._client.mentions(**kwargs)

    async def mentions_wait(self, **kwargs: Any) -> dict[str, Any]:
        """Block briefly until pending mentions arrive for an agent."""
        return await self._client.mentions_wait(**kwargs)

    async def presence(self, **kwargs: Any) -> dict[str, Any]:
        """Refresh, end, or read short-TTL agent presence."""
        return await self._client.presence(**kwargs)

    async def subscribe(self, **kwargs: Any) -> dict[str, Any]:
        """Register an actor as polling a mention channel."""
        return await self._client.subscribe(**kwargs)


class HarnessDiagnose:
    """Diagnose namespace: intelligence diagnostics (reserved).

    Currently a placeholder. The conversation described an IQ/health
    diagnostic verb cluster; the backend endpoints for these (iq,
    graph_health, stats) are MCP-only today and have no HTTP
    wrappers. Methods are NOT added here until those endpoints exist;
    per the SDK harness product rule, the facade does not ship stubs.
    """

    def __init__(self, _client: 'TheoremContextClient') -> None:
        # Reserved for future iq/health/stats methods when their
        # backend endpoints land. No methods exposed yet.
        del _client


class Harness:
    """Unified ergonomic facade over ``TheoremContextClient``.

    Construct with a ``TheoremContextClient`` instance; access the
    namespaces via ``.memory``, ``.action``, ``.diagnose``. The
    underlying client is still accessible at ``.client`` for callers
    who need the full 13-namespace surface.
    """

    def __init__(self, *, client: 'TheoremContextClient') -> None:
        self.client = client
        self.memory = HarnessMemory(client)
        self.action = HarnessAction(client)
        self.diagnose = HarnessDiagnose(client)


__all__ = [
    'Harness',
    'HarnessAction',
    'HarnessDiagnose',
    'HarnessMemory',
]
