# Design Skill Corpus

This skill is refreshed by `apps/notebook/encode/refresh_design_skill.py`.
It combines first-party tokens and components with bounded slices from
design-system, motion, and visualization repositories. The gate scores
computable correctness, not taste.

## Refresh Summary

| Field | Value |
|---|---|
| `source_packet_id` | `source:design-engineering-external-corpus-v0.1` |
| `source_content_hash` | `sha256:08d543dfd4d07702cc8ae8ff008c0e079ec6d30f3a90b95213997b64c85eb501` |
| `pack_content_hash` | `sha256:8a74b42202b10f8394f2cbaa82c041d8617c76ceb5eeb0ecb214a661e35c2f3b` |
| lowered views | `11055` |
| compiled artifacts | `9246` |
| selected source files | `42` |
| component fixtures | `4` |
| trust level | `scanned` |
| canonical ready | `False` |
| scored axes | `css_static, token_lint` |
| pending axes | `axe_render, apg_behavioral` |

## Checker Results

| Checker | Status | Checked files | Findings |
|---|---:|---:|---:|
| `token_lint` | `failed` | `42` | `161` |
| `css_static` | `failed` | `42` | `22` |
| `css_static` | `failed` | `42` | `14` |
| `css_static` | `failed` | `42` | `50` |
| `css_static` | `failed` | `42` | `6` |
| `css_static` | `failed` | `42` | `79` |
| `apg_behavioral` | `pending` | `42` | `0` |
| `axe_render` | `pending` | `42` | `0` |
| `css_static` | `passed` | `42` | `0` |
| `css_static` | `failed` | `42` | `130` |
| `css_static` | `failed` | `42` | `581` |
| `css_static` | `failed` | `42` | `345` |
| `css_static` | `failed` | `42` | `27` |
| `axe_render` | `pending` | `42` | `0` |
| `css_static` | `failed` | `42` | `878` |
| `axe_render` | `pending` | `42` | `0` |
| `css_static` | `failed` | `42` | `1` |
| `token_lint` | `failed` | `42` | `401` |
| `css_static` | `failed` | `42` | `1` |
| `css_static` | `failed` | `42` | `3` |

## External Corpus

| Source | License | Commit | Files | Status | Why |
|---|---|---:|---:|---|---|
| `https://github.com/radix-ui/primitives.git` | `MIT` | `424643acc60b` | `4` | `cloned` | Accessibility-first primitive component patterns. |
| `https://github.com/uswds/uswds.git` | `CC0-1.0/public-domain works plus noted project licensing` | `2ca50099b529` | `4` | `cloned` | Public-sector accessibility and token practice. |
| `https://github.com/alphagov/govuk-frontend.git` | `MIT` | `e168cdb7fce1` | `4` | `cloned` | Research-backed frontend components and documented rationale. |
| `https://github.com/carbon-design-system/carbon.git` | `Apache-2.0` | `88ec54e97e65` | `4` | `cloned` | Enterprise design-system tokens and components. |
| `https://github.com/material-components/material-web.git` | `Apache-2.0` | `a3379a361431` | `1` | `cloned` | Material web component and token architecture. |
| `https://github.com/primer/react.git` | `MIT` | `0676c6518db9` | `4` | `cloned` | GitHub component system and tokenized React practice. |
| `https://github.com/shadcn-ui/ui.git` | `MIT` | `8da459230847` | `4` | `cloned` | Upstream for the working first-party stack. |
| `https://github.com/observablehq/plot.git` | `ISC` | `356f579b1d94` | `4` | `cloned` | Data visualization defaults and axis/legend conventions. |
| `https://github.com/juliangarnier/anime.git` | `MIT` | `308c09346ffc` | `4` | `cloned` | Motion corpus for duration and animation patterns. |

## Selected Files

- `first-party/tokens/design.tokens.json`
- `first-party/styles/design-foundation.css`
- `local/travisgilbert.me/src/styles/global.css`
- `local/travisgilbert.me/src/styles/studio.css`
- `local/travisgilbert.me/src/styles/commonplace.css`
- `local/travisgilbert.me/src/styles/reading-pane.css`
- `local/travisgilbert.me/src/lib/graph/colors.ts`
- `local/travisgilbert.me/src/components/ThemeToggle.tsx`
- `local/travisgilbert.me/src/components/mobile-shell/MobileTopBar.tsx`
- `external/radix-primitives/packages/react/alert-dialog/package.json`
- `external/radix-primitives/packages/react/alert-dialog/tsconfig.json`
- `external/radix-primitives/packages/react/dialog/package.json`
- `external/radix-primitives/packages/react/dialog/tsconfig.json`
- `external/uswds/packages/uswds-tokens/colors/blue-cool.json`
- `external/uswds/packages/uswds-tokens/colors/blue-warm.json`
- `external/uswds/packages/uswds-tokens/colors/blue.json`
- `external/uswds/packages/uswds-tokens/colors/cyan.json`
- `external/govuk-frontend/package.json`
- `external/govuk-frontend/packages/govuk-frontend-review/nodemon.json`
- `external/govuk-frontend/packages/govuk-frontend-review/package.json`
- `external/govuk-frontend/packages/govuk-frontend-review/src/views/full-page-examples/search/data.json`
- `external/carbon/packages/themes/examples/preview-v10/package.json`
- `external/carbon/packages/themes/examples/preview/package.json`
- `external/carbon/packages/themes/examples/sass-modules/package.json`
- `external/carbon/packages/themes/package.json`
- `external/material-web/package.json`
- `external/primer-react/packages/react/src/TextInputWithTokens/TextInputWithTokens.docs.json`
- `external/primer-react/packages/react/src/Token/Token.docs.json`
- `external/primer-react/packages/react/src/utils/useTheme.hookDocs.json`
- `external/primer-react/packages/react/src/Button/Button.docs.json`
- `external/shadcn-ui/packages/tests/fixtures/registry/example-style.json`
- `external/shadcn-ui/package.json`
- `external/shadcn-ui/packages/shadcn/package.json`
- `external/shadcn-ui/packages/shadcn/test/fixtures/colors/neutral.json`
- `external/observable-plot/package.json`
- `external/observable-plot/src/marks/axis.d.ts`
- `external/observable-plot/src/channel.d.ts`
- `external/observable-plot/src/context.d.ts`
- `external/anime/package.json`
- `external/anime/src/svg/motionpath.js`
- `external/anime/src/core/styles.js`
- `external/anime/src/animatable/animatable.js`

## Component Fixtures

- `dialog_apg_fixture` (dialog) from `fixtures/apg/dialog.html`
- `tabs_apg_fixture` (tabs) from `fixtures/apg/tabs.html`
- `menu_apg_fixture` (menu) from `fixtures/apg/menu.html`
- `combobox_apg_fixture` (combobox) from `fixtures/apg/combobox.html`

## Held-Out Gate

```json
{
  "baseline": {
    "attempted_task_count": 0,
    "label": "baseline",
    "success_rate": 0.0,
    "successful_task_count": 0,
    "task_count": 20,
    "task_results": [
      {
        "attempted": false,
        "success": false,
        "task_id": "design-001-contrast-token-button",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-002-focus-visible-tabs",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-003-reduced-motion-dialog",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-004-spacing-grid-card",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-005-type-scale-article",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-006-measure-reading-pane",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-007-target-size-toolbar",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-008-radii-tokenized-popover",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-009-breakpoint-tokenized-shell",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-010-menu-roving-fixture",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-011-combobox-labels",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-012-visualization-palette",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-013-infinite-animation-pause",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-014-uswds-form-scale",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-015-dialog-targets-focus",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-016-article-theme-token-colors",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-017-grid-gutters",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-018-large-text-contrast",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-019-tabs-type-motion",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-020-viz-axis-fixture",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      }
    ],
    "tasks_with_time": 0,
    "time_to_correct_average": 0.0,
    "time_to_correct_total": 0.0,
    "token_cost_average": 0.0,
    "token_cost_total": 0.0,
    "validator_pass_rate": 0.0,
    "validator_passed_task_count": 0
  },
  "benchmark_treatment_beats_baseline": false,
  "canonical_ready": false,
  "pending_axes": [
    "axe_render",
    "apg_behavioral"
  ],
  "regression_signals": [
    "held_out_treatment_task_floor_not_met",
    "held_out_baseline_task_floor_not_met",
    "treatment_does_not_beat_baseline",
    "treatment_validator_pass_rate_below_policy",
    "render_axes_pending"
  ],
  "scored_axes": [
    "css_static",
    "token_lint"
  ],
  "static_axes_only": true,
  "success_rate_delta": 0.0,
  "task_count": 20,
  "task_count_floor": 20,
  "task_floor_met": true,
  "task_ids": [
    "design-001-contrast-token-button",
    "design-002-focus-visible-tabs",
    "design-003-reduced-motion-dialog",
    "design-004-spacing-grid-card",
    "design-005-type-scale-article",
    "design-006-measure-reading-pane",
    "design-007-target-size-toolbar",
    "design-008-radii-tokenized-popover",
    "design-009-breakpoint-tokenized-shell",
    "design-010-menu-roving-fixture",
    "design-011-combobox-labels",
    "design-012-visualization-palette",
    "design-013-infinite-animation-pause",
    "design-014-uswds-form-scale",
    "design-015-dialog-targets-focus",
    "design-016-article-theme-token-colors",
    "design-017-grid-gutters",
    "design-018-large-text-contrast",
    "design-019-tabs-type-motion",
    "design-020-viz-axis-fixture"
  ],
  "time_to_correct_delta": 0.0,
  "token_cost_delta": 0.0,
  "treatment": {
    "attempted_task_count": 0,
    "label": "treatment",
    "success_rate": 0.0,
    "successful_task_count": 0,
    "task_count": 20,
    "task_results": [
      {
        "attempted": false,
        "success": false,
        "task_id": "design-001-contrast-token-button",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-002-focus-visible-tabs",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-003-reduced-motion-dialog",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-004-spacing-grid-card",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-005-type-scale-article",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-006-measure-reading-pane",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-007-target-size-toolbar",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-008-radii-tokenized-popover",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-009-breakpoint-tokenized-shell",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-010-menu-roving-fixture",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-011-combobox-labels",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-012-visualization-palette",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-013-infinite-animation-pause",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-014-uswds-form-scale",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-015-dialog-targets-focus",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-016-article-theme-token-colors",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-017-grid-gutters",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-018-large-text-contrast",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-019-tabs-type-motion",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      },
      {
        "attempted": false,
        "success": false,
        "task_id": "design-020-viz-axis-fixture",
        "time_to_correct_seconds": 0.0,
        "token_cost": 0.0,
        "validator_passed": false
      }
    ],
    "tasks_with_time": 0,
    "time_to_correct_average": 0.0,
    "time_to_correct_total": 0.0,
    "token_cost_average": 0.0,
    "token_cost_total": 0.0,
    "validator_pass_rate": 0.0,
    "validator_passed_task_count": 0
  },
  "treatment_task_floor_met": false,
  "validator_pass_rate_floor": 0.95
}
```
