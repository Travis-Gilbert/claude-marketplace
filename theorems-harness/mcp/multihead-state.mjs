import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

const STATE_VERSION = 1;
const DEFAULT_LEASE_TTL_SECONDS = 90;
const DEFAULT_PROOF_TIMEOUT_MS = 120_000;
const OUTPUT_LIMIT = 12_000;

export function createMultiheadStore(options = {}) {
  return new MultiheadStore(options);
}

export class MultiheadStore {
  constructor(options = {}) {
    this.projectDir = options.projectDir || process.cwd();
    this.stateDir =
      options.stateDir || join(this.projectDir, ".theorem", "multihead");
    this.statePath = options.statePath || join(this.stateDir, "state.json");
    this.lockDir = options.lockDir || join(this.stateDir, ".lock");
    this.clock = options.clock || { now: () => Date.now() };
    this.lockTimeoutMs = options.lockTimeoutMs ?? 5_000;
    this.lockStaleMs = options.lockStaleMs ?? 30_000;
  }

  startRun(args = {}) {
    const runId = cleanString(args.run_id) || `multihead:${randomUUID()}`;
    const now = this.isoNow();
    return this.withState((state) => {
      const run = ensureRun(state, runId, {
        goal: cleanString(args.goal) || "Multi-head run",
        actor: cleanString(args.actor) || null,
        created_at: now,
      });
      run.updated_at = now;
      appendEvent(run, "run_started", {
        actor: cleanString(args.actor) || null,
        goal: run.goal,
      }, now);
      return { ok: true, run };
    });
  }

  readRun(args = {}) {
    const runId = required(args, "run_id");
    return this.withState((state) => {
      const run = state.runs[runId];
      if (!run) throw new Error(`run not found: ${runId}`);
      refreshExpiredClaims(run, this.nowMs(), this.isoNow());
      return { ok: true, run };
    });
  }

  createTask(args = {}) {
    const runId = required(args, "run_id");
    const now = this.isoNow();
    return this.withState((state) => {
      const run = ensureRun(state, runId, {
        goal: cleanString(args.run_goal) || cleanString(args.goal) || "Multi-head run",
        actor: cleanString(args.actor) || null,
        created_at: now,
      });
      const nodeId = cleanString(args.node_id) || idFor("task", [
        runId,
        args.goal,
        Object.keys(run.tasks).length,
      ]);
      if (run.tasks[nodeId]) {
        return { ok: true, reused: true, task: run.tasks[nodeId], run };
      }
      const task = {
        node_id: nodeId,
        kind: cleanString(args.kind) || "task",
        goal: required(args, "goal"),
        description: cleanString(args.description) || "",
        status: "open",
        prerequisites: arrayOfStrings(args.prerequisites),
        metadata: objectOrEmpty(args.metadata),
        created_at: now,
        updated_at: now,
        claim_epoch: 0,
        active_claim_id: null,
        patch_ids: [],
        review_ids: [],
      };
      run.tasks[nodeId] = task;
      run.updated_at = now;
      appendEvent(run, "task_created", { node_id: nodeId, kind: task.kind }, now);
      return { ok: true, task, run };
    });
  }

  claimTask(args = {}) {
    const runId = required(args, "run_id");
    const nodeId = required(args, "node_id");
    const owner = required(args, "owner");
    const ttlSeconds = leaseTtl(args.lease_ttl_seconds);
    const nowMs = this.nowMs();
    const now = this.isoNow();
    return this.withState((state) => {
      const run = requireRun(state, runId);
      const task = requireTask(run, nodeId);
      refreshExpiredClaims(run, nowMs, now);
      const active = task.active_claim_id ? run.claims[task.active_claim_id] : null;
      if (active && isClaimActive(active, nowMs)) {
        if (active.owner !== owner) {
          throw new Error(
            `task ${nodeId} already claimed by ${active.owner} until ${active.expires_at}`,
          );
        }
        active.last_heartbeat = now;
        active.expires_at = isoFromMs(nowMs + ttlSeconds * 1000);
        active.lease_ttl_seconds = ttlSeconds;
        task.updated_at = now;
        run.updated_at = now;
        appendEvent(run, "claim_heartbeat", {
          claim_id: active.claim_id,
          node_id: nodeId,
          owner,
          epoch: active.epoch,
        }, now);
        return { ok: true, renewed: true, claim: active, task };
      }

      const epoch = (task.claim_epoch || 0) + 1;
      const claim = {
        claim_id: idFor("claim", [runId, nodeId, owner, epoch, now]),
        run_id: runId,
        node_id: nodeId,
        owner,
        epoch,
        status: "active",
        lease_ttl_seconds: ttlSeconds,
        claimed_at: now,
        last_heartbeat: now,
        expires_at: isoFromMs(nowMs + ttlSeconds * 1000),
      };
      run.claims[claim.claim_id] = claim;
      task.claim_epoch = epoch;
      task.active_claim_id = claim.claim_id;
      task.status = "claimed";
      task.updated_at = now;
      run.updated_at = now;
      appendEvent(run, "claim_acquired", {
        claim_id: claim.claim_id,
        node_id: nodeId,
        owner,
        epoch,
      }, now);
      return { ok: true, renewed: false, claim, task };
    });
  }

  releaseClaim(args = {}) {
    const runId = required(args, "run_id");
    const claimId = required(args, "claim_id");
    const owner = required(args, "owner");
    const now = this.isoNow();
    return this.withState((state) => {
      const run = requireRun(state, runId);
      const claim = run.claims[claimId];
      if (!claim) throw new Error(`claim not found: ${claimId}`);
      if (claim.owner !== owner) {
        throw new Error(`claim ${claimId} belongs to ${claim.owner}, not ${owner}`);
      }
      claim.status = "released";
      claim.released_at = now;
      const task = run.tasks[claim.node_id];
      if (task?.active_claim_id === claimId) {
        task.active_claim_id = null;
        task.status = "open";
        task.updated_at = now;
      }
      run.updated_at = now;
      appendEvent(run, "claim_released", {
        claim_id: claimId,
        node_id: claim.node_id,
        owner,
      }, now);
      return { ok: true, claim, task };
    });
  }

  proposePatch(args = {}) {
    const runId = required(args, "run_id");
    const nodeId = required(args, "node_id");
    const owner = required(args, "owner");
    const epoch = requiredNumber(args, "epoch");
    const baseCommit = required(args, "base_commit");
    const patchText = cleanString(args.patch) || "";
    const now = this.isoNow();
    return this.withState((state) => {
      const run = requireRun(state, runId);
      const task = requireTask(run, nodeId);
      const claim = requireActiveClaim(run, task, owner, epoch, this.nowMs());
      const patchId = cleanString(args.patch_id) || idFor("patch", [
        runId,
        nodeId,
        owner,
        epoch,
        baseCommit,
        patchText,
        now,
      ]);
      const patch = {
        patch_id: patchId,
        run_id: runId,
        node_id: nodeId,
        claim_id: claim.claim_id,
        owner,
        epoch,
        base_commit: baseCommit,
        status: "proposed",
        files: arrayOfStrings(args.files),
        patch: patchText,
        patch_hash: hashText(patchText || JSON.stringify(args.patch_ref ?? {})),
        patch_ref: args.patch_ref ?? null,
        created_at: now,
        updated_at: now,
        receipt_ids: [],
        review_ids: [],
      };
      run.patches[patchId] = patch;
      pushUnique(task.patch_ids, patchId);
      task.status = "patch_proposed";
      task.updated_at = now;
      run.updated_at = now;
      appendEvent(run, "patch_proposed", {
        patch_id: patchId,
        node_id: nodeId,
        owner,
        base_commit: baseCommit,
      }, now);
      return { ok: true, patch, task };
    });
  }

  rebasePatch(args = {}) {
    const runId = required(args, "run_id");
    const patchId = required(args, "patch_id");
    const newBaseCommit = required(args, "new_base_commit");
    const now = this.isoNow();
    return this.withState((state) => {
      const run = requireRun(state, runId);
      const patch = requirePatch(run, patchId);
      const oldBaseCommit = patch.base_commit;
      if (oldBaseCommit === newBaseCommit) {
        return { ok: true, changed: false, patch, invalidated_receipts: [] };
      }
      const invalidated = [];
      for (const receiptId of patch.receipt_ids) {
        const receipt = run.receipts[receiptId];
        if (!receipt || receipt.status === "stale") continue;
        receipt.status = "stale";
        receipt.stale_reason = "patch_rebased";
        receipt.invalidated_at = now;
        invalidated.push(receiptId);
      }
      patch.base_commit = newBaseCommit;
      patch.updated_at = now;
      patch.status = "rebased";
      run.updated_at = now;
      appendEvent(run, "patch_rebased", {
        patch_id: patchId,
        old_base_commit: oldBaseCommit,
        new_base_commit: newBaseCommit,
        invalidated_receipts: invalidated,
      }, now);
      return { ok: true, changed: true, patch, invalidated_receipts: invalidated };
    });
  }

  runProof(args = {}) {
    const runId = required(args, "run_id");
    const patchId = required(args, "patch_id");
    const command = required(args, "command");
    const commandArgs = arrayOfStrings(args.args);
    const cwd = cleanString(args.cwd) || this.projectDir;
    const timeoutMs = boundedNumber(
      args.timeout_ms,
      1_000,
      30 * 60_000,
      DEFAULT_PROOF_TIMEOUT_MS,
    );
    const before = this.withState((state) => {
      const run = requireRun(state, runId);
      const patch = requirePatch(run, patchId);
      return {
        run_id: runId,
        patch_id: patchId,
        base_commit: patch.base_commit,
      };
    });

    const startedAt = this.isoNow();
    const child = spawnSync(command, commandArgs, {
      cwd,
      encoding: "utf8",
      timeout: timeoutMs,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const finishedAt = this.isoNow();
    const timedOut = child.error?.code === "ETIMEDOUT";
    const exitCode = child.status;
    const actualStatus = !timedOut && exitCode === 0 ? "passed" : "failed";
    const stdout = truncate(child.stdout || "");
    const stderr = truncate(child.stderr || child.error?.message || "");
    const now = this.isoNow();

    return this.withState((state) => {
      const run = requireRun(state, runId);
      const patch = requirePatch(run, patchId);
      const baseChangedDuringProof = patch.base_commit !== before.base_commit;
      const receipt = {
        receipt_id: idFor("receipt", [
          runId,
          patchId,
          patch.base_commit,
          command,
          commandArgs,
          startedAt,
        ]),
        run_id: runId,
        patch_id: patchId,
        base_commit: before.base_commit,
        status: baseChangedDuringProof ? "stale" : actualStatus,
        stale_reason: baseChangedDuringProof ? "patch_rebased_during_proof" : null,
        trust_tier: "substrate_rerun",
        command,
        args: commandArgs,
        cwd,
        timeout_ms: timeoutMs,
        exit_code: exitCode,
        timed_out: timedOut,
        signal: child.signal || null,
        stdout,
        stderr,
        stdout_sha256: hashText(child.stdout || ""),
        stderr_sha256: hashText(child.stderr || child.error?.message || ""),
        started_at: startedAt,
        finished_at: finishedAt,
        created_at: now,
      };
      run.receipts[receipt.receipt_id] = receipt;
      pushUnique(patch.receipt_ids, receipt.receipt_id);
      patch.status = receipt.status === "passed" ? "proof_passed" : "proof_failed";
      patch.updated_at = now;
      run.updated_at = now;
      appendEvent(run, "proof_ran", {
        receipt_id: receipt.receipt_id,
        patch_id: patchId,
        base_commit: receipt.base_commit,
        status: receipt.status,
      }, now);
      return { ok: receipt.status === "passed", receipt, patch };
    });
  }

  reviewPatch(args = {}) {
    const runId = required(args, "run_id");
    const patchId = required(args, "patch_id");
    const reviewer = required(args, "reviewer");
    const action = cleanString(args.action) || "open";
    const now = this.isoNow();
    return this.withState((state) => {
      const run = requireRun(state, runId);
      const patch = requirePatch(run, patchId);
      const reviewId =
        cleanString(args.review_id) || idFor("review", [runId, patchId, reviewer]);
      let review = run.reviews[reviewId];
      if (!review) {
        review = {
          review_id: reviewId,
          run_id: runId,
          patch_id: patchId,
          node_id: patch.node_id,
          reviewer,
          status: "open",
          requested_at: now,
          updated_at: now,
          falsification_attempts: [],
          findings: [],
          waived_risks: [],
        };
        run.reviews[reviewId] = review;
        pushUnique(patch.review_ids, reviewId);
        const task = run.tasks[patch.node_id];
        if (task) pushUnique(task.review_ids, reviewId);
      }
      if (action === "complete") {
        review.status = cleanString(args.status) || "reviewed";
        review.falsification_attempts = arrayOfStrings(args.falsification_attempts);
        review.findings = arrayOfObjects(args.findings);
        review.waived_risks = arrayOfStrings(args.waived_risks);
        review.completed_at = now;
        patch.status =
          review.status === "passed" || review.status === "accepted"
            ? "review_passed"
            : "review_attention";
      }
      review.updated_at = now;
      run.updated_at = now;
      appendEvent(run, action === "complete" ? "review_completed" : "review_opened", {
        review_id: reviewId,
        patch_id: patchId,
        reviewer,
        status: review.status,
      }, now);
      return { ok: true, review, patch };
    });
  }

  withState(mutator) {
    mkdirSync(this.stateDir, { recursive: true });
    return withDirectoryLock(this.lockDir, this.lockTimeoutMs, this.lockStaleMs, () => {
      const state = readState(this.statePath);
      const result = mutator(state);
      writeState(this.statePath, state);
      return result;
    });
  }

  nowMs() {
    return Number(this.clock.now());
  }

  isoNow() {
    return isoFromMs(this.nowMs());
  }
}

function readState(path) {
  if (!existsSync(path)) {
    return {
      version: STATE_VERSION,
      runs: {},
    };
  }
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (parsed.version !== STATE_VERSION || !parsed.runs) {
    throw new Error(`unsupported multihead state version at ${path}`);
  }
  return parsed;
}

function writeState(path, state) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(tmp, path);
}

function withDirectoryLock(lockDir, timeoutMs, staleMs, fn) {
  const start = Date.now();
  for (;;) {
    try {
      mkdirSync(lockDir, { recursive: false });
      try {
        return fn();
      } finally {
        rmSync(lockDir, { recursive: true, force: true });
      }
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (isStaleLock(lockDir, staleMs)) {
        rmSync(lockDir, { recursive: true, force: true });
        continue;
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`multihead state lock timed out: ${lockDir}`);
      }
      sleepSync(25);
    }
  }
}

function isStaleLock(lockDir, staleMs) {
  try {
    return Date.now() - statSync(lockDir).mtimeMs > staleMs;
  } catch {
    return true;
  }
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function ensureRun(state, runId, defaults) {
  if (!state.runs[runId]) {
    state.runs[runId] = {
      run_id: runId,
      goal: defaults.goal,
      actor: defaults.actor,
      created_at: defaults.created_at,
      updated_at: defaults.created_at,
      tasks: {},
      claims: {},
      patches: {},
      receipts: {},
      reviews: {},
      events: [],
    };
  }
  return state.runs[runId];
}

function requireRun(state, runId) {
  const run = state.runs[runId];
  if (!run) throw new Error(`run not found: ${runId}`);
  return run;
}

function requireTask(run, nodeId) {
  const task = run.tasks[nodeId];
  if (!task) throw new Error(`task not found: ${nodeId}`);
  return task;
}

function requirePatch(run, patchId) {
  const patch = run.patches[patchId];
  if (!patch) throw new Error(`patch not found: ${patchId}`);
  return patch;
}

function requireActiveClaim(run, task, owner, epoch, nowMs) {
  const claim = task.active_claim_id ? run.claims[task.active_claim_id] : null;
  if (!claim || !isClaimActive(claim, nowMs)) {
    throw new Error(`task ${task.node_id} has no active claim`);
  }
  if (claim.owner !== owner || claim.epoch !== epoch) {
    throw new Error(
      `task ${task.node_id} active claim is ${claim.owner}@${claim.epoch}, not ${owner}@${epoch}`,
    );
  }
  return claim;
}

function refreshExpiredClaims(run, nowMs, now) {
  for (const task of Object.values(run.tasks)) {
    const claim = task.active_claim_id ? run.claims[task.active_claim_id] : null;
    if (!claim || claim.status !== "active") continue;
    if (isClaimActive(claim, nowMs)) continue;
    claim.status = "expired";
    claim.expired_at = now;
    task.active_claim_id = null;
    task.status = task.patch_ids.length ? "patch_proposed" : "open";
    task.updated_at = now;
    appendEvent(run, "claim_expired", {
      claim_id: claim.claim_id,
      node_id: task.node_id,
      owner: claim.owner,
      epoch: claim.epoch,
    }, now);
  }
}

function isClaimActive(claim, nowMs) {
  return claim.status === "active" && Date.parse(claim.expires_at) > nowMs;
}

function appendEvent(run, event_type, payload, createdAt) {
  run.events.push({
    seq: run.events.length + 1,
    event_type,
    created_at: createdAt,
    payload,
  });
}

function required(args, key) {
  const value = cleanString(args?.[key]);
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function requiredNumber(args, key) {
  const value = Number(args?.[key]);
  if (!Number.isFinite(value)) throw new Error(`${key} is required`);
  return value;
}

function leaseTtl(value) {
  return boundedNumber(value, 1, 24 * 60 * 60, DEFAULT_LEASE_TTL_SECONDS);
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOfStrings(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function arrayOfObjects(value) {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
    : [];
}

function pushUnique(target, value) {
  if (!target.includes(value)) target.push(value);
}

function idFor(prefix, parts) {
  return `${prefix}_${createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 24)}`;
}

function hashText(text) {
  return createHash("sha256").update(String(text || "")).digest("hex");
}

function truncate(text) {
  const string = String(text || "");
  if (string.length <= OUTPUT_LIMIT) return string;
  return `${string.slice(0, OUTPUT_LIMIT)}\n...[truncated ${string.length - OUTPUT_LIMIT} chars]`;
}

function isoFromMs(ms) {
  return new Date(ms).toISOString();
}
