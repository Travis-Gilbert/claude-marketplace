# Decision: the shared code CRDT buffer is out of scope

Status: settled. This note exists so a future session finds the reasoning rather
than re-deriving it. A shared code buffer (a Y.Text-per-file CRDT that both heads
mount as their working files and sync character by character) is permanently out
of scope, absent a concrete new reason.

## What is out of scope

A character-level shared buffer for source files: heads editing the same bytes
through a CRDT (Yjs / Y.Text), with a buffer-to-disk reconciliation layer beneath
the editor. This is distinct from the native Graph CRDT in
`rustyred-thg-core/src/crdt/` (HLC clocks, version vectors, add-only merge,
confidence-weighted edges), which stays: graph state has a real merge, source text
does not.

## Why (two independent lines of evidence)

1. The CodeCRDT study (arXiv:2510.18893, Oct 2025, Claude Sonnet 4.5, 600 trials)
   ran multi-agent code generation over a Yjs CRDT and measured a semantic-conflict
   rate of roughly 5 to 10 percent overall, rising to 80 percent on complex tasks,
   with code quality down 7.7 percent and code volume up 82 to 189 percent. The
   buffer merges the text cleanly and the program still disagrees with itself.

2. The 2026 agent-tooling ecosystem converged on git-worktree isolation (native in
   Claude Code, OpenAI Codex, and Cursor 2.0) and documents a shared working
   directory as a corruption source.

The structural reason underneath both: agents reason in whole files and complete
edits, not keystrokes. A character-level buffer adds a buffer-to-disk
reconciliation seam with no payoff, and a third-party head (Codex) cannot be made
to edit through our buffer in any case.

## What replaces it

Closeness and isolation are orthogonal. Closer collaboration does not mean shared
bytes; it means shared awareness over isolated execution. Heads run in isolated
execution (separate environments or worktrees, patch against a base). The fence
stays. What keeps the heads one unit across the fence is high-frequency announce
over the CRDT-backed room plus a continuous semantic-overlap guard over the code
graph: the guard catches the one failure that isolation and text merge both miss,
edits that merge cleanly and still disagree at runtime.

See `skills/harness-coordinate/SKILL.md` for the announce protocol and the
semantic-overlap guard.
