# spec-compliance

Convert natural-language specs into deviation-resistant MUST/MUST NOT/VERIFY
format and enforce a compliance protocol during implementation sessions.

## Components

### Skill: spec-compliance

Triggers when asked to "make this spec tight", "lock this down", "implement
this exactly", etc. Converts design docs into locked specs with binary,
testable requirements.

The skill produces specs with four statement types:
- **MUST** - Positive requirement (binary: true or not)
- **MUST NOT** - Explicit prohibition (prevents the five deviation modes)
- **IF CONFLICT** - What to do when spec disagrees with codebase
- **VERIFY** - Executable check to confirm implementation

### Command: /inject-protocol

Adds the Spec Compliance Protocol block to the project's CLAUDE.md. This
protocol activates automatically when a session includes a LOCKED spec
and enforces literal implementation with structured deviation reporting.

### Command: /learn

Epistemic learning loop. Saves session events, runs the fast learning
pipeline, and presents review items (confidence changes, tensions,
candidates, attention-needed claims).

## The Five Deviation Modes

1. **Reasonable substitution** - Swaps specified approach for "equivalent"
2. **Additive deviation** - Adds unrequested features
3. **Silent omission** - Skips requirements without flagging
4. **Layout reinterpretation** - Changes spatial relationships
5. **Tool substitution** - Uses different library/tool

## Usage Flow

```
1. Design the feature (design-pro, d3-pro, etc.)
2. Convert plan to locked spec (spec-compliance skill)
3. Open Claude Code session with the spec
4. CLAUDE.md compliance protocol activates automatically
5. Claude implements literally, flags conflicts, runs verifications
6. Deviations reported in structured format
```

## Relationship to spec-guard

spec-compliance produces the spec. spec-guard enforces it at edit-time
via hooks. They are complementary:
- spec-compliance: spec authoring (converts plans to MUST/MUST NOT/VERIFY)
- spec-guard: spec enforcement (blocks deviating edits via PreToolUse hooks)
