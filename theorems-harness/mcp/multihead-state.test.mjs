import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMultiheadStore } from "./multihead-state.mjs";

const root = mkdtempSync(join(tmpdir(), "theorem-multihead-"));
let now = Date.UTC(2026, 5, 7, 12, 0, 0);
const store = createMultiheadStore({
  projectDir: root,
  stateDir: join(root, ".theorem", "multihead"),
  clock: { now: () => now },
});

try {
  const run = store.startRun({
    run_id: "run-spike",
    goal: "prove multi-head substrate v0.1",
    actor: "codex",
  });
  assert.equal(run.run.run_id, "run-spike");

  const task = store.createTask({
    run_id: "run-spike",
    node_id: "task-contract",
    goal: "Add claim lease and receipt base binding",
    kind: "implementation",
  });
  assert.equal(task.task.status, "open");

  const claim1 = store.claimTask({
    run_id: "run-spike",
    node_id: "task-contract",
    owner: "codex",
    lease_ttl_seconds: 2,
  });
  assert.equal(claim1.claim.epoch, 1);
  assert.equal(claim1.task.status, "claimed");

  assert.throws(
    () =>
      store.claimTask({
        run_id: "run-spike",
        node_id: "task-contract",
        owner: "claude-code",
      }),
    /already claimed by codex/,
  );

  now += 3_000;
  const claim2 = store.claimTask({
    run_id: "run-spike",
    node_id: "task-contract",
    owner: "claude-code",
    lease_ttl_seconds: 30,
  });
  assert.equal(claim2.claim.epoch, 2);

  assert.throws(
    () =>
      store.proposePatch({
        run_id: "run-spike",
        node_id: "task-contract",
        owner: "codex",
        epoch: 1,
        base_commit: "base-a",
        patch: "diff --git a/x b/x\n",
      }),
    /not codex@1/,
  );

  const patch = store.proposePatch({
    run_id: "run-spike",
    node_id: "task-contract",
    owner: "claude-code",
    epoch: 2,
    base_commit: "base-a",
    files: ["mcp/multihead-state.mjs"],
    patch: "diff --git a/mcp/multihead-state.mjs b/mcp/multihead-state.mjs\n",
  });
  assert.equal(patch.patch.base_commit, "base-a");

  const proof1 = store.runProof({
    run_id: "run-spike",
    patch_id: patch.patch.patch_id,
    command: process.execPath,
    args: ["-e", "process.exit(0)"],
    timeout_ms: 10_000,
  });
  assert.equal(proof1.receipt.status, "passed");
  assert.equal(proof1.receipt.base_commit, "base-a");
  assert.equal(proof1.receipt.trust_tier, "substrate_rerun");

  const rebased = store.rebasePatch({
    run_id: "run-spike",
    patch_id: patch.patch.patch_id,
    new_base_commit: "base-b",
  });
  assert.equal(rebased.invalidated_receipts.length, 1);
  assert.equal(rebased.patch.base_commit, "base-b");

  const afterRebase = store.readRun({ run_id: "run-spike" });
  const staleReceipt =
    afterRebase.run.receipts[rebased.invalidated_receipts[0]];
  assert.equal(staleReceipt.status, "stale");
  assert.equal(staleReceipt.stale_reason, "patch_rebased");

  const proof2 = store.runProof({
    run_id: "run-spike",
    patch_id: patch.patch.patch_id,
    command: process.execPath,
    args: ["-e", "process.exit(0)"],
  });
  assert.equal(proof2.receipt.status, "passed");
  assert.equal(proof2.receipt.base_commit, "base-b");

  const opened = store.reviewPatch({
    run_id: "run-spike",
    patch_id: patch.patch.patch_id,
    reviewer: "codex",
  });
  assert.equal(opened.review.status, "open");

  const reviewed = store.reviewPatch({
    run_id: "run-spike",
    patch_id: patch.patch.patch_id,
    reviewer: "codex",
    action: "complete",
    status: "changes_requested",
    falsification_attempts: [
      "Tried stale epoch patch",
      "Rebased patch and confirmed old receipt went stale",
    ],
    findings: [{ severity: "p2", message: "review node records defect path" }],
  });
  assert.equal(reviewed.review.status, "changes_requested");
  assert.equal(reviewed.review.falsification_attempts.length, 2);

  const finalRun = store.readRun({ run_id: "run-spike" }).run;
  assert.equal(Object.keys(finalRun.claims).length, 2);
  assert.equal(Object.keys(finalRun.receipts).length, 2);
  assert.ok(finalRun.events.some((event) => event.event_type === "claim_expired"));

  console.log("multihead-state tests passed");
} finally {
  rmSync(root, { recursive: true, force: true });
}
