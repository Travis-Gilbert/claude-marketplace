# KISS / DRY / YAGNI

Three old rules. Still relevant. plan-pro's quality-reviewer checks for violations of all three.

## KISS — Keep It Simple, Stupid

The simplest thing that could possibly work. If a feature can be added with an `if` statement, use an `if` statement. Not a strategy pattern. Not a plugin system.

### Signals of violation

- "Flexibility" added before a second caller exists
- Config knobs with no user
- Abstractions with one concrete implementation
- Helpers that wrap one line of code
- Classes with one method

### quality-reviewer test
Can a reader understand the change without holding 5 files in their head? If not, simplify.

## DRY — Don't Repeat Yourself

Once, not twice. Three times is a refactor.

### Rule of three

Two occurrences: note it, leave it.
Three occurrences: extract the shared code.

Premature extraction (at two) creates an abstraction that doesn't fit. Shared code that isn't actually shared.

### Signals of violation

- Copy-paste across 3+ files
- Same parsing / validation logic inlined in multiple endpoints
- Same query building pattern repeated

### Not DRY (false positives)

- Two functions that look similar but have different reasons to change. They should NOT be unified. Similar ≠ same.

## YAGNI — You Aren't Gonna Need It

Don't build for speculative futures. Build for current requirements. Add when the requirement shows up.

### Signals of violation

- "In case we need to swap databases" (you won't)
- "In case we need to support multiple tenants" (tell me when)
- Generic `EventBus` for a system that emits two event types to one handler
- Plugin architecture for a tool that has 0 plugins

### When speculation IS warranted

- You're three weeks from the second use case, and it's on the roadmap
- Removing the flexibility later would require a breaking change
- The abstraction costs the same as the concrete implementation

## plan-pro's quality-reviewer checklist

- Any class with 1 concrete implementation → flag for inlining
- Any interface / abstract class with 1 implementer → flag
- Any config knob with no reader → flag
- Any 3+ copies of the same logic → flag DRY
- Any "for future use" comment → flag YAGNI

## The counter-principle

Once, twice, thrice, then abstract. And: simplest possible **for the current requirement**. Not "simple" in the abstract.

These rules serve the goal of code that's easy to change. If following one of them makes code harder to change, reconsider. Rules serve outcomes, not the other way around.
