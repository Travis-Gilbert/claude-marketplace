# Elegance via Constraint

Elegant code is constrained code. Every degree of freedom you remove is a bug class eliminated and a reader's burden reduced.

## The principle

Elegance isn't extra cleverness — it's fewer choices. A function with fewer parameters, fewer branches, fewer return types is easier to understand than one with more.

## Concrete constraints to prefer

### Narrow types over wide types
```python
# Less elegant — what's None mean?
def get_user(id: int | None) -> User | None:
    ...

# More elegant
def get_user(id: int) -> User | None:
    ...
def current_user(request) -> User | None:  # specific case
    ...
```

### Immutable by default
```python
# Dataclass with frozen=True
@dataclass(frozen=True)
class Config:
    host: str
    port: int
```
Immutability removes the whole class of "wait, when did this change?" bugs.

### Pure functions where possible
A function that only depends on its inputs and only affects its outputs is testable, cacheable, and reorderable. Reserve impurity (I/O, state) for the thin edges of the program.

### Single entry, single exit
Not dogmatic — early returns are fine. But a function with 7 return statements interleaved with mutation is harder than a function that computes a result and returns it once.

### Closed sets of cases
Union types / sum types / enums beat strings:
```typescript
// Less elegant
type Status = string  // what values?

// More elegant
type Status = "active" | "paused" | "archived"
```

## Anti-elegance signals

- Parameters that are "optional but actually required in some cases"
- Return types like `any` or `Object` or `dict` at public API boundaries
- "Flags that change behavior" — often a sign the function should be two functions
- Mutation of shared state across function calls
- "Magic" — behavior that can't be traced from the code

## The quality-reviewer check

- Parameter count > 4 → consider a grouped object / config
- Return type is `Any` / `object` / untyped → narrow it
- Function length > ~30 lines → probably two functions
- Nested conditionals > 3 levels deep → extract a guard clause or helper
- String literals that should be enums → extract constants

## The discipline

Prefer the solution you can't misuse. Type systems, immutability, explicit enumerations — they constrain both the author and the user. That's the point.

## Related

- `kiss-dry-yagni.md` — constrained solutions are usually the simpler solutions
- `fat-models-thin-views.md` — thin views constrain what a view can do, making views easier to read
