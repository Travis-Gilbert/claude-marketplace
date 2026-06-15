# Coordination redesign: footprint over claim, co-edit over yield

## Why this is small, not a rewrite

The binding already is the unit you want. `agent_binding.rs` models one agent as
one identity (`BindingIdentity.owner_id`) composed of heads
(`BindingComposition { heads }`, with `claude-code` / `codex` / `claude-ai` as
`ReasoningCore` / `SkillPlugin` / `SpecializedCoder`), sharing one scratchpad they
append revisions to (`ScratchpadDocument.append(actor_head_id, parent_revision_id,
seq)`), one budget (`shared_budget_units`, `max_parallel_heads`), and one trace.
Safety gates on action tier (reversible / commit / irreversible), not on who
touches which file. The only "claim" in the file is an epistemic artifact type in
`PublishedScope`, unrelated to file territory.

The code says "one unit, several hands, one shared document they build on." The
skills lagged it: they still teach claim-your-files and yield-on-overlap. The
no-lanes pass was already done across the plugin. The residual frame is that the
atomic unit of coordination is still ownership of a file. Flipping that frame, and
cutting the handshake apparatus the coordinate skill disclaims while teaching, is
the whole job.

Two files are full rewrites (provided as drop-ins). Four files take word-level
patches (below). Everything else in the plugin is unrelated to coordination and is
left alone.

## Drop-in files (replace in place)

- `theorems-harness/AGENTS.md`
  (the `## Coordination cadence` section is what `inject-harness-directives.sh`
  injects at SessionStart, so this is the highest-leverage text in the plugin)
- `theorems-harness/skills/harness-coordinate/SKILL.md`
  (198 -> 143 lines; the cut is the exhaustive tool table, worktree-targeting, and
  "real time" apparatus, not the load-bearing beats)

## Patch 1 of 4: scripts/inject-harness-directives.sh

The injector reads cadence from AGENTS.md normally, but has a hardcoded fallback
that still teaches the old frame. Without this patch the old language bleeds back
in whenever the AGENTS.md read returns empty.

Find the fallback block (the `if [ -z "$cadence_frame" ]; then` branch) and
replace its `cadence_frame='...'` body.

OLD:
```
- Begin: write your intent with the files you are claiming now.
- During: broadcast forks as tensions and keep working; never freeze a lane.
- Questions: substrate first (recall, room decisions); else record an ask with a named default and continue on non-blocked work.
- Blocked: do not wait on a peer; take other ready work or re-read the room.
```

NEW:
```
- Turn-start: read the room (intents, reflections, open tensions) and drain your mentions before planning.
- Begin: write your intent, what you are doing now and which files your hands are on. It is a footprint others build on, not a fence.
- During: when your work meets a footprint from another head, read its edit and build on it; do not yield or wait. Surface a real disagreement as a tension and keep working.
- Questions: substrate first (recall, room decisions); else record an ask with a named default and continue on non-blocked work.
- Blocked: take other ready work or re-read the room; do not idle on a peer.
```

(Keep the existing `Turn-end` and `Wake` lines. The first OLD line above replaces
the existing fallback `Turn-start` line as well; the simplest path is to replace
the whole fallback cadence body with the cadence from the new AGENTS.md so the
fallback and the live text are identical.)

## Patch 2 of 4: skills/theorems-harness/SKILL.md (the /harness spine)

Three edits. The rest of the spine (palette, routing, workflow, tools) is fine.

### 2a. The `coordination_intent` row in "Tools Owned"

OLD:
```
| `coordination_intent` | Write the live file/subsystem claim peers read at SessionStart. |
```
NEW:
```
| `coordination_intent` | Write your live footprint (what you are doing, which files your hands are on) for peers to build on at SessionStart. |
```

### 2b. The entire "## Coordination Rule" body

OLD:
```
For multi-agent work, coordination is a lightweight safety layer:

- Heartbeat presence.
- Join or inspect the durable coordination room when a shared task has more than
  a one-off packet.
- Read the SessionStart digest and write `coordination_intent` for the immediate
  files or subsystem before overlapping edits.
- Subscribe to the shared repo/task channel and consume pending interrupts.
- Send `coordinate` messages with stable `@actor` mentions only for interrupts,
  review requests, or asks that affect the next immediate action.
- Write `coordination_reflection`, `coordination_decision`, or
  `coordination_tension` when the next agent should inherit working memory,
  rationale, or a visible disagreement.
- Wait briefly only when a response is useful now.
- Prefer shared goals and file-level claims over rigid global lane ownership.

The durable model is room digest plus interrupt mailbox: membership, intents,
reflections, decisions, tensions, events, continuity packs, and pending mentions
survive agent sleep; short-TTL presence only says who is fresh.
```
NEW:
```
The heads are one agent with several hands (`codex`, `claude-code`, `claude-ai`),
not separate workers dividing the repo. Coordinate as a unit:

- Read the room (intents, reflections, open tensions) and drain mentions at
  turn-start, before planning edits.
- Write `coordination_intent` as your footprint: what you are doing now and which
  files your hands are on, for peers to build on. It is not a lock.
- When your work meets another head's footprint, build on its edit rather than
  yielding or waiting; held, not clobbered. A real disagreement is a
  `coordination_tension` you record and work around, not a silent overwrite.
- Send `coordinate` with an `@actor` only for a block or a fork that changes the
  next action. Ordinary progress goes in your footprint summary.
- Close your footprint at turn-end and write a `coordination_reflection` (and a
  `coordination_decision` for any architectural choice) so the next head resumes
  cold.

The durable model is room digest plus interrupt mailbox: membership, intents,
reflections, decisions, tensions, events, continuity packs, and pending mentions
survive head sleep; short-TTL presence only says who is fresh. Full protocol:
`skills/harness-coordinate/SKILL.md`.
```

### 2c. The "## Anti-Patterns" line about lanes

OLD:
```
- Using strict file lanes or message handshakes where shared intent records, file-level claims, and peer review would be safer and faster.
```
NEW:
```
- Treating files as territory to claim and yield instead of footprints to build on; using message handshakes where reading the room and co-editing on overlap would be faster.
```

## Patch 3 of 4: skills/execute/SKILL.md

Two edits.

### 3a. "## Completion Rule" bullet

OLD:
```
- If another agent owns the next step, name the handoff and send the mention.
```
NEW:
```
- If the next step belongs to another head, leave the handoff in your footprint and mention it.
```

### 3b. The report template "Remaining Work" line

OLD:
```
- Owner/next step:
```
NEW:
```
- Next step:
```

## Patch 4 of 4: skills/peer-review/SKILL.md

Three edits. The review protocol itself stays; it is orthogonal and good.

### 4a. Opening paragraph

OLD:
```
It is strongest after loose coordination, where both agents had a shared goal and negotiated file ownership through `coordinate` messages.
```
NEW:
```
It is strongest after the heads worked as a unit on a shared goal, co-editing rather than dividing the files.
```

### 4b. "## Automatic Trigger" bullet

OLD:
```
- The diff includes files another active agent claimed, reviewed, or generated.
```
NEW:
```
- The diff includes files another active head touched, reviewed, or generated.
```

### 4c. The "## Loose Coordination Rule" section (retitle and rewrite)

OLD:
```
## Loose Coordination Rule

Do not pre-assign strict file lanes unless the repo or human explicitly needs
that safety. The preferred pattern is:

1. Shared goal.
2. Room digest plus inbox check.
3. Claim only the immediate files you are about to touch with
   `coordination_intent`.
4. Review each other's diff before commit.

Strict lanes and message handshakes can prevent useful negotiation. Intent
records plus peer review make loose coordination safe enough to move quickly.
```
NEW:
```
## Coordination posture

The heads work as one unit, not as workers dividing files. The pattern:

1. Shared goal.
2. Room digest plus mention drain at turn-start.
3. Footprint your current files with `coordination_intent`, and build on a peer's
   footprint where it overlaps yours.
4. Review each other's diff before commit.

Reading the room plus co-editing plus peer review makes fast multi-head work
safe. Pre-assigning territory or handshaking before edits only slows it down.
```

## Verify the old frame is gone

After applying, the only surviving "claim" in the coordination surface should be
the tool field name `claimed_files` and epistemic claims. This should return
nothing meaningful:

```
grep -rniE "\byield\b|file lane|files you (are )?claim|negotiat(e|ed) (file )?ownership|owns the next" \
  theorems-harness/AGENTS.md \
  theorems-harness/skills/harness-coordinate/SKILL.md \
  theorems-harness/skills/theorems-harness/SKILL.md \
  theorems-harness/skills/execute/SKILL.md \
  theorems-harness/skills/peer-review/SKILL.md \
  theorems-harness/scripts/inject-harness-directives.sh
```

## One optional deeper change

The MCP tool parameter is literally `claimed_files`, so the word "claim" still
lives at the schema level and re-teaches the old frame every time a head reads the
tool signature. These plugin edits reframe its meaning in prose ("files my hands
are on"), which is as far as a skills change can go. Renaming the field to
`touched_files` or `footprint` in the harness server (`coordination_intent`
handler, plus the SessionStart digest that prints it) would finish the rename at
the source. That is a server edit outside this plugin, so it is flagged here rather
than done.
