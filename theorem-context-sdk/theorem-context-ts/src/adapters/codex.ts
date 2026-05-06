import type { ArtifactExportFormat } from '../types.js';

const CHILD_PROCESS_MODULE = 'node:child_process';
const FS_PROMISES_MODULE = 'node:fs/promises';
const PATH_MODULE = 'node:path';

export interface CodexRepoMetadata {
  cwd: string;
  repo_root: string;
  branch: string;
  head: string;
  dirty: boolean;
}

export interface CodexBundleResult {
  root: string;
  trace_dir: string;
  current_context: string;
  current_artifact: string;
  current_run: string;
  run: Record<string, unknown>;
  artifact: Record<string, unknown> | null;
  repo: CodexRepoMetadata;
}

export interface CodexBundleWriteOptions {
  bundleDir: string;
  run: Record<string, unknown>;
  artifact?: Record<string, unknown> | null;
  contextMarkdown?: string | null;
  repoMetadata: CodexRepoMetadata;
  outcome?: Record<string, unknown> | null;
}

export interface CodexPrepareOptions {
  client: {
    harness: {
      begin: (request: Record<string, unknown>) => Promise<Record<string, unknown>>;
      context: (
        runId: string,
        request: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>;
    };
    context: {
      artifacts: {
        export: (
          artifactId: string,
          format?: ArtifactExportFormat,
        ) => Promise<Record<string, unknown>>;
      };
    };
  };
  task: string;
  bundleDir?: string;
  repoPath?: string;
  repoMetadata?: CodexRepoMetadata;
  actor?: string;
  taskType?: string;
  budgetTokens?: number;
  invariants?: string;
  scope?: Record<string, unknown>;
}

export async function detectRepoMetadata(
  repoPath: string = '.',
): Promise<CodexRepoMetadata> {
  const pathMod: any = await import(PATH_MODULE);
  const cwd = pathMod.resolve(repoPath);
  const repoRoot = (await gitOutput(cwd, 'rev-parse', '--show-toplevel')) || cwd;
  return {
    cwd,
    repo_root: repoRoot,
    branch: await gitOutput(repoRoot, 'branch', '--show-current'),
    head: await gitOutput(repoRoot, 'rev-parse', 'HEAD'),
    dirty: Boolean(await gitOutput(repoRoot, 'status', '--short')),
  };
}

export async function prepareCodexBundle(
  options: CodexPrepareOptions,
): Promise<CodexBundleResult> {
  const repoMetadata =
    options.repoMetadata ?? (await detectRepoMetadata(options.repoPath ?? '.'));
  const taskType = options.taskType ?? 'research';
  const run = await options.client.harness.begin({
    task: options.task,
    actor: options.actor ?? 'codex',
    scope: {
      ...(options.scope ?? {}),
      repo_root: repoMetadata.repo_root,
      cwd: repoMetadata.cwd,
      branch: repoMetadata.branch,
      head: repoMetadata.head,
      dirty: repoMetadata.dirty,
      task_type: taskType,
    },
  });
  const runData = toPlainRecord(run);
  const runId = requireKey(runData, 'run_id');
  const artifact = await options.client.harness.context(runId, {
    task: options.task,
    budget_tokens: options.budgetTokens ?? 8000,
    repo: repoMetadata.repo_root,
    task_type: taskType,
    invariants: options.invariants ?? '',
  });
  const artifactData = toPlainRecord(artifact);
  const artifactId = String(
    artifactData.id ?? artifactData.artifact_id ?? '',
  );
  const exported = artifactId
    ? await options.client.context.artifacts.export(artifactId, 'markdown')
    : { content: fallbackContextMarkdown(artifactData) };
  const contextMarkdown = String(exported.content ?? fallbackContextMarkdown(artifactData));
  return writeCodexBundle({
    bundleDir: options.bundleDir ?? '.theorem',
    run: runData,
    artifact: artifactData,
    contextMarkdown,
    repoMetadata,
  });
}

export async function writeCodexBundle(
  options: CodexBundleWriteOptions,
): Promise<CodexBundleResult> {
  const fs: any = await import(FS_PROMISES_MODULE);
  const pathMod: any = await import(PATH_MODULE);
  const root = pathMod.resolve(options.bundleDir);
  const runData = toPlainRecord(options.run);
  const artifactData = options.artifact ? toPlainRecord(options.artifact) : null;
  const runId = requireKey(runData, 'run_id');
  const traceDir = pathMod.join(root, 'runs', runId);

  await fs.mkdir(traceDir, { recursive: true });
  await writeJson(fs, pathMod.join(root, 'current-run.json'), runData);
  await writeJson(fs, pathMod.join(traceDir, 'run.json'), runData);

  if (artifactData) {
    await writeJson(fs, pathMod.join(root, 'current-artifact.json'), artifactData);
    await writeJson(fs, pathMod.join(traceDir, 'artifact.json'), artifactData);
  }
  if (options.contextMarkdown !== undefined && options.contextMarkdown !== null) {
    await fs.writeFile(
      pathMod.join(root, 'current-context.md'),
      options.contextMarkdown,
      'utf8',
    );
    await fs.writeFile(
      pathMod.join(traceDir, 'context.md'),
      options.contextMarkdown,
      'utf8',
    );
  }
  if (options.outcome) {
    await writeJson(fs, pathMod.join(traceDir, 'outcome.json'), options.outcome);
  }
  await writeJson(fs, pathMod.join(traceDir, 'trace.json'), {
    run_id: runId,
    artifact_id: artifactData?.id ?? artifactData?.artifact_id ?? '',
    repo: options.repoMetadata,
    updated_at: new Date().toISOString(),
  });

  return {
    root,
    trace_dir: traceDir,
    current_context: pathMod.join(root, 'current-context.md'),
    current_artifact: pathMod.join(root, 'current-artifact.json'),
    current_run: pathMod.join(root, 'current-run.json'),
    run: runData,
    artifact: artifactData,
    repo: options.repoMetadata,
  };
}

async function gitOutput(cwd: string, ...args: string[]): Promise<string> {
  const child: any = await import(CHILD_PROCESS_MODULE);
  try {
    return String(
      child.execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    ).trim();
  } catch {
    return '';
  }
}

async function writeJson(fs: any, path: string, value: unknown): Promise<void> {
  await fs.writeFile(
    path,
    `${JSON.stringify(toPlainData(value), null, 2)}\n`,
    'utf8',
  );
}

function fallbackContextMarkdown(artifact: Record<string, unknown>): string {
  const title = String(
    artifact.task_description ?? artifact.title ?? 'Context',
  );
  const artifactId = String(artifact.id ?? artifact.artifact_id ?? '');
  return `# Context Brief: ${title}\n\n- Artifact id: \`${artifactId}\`\n`;
}

function toPlainRecord(value: unknown): Record<string, unknown> {
  const plain = toPlainData(value);
  if (
    typeof plain === 'object' &&
    plain !== null &&
    !Array.isArray(plain)
  ) {
    return plain as Record<string, unknown>;
  }
  return {};
}

function toPlainData(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  const modelDump = (value as { model_dump?: () => unknown }).model_dump;
  if (typeof modelDump === 'function') {
    return modelDump.call(value);
  }
  const toDict = (value as { to_dict?: () => unknown }).to_dict;
  if (typeof toDict === 'function') {
    return toDict.call(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => toPlainData(item));
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      toPlainData(entry),
    ]),
  );
}

function requireKey(
  payload: Record<string, unknown>,
  key: string,
): string {
  const value = String(payload[key] ?? '');
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}
