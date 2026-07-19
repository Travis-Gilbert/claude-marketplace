#!/usr/bin/env python3
"""Generate byte-stable compact Harness capability teaching projections."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from harness_capability_projection import (
    ProjectionError,
    check_or_write,
    compact_source_catalog,
    json_bytes,
    load_inputs,
    read_json,
    rendered_files,
    validate_spec,
)


ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("plugin", nargs="?", default="theorems-harness")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--source-catalog", type=Path)
    parser.add_argument("--source-label", default="rustyred-thg-mcp:harness_capability_source_catalog")
    args = parser.parse_args()
    plugin_root = (ROOT / args.plugin).resolve()

    try:
        if args.source_catalog:
            compact = compact_source_catalog(read_json(args.source_catalog), args.source_label)
            snapshot = plugin_root / "capabilities" / "source-surfaces.json"
            if args.check:
                if not snapshot.is_file() or snapshot.read_bytes() != json_bytes(compact):
                    raise ProjectionError(f"source surface snapshot drift: {snapshot}")
            else:
                snapshot.parent.mkdir(parents=True, exist_ok=True)
                snapshot.write_bytes(json_bytes(compact))

        spec, source = load_inputs(plugin_root)
        validate_spec(plugin_root, spec, source)
        changed = check_or_write(rendered_files(plugin_root, spec, source), check=args.check)
        if changed:
            if args.check:
                for path in changed:
                    print(f"out of date: {path.relative_to(ROOT)}", file=sys.stderr)
                return 1
            for path in changed:
                print(f"generated {path.relative_to(ROOT)}")
        else:
            print("Harness capability projections are byte-stable")
        return 0
    except ProjectionError as exc:
        print(f"capability projection generation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
