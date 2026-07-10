# On a shared PR branch, an autonomous agent may push between your commit and your push

**Kind:** method
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** git, coordination, multi-agent, copilot

## Trigger

Pushed a skill mirror to `Theorems-Harness` branch `claude/harness-activation-bridge`
(`de89dae`) and reported it landed. Minutes later a follow-up push (the `.mcp.json`
fix) was rejected non-fast-forward: a GitHub Copilot coding agent had pushed 5
commits onto the same branch ("resolve merge conflicts and apply copilot review
fixes"), and they touched `.mcp.json` — the exact file I had just changed.

## Rule

On a shared PR branch, assume an autonomous agent (Copilot workspace, a CI bot)
may push between your commit and your push. On a non-fast-forward rejection, do
NOT force-push. Instead: `git fetch`; verify YOUR earlier commits survived their
conflict resolution (`git cat-file -e origin/<branch>:<path>` for each); inspect
their version of the files you touched (`git show origin/<branch>:<file>`); then
rebase your commit on top of their HEAD and push. Read the room before you write.

## Evidence

- `de89dae` push ok; `.mcp.json` fix push rejected (non-ff)
- `origin/claude/harness-activation-bridge` had `2a5012f` + 4 automation commits
- All 6 mirrored skills confirmed present on remote before rebasing
- `git rebase origin/...` → clean; push `2a5012f..cb9ae09`

## Encoded in

- `docs/learnings/2026-07-10-autonomous-agent-shared-branch-race.md` (this file)
