# Screen Archetypes

## Why Archetypes Matter

Every screen serves one of a small number of purposes. Identifying the
archetype early in the design process constrains decisions in useful ways:
it sets density expectations, interaction patterns, state priorities, and
layout composition strategies. Skipping archetype identification leads to
"average" designs that serve no purpose well.

## The Five Archetypes

### Monitoring (Dashboard)
- **Purpose**: observe system state, spot anomalies, track progress
- **Density**: high
- **Key pattern**: asymmetric card sizing establishes priority among
  multiple data sources. The most important metric gets the most visual
  weight. Supporting metrics recede.
- **State priorities**: stale data (is this number current?), error
  (connection lost), threshold alerts
- **Composition**: dashboard grid with asymmetric sizing, NOT a uniform
  grid of equal-weight panels
- **Interaction**: mostly observation, occasional drill-down. Primary
  action is often "refresh" or "investigate anomaly."
- **Common mistakes**: equal-weight panels for unequal-importance data,
  decorative charts that communicate nothing, no stale-data indicator

### Triage (Inbox, Queue, Review)
- **Purpose**: process items, make decisions, move things forward
- **Density**: high (list) + medium (preview)
- **Key pattern**: scannable list with enough preview to decide without
  opening. Status indicators, age, priority, and assignee visible at
  scan level.
- **State priorities**: empty (nothing to triage), bulk selection,
  "all caught up" success state
- **Composition**: list/detail split (master-detail) or stacked list
  with inline expansion
- **Interaction**: select, preview, act, move to next. Batch actions
  for efficiency. Keyboard shortcuts for power users.
- **Common mistakes**: requiring a click to see enough information to
  decide, no batch actions, no "all caught up" state

### Authoring (Editor, Form, Composer)
- **Purpose**: create or edit content with focus and minimal distraction
- **Density**: low to medium
- **Key pattern**: content area dominates, tools recede. Save state is
  always visible. Helper text appears near the decision it supports.
- **State priorities**: unsaved changes, validation errors, auto-save
  confirmation, draft vs. published
- **Composition**: single-column or asymmetric split (content + sidebar
  for metadata). Never equal-weight split between content and tools.
- **Interaction**: typing, selecting, formatting. Save should be
  automatic or one action away. Undo is more important than confirm.
- **Common mistakes**: crowding the editor with tools, hiding save state,
  wizard patterns for independent settings, validation only on submit

### Configuration (Settings, Preferences, Admin)
- **Purpose**: adjust system behavior, manage resources
- **Density**: medium
- **Key pattern**: grouped by category with clear section boundaries.
  Immediate feedback on changes. Safe defaults.
- **State priorities**: changed-but-not-saved, save confirmation, reset
  to default, permission errors
- **Composition**: vertical stack of grouped sections, sidebar navigation
  for many groups. Each group is self-contained.
- **Interaction**: toggle, select, input, save. Changes should be
  reversible. Destructive settings should be visually separated.
- **Common mistakes**: ungrouped flat list of settings, no visual
  separation between safe and dangerous options, no immediate feedback

### Exploration (Search, Browse, Feed, Gallery)
- **Purpose**: discover, browse, find, compare
- **Density**: variable (adapts to content type)
- **Key pattern**: polymorphic object rendering is essential here. Mixed
  content types displayed in a single stream must have type-aware visual
  treatment. Filtering and sorting surface at the top.
- **State priorities**: empty search results, no matches for filter,
  end of results, loading more
- **Composition**: depends on content type. Text-forward: list.
  Visual-forward: grid or masonry. Mixed: heterogeneous feed.
- **Interaction**: search, filter, sort, select, preview. Progressive
  loading (infinite scroll or pagination).
- **Common mistakes**: uniform card grid for mixed content types,
  search with no results guidance, filters that produce empty states
  without explanation, no indication of result count or scope
