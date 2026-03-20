---
name: ux-expertise
description: >-
  This skill should be used when the user asks to "audit accessibility",
  "evaluate usability", "review UX", "check WCAG compliance", "design a user
  flow", "plan user research", "create a test script", "write a journey map",
  "build a service blueprint", "improve navigation", "fix error messages",
  "write UI copy", "add ARIA", "check keyboard accessibility", "design a form",
  "plan information architecture", "conduct a heuristic evaluation", "measure
  UX metrics", "write microcopy", or mentions WCAG, ARIA, Nielsen heuristics,
  Laws of UX, usability testing, card sorting, tree testing, SUS score, HEART
  framework, service design, content design, interaction patterns, focus
  management, screen reader, or any UX research method. Covers the full UX
  discipline: research, information architecture, interaction design,
  accessibility, usability testing, content design, and service design.
---

# UX Expertise

Foundational UX knowledge covering research methods, information architecture,
interaction design patterns, accessibility standards, usability testing,
content design, and service design. This skill provides the knowledge layer
that all seven specialist agents draw from.

## Core Frameworks

### Nielsen's 10 Usability Heuristics
The primary evaluation framework for heuristic reviews:

1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Load `references/nielsen-heuristics.md` for per-heuristic checklists and examples.

### Laws of UX
Psychological principles for design decisions. Key laws:

- **Fitts's Law**: Target acquisition time = f(distance, size)
- **Hick's Law**: Decision time increases logarithmically with choices
- **Miller's Law**: Working memory holds 7 plus/minus 2 items
- **Jakob's Law**: Users expect your site to work like others they know
- **Doherty Threshold**: Productivity soars when response < 400ms
- **Peak-End Rule**: Experiences judged by peak intensity and ending

Load `references/laws-of-ux.md` for all 17 laws with origins and applications.

### WCAG 2.2 Organized for Designers
Accessibility requirements organized by design responsibility:

| Category | Key criteria |
|----------|-------------|
| Visual design | Contrast 4.5:1 text, 3:1 UI; no color-only info; target 24x24px min |
| Interaction | Keyboard access all; no traps; focus visible; consistent nav |
| Content | Descriptive titles; heading hierarchy; labeled inputs; clear errors |
| Structure | Landmarks; reading order = DOM order; works portrait and landscape |

Load `references/wcag-22-design-guide.md` for the complete organized checklist.

## Research Method Selection

Choose methods by project phase:

| Phase | Methods | Effort |
|-------|---------|--------|
| Discovery | Contextual inquiry, stakeholder interviews, diary studies, competitive analysis | Medium-High |
| Definition | Personas, journey mapping, JTBD, service blueprints, task analysis | Medium |
| Design | Usability testing, A/B testing, tree testing, heuristic evaluation, cognitive walkthrough | Low-Medium |
| Measurement | Analytics review, SUS, HEART framework, task-level metrics | Low |

Load `references/research-methods.md` for the complete framework with method details.

## Information Architecture

The four systems of IA (Rosenfeld and Morville):
1. **Organization**: How information is categorized
2. **Labeling**: How information is represented
3. **Navigation**: How users browse (global, local, contextual)
4. **Search**: How users find

Navigation models: Hub and Spoke, Nested Doll, Tabbed View, Bento Box, Filtered View.

Load `references/information-architecture.md` for frameworks, card sorting, tree testing.

## Interaction Patterns

Key pattern categories: Form Design, Navigation, Data Display, Feedback and
Messaging, Onboarding, Complex Interactions (drag/drop, inline edit, bulk actions).

Load `references/interaction-patterns.md` for the complete pattern catalog.

## ARIA Authoring Practices

Keyboard interaction models for every common widget: Accordion, Combobox,
Dialog, Listbox, Menu, Tabs, Tree View, and more.

Load `references/aria-patterns.md` for the complete pattern set with keyboard models.

## UX Metrics

| Framework | Dimensions |
|-----------|-----------|
| Task-level | Completion rate, time on task, error rate, lostness, efficiency |
| SUS | 10-item questionnaire, score 0-100, benchmark ~68 |
| HEART | Happiness, Engagement, Adoption, Retention, Task success |
| AARRR | Acquisition, Activation, Retention, Revenue, Referral |

Load `references/ux-metrics.md` for measurement frameworks and calculation methods.

## Verifying Patterns Against Source

Always verify accessibility patterns against real implementations:

```bash
# Radix: focus management and ARIA
grep -r "aria-\|role=\|tabIndex\|onKeyDown" refs/radix-primitives/packages/react/dialog/src/
# axe-core: WCAG rules as code
grep -r "description\|help\|tags" refs/axe-core/lib/rules/ --include="*.json"
# ARIA practices: keyboard models
grep -r "keyboard\|key.*down\|arrow" refs/aria-practices/content/patterns/
# GOV.UK: research-backed patterns
grep -r "research\|evidence\|finding" refs/govuk-design-system/src/patterns/
```

## Templates

Reusable deliverable scaffolds in `templates/`:

- **`templates/heuristic-evaluation/`**: Report with per-heuristic sections, severity scale
- **`templates/usability-test-script/`**: Moderator guide, tasks, metrics, SUS, debrief
- **`templates/research-plan/`**: Brief, questions, methods, participants, timeline
- **`templates/journey-map/`**: Phases, rows (actions/thoughts/feelings/touchpoints)
- **`templates/service-blueprint/`**: Layers (frontstage/backstage/support), lines of visibility
- **`templates/accessibility-audit/`**: WCAG checklist by level, issue template, scoring
- **`templates/ux-review/`**: Screen-by-screen format, priority matrix

## Reference Files

- **`references/nielsen-heuristics.md`**: 10 heuristics with checklists and violation examples
- **`references/laws-of-ux.md`**: 17 UX laws with psychology origins and applications
- **`references/research-methods.md`**: Method selection by phase, study design guidance
- **`references/information-architecture.md`**: IA systems, navigation models, card sorting
- **`references/wcag-22-design-guide.md`**: WCAG 2.2 organized by designer responsibility
- **`references/aria-patterns.md`**: Keyboard interaction models per widget type
- **`references/interaction-patterns.md`**: Form, navigation, data display, feedback patterns
- **`references/ux-metrics.md`**: HEART, SUS, task metrics, AARRR frameworks
- **`references/service-design.md`**: Journey maps, blueprints, empathy maps, JTBD
- **`references/ux-writing-guide.md`**: Microcopy patterns, voice/tone, content hierarchy
- **`references/inclusive-design.md`**: Microsoft framework, disability spectrum, universal design
