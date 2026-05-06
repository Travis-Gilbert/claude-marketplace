"""CLI for Theorem Context harness and Codex bundle workflows."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from pathlib import Path
from typing import Any, Callable

from .adapters.codex import (
    begin_harness_bundle,
    compile_run_context_bundle,
    prepare_codex_bundle,
    record_run_outcome,
)
from .client import TheoremContextClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='theorem-context')
    parser.add_argument(
        '--base-url',
        default=os.getenv('THEOREM_CONTEXT_BASE_URL'),
    )
    parser.add_argument(
        '--plugins-base-url',
        default=os.getenv('THEOREM_CONTEXT_PLUGINS_BASE_URL'),
    )
    parser.add_argument(
        '--api-key',
        default=os.getenv('THEOREM_CONTEXT_API_KEY'),
    )
    parser.add_argument(
        '--bundle-dir',
        default=os.getenv('THEOREM_CONTEXT_BUNDLE_DIR', '.theorem'),
    )
    parser.add_argument(
        '--repo-path',
        default=os.getenv('THEOREM_CONTEXT_REPO_PATH'),
    )

    subparsers = parser.add_subparsers(dest='command', required=True)

    harness = subparsers.add_parser('harness')
    harness_sub = harness.add_subparsers(dest='harness_command', required=True)
    harness_begin = harness_sub.add_parser('begin')
    harness_begin.add_argument('--task', required=True)
    harness_begin.add_argument('--actor', default='codex')
    harness_begin.add_argument('--task-type', default='research')

    context = subparsers.add_parser('context')
    context_sub = context.add_subparsers(dest='context_command', required=True)
    context_compile = context_sub.add_parser('compile')
    context_compile.add_argument('--run-id')
    context_compile.add_argument('--task')
    context_compile.add_argument('--task-type')
    context_compile.add_argument('--budget-tokens', type=int, default=8000)
    context_compile.add_argument('--invariants', default='')

    run = subparsers.add_parser('run')
    run_sub = run.add_subparsers(dest='run_command', required=True)
    run_outcome = run_sub.add_parser('outcome')
    run_outcome.add_argument('--run-id')
    run_outcome.add_argument('--artifact-id')
    run_outcome.add_argument('--accepted', action='store_true')
    run_outcome.add_argument('--tests-passed', action='store_true')
    run_outcome.add_argument('--pr-merged', action='store_true')
    run_outcome.add_argument('--agent-used')
    run_outcome.add_argument('--user-feedback')

    codex = subparsers.add_parser('codex')
    codex_sub = codex.add_subparsers(dest='codex_command', required=True)
    codex_prepare = codex_sub.add_parser('prepare')
    codex_prepare.add_argument('--task', required=True)
    codex_prepare.add_argument('--actor', default='codex')
    codex_prepare.add_argument('--task-type', default='research')
    codex_prepare.add_argument('--budget-tokens', type=int, default=8000)
    codex_prepare.add_argument('--invariants', default='')

    return parser


async def run_async(
    argv: list[str] | None = None,
    client_factory: Callable[[argparse.Namespace], Any] | None = None,
) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if client_factory:
        client = client_factory(args)
    else:
        client_kwargs: dict[str, Any] = {
            'api_key': args.api_key or None,
        }
        if args.base_url:
            client_kwargs['base_url'] = args.base_url
        if args.plugins_base_url:
            client_kwargs['plugins_base_url'] = args.plugins_base_url
        client = TheoremContextClient(**client_kwargs)
    try:
        result = await _dispatch(client, args)
    finally:
        if hasattr(client, 'aclose'):
            await client.aclose()
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


def main(
    argv: list[str] | None = None,
    client_factory: Callable[[argparse.Namespace], Any] | None = None,
) -> int:
    if _is_legacy_run(argv):
        return _legacy_run_main(argv or [], client_factory=client_factory)
    return asyncio.run(run_async(argv=argv, client_factory=client_factory))


def _is_legacy_run(argv: list[str] | None) -> bool:
    return bool(argv) and argv[0] == 'run' and (
        len(argv) == 1 or argv[1] != 'outcome'
    )


def _legacy_run_main(
    argv: list[str],
    *,
    client_factory: Callable[[argparse.Namespace], Any] | None = None,
) -> int:
    parser = argparse.ArgumentParser(prog='theorem-context')
    parser.add_argument('command', choices=['run'])
    parser.add_argument('task')
    parser.add_argument('--actor', default='agent')
    parser.add_argument('--base-url', default=None)
    parser.add_argument('--api-key', default=None)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args(argv)
    plan = _legacy_run_plan(args.task, args.actor)
    if args.dry_run:
        print(json.dumps(plan, indent=2, sort_keys=True))
        return 0
    return asyncio.run(
        _legacy_run(args, plan, client_factory=client_factory),
    )


async def _legacy_run(
    args: argparse.Namespace,
    plan: list[dict[str, Any]],
    *,
    client_factory: Callable[[argparse.Namespace], Any] | None = None,
) -> int:
    if client_factory:
        client = client_factory(args)
    else:
        kwargs: dict[str, Any] = {}
        if args.base_url:
            kwargs['base_url'] = args.base_url
        if args.api_key:
            kwargs['api_key'] = args.api_key
        client = TheoremContextClient(**kwargs)
    try:
        run = await client.runs.begin(task=args.task, actor=args.actor)
    finally:
        if hasattr(client, 'aclose'):
            await client.aclose()
    print(json.dumps({'run_id': run.run_id, 'plan': plan}, indent=2))
    return 0


def _legacy_run_plan(task: str, actor: str) -> list[dict[str, Any]]:
    return [
        {
            'method': 'POST',
            'path': '/harness/runs/',
            'body': {'task': task, 'actor': actor, 'scope': {}},
        },
        {
            'method': 'POST',
            'path': '/harness/runs/{run_id}/transition/',
            'body': {
                'type': 'TASK.RESOLVED',
                'payload': {'task_type': 'fix', 'task_signature': '<sha256>'},
            },
        },
        {
            'method': 'GET',
            'path': '/harness/runs/{run_id}/events/',
        },
        {
            'method': 'GET',
            'path': '/harness/runs/{run_id}/state-hash/',
        },
    ]


async def _dispatch(client, args: argparse.Namespace) -> dict[str, Any]:
    bundle_dir = Path(args.bundle_dir)
    repo_path = args.repo_path

    if args.command == 'harness' and args.harness_command == 'begin':
        return await begin_harness_bundle(
            client=client,
            task=args.task,
            bundle_dir=bundle_dir,
            repo_path=repo_path,
            actor=args.actor,
            task_type=args.task_type,
        )

    if args.command == 'context' and args.context_command == 'compile':
        return await compile_run_context_bundle(
            client=client,
            bundle_dir=bundle_dir,
            run_id=args.run_id,
            task=args.task,
            repo_path=repo_path,
            task_type=args.task_type,
            budget_tokens=args.budget_tokens,
            invariants=args.invariants,
        )

    if args.command == 'run' and args.run_command == 'outcome':
        return await record_run_outcome(
            client=client,
            bundle_dir=bundle_dir,
            artifact_id=args.artifact_id,
            run_id=args.run_id,
            accepted=args.accepted or None,
            tests_passed=args.tests_passed or None,
            pr_merged=args.pr_merged or None,
            agent_used=args.agent_used,
            user_feedback=args.user_feedback,
        )

    if args.command == 'codex' and args.codex_command == 'prepare':
        return await prepare_codex_bundle(
            client=client,
            task=args.task,
            bundle_dir=bundle_dir,
            repo_path=repo_path,
            actor=args.actor,
            task_type=args.task_type,
            budget_tokens=args.budget_tokens,
            invariants=args.invariants,
        )

    raise ValueError('Unsupported command.')
