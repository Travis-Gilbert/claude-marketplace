import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { prepareCodexBundle } from '../dist/index.js';

test('prepareCodexBundle writes the Codex trace bundle files', async () => {
  const bundleRoot = await mkdtemp(path.join(tmpdir(), 'theorem-context-'));
  const bundleDir = path.join(bundleRoot, '.theorem');
  const client = {
    harness: {
      async begin(request) {
        return {
          run_id: 'run-1',
          task: request.task,
          actor: request.actor,
          scope: request.scope,
          status: 'running',
        };
      },
      async context(_runId, request) {
        return {
          id: 'artifact-1',
          status: 'compiled',
          task_description: request.task,
          task_type: request.task_type,
        };
      },
    },
    context: {
      artifacts: {
        async export(artifactId, format = 'markdown') {
          assert.equal(artifactId, 'artifact-1');
          assert.equal(format, 'markdown');
          return {
            artifact_id: artifactId,
            format: 'markdown',
            content: '# Context Brief\n\nPrepared for Codex.',
          };
        },
      },
    },
  };

  const result = await prepareCodexBundle({
    client,
    task: 'Review harness SDK gap',
    bundleDir,
    repoMetadata: {
      cwd: bundleRoot,
      repo_root: bundleRoot,
      branch: 'feature/test',
      head: 'abc123',
      dirty: false,
    },
    actor: 'codex',
    taskType: 'review',
  });

  await stat(path.join(bundleDir, 'current-context.md'));
  await stat(path.join(bundleDir, 'current-artifact.json'));
  await stat(path.join(bundleDir, 'current-run.json'));
  await stat(path.join(bundleDir, 'runs', 'run-1'));
  await stat(path.join(bundleDir, 'runs', 'run-1', 'trace.json'));

  const currentRun = JSON.parse(
    await readFile(path.join(bundleDir, 'current-run.json'), 'utf8'),
  );
  const currentContext = await readFile(
    path.join(bundleDir, 'current-context.md'),
    'utf8',
  );

  assert.equal(currentRun.run_id, 'run-1');
  assert.match(currentContext, /Prepared for Codex/);
  assert.equal(result.artifact.id, 'artifact-1');
});
