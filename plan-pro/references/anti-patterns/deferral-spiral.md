# Anti-Pattern: Deferral Spiral

The planner defers decisions to the implementer, who defers back to the user, who re-opens the question with the planner. Nothing ships.

## What it looks like

1. Plan says: "figure out the right approach for X"
2. Implementer reads the task: "the plan doesn't specify X. I'll ask."
3. User reads the question: "I thought we decided that. Let me re-read the plan."
4. Conversation re-spawns, re-researches, re-decides.
5. A second task later, same shape repeats.

## Costs

- Every deferral adds a round trip
- Context is rebuilt each time (planner's reasoning is lost)
- Decisions drift between re-opens
- User feels they're doing the plugin's job
- Momentum dies

## The plan-pro rule

**Deferring work to the user is a failure mode.** Work the user can do is work the plugin failed to complete.

## Common deferral shapes

### "You might want to also consider…"
If it's in scope, do it. If it's not, leave it out.

### "Up to you — either approach works"
Pick one. State it in one line. Continue.

### "Should I use X or Y?"
If the choice is reversible, pick. If not, this is the one case the clarifier agent allows a question.

### "Let me know if you want me to also…"
Either in scope or not. Don't fish for scope creep.

### "I'll leave this for you to decide"
Decisions deferred to "the user" are usually decisions the plugin could have made. Make them.

## What genuinely belongs to the user

- Business priorities (what ships first)
- Stakes the plugin can't infer (budget, user trust, political context)
- Irreversible technical choices with no codebase signal
- Product decisions that change user behavior

Everything else: the plugin decides. One line noting the decision, continue.

## The concision-enforcer check

Flag:
- "You might want to…"
- "Feel free to…"
- "I recommend you…"
- "You could also…"
- "It's up to you…"
- "Let me know if…"

Every one of these is a micro-deferral. Replace with a decision or a completed action.

## When to legitimately stop

- Blocker that requires external access (credentials, API keys, deploy permission)
- Irreversible choice affecting user data or business relationships
- Direct conflict between user instructions and CLAUDE.md

In those cases: name the blocker in one line, propose the fix in one line, stop. Do not pad with options the user didn't ask for.
