#!/usr/bin/env python3
"""Deterministic compiler and validator for Harness plugin teaching projections."""

from __future__ import annotations

import copy
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Iterable


class ProjectionError(ValueError):
    """A source, projection, link, or installed-cache invariant failed."""


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True) + "\n").encode()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ProjectionError(f"missing JSON source: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ProjectionError(f"invalid JSON source {path}: {exc}") from exc


def graphql_root_fields(sdl: str) -> list[str]:
    fields: set[str] = set()
    type_pattern = re.compile(
        r"(?ms)^(?:extend\s+)?type\s+(Query|Mutation|Subscription)(?:Root)?\b[^\{]*\{(.*?)^\s*\}"
    )
    field_pattern = re.compile(r"(?m)^\s*([_A-Za-z][_0-9A-Za-z]*)\s*(?:\(|:)")
    for type_name, body in type_pattern.findall(sdl):
        body_without_descriptions = re.sub(r'(?ms)""".*?"""', "", body)
        for field_name in field_pattern.findall(body_without_descriptions):
            fields.add(f"{type_name}.{field_name}")
    return sorted(fields)


def compact_source_catalog(catalog: dict[str, Any], source_label: str) -> dict[str, Any]:
    if catalog.get("schema_version") != 1:
        raise ProjectionError("source capability catalog schema_version must be 1")
    flat = catalog.get("flat_mcp")
    sdl = catalog.get("graphql_sdl")
    if not isinstance(flat, list) or not flat:
        raise ProjectionError("source capability catalog flat_mcp must be non-empty")
    if not isinstance(sdl, str) or not sdl.strip():
        raise ProjectionError("source capability catalog graphql_sdl must be non-empty")
    if any(not isinstance(item, dict) for item in flat):
        raise ProjectionError("source capability catalog flat_mcp entries must be objects")
    names = [item.get("name") for item in flat]
    if any(not isinstance(name, str) or not name for name in names):
        raise ProjectionError("source capability catalog contains a tool without a name")
    if len(names) != len(set(names)):
        raise ProjectionError("source capability catalog contains duplicate flat tool names")
    canonical = json.dumps(catalog, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    server_version = catalog.get("server_version")
    graphql = graphql_root_fields(sdl)
    if not isinstance(server_version, str) or not server_version:
        raise ProjectionError("source capability catalog server_version must be non-empty")
    if not graphql:
        raise ProjectionError("source capability catalog has no GraphQL root fields")
    return {
        "schema_version": 1,
        "server_version": server_version,
        "source": source_label,
        "source_catalog_sha256": sha256_bytes(canonical.encode()),
        "flat_mcp": sorted(names),
        "graphql": graphql,
    }


def plugin_versions(plugin_root: Path) -> dict[str, str]:
    paths = {
        "source": plugin_root / "plugin.manifest.json",
        "codex": plugin_root / ".codex-plugin" / "plugin.json",
        "claude": plugin_root / ".claude-plugin" / "plugin.json",
    }
    versions: dict[str, str] = {}
    for label, path in paths.items():
        value = read_json(path)
        version = value.get("plugin", {}).get("version") if label == "source" else value.get("version")
        if not isinstance(version, str) or not version:
            raise ProjectionError(f"{path}: missing plugin version")
        versions[label] = version
    return versions


def load_inputs(plugin_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    spec = read_json(plugin_root / "capabilities" / "families.json")
    source = read_json(plugin_root / "capabilities" / "source-surfaces.json")
    return spec, source


def apply_fixture(spec: dict[str, Any], fixture: dict[str, Any]) -> dict[str, Any]:
    mutated = copy.deepcopy(spec)
    mutation = fixture.get("mutation", {})
    kind = mutation.get("kind", "none")
    if kind == "none":
        return mutated
    if kind == "set_plugin_version":
        mutated["plugin_version"] = mutation["value"]
        return mutated
    families = {family["id"]: family for family in mutated.get("families", [])}
    family_id = mutation.get("family")
    if family_id not in families:
        raise ProjectionError(f"fixture references unknown family: {family_id}")
    if kind == "add_entry":
        families[family_id].setdefault("entries", []).append(copy.deepcopy(mutation["entry"]))
    elif kind == "set_entry_field":
        name = mutation["name"]
        entry = next(
            (item for item in families[family_id].get("entries", []) if item.get("name") == name),
            None,
        )
        if entry is None:
            raise ProjectionError(f"fixture references unknown capability: {family_id}:{name}")
        entry[mutation["field"]] = mutation["value"]
    elif kind == "set_skill":
        families[family_id]["skill"] = mutation["value"]
    else:
        raise ProjectionError(f"unknown fixture mutation: {kind}")
    return mutated


def validate_spec(
    plugin_root: Path,
    spec: dict[str, Any],
    source: dict[str, Any],
    *,
    live_catalog: dict[str, Any] | None = None,
    require_live: bool = False,
) -> None:
    if spec.get("schema_version") != 1:
        raise ProjectionError("capability family schema_version must be 1")
    if source.get("schema_version") != 1:
        raise ProjectionError("source surface schema_version must be 1")

    versions = plugin_versions(plugin_root)
    if len(set(versions.values())) != 1:
        raise ProjectionError(f"source manifest version drift: {versions}")
    expected_version = versions["source"]
    if spec.get("plugin_version") != expected_version:
        raise ProjectionError(
            f"capability source/plugin version drift: source={spec.get('plugin_version')} plugin={expected_version}"
        )

    flat_registered = set(source.get("flat_mcp", []))
    graphql_registered = set(source.get("graphql", []))
    registries = spec.get("registries", {})
    registered = {
        "dynamic": set(registries.get("dynamic", [])),
        "http": set(registries.get("http", [])),
        "rust": set(registries.get("rust", [])),
        "behavior": set(registries.get("behavior", [])),
    }
    compatibility = spec.get("compatibility", [])
    retired = {
        item.get("name")
        for item in compatibility
        if item.get("status") in {"deprecated", "removed"}
    }

    live_flat: set[str] | None = None
    live_graphql: set[str] | None = None
    live_dynamic: set[str] | None = None
    if require_live and live_catalog is None:
        raise ProjectionError("live catalog is required for live conformance")
    if live_catalog is not None:
        live_flat = set(live_catalog.get("flat_mcp", []))
        live_graphql = set(live_catalog.get("graphql", []))
        live_dynamic = set(live_catalog.get("dynamic", []))

    families = spec.get("families")
    if not isinstance(families, list) or not families:
        raise ProjectionError("capability families must be a non-empty array")

    family_ids: set[str] = set()
    skills: set[str] = set()
    names_by_surface: set[tuple[str, str]] = set()
    for family in families:
        family_id = family.get("id")
        skill = family.get("skill")
        reference = family.get("reference")
        if not isinstance(family_id, str) or not family_id:
            raise ProjectionError("family id must be a non-empty string")
        if family_id in family_ids:
            raise ProjectionError(f"duplicate family id: {family_id}")
        family_ids.add(family_id)
        for field in ("title", "summary"):
            if not isinstance(family.get(field), str) or not family[field].strip():
                raise ProjectionError(f"family {family_id} has an invalid {field}")
        if not isinstance(skill, str) or not skill or skill in skills:
            raise ProjectionError(f"family {family_id} has an invalid or duplicate skill")
        skills.add(skill)
        skill_file = plugin_root / "skills" / skill / "SKILL.md"
        if not skill_file.is_file():
            raise ProjectionError(f"broken skill link for {family_id}: {skill_file}")
        if not isinstance(reference, str) or not (plugin_root / "references" / reference).is_file():
            raise ProjectionError(f"broken reference link for {family_id}: {reference}")
        if not family.get("entries"):
            raise ProjectionError(f"family {family_id} has no compact catalog entries")

        for entry in family["entries"]:
            surface = entry.get("surface")
            name = entry.get("name")
            if not isinstance(surface, str) or not isinstance(name, str) or not name:
                raise ProjectionError(f"family {family_id} has an invalid catalog entry")
            for field in ("guidance", "maturity", "live_status", "schema"):
                if not isinstance(entry.get(field), str) or not entry[field].strip():
                    raise ProjectionError(
                        f"family {family_id} capability {name} has an invalid {field}"
                    )
            key = (surface, name)
            if key in names_by_surface:
                raise ProjectionError(f"duplicate capability projection: {surface}:{name}")
            names_by_surface.add(key)
            if name in retired:
                raise ProjectionError(f"deprecated capability taught as current: {name}")
            if surface == "flat_mcp":
                if name not in flat_registered:
                    raise ProjectionError(f"fictional flat MCP capability: {name}")
            elif surface == "graphql":
                if name not in graphql_registered:
                    raise ProjectionError(f"fictional GraphQL capability: {name}")
            elif surface in registered:
                if name not in registered[surface]:
                    raise ProjectionError(f"unregistered {surface} capability: {name}")
            else:
                raise ProjectionError(f"unknown capability surface: {surface}")

            require_entry_live = bool(entry.get("live_required")) or (
                require_live
                and surface in {"flat_mcp", "graphql"}
                and "compatibility" not in str(entry.get("guidance", "")).lower()
            )
            if require_entry_live:
                if live_catalog is None:
                    raise ProjectionError(f"live catalog required for capability: {name}")
                live_set = (
                    live_flat
                    if surface == "flat_mcp"
                    else live_graphql
                    if surface == "graphql"
                    else live_dynamic
                    if surface == "dynamic"
                    else None
                )
                if live_set is None or name not in live_set:
                    raise ProjectionError(f"live-missing capability: {name}")

    compatibility_names: set[str] = set()
    for item in compatibility:
        name = item.get("name")
        status = item.get("status")
        replacement = item.get("replacement")
        reason = item.get("reason")
        if not isinstance(name, str) or not name or name in compatibility_names:
            raise ProjectionError(f"invalid or duplicate compatibility name: {name}")
        compatibility_names.add(name)
        if status not in {"compatibility", "deprecated", "removed"}:
            raise ProjectionError(f"invalid compatibility status for {name}: {status}")
        if status in {"deprecated", "removed"} and not isinstance(replacement, str):
            raise ProjectionError(f"retired capability lacks replacement guidance: {name}")
        if not isinstance(reason, str) or not reason.strip():
            raise ProjectionError(f"compatibility capability lacks a reason: {name}")


def family_catalog_text(
    family: dict[str, Any], source: dict[str, Any], plugin_version: str
) -> str:
    rows = []
    for entry in sorted(family["entries"], key=lambda item: (item["surface"], item["name"])):
        live = entry.get("live_status", "source-registered")
        rows.append(
            f"| `{entry['name']}` | {entry['surface']} | {entry['guidance']} | "
            f"{entry['maturity']} | {live} | `{entry['schema']}` |"
        )
    return "\n".join(
        [
            "<!-- GENERATED: scripts/generate_harness_capability_projections.py -->",
            f"# {family['title']} capability catalog",
            "",
            family["summary"],
            "",
            f"Plugin version: `{plugin_version}`. Source server version: `{source.get('server_version')}`.",
            f"Source catalog SHA-256: `{source.get('source_catalog_sha256')}`.",
            "",
            "| Capability | Surface | Guidance | Maturity | Live status | Schema/source |",
            "|---|---|---|---|---|---|",
            *rows,
            "",
            f"Behavioral contract: `references/{family['reference']}` in the source plugin.",
            "Live status is an explicit claim, not an inference from implementation presence.",
            "",
        ]
    )


def index_text(spec: dict[str, Any], source: dict[str, Any]) -> str:
    rows = [
        f"| {family['title']} | `{family['skill']}` | "
        f"`skills/{family['skill']}/CAPABILITIES.generated.md` | `{family['reference']}` |"
        for family in sorted(spec["families"], key=lambda item: item["id"])
    ]
    return "\n".join(
        [
            "<!-- GENERATED: scripts/generate_harness_capability_projections.py -->",
            "# Harness capability teaching projections",
            "",
            "This is a compact index, not a second global tool catalog. Each family catalog is generated from `capabilities/families.json` and checked against the source-derived surface snapshot.",
            "",
            f"Plugin version: `{spec['plugin_version']}`. Source server version: `{source.get('server_version')}`.",
            f"Source catalog SHA-256: `{source.get('source_catalog_sha256')}`.",
            "",
            "| Family | Skill | Generated catalog | Behavioral reference |",
            "|---|---|---|---|",
            *rows,
            "",
        ]
    )


def compatibility_text(spec: dict[str, Any]) -> str:
    rows = []
    for item in sorted(spec.get("compatibility", []), key=lambda value: value["name"]):
        rows.append(
            f"| `{item['name']}` | {item['status']} | {item.get('replacement', 'same canonical name')} | {item['reason']} |"
        )
    return "\n".join(
        [
            "<!-- GENERATED: scripts/generate_harness_capability_projections.py -->",
            "# Harness compatibility and deprecation projection",
            "",
            "Removed names are documentation-only and must never re-enter current routing or family catalogs.",
            "",
            "| Name | Status | Replacement | Reason |",
            "|---|---|---|---|",
            *rows,
            "",
        ]
    )


def rendered_files(plugin_root: Path, spec: dict[str, Any], source: dict[str, Any]) -> dict[Path, bytes]:
    files: dict[Path, bytes] = {
        plugin_root / "references" / "CAPABILITY_CATALOG.generated.md": index_text(spec, source).encode(),
        plugin_root / "references" / "COMPATIBILITY.generated.md": compatibility_text(spec).encode(),
    }
    for family in spec["families"]:
        path = plugin_root / "skills" / family["skill"] / "CAPABILITIES.generated.md"
        files[path] = family_catalog_text(family, source, spec["plugin_version"]).encode()
    return files


def check_or_write(files: dict[Path, bytes], *, check: bool) -> list[Path]:
    changed: list[Path] = []
    for path, expected in sorted(files.items(), key=lambda item: str(item[0])):
        actual = path.read_bytes() if path.exists() else None
        if actual == expected:
            continue
        changed.append(path)
        if not check:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    return changed


def validate_generated_links(plugin_root: Path, spec: dict[str, Any]) -> None:
    for family in spec["families"]:
        skill_dir = plugin_root / "skills" / family["skill"]
        skill_text = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
        if "CAPABILITIES.generated.md" not in skill_text:
            raise ProjectionError(
                f"broken generated-catalog skill link: skills/{family['skill']}/SKILL.md"
            )
        if not (skill_dir / "CAPABILITIES.generated.md").is_file():
            raise ProjectionError(
                f"missing generated family catalog: skills/{family['skill']}/CAPABILITIES.generated.md"
            )


def tree_hashes(root: Path, relative_paths: Iterable[Path]) -> dict[str, str]:
    hashes: dict[str, str] = {}
    for relative in sorted(relative_paths, key=str):
        path = root / relative
        if not path.is_file():
            raise ProjectionError(f"installed cache missing projected file: {relative}")
        hashes[str(relative)] = sha256_bytes(path.read_bytes())
    return hashes


def validate_installed_cache(plugin_root: Path, installed_root: Path, spec: dict[str, Any]) -> None:
    installed_skills = installed_root / "skills"
    full_plugin_cache = installed_skills.is_dir()
    source_prefix = Path("skills")
    installed_prefix = Path("skills")
    if not installed_skills.is_dir() and (installed_root / spec["families"][0]["skill"]).is_dir():
        installed_prefix = Path()

    relative_source: list[Path] = []
    relative_installed: list[Path] = []
    for family in spec["families"]:
        for filename in ("SKILL.md", "CAPABILITIES.generated.md"):
            relative_source.append(source_prefix / family["skill"] / filename)
            relative_installed.append(installed_prefix / family["skill"] / filename)
    if full_plugin_cache:
        for relative in (
            Path("capabilities/families.json"),
            Path("capabilities/source-surfaces.json"),
            Path("references/CAPABILITY_CATALOG.generated.md"),
            Path("references/COMPATIBILITY.generated.md"),
        ):
            relative_source.append(relative)
            relative_installed.append(relative)
    source_hashes = tree_hashes(plugin_root, relative_source)
    normalized_installed: dict[str, str] = {}
    for source_relative, installed_relative in zip(relative_source, relative_installed, strict=True):
        installed_path = installed_root / installed_relative
        if not installed_path.is_file():
            raise ProjectionError(
                f"installed cache missing projected file: {installed_relative}"
            )
        normalized_installed[str(source_relative)] = sha256_bytes(installed_path.read_bytes())
    if source_hashes != normalized_installed:
        differing = sorted(set(source_hashes) | set(normalized_installed))
        detail = [path for path in differing if source_hashes.get(path) != normalized_installed.get(path)]
        raise ProjectionError(f"source/installed-cache content drift: {', '.join(detail)}")

    manifest_path = installed_root / ".codex-plugin" / "plugin.json"
    if manifest_path.is_file():
        installed_version = read_json(manifest_path).get("version")
        source_version = plugin_versions(plugin_root)["source"]
        if installed_version != source_version:
            raise ProjectionError(
                f"source/installed-cache version drift: source={source_version} installed={installed_version}"
            )
