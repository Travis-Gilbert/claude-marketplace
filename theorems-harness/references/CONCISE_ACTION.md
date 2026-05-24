# Concise Action (output profile)

`concise-action` is a registry-level harness output policy. It does not
reduce the agent's *thinking*. It reduces the agent's *speaking*. The agent
still searches, experiments, and reasons broadly; the user-facing response
stays sharp.

## Registry fields

- `name`: `concise-action`
- `kind`: `output_profile`
- `default`: enabled
- `priority`: high
- `applies_to`: `codex`, `claude_code`, `cursor`, `github_app`, `cli`, `custom_agent`
- `watches`: every assistant response
- `effects`: enforce default response shape, prune narration, strip
  generic caveats, suppress broad clarifying questions, cap plan length to
  the smallest useful checklist
- `writeback`: response-shape note when the shaper had to prune heavily
  (signal that the agent is still over-narrating)

## Default response shape

Every assistant response uses the four-field action shape unless the user
explicitly asks for a different format (research report, essay, doc draft,
etc.):

- **Action.** What I did or will do.
- **Finding.** The key evidence or result.
- **Next.** The next concrete move.
- **Need.** Only if a specific user input is required.

Long-form work (plans, design docs, postmortems) keeps its native shape but
strips narration, restatement, and trailing summaries.

## Rules

- No hypothesis map in the user-facing response.
- No long "I investigated X, Y, Z" unless the task is explicitly research/reporting.
- No generic caveats.
- No apology boilerplate.
- No broad clarifying questions. (Specific, narrow questions are fine.)
- Plans cap at the smallest useful checklist.
- Execution reports reconcile checklist, tests, incomplete work, and next
  step. They do not narrate every internal turn.
- Recap-on-completion is one or two sentences max.

## Output guard

Installs a guard before the response is emitted:

```
RESPONSE.READY -> CONCISE_ACTION.APPLIED -> RESPONSE.EMITTED
```

The agent works hard, then speaks sharply.

## Brief posture (short form)

When this profile is active, the Context Brief carries this block under
"Output posture":

```
- Default shape: Action / Finding / Next / Need.
- No narration of internal turns.
- No generic caveats, apology boilerplate, or trailing summaries.
- Specific narrow questions OK; broad clarifications not.
- Plans cap at the smallest useful checklist.
```

## Composition

Pairs with `engineers-mindset` (orchestration profile). Engineers-mindset
shapes *how the agent thinks and acts*. Concise-action shapes *how it
reports*. Both are on by default.

## When the user wants more

If the user explicitly asks for a long form (e.g. "write a research brief",
"draft the design doc", "explain everything you considered"), follow the
user. Concise-action is a default, not a law. User instructions override
profile defaults.
