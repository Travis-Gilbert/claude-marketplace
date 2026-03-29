# Deviation Risks by Task Type

Common deviation patterns organized by task type. Use these to generate
targeted MUST NOT statements when converting specs.

## The Five Deviation Modes

1. **Reasonable substitution** - Swapping a specified approach for one
   that seems equivalent but violates the spec
2. **Additive deviation** - Adding features, patterns, or structure the
   spec did not ask for
3. **Silent omission** - Skipping a requirement without flagging it
4. **Layout reinterpretation** - Changing spatial relationships, spacing,
   or visual hierarchy from the spec
5. **Tool substitution** - Using a different library or tool than required

All five share a root cause: descriptive language that invites
interpretation. The fix is prescriptive, binary, testable language.

## Component Work

Common risks:
- Adding unrequested props
- Changing existing component interfaces
- Swapping Server/Client Component boundaries
- Adding "helpful" error states or loading states not in the spec
- Renaming props to match a preferred convention

Example MUST NOT statements:
```
MUST NOT: Add props, parameters, or features not listed in this spec
MUST NOT: Change the existing interface of [ComponentName]
MUST NOT: Convert between Server and Client Components unless specified
MUST NOT: Add error boundary or loading state unless listed in REQUIREMENTS
```

## Styling Work

Common risks:
- Overriding design tokens with hardcoded values
- Changing font stacks
- Modifying z-index layers
- Adjusting spacing that affects adjacent components
- Using a different unit system (rem vs px vs em)
- "Improving" responsive breakpoints

Example MUST NOT statements:
```
MUST NOT: Use hardcoded color values where this spec names a token
MUST NOT: Use a font family other than [specified font]
MUST NOT: Modify z-index of any element not listed in SCOPE
MUST NOT: Change padding/margin values on components adjacent to SCOPE
MUST NOT: Add media queries or breakpoints not in this spec
```

## API / Backend Work

Common risks:
- Adding unrequested fields to serializers
- Changing URL patterns
- Adding middleware or signals
- Modifying model fields beyond what was specified
- Adding validation beyond what was specified
- "Improving" error responses

Example MUST NOT statements:
```
MUST NOT: Add fields to serializers beyond those listed in this spec
MUST NOT: Change URL patterns for existing endpoints
MUST NOT: Add middleware, signals, or model methods not specified
MUST NOT: Modify model fields or constraints beyond SCOPE
```

## Data Visualization

Common risks:
- Changing D3 scale types
- Adding transitions not in the spec
- Modifying axis formatting
- Swapping color schemes
- Adding tooltips or interactions not specified
- "Improving" the layout algorithm

Example MUST NOT statements:
```
MUST NOT: Change the D3 scale type from what this spec specifies
MUST NOT: Add transitions or animations not listed in this spec
MUST NOT: Modify axis tick formatting, domain, or range
MUST NOT: Use a color scheme other than [specified scheme]
MUST NOT: Add interactive features (tooltips, zoom, brush) unless specified
```

## Universal MUST NOT Statements

Include these in every spec:
```
MUST NOT: Add props, parameters, or features not listed in this spec
MUST NOT: Modify files not listed in SCOPE
MUST NOT: Resolve conflicts with existing code independently (STOP and report)
```
