#!/usr/bin/env python3
"""Materialize host-specific plugin manifests from shared plugin manifests.

Each plugin can define `plugin.manifest.json` with common metadata plus a
`hosts` map. This script writes the host files such as
`.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`, and keeps the root
marketplace advertisement version aligned with the same source.
"""

from __future__ import annotations

import argparse
import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE_PATH = ROOT / ".claude-plugin" / "marketplace.json"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync plugin host manifests from plugin.manifest.json.",
    )
    parser.add_argument(
        "plugins",
        nargs="*",
        help="Plugin directories to sync. Defaults to all plugin.manifest.json files.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Do not write files; fail if any generated file is out of date.",
    )
    args = parser.parse_args()

    manifests = find_manifest_paths(args.plugins)
    if not manifests:
        print("No plugin manifests found.", file=sys.stderr)
        return 1

    marketplace = read_json(MARKETPLACE_PATH)
    changed = False
    out_of_date: list[Path] = []

    for manifest_path in manifests:
        plugin_dir = manifest_path.parent
        spec = read_json(manifest_path)
        validate_spec(spec, manifest_path)
        common = spec["plugin"]
        plugin_name = common["name"]

        for host_name, host in spec["hosts"].items():
            output = plugin_dir / host["output"]
            rendered = render_host_manifest(common, host["manifest"])
            rendered_text = json_text(rendered)
            if output.exists() and output.read_text(encoding="utf-8") == rendered_text:
                continue
            if args.check:
                out_of_date.append(output)
            else:
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_text(rendered_text, encoding="utf-8")
                print(f"updated {output.relative_to(ROOT)} ({host_name})")
                changed = True

        marketplace_changed = sync_marketplace_version(
            marketplace,
            plugin_name=plugin_name,
            version=common["version"],
        )
        if marketplace_changed and args.check:
            out_of_date.append(MARKETPLACE_PATH)
        elif marketplace_changed:
            changed = True

    if args.check:
        if out_of_date:
            for path in out_of_date:
                print(f"out of date: {path.relative_to(ROOT)}", file=sys.stderr)
            return 1
        print("plugin manifests are up to date")
        return 0

    if changed:
        MARKETPLACE_PATH.write_text(json_text(marketplace), encoding="utf-8")
        print(f"updated {MARKETPLACE_PATH.relative_to(ROOT)}")
    else:
        print("plugin manifests already up to date")
    return 0


def find_manifest_paths(plugin_args: list[str]) -> list[Path]:
    if plugin_args:
        paths = []
        for plugin in plugin_args:
            plugin_path = Path(plugin)
            if not plugin_path.is_absolute():
                plugin_path = ROOT / plugin_path
            paths.append(plugin_path / "plugin.manifest.json")
        return paths
    return sorted(ROOT.glob("*/plugin.manifest.json"))


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"missing JSON file: {path}") from None
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid JSON in {path}: {exc}") from None


def validate_spec(spec: dict[str, Any], path: Path) -> None:
    if spec.get("schema_version") != 1:
        raise SystemExit(f"{path}: schema_version must be 1")
    plugin = spec.get("plugin")
    hosts = spec.get("hosts")
    if not isinstance(plugin, dict):
        raise SystemExit(f"{path}: plugin must be an object")
    if not isinstance(hosts, dict) or not hosts:
        raise SystemExit(f"{path}: hosts must be a non-empty object")

    for field in ("name", "version", "description"):
        if not isinstance(plugin.get(field), str) or not plugin[field].strip():
            raise SystemExit(f"{path}: plugin.{field} must be a non-empty string")

    for host_name, host in hosts.items():
        if not isinstance(host, dict):
            raise SystemExit(f"{path}: hosts.{host_name} must be an object")
        output = host.get("output")
        manifest = host.get("manifest")
        if not isinstance(output, str) or not output.endswith("plugin.json"):
            raise SystemExit(f"{path}: hosts.{host_name}.output must target plugin.json")
        if output.startswith("/") or ".." in Path(output).parts:
            raise SystemExit(f"{path}: hosts.{host_name}.output must stay inside plugin")
        if not isinstance(manifest, dict):
            raise SystemExit(f"{path}: hosts.{host_name}.manifest must be an object")


def render_host_manifest(
    common: dict[str, Any],
    host_manifest: dict[str, Any],
) -> dict[str, Any]:
    rendered = deepcopy(common)
    deep_update(rendered, deepcopy(host_manifest))
    return rendered


def deep_update(base: dict[str, Any], overlay: dict[str, Any]) -> None:
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_update(base[key], value)
        else:
            base[key] = value


def sync_marketplace_version(
    marketplace: dict[str, Any],
    *,
    plugin_name: str,
    version: str,
) -> bool:
    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list):
        raise SystemExit(f"{MARKETPLACE_PATH}: plugins must be a list")
    for entry in plugins:
        if entry.get("name") != plugin_name:
            continue
        if entry.get("version") == version:
            return False
        entry["version"] = version
        return True
    raise SystemExit(f"{MARKETPLACE_PATH}: missing marketplace entry for {plugin_name}")


def json_text(value: dict[str, Any]) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    raise SystemExit(main())
