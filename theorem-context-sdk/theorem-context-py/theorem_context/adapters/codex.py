from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def detect_repo_metadata(repo_path: str | Path | None = None) -> dict[str, Any]:
    repo_dir = Path(repo_path or Path.cwd()).resolve()
    metadata = {
        'cwd': str(repo_dir),
        'repo_root': str(repo_dir),
        'branch': '',
        'head': '',
        'dirty': False,
    }

    top_level = _git_output(repo_dir, 'rev-parse', '--show-toplevel')
    if top_level:
        repo_dir = Path(top_level).resolve()
        metadata['repo_root'] = str(repo_dir)
    metadata['branch'] = _git_output(repo_dir, 'branch', '--show-current')
    metadata['head'] = _git_output(repo_dir, 'rev-parse', 'HEAD')
    metadata['dirty'] = bool(_git_output(repo_dir, 'status', '--short'))
    return metadata


async def prepare_codex_bundle(
    *,
    client,
    task: str,
    bundle_dir: str | Path = '.theorem',
    repo_path: str | Path | None = None,
    repo_metadata: dict[str, Any] | None = None,
    actor: str = 'codex',
    task_type: str = 'research',
    budget_tokens: int = 8000,
    invariants: str = '',
    scope: dict[str, Any] | None = None,
) -> dict[str, Any]:
    repo_info = dict(repo_metadata or detect_repo_metadata(repo_path))
    merged_scope = {
        **dict(scope or {}),
        'repo_root': repo_info.get('repo_root', ''),
        'cwd': repo_info.get('cwd', ''),
        'branch': repo_info.get('branch', ''),
        'head': repo_info.get('head', ''),
        'dirty': bool(repo_info.get('dirty', False)),
        'task_type': task_type,
    }
    run = await client.harness.begin(
        task=task,
        actor=actor,
        scope=merged_scope,
    )
    run_data = _to_plain_data(run)
    run_id = _require_key(run_data, 'run_id')
    artifact = await client.harness.context(
        run_id,
        task=task,
        budget_tokens=budget_tokens,
        repo=str(repo_info.get('repo_root') or ''),
        task_type=task_type,
        invariants=invariants,
    )
    artifact_data = _to_plain_data(artifact)
    context_markdown = await _artifact_markdown(client, artifact_data)
    return write_codex_bundle(
        bundle_dir=bundle_dir,
        run=run_data,
        artifact=artifact_data,
        context_markdown=context_markdown,
        repo_metadata=repo_info,
    )


async def begin_harness_bundle(
    *,
    client,
    task: str,
    bundle_dir: str | Path = '.theorem',
    repo_path: str | Path | None = None,
    repo_metadata: dict[str, Any] | None = None,
    actor: str = 'codex',
    task_type: str = 'research',
    scope: dict[str, Any] | None = None,
) -> dict[str, Any]:
    repo_info = dict(repo_metadata or detect_repo_metadata(repo_path))
    run = await client.harness.begin(
        task=task,
        actor=actor,
        scope={
            **dict(scope or {}),
            'repo_root': repo_info.get('repo_root', ''),
            'cwd': repo_info.get('cwd', ''),
            'branch': repo_info.get('branch', ''),
            'head': repo_info.get('head', ''),
            'dirty': bool(repo_info.get('dirty', False)),
            'task_type': task_type,
        },
    )
    return write_codex_bundle(
        bundle_dir=bundle_dir,
        run=_to_plain_data(run),
        artifact=None,
        context_markdown=None,
        repo_metadata=repo_info,
    )


async def compile_run_context_bundle(
    *,
    client,
    bundle_dir: str | Path = '.theorem',
    run_id: str | None = None,
    task: str | None = None,
    repo_path: str | Path | None = None,
    repo_metadata: dict[str, Any] | None = None,
    task_type: str | None = None,
    budget_tokens: int = 8000,
    invariants: str = '',
) -> dict[str, Any]:
    root = Path(bundle_dir)
    repo_info = dict(repo_metadata or detect_repo_metadata(repo_path))
    current_run = _load_json(root / 'current-run.json')
    run_payload = current_run if isinstance(current_run, dict) else {}
    effective_run_id = run_id or str(run_payload.get('run_id') or '')
    if not effective_run_id:
        raise ValueError('run_id is required to compile context.')
    run_scope = run_payload.get('scope')
    saved_task_type = (
        str(run_scope.get('task_type') or '')
        if isinstance(run_scope, dict)
        else ''
    )
    effective_task_type = task_type or saved_task_type or 'research'
    artifact = await client.harness.context(
        effective_run_id,
        task=task or str(run_payload.get('task') or ''),
        budget_tokens=budget_tokens,
        repo=str(repo_info.get('repo_root') or ''),
        task_type=effective_task_type,
        invariants=invariants,
    )
    artifact_data = _to_plain_data(artifact)
    context_markdown = await _artifact_markdown(client, artifact_data)
    return write_codex_bundle(
        bundle_dir=root,
        run=run_payload or {'run_id': effective_run_id},
        artifact=artifact_data,
        context_markdown=context_markdown,
        repo_metadata=repo_info,
    )


async def record_run_outcome(
    *,
    client,
    bundle_dir: str | Path = '.theorem',
    artifact_id: str | None = None,
    run_id: str | None = None,
    accepted: bool | None = None,
    tests_passed: bool | None = None,
    pr_merged: bool | None = None,
    agent_used: str | None = None,
    user_feedback: str | None = None,
) -> dict[str, Any]:
    root = Path(bundle_dir)
    current_run = _load_json(root / 'current-run.json')
    current_artifact = _load_json(root / 'current-artifact.json')
    run_payload = current_run if isinstance(current_run, dict) else {}
    artifact_payload = current_artifact if isinstance(current_artifact, dict) else {}
    effective_run_id = run_id or str(run_payload.get('run_id') or '')
    effective_artifact_id = artifact_id or str(
        artifact_payload.get('id') or artifact_payload.get('artifact_id') or ''
    )
    if not effective_artifact_id:
        raise ValueError('artifact_id is required to record an outcome.')

    payload = {
        'accepted': accepted,
        'testsPassed': tests_passed,
        'prMerged': pr_merged,
        'agentUsed': agent_used,
        'userFeedback': user_feedback,
    }
    payload = {key: value for key, value in payload.items() if value is not None}
    outcome = await client.context.outcome(effective_artifact_id, **payload)
    if effective_run_id:
        await client.harness.step(
            effective_run_id,
            kind='outcome',
            payload=payload,
        )
    context_markdown = _read_text(root / 'current-context.md')
    return write_codex_bundle(
        bundle_dir=root,
        run=run_payload or {'run_id': effective_run_id},
        artifact=artifact_payload or {'artifact_id': effective_artifact_id},
        context_markdown=context_markdown,
        repo_metadata=detect_repo_metadata(),
        outcome={'payload': payload, 'result': outcome},
    )


def write_codex_bundle(
    *,
    bundle_dir: str | Path,
    run: dict[str, Any],
    artifact: dict[str, Any] | None,
    context_markdown: str | None,
    repo_metadata: dict[str, Any],
    outcome: dict[str, Any] | None = None,
) -> dict[str, Any]:
    root = Path(bundle_dir)
    run_data = _to_plain_data(run)
    artifact_data = _to_plain_data(artifact) if artifact else None
    run_id = _require_key(run_data, 'run_id')
    trace_dir = root / 'runs' / run_id
    trace_dir.mkdir(parents=True, exist_ok=True)
    root.mkdir(parents=True, exist_ok=True)

    _write_json(root / 'current-run.json', run_data)
    _write_json(trace_dir / 'run.json', run_data)
    if artifact_data is not None:
        _write_json(root / 'current-artifact.json', artifact_data)
        _write_json(trace_dir / 'artifact.json', artifact_data)
    if context_markdown is not None:
        _write_text(root / 'current-context.md', context_markdown)
        _write_text(trace_dir / 'context.md', context_markdown)
    if outcome is not None:
        _write_json(trace_dir / 'outcome.json', _to_plain_data(outcome))
    _write_json(
        trace_dir / 'trace.json',
        {
            'run_id': run_id,
            'artifact_id': (
                artifact_data.get('id')
                if artifact_data
                else ''
            ) or (
                artifact_data.get('artifact_id')
                if artifact_data
                else ''
            ) or '',
            'repo': repo_metadata,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        },
    )
    return {
        'root': str(root),
        'trace_dir': str(trace_dir),
        'current_context': str(root / 'current-context.md'),
        'current_artifact': str(root / 'current-artifact.json'),
        'current_run': str(root / 'current-run.json'),
        'run': run_data,
        'artifact': artifact_data,
        'repo': repo_metadata,
    }


async def _artifact_markdown(client, artifact: dict[str, Any]) -> str:
    artifact_id = str(artifact.get('id') or artifact.get('artifact_id') or '')
    if not artifact_id:
        return _fallback_context_markdown(artifact)
    exported = await client.context.artifacts.export(artifact_id, format='markdown')
    if hasattr(exported, 'content'):
        return str(exported.content)
    if isinstance(exported, dict):
        return str(exported.get('content') or '')
    return _fallback_context_markdown(artifact)


def _fallback_context_markdown(artifact: dict[str, Any]) -> str:
    title = str(artifact.get('task_description') or artifact.get('title') or 'Context')
    artifact_id = str(artifact.get('id') or artifact.get('artifact_id') or '')
    return '\n'.join([
        f'# Context Brief: {title}',
        '',
        f'- Artifact id: `{artifact_id}`',
        f'- Status: {artifact.get("status", "")}',
    ])


def _to_plain_data(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, 'model_dump'):
        return value.model_dump()
    if hasattr(value, 'to_dict'):
        return value.to_dict()
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, dict):
        return {key: _to_plain_data(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_to_plain_data(item) for item in value]
    if isinstance(value, tuple):
        return [_to_plain_data(item) for item in value]
    if hasattr(value, '__dict__'):
        return {
            key: _to_plain_data(val)
            for key, val in vars(value).items()
            if not key.startswith('_')
        }
    return value


def _require_key(payload: dict[str, Any], key: str) -> str:
    value = str(payload.get(key) or '')
    if not value:
        raise ValueError(f'{key} is required.')
    return value


def _git_output(repo_dir: Path, *args: str) -> str:
    try:
        result = subprocess.run(
            ['git', *args],
            cwd=repo_dir,
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return ''
    if result.returncode != 0:
        return ''
    return result.stdout.strip()


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(_to_plain_data(payload), indent=2, sort_keys=True) + '\n',
        encoding='utf-8',
    )


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def _load_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding='utf-8'))


def _read_text(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding='utf-8')
