# A local commit + marketplace symlink is not "live" — push to the serving remote

**Kind:** postmortem
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** plugins, git, deployment, claude-code

## Trigger

Edited the `theorems-harness` plugin's skills, committed to the local
`~/Tech Dev Local/codex-plugins` clone, ran `sync-plugins.sh` (which symlinks
`~/.claude/plugins/marketplaces/local-desktop-app-uploads/theorems-harness` to
that local checkout), and reported the work "live" — across two turns. It was
not. The commits sat `ahead 3` of `origin/main` and were never pushed, so the
GitHub repos that actually serve the plugins (`claude-marketplace`, and later
the `Theorems-Harness` product repo) had none of it. The user had to correct
it: "None of the commits went to either of the repos that serve plugins."

## Rule

After committing plugin/skill changes, `git push` to the serving repo's remote
and verify by reading a changed file back from the remote (GitHub
`get_file_content` / API). A symlink from a marketplace clone into your local
checkout makes edits look live on your machine but propagates to no other
surface — not another machine, not the desktop app's channel, not a fresh
clone.

## Evidence

- `git status -sb` → `## main...origin/main [ahead 3]` before the push
- Fix: `git push origin main` → `3a08320e..7d932c56`
- Verified: GitHub `get_file_content` on `claude-marketplace:theorems-harness/skills/planning-theorem/SKILL.md` → SHA `79c3ffe1`

## Encoded in

- `docs/learnings/2026-07-10-committed-not-pushed-to-serving-repo.md` (this file)
