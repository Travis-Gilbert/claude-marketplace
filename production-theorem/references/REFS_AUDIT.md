# Refs Audit (REF-005)

Inventory of plugins with vendored `refs/` content and whether they
carry a `MANIFEST.md` conforming to `REFS_MANIFEST.md`.

**Date:** 2026-05-10
**Source:** `find $PLUGIN_ROOTS -maxdepth 3 -path '*/refs/MANIFEST.md'` plus directory walk

## Summary

| Status | Count | Notes |
|---|---|---|
| HAS MANIFEST | 1 | ui-design-pro (this work, v1.2.0) |
| NEEDS MANIFEST | 12+ | listed below |
| Total invisible refs | ~2.8 GB | across the NEEDS plugins |

## Plugins needing MANIFEST.md

Sorted by size of `refs/` directory (largest = highest leverage if surfaced).

| Plugin | refs/ size | Top vendored entries | Priority |
|---|---|---|---|
| `js-pro` | 1.3G | ag-grid-latest, alpine-main, angular.js-master, base-ui-master, commerce-main | high (largest corpus; JS/framework heavy) |
| `django-engine-pro` | 385M | dj-notebook, django-db, django-filter, django-mcp-server, django-model-utils | high (matches Index-API repo work) |
| `ux-pro` | 556M | aria-practices, axe-core, carbon, govuk-design-system, govuk-frontend | high (accessibility + UX; complements ui-design-pro) |
| `animation-pro` | 300M | animate-css, anime, auto-animate, d3-ease, d3-transition | medium (animation libraries) |
| `cosmos-pro` | 295M | cosmos-gl, duckdb-wasm, luma-gl, mosaic, theseus-viz-types | medium (graph viz) |
| `vie-design` | 92M | cmdk, ink-ui, mantine, observable-framework, sonner | medium (also has component libraries) |
| `app-pro` | 59M | capacitor, expo-router, mmkv, react-native, react-native-gesture-handler | medium (mobile/cross-platform) |
| `next-pro` | 9.6M | next-build, next-client, next-devtools, next-lib, next-server | medium (matches Website repo work) |
| `plan-pro` | 9.6M | adr-templates, mycelium, superpowers | low (templates + meta-knowledge) |
| `d3-pro` | 5.3M | d3-annotation, d3-array, d3-brush, d3-chord, d3-color | medium (d3 module sources) |
| `three-pro` | 276K | d3-force-3d, drei-components, r3f-core, three-core | low (small but useful for 3D work) |
| `swift-pro` | 184K | appkit-patterns, observation, swift-concurrency, swift-testing, swiftdata | low (Swift-only; matches Swift work) |
| `app-forge` | 0B | (empty refs/ directory; skip) | none |

## Recommended MANIFEST.md backfill order

1. **Same-day priority** (matches active repo work): `next-pro`, `django-engine-pro`, `ux-pro`.
2. **Next sprint** (active project domains): `js-pro`, `animation-pro`, `cosmos-pro`, `vie-design`.
3. **Eventually**: `app-pro`, `d3-pro`, `three-pro`, `swift-pro`, `plan-pro`.
4. **Skip**: `app-forge` (empty).

## Backfill template

For each plugin, the work is:

1. Read existing `refs/` contents.
2. Write `refs/MANIFEST.md` using `REFS_MANIFEST.md` schema.
   Each entry needs `path`, `source`, `license`, `bucket`, `framework`, `pull_what`.
3. Verify licenses via `gh api repos/<owner>/<repo> --jq .license` for each row.
4. (After Phase 2 ships) Run `python3 manage.py ingest_design_refs --plugin-root <plugin-path>` to land in THG.

Per-plugin walltime estimate: 15-30 min depending on refs/ size and license churn.

## What the walker hook delivers in v1

Until each plugin gets a MANIFEST.md, the walker hook
(`refs-manifest-load.sh`) injects nothing for that plugin. Currently
only `ui-design-pro` benefits.

After Phase 2 ships (THG ingest), the walker becomes the fallback only;
the primary surface is `memory_recall.read_first` in the brief. But for
that to surface anything per plugin, that plugin's MANIFEST.md must
have been written and ingested. The audit above is the punch list for
that work.

## Notes

- Duplicates seen in `.claude/plugins/marketplaces/local-desktop-app-uploads/` are
  artifacts of marketplace install. The walker dedupes by plugin name
  (source path wins).
- `.backup.YYYYMMDD...` directories from earlier marketplace updates
  also appear. They are read and deduplicated as separate plugin names;
  consider cleaning these up to reduce noise.
- `app-forge` has an empty `refs/` (0B) and is skipped.
