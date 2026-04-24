# Double Diamond

Source: [Design Council Double Diamond framework](https://www.designcouncil.org.uk/our-resources/the-double-diamond/).

Two diamonds. Each diamond is divergent → convergent.

## First diamond: problem

- **Discover** (divergent): what's actually going on? Research, interviews, observation, codebase audit.
- **Define** (convergent): state the problem in one sentence. Who, pain, definition-of-solved, out-of-scope.

## Second diamond: solution

- **Develop** (divergent): generate 5-8 approaches. Include contrarian options.
- **Deliver** (convergent): filter to 2-3, pick one, write design-doc.md.

## plan-pro mapping

| Diamond phase | plan-pro step |
|---|---|
| Discover | `/research` → researcher agent → `research-brief.md` |
| Define | problem-framer agent (if intent is ambiguous) → `problem-statement.md` |
| Develop | divergent-thinker agent → 5-8 approaches |
| Deliver | divergent-thinker filters to 2-3, clarifier picks (rare) → `design-doc.md` |

## The key insight

Teams usually skip "Discover" and "Define" and jump to "Develop". They build the first reasonable solution to a poorly-understood problem.

plan-pro's divergent-thinker is explicitly one response: **generate then filter**. No pause for user approval between them. This keeps the user from fixating on the first idea they see.

## When to skip "Define"

If the user arrives with a specific feature request ("add dark mode to settings"), the problem is defined. Skip problem-framer, skip to Develop.

If the user arrives with a vision ("I want something like X but for Y"), the problem is not defined. Run problem-framer first.

## Anti-pattern

"Presenting options" that are actually one option dressed up three ways. If the three options share the same strategy, you're not diverging — you're polishing. Broaden before picking.
