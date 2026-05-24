# Orchestration Profiles

Profiles are **registry-level operating policies**, not skills and not slash
commands. A skill depends on the agent choosing to invoke it. A profile
changes the run policy before the agent is allowed to think.

Profiles sit *above* the six epistemic jobs (`ingest`, `structure`, `relate`,
`evaluate`, `revise`, `express`). Orchestrate routes those jobs; profiles
shape *how* Orchestrate is allowed to route them.

## Profile kinds

| Kind | Purpose | Example |
|---|---|---|
| `orchestration_profile` | Thinking and action policy (when to research, when to attempt, when to defer) | `engineers-mindset` |
| `output_profile` | Speaking policy (response shape, brevity, format) | `concise-action` |
| `selected_profile` | Domain posture chosen per task by the orchestrate backend | `developer-core`, `researcher-core` |

Orchestration and output profiles are baseline. They apply to every run
regardless of which selected profile the orchestrate backend picks. The
selected profile layers domain knowledge on top of the baseline.

## Registry fields

Every profile registered in this directory must declare:

- `name`: identifier used in routing decisions and brief synthesis
- `kind`: one of the three above
- `default`: enabled or disabled by default
- `priority`: high, normal, low (higher priority profiles cannot be silently overridden)
- `applies_to`: which agent hosts honor it (`codex`, `claude_code`, `cursor`, `github_app`, `cli`, `custom_agent`)
- `watches`: signals that activate or escalate the profile
- `effects`: what the profile imposes on the run
- `writeback`: what the profile contributes to the postmortem ledger

## State-machine integration

Profiles can install guards into the harness state machine. The current
guards owned by registered profiles:

| Guard | Owner profile | Blocks transition into |
|---|---|---|
| `DEFERRAL_GATE.CHECKED` | `engineers-mindset` | `ASK_USER`, `RUN.DEFERRED`, `RUN.FAILED`, `BLOCKED`, `NEEDS_CONTEXT`, `NEEDS_HUMAN_DECISION` |
| `CONCISE_ACTION.APPLIED` | `concise-action` | `RESPONSE.EMITTED` |

A guard is satisfied by an `ENGINEERING_PASS` record (for the deferral gate)
or by passing the response through the concise-action shaper (for the output
guard). The orchestrate backend writes these records; the plugin layer
surfaces them in the brief and in the postmortem.

## Registered profiles

| Name | Kind | Default | Priority | Spec |
|---|---|---|---|---|
| `engineers-mindset` | `orchestration_profile` | enabled | high | `ENGINEERS_MINDSET.md` |
| `concise-action` | `output_profile` | enabled | high | `CONCISE_ACTION.md` |

Profiles selected per task by the backend (e.g., `developer-core`) are not
listed here. They are not registry-static; they are server-side decisions
based on task signature.

## Brief integration

`scripts/prepare-context.sh` appends the active baseline profiles' posture
block to the Theorem Context Brief alongside the server-selected profile.
The block is short on purpose: it carries the deferral rules and the output
shape, not a long essay. Profile spec files in this directory are the long
form; the brief is the short form.

## Adding a new profile

1. Write the spec file: `references/<UPPER_SNAKE_NAME>.md`. Cover the
   registry fields above plus the activation conditions and the effects in
   plain language.
2. Add a row to the `Registered profiles` table in this file.
3. Add a row to the `Profiles` table in `PLUGIN_INVENTORY.md`.
4. Add the default activation entry to `SETTINGS.md`.
5. If the profile installs a state-machine guard, add it to the guard table
   in this file and to the routing notes in `ROUTING.md`.
6. If the profile contributes a posture block to the brief, extend
   `scripts/prepare-context.sh` to append it. Keep the block under 12 lines.

## Guardrail

Profiles override default agent behavior. They do not override user
instructions in `AGENTS.md`, `CLAUDE.md`, or direct user messages. If the
user explicitly asks for a behavior that conflicts with a profile, follow
the user. Profiles are defaults, not laws.
