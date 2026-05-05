"""Theorem Context Python SDK.

Mirrors the TypeScript package surface with Pythonic async generators::

    from theorem_context import TheoremContextClient

    cc = TheoremContextClient(api_key='...')
    artifact = await cc.context.compile(task='review the auth module')
    async for event in cc.context.compile_stream(task='...'):
        print(event)
"""

from .client import TheoremContextClient  # noqa: F401
from .product import TheoremHotGraphClient  # noqa: F401
from .types import (  # noqa: F401
    Action,
    Atom,
    Capsule,
    CapsuleChannel,
    CompileRequest,
    ContextArtifact,
    GraphHealth,
    HarnessBeginRequest,
    HarnessCompareRequest,
    HarnessContextRequest,
    HarnessForkRequest,
    HarnessPatchRequest,
    HarnessRun,
    HarnessSearchRequest,
    HarnessSearchRun,
    HarnessStep,
    OutcomeRequest,
    SavingsBreakdown,
    StressTest,
    THGCommandRequest,
    THGCypherRequest,
    THGEdge,
    THGNode,
    THGResult,
    TokenLedger,
)


__all__ = [
    'TheoremContextClient',
    'TheoremHotGraphClient',
    'Action',
    'Atom',
    'Capsule',
    'CapsuleChannel',
    'CompileRequest',
    'ContextArtifact',
    'GraphHealth',
    'HarnessBeginRequest',
    'HarnessCompareRequest',
    'HarnessContextRequest',
    'HarnessForkRequest',
    'HarnessPatchRequest',
    'HarnessRun',
    'HarnessSearchRequest',
    'HarnessSearchRun',
    'HarnessStep',
    'OutcomeRequest',
    'SavingsBreakdown',
    'StressTest',
    'THGCommandRequest',
    'THGCypherRequest',
    'THGEdge',
    'THGNode',
    'THGResult',
    'TokenLedger',
]
