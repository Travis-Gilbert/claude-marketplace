#!/usr/bin/env python3
"""Validate one plugin's generated Harness teaching and installation contract."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from harness_capability_projection import (
    ProjectionError,
    apply_fixture,
    check_or_write,
    load_inputs,
    read_json,
    rendered_files,
    validate_generated_links,
    validate_installed_cache,
    validate_spec,
)


ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("plugin")
    parser.add_argument("--fixture", type=Path)
    parser.add_argument("--live-catalog", type=Path)
    parser.add_argument("--require-live", action="store_true")
    parser.add_argument("--installed-cache", type=Path)
    args = parser.parse_args()
    plugin_root = (ROOT / args.plugin).resolve()
    try:
        spec, source = load_inputs(plugin_root)
        if args.fixture:
            spec = apply_fixture(spec, read_json(args.fixture))
        live = read_json(args.live_catalog) if args.live_catalog else None
        validate_spec(
            plugin_root,
            spec,
            source,
            live_catalog=live,
            require_live=args.require_live,
        )
        changed = check_or_write(rendered_files(plugin_root, spec, source), check=True)
        if changed:
            paths = ", ".join(str(path.relative_to(ROOT)) for path in changed)
            raise ProjectionError(f"non-idempotent or stale generated projection: {paths}")
        validate_generated_links(plugin_root, spec)
        if args.installed_cache:
            validate_installed_cache(plugin_root, args.installed_cache.resolve(), spec)
        print(f"plugin validation passed: {args.plugin}")
        return 0
    except ProjectionError as exc:
        print(f"plugin validation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
