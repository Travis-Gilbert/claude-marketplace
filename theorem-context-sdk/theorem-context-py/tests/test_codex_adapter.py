from __future__ import annotations

import asyncio
import contextlib
import io
import json
from pathlib import Path

from theorem_context import ArtifactMarkdownExport
from theorem_context.adapters.codex import prepare_codex_bundle
from theorem_context.cli import main


class _FakeArtifacts:
    async def export(self, artifact_id: str, format: str = 'markdown') -> ArtifactMarkdownExport:
        assert artifact_id == 'artifact-1'
        assert format == 'markdown'
        return ArtifactMarkdownExport(
            artifact_id=artifact_id,
            content='# Context Brief\n\nPrepared for Codex.',
        )


class _FakeContext:
    def __init__(self) -> None:
        self.artifacts = _FakeArtifacts()
        self.outcomes: list[dict] = []

    async def outcome(self, artifact_id: str, **kwargs):
        self.outcomes.append({'artifact_id': artifact_id, **kwargs})
        return {
            'artifact_id': artifact_id,
            'status': 'outcome_recorded',
            'feedback_counts': {},
        }


class _FakeHarness:
    def __init__(self) -> None:
        self.begin_calls: list[dict] = []
        self.context_calls: list[dict] = []
        self.step_calls: list[dict] = []

    async def begin(self, **kwargs):
        self.begin_calls.append(kwargs)
        return {
            'run_id': 'run-1',
            'task': kwargs['task'],
            'actor': kwargs['actor'],
            'scope': kwargs['scope'],
            'status': 'running',
        }

    async def context(self, run_id: str, **kwargs):
        self.context_calls.append({'run_id': run_id, **kwargs})
        return {
            'id': 'artifact-1',
            'status': 'compiled',
            'task_description': kwargs.get('task') or '',
            'task_type': kwargs.get('task_type') or 'research',
        }

    async def step(self, run_id: str, **kwargs):
        self.step_calls.append({'run_id': run_id, **kwargs})
        return {'step_id': 'step-1'}


class FakeClient:
    def __init__(self) -> None:
        self.harness = _FakeHarness()
        self.context = _FakeContext()
        self.closed = False

    async def aclose(self) -> None:
        self.closed = True


def test_prepare_codex_bundle_writes_current_files_and_trace_folder(tmp_path: Path) -> None:
    bundle_dir = tmp_path / '.theorem'
    client = FakeClient()

    result = asyncio.run(
        prepare_codex_bundle(
            client=client,
            task='Review harness SDK gap',
            bundle_dir=bundle_dir,
            repo_metadata={
                'cwd': str(tmp_path),
                'repo_root': str(tmp_path),
                'branch': 'feature/test',
                'head': 'abc123',
                'dirty': False,
            },
            actor='codex',
            task_type='review',
        )
    )

    assert (bundle_dir / 'current-context.md').exists()
    assert (bundle_dir / 'current-artifact.json').exists()
    assert (bundle_dir / 'current-run.json').exists()
    assert (bundle_dir / 'runs' / 'run-1').is_dir()
    assert (bundle_dir / 'runs' / 'run-1' / 'trace.json').exists()
    assert json.loads((bundle_dir / 'current-run.json').read_text())['run_id'] == 'run-1'
    assert 'Prepared for Codex' in (bundle_dir / 'current-context.md').read_text()
    assert result['artifact']['id'] == 'artifact-1'


def test_cli_codex_prepare_writes_bundle(tmp_path: Path) -> None:
    bundle_dir = tmp_path / '.theorem'
    stdout = io.StringIO()

    with contextlib.redirect_stdout(stdout):
        exit_code = main(
            [
                '--bundle-dir',
                str(bundle_dir),
                'codex',
                'prepare',
                '--task',
                'Prepare Codex bundle',
            ],
            client_factory=lambda _args: FakeClient(),
        )

    assert exit_code == 0
    assert (bundle_dir / 'current-context.md').exists()
    assert (bundle_dir / 'current-artifact.json').exists()
    assert (bundle_dir / 'current-run.json').exists()
    assert (bundle_dir / 'runs' / 'run-1').is_dir()


def test_cli_context_compile_reuses_saved_task_type_when_flag_omitted(tmp_path: Path) -> None:
    bundle_dir = tmp_path / '.theorem'
    bundle_dir.mkdir()
    (bundle_dir / 'current-run.json').write_text(
        json.dumps(
            {
                'run_id': 'run-1',
                'task': 'Prepare Codex bundle',
                'scope': {'task_type': 'review'},
            }
        )
    )
    client = FakeClient()
    stdout = io.StringIO()

    with contextlib.redirect_stdout(stdout):
        exit_code = main(
            [
                '--bundle-dir',
                str(bundle_dir),
                'context',
                'compile',
            ],
            client_factory=lambda _args: client,
        )

    assert exit_code == 0
    assert client.harness.context_calls[0]['task_type'] == 'review'
