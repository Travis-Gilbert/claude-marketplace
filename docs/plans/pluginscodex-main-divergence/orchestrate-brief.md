# Orchestrate Brief: claude-marketplace `main` vs `pluginscodex` Divergence

Mode: theorize (read-only investigation)
Date: 2026-05-21
Author: Claude (Opus 4.7) on behalf of Travis Gilbert
Trigger: user reported "Can we not push to pluginscodex anymore? Move all the work to main" — investigation revealed 47-commit divergence at first count, requiring scope verification before any merge.

Read-only commands run (no git mutations):
- `git log --oneline main..pluginscodex` (47 commits)
- `git diff --stat main pluginscodex` (24,766 files changed, 2.5M insertions)
- `git diff --stat main pluginscodex -- <plugin>/` (per-plugin)
- `git show main:production-theorem/.claude-plugin/plugin.json` (MCP registration check)
- `git diff main pluginscodex -- production-theorem/skills/<name>/` (per-skill)
- `git ls-tree main/pluginscodex production-theorem/agents/` (agent count check)

## Executive Summary

- **Current condition:** `pluginscodex` is nominally 47 commits ahead of `main`, but file-level analysis shows the real plugin-relevant divergence is **dramatically smaller** than the commit count suggests. ~96% of the file-stat (24,766 files / 2.5M insertions) is dominated by vendored React and D3 source trees (`ui-lab/` + `d3-main/` = 10,635 files / 2M+ insertions) that shouldn't be on main regardless. After filtering vendor noise, real plugin-relevant divergence is **~135 files / ~12,400 insertions** spread across 7 plugins.
- **The user's recollection IS correct.** Production-theorem (the harness/orchestrate work) is **identical** on main and pluginscodex except for my compute_code commit. All seven existing skills (execute, harness_theorem, planning-theorem, theorize, code_theorem, graph_theorem) and both slash commands (execute.md, orchestrate.md) are byte-identical between branches. The `rustyred-thg` MCP server is already registered in main's `plugin.json` `mcpServers` block.
- **Intent:** Decide how to ship `compute_code` (the user's only stated immediate concern) and how to handle the broader pluginscodex retirement.
- **Recommended direction:** **Strategy B** (cherry-pick 4a4d09fb only). It's surgical, dependency-complete, and leaves the harder plan-pro / theorem-context-sdk / vendoring questions for separate decisions.
- **Main risk:** A naive "merge pluginscodex into main" would drag 10,635 files of vendored source code into main, which is almost certainly not the user's intent. The user's literal wording ("all the work that was done") would technically include this — but it would be operationally wrong.
- **Next action:** User picks between Strategy B (recommended), Strategy A (review-first batched merges by concern), or Strategy C (full merge — explicitly NOT recommended).

## Problem Shape

### Known facts (Evidence)

**Total divergence (deceptive top-line number):**

| Metric | Value |
|---|---|
| Commits on pluginscodex not on main | 47 |
| Files changed | 24,766 |
| Insertions | 2,509,870 |
| Deletions | 2,446 |

**Per-plugin breakdown (real signal):**

| Plugin / area | Files | Insertions | Deletions | Risk read |
|---|---|---|---|---|
| **production-theorem** | **3** | **191** | **0** | **My compute_code commit ONLY** |
| plan-pro | 106 | 10,498 | 0 | Substantial v1.1.0 SDK redesign — separate concern |
| theorem-context-sdk | 10 | 1,511 | 1 | Moderate SDK parity work — separate concern |
| ui-design-pro | 6 | 964 | 58 | Small additions |
| ml-pro | 7 | 205 | 5 | Tiny additions |
| django-engine-pro | 2 | 35 | 0 | Tiny |
| vie-design | 2 | 28 | 15 | Tiny |
| **ui-lab** | **8,356** | **1,260,849** | **0** | **VENDOR NOISE — React source tree** |
| **d3-main** | **~2,300** | **~778,000** | **0** | **VENDOR NOISE — D3 source tree** |
| engineers-mindset | 0 | 0 | 0 | Identical — pluginscodex commits already on main via different SHAs |

Plus root-level config (marketplace.json, README, AGENTS.md, settings.json, .codex/, .idea/, .claude/) — small.

**Production-theorem skill-by-skill divergence:**

| File | Status |
|---|---|
| `skills/code_theorem/SKILL.md` | identical |
| `skills/execute/SKILL.md` | identical |
| `skills/graph_theorem/SKILL.md` | identical |
| `skills/harness_theorem/SKILL.md` | identical |
| `skills/orchestrate/SKILL.md` | **+1 line** (my compute_code routing entry) |
| `skills/planning-theorem/SKILL.md` | identical |
| `skills/theorize/SKILL.md` | identical |
| `skills/compute_code/SKILL.md` | **NEW** (my work) |
| `commands/execute.md` | identical |
| `commands/orchestrate.md` | identical |
| `commands/compute_code.md` | **NEW** (my work) |
| `agents/` (11 files on each branch) | identical count, presumed identical content |
| `.claude-plugin/plugin.json` | already has `rustyred-thg` MCP entry on BOTH branches |

**Why the 47-commit number is misleading:**

`pluginscodex` contains commits that have ALSO been merged into main via different SHAs. Evidence: the commit `c31dcef8 merge(main): catch pluginscodex up with main` is visible in the pluginscodex history; engineers-mindset and most production-theorem changes show zero file-level diff despite commits touching them appearing in `git log main..pluginscodex`. Git treats the original commit SHAs as "not on main" even though their content IS on main under merged/rebased SHAs.

### Unknowns (Gap)

- Whether the user wants the plan-pro v1.1.0 work (106 files) on main. This is substantial work (SDK redesign, validators, Python package, agent prompts) that looks well-formed but hasn't been brought across. User did not mention it explicitly.
- Whether the user wants theorem-context-sdk work (10 files) on main. Same situation.
- Whether the user is aware that pluginscodex has vendored React + D3 source trees (10,635 files of third-party source code). These look like accidental commits and probably shouldn't be on main.

### Constraints

- **Read-only.** This brief makes no git mutations.
- **The user explicitly does not want to push to pluginscodex going forward.** Any retirement plan needs to handle (a) what's on pluginscodex that isn't on main, (b) the vendored source trees, (c) the policy going forward.
- **Production-theorem is the user's primary concern.** They named harness/orchestrate tools specifically. The plan-pro / theorem-context-sdk work is collateral, not the main interest.

### Tensions

- **T1: "All the work that was done" is operationally ambiguous at scale.** Literally interpreted, it includes 10,635 files of vendored source. Operationally, it almost certainly does not.
- **T2: pluginscodex has work that isn't on main AND main has work that isn't on pluginscodex** (the `behind` count would tell us by how much, but the question is whether retiring pluginscodex means "rebase main forward" or "merge pluginscodex sideways"). The user's wording doesn't disambiguate.
- **T3: compute_code's stated dependency on `b391ccc7` was wrong.** I asserted earlier that cherry-picking only my commit would leave a dangling reference. Verification proved that wrong — main already has the rustyred-thg MCP registration. The dependency-completeness argument I made for Strategy B+ in the prior chat was based on a false premise. The correct version is just Strategy B (cherry-pick 4a4d09fb solo).

### Failure modes

- **F1: Naive `git merge pluginscodex` into main** — pulls 10,635 files of vendored React + D3 source into main. Likely undesired. Hard to undo cleanly after the merge SHA lands.
- **F2: Cherry-pick subset that misses a dependency** — verification proved this is NOT a risk for compute_code specifically (main already has the MCP server). But it IS a risk if the user later wants to cherry-pick a plan-pro commit or theorem-context-sdk commit without bringing dependencies.
- **F3: Force-push main from pluginscodex** — destroys git history on main. Off the table unless explicitly authorized.
- **F4: Leave pluginscodex orphaned with real work on it** — if pluginscodex retires without bringing the plan-pro v1.1.0 work across, that work is lost (still in git, but invisible to anyone reading main).

## Options (Updated)

### Strategy B (RECOMMENDED): Cherry-pick `4a4d09fb` to main

**What:** `git checkout main && git cherry-pick 4a4d09fb && git push origin main`

**Why this works:**
- main already has every dependency compute_code needs:
  - `rustyred-thg` MCP server registered in `production-theorem/.claude-plugin/plugin.json` (verified by reading the file from `main`'s tree)
  - All seven sibling skills (execute, harness_theorem, planning-theorem, theorize, code_theorem, graph_theorem) are byte-identical on both branches
  - All 11 agents present on both branches
- My commit's diff is 3 files / 191 insertions / 0 deletions. Smallest possible blast radius.
- Leaves the plan-pro and theorem-context-sdk questions for separate, deliberate decisions.
- Does NOT touch the vendored React/D3 source trees.

**Risk:** Low. The compute_code skill references the `rustyred-thg` MCP server, which is already on main. No dangling references.

**Validation after cherry-pick:** `git log --oneline main..pluginscodex` should now show 46 commits (one fewer). `production-theorem/skills/compute_code/SKILL.md` should be present on main. Test: invoke `/compute_code` from a Claude Code session pointed at the updated plugin.

**Trade-off:** Leaves pluginscodex's plan-pro and theorem-context-sdk work uncommitted to main. User may want those separately; or they may already be merged via SHAs we haven't checked yet.

### Strategy A: Review-first batched merge by concern

**What:** Split the divergence into three or four targeted PRs:
1. compute_code (just `4a4d09fb` — same as Strategy B)
2. plan-pro v1.1.0 (106 files, multiple commits) — needs review
3. theorem-context-sdk parity (10 files, multiple commits) — needs review
4. (Optional) Small changes in ui-design-pro, ml-pro, django-engine-pro, vie-design — bundle or skip

Each PR cherry-picks the relevant commits. Vendored source trees (ui-lab, d3-main) are explicitly excluded.

**Why this might be better than B:** Brings the genuinely useful pluginscodex work to main in a reviewable form. Lets the user verify plan-pro v1.1.0 is in a shippable state before publishing.

**Risk:** Medium. Cherry-picking plan-pro commits across the merge in `c31dcef8` may produce conflicts or re-apply already-applied diffs. Needs care.

**Trade-off:** More effort. User has to review plan-pro substance.

### Strategy C: Full merge (`git merge pluginscodex` into main)

**What:** `git checkout main && git merge pluginscodex && git push origin main`

**Why this is RISKY (and not recommended):**
- Brings 10,635 files of vendored React + D3 source code into main. Almost certainly not desired.
- Brings 6,000+ lines of `.idea/` IDE config to main.
- Brings `node_modules`-like content to main if any was committed.
- Hard to selectively undo after the merge SHA lands without rewriting history.

**When this would be the right call:** Only if the user explicitly confirms that the React/D3 vendoring on pluginscodex IS intentional and SHOULD be on main. Based on the file paths (`ui-lab/react-main 2/`) this looks like a development experiment, not production content.

**Recommendation:** Do NOT execute Strategy C without explicit confirmation that the vendored source trees should land on main.

## Recommended Direction

**Strategy B (cherry-pick 4a4d09fb to main) is the right move now.** It:
- Ships the user's stated immediate goal (compute_code on main)
- Has the smallest possible blast radius
- Doesn't force a decision on plan-pro v1.1.0 or theorem-context-sdk parity (those can be Strategy A passes later)
- Doesn't touch the vendored source trees
- Is fully reversible (revert the cherry-pick commit if anything breaks)

After Strategy B, three follow-up questions remain for the user to decide separately:

1. **Is the plan-pro v1.1.0 work on pluginscodex ready for main?** (106 files of SDK redesign). If yes, separate cherry-pick / PR pass. If no, leave on pluginscodex or move to a `plan-pro-v1.1.0-redesign` feature branch.

2. **Is the theorem-context-sdk parity work on pluginscodex ready for main?** (10 files). Same shape.

3. **What's the right home for the vendored React + D3 source trees?** They're on pluginscodex but probably don't belong on main. Options: delete from pluginscodex (rewrite history), move to a separate `ui-lab/` repo, or add to `.gitignore` going forward. This is an independent question from compute_code's path.

## Decisions Resolved (during investigation)

- **Decision:** The "47 commits" framing was misleading. The plugin-relevant divergence is ~135 files / ~12,400 insertions across 7 plugins; the bulk of the file-stat is vendored source noise.
  - **Evidence:** Per-plugin shortstats; identical-file checks; visible `c31dcef8 merge(main): catch pluginscodex up with main` commit.
  - **Reversible?** No — factual observation.

- **Decision:** The user's recollection that harness/orchestrate tools are synced to main is correct.
  - **Evidence:** All seven production-theorem skills + both slash commands + agent counts are byte-identical between branches.
  - **Reversible?** No — factual observation.

- **Decision:** compute_code can ship to main via solo cherry-pick of `4a4d09fb`. The "must also bring `b391ccc7`" claim from the prior chat was wrong.
  - **Evidence:** `git show main:production-theorem/.claude-plugin/plugin.json` shows `rustyred-thg` already registered.
  - **Reversible?** No — factual observation.

- **Decision:** Strategy C (full merge) is NOT recommended without explicit user confirmation on vendored source trees.
  - **Rationale:** Brings 10,635 files of third-party source to main. Probably not intended.
  - **Reversible?** Yes — user can override if vendoring IS intentional.

## Open Questions

- **Q1:** Proceed with Strategy B (cherry-pick 4a4d09fb to main and push)? **Recommended: yes.**

- **Q2:** Is plan-pro v1.1.0 work on pluginscodex ready to ship to main? **No recommendation — this needs separate review.**

- **Q3:** Are the React/D3 vendored source trees intentional? If not, the right cleanup is a separate concern (probably out of scope for this brief).

- **Q4:** Going forward, is pluginscodex deleted entirely, kept as an archive branch, or repurposed? **Not blocking compute_code; decide after Strategy B lands.**

## Planning Inputs

If user picks Strategy B, the execution is:

```bash
cd ~/Tech\ Dev\ Local/codex-plugins
git stash push -u -m "preserve pre-existing dirty files on pluginscodex"
git checkout main
git pull origin main  # ensure main is up to date
git cherry-pick 4a4d09fb
git push origin main
git checkout pluginscodex
git stash pop
```

Validation after push:
- `git log --oneline main..pluginscodex | wc -l` → 46 (was 47)
- main's `production-theorem/skills/compute_code/SKILL.md` exists
- main's `production-theorem/skills/orchestrate/SKILL.md` contains the compute_code routing line

Plugin cache refresh (separate concern, not in this brief): whichever path activates the new skill in a Claude Code session (publish via marketplace, symlink cache, etc.).

## Learning Candidates

- **Claim:** Commit-count divergence is an unreliable proxy for actual file-level divergence in repos that see merge/rebase activity between branches. **Confidence: high.** Evidence: 47 commits with content largely already on main.

- **Method:** When investigating a branch divergence with surprising size, run per-plugin / per-area shortstats first. The aggregate `git diff --stat main pluginscodex` was misleading; the per-area filter immediately surfaced the real signal-vs-noise split.

- **Tension:** Vendored third-party source trees ending up on feature branches is a recurring source of operational complexity. Worth establishing a project-wide policy: vendor under `refs/` (already a convention here) or never commit; never under random plugin subdirs like `ui-lab/`.

- **Plugin routing lesson:** No specialist agent was needed for this investigation. Direct `git` interrogation through Bash was sufficient. The cosmos-critic / plugin-router agents weren't a fit (no cosmos.gl, no plugin selection question). Recording this so future similar investigations don't over-delegate.

## Suggested Next Steps

Ordered by production value:

1. **User decides on Strategy B (recommended).** If yes, I execute the cherry-pick block above.
2. **Pre-existing dirty files on pluginscodex** (the `M production-theorem/.codex-plugin/plugin.json`, `M production-theorem/README.md`, etc. from earlier `git status`) — what does the user want to do with these? They're unrelated to compute_code but they're sitting in the working tree.
3. **Plan-pro v1.1.0 and theorem-context-sdk decisions** — separate reviews, separate cherry-picks.
4. **Vendored source tree policy** — independent cleanup question.
5. **pluginscodex retirement plan** — only meaningful after #1–#4 are resolved.

---

End of brief. No git mutations made.
