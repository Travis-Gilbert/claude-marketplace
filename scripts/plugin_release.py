#!/usr/bin/env python3
"""Build and verify deterministic standalone plugin cache artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import stat
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
IGNORED_NAMES = {".DS_Store", "__pycache__"}
IGNORED_SUFFIXES = {".pyc", ".pyo"}


class ReleaseError(RuntimeError):
    """The release contract or materialized artifact is invalid."""


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ReleaseError(f"missing JSON file: {path}") from None
    except json.JSONDecodeError as exc:
        raise ReleaseError(f"invalid JSON in {path}: {exc}") from None


def plugin_root(plugin: str) -> Path:
    candidate = Path(plugin)
    if not candidate.is_absolute():
        candidate = ROOT / candidate
    candidate = candidate.resolve()
    if not (candidate / "plugin.manifest.json").is_file():
        raise ReleaseError(f"missing plugin.manifest.json under {candidate}")
    return candidate


def contract(root: Path) -> dict[str, Any]:
    spec = read_json(root / "plugin.manifest.json")
    plugin = spec.get("plugin")
    release = spec.get("release")
    mcp_servers = spec.get("mcpServers")
    if not isinstance(plugin, dict):
        raise ReleaseError("plugin.manifest.json: plugin must be an object")
    if not isinstance(plugin.get("name"), str) or not plugin["name"]:
        raise ReleaseError("plugin.manifest.json: plugin.name must be non-empty")
    if not isinstance(plugin.get("version"), str) or not plugin["version"]:
        raise ReleaseError("plugin.manifest.json: plugin.version must be non-empty")
    if not isinstance(release, dict) or not isinstance(release.get("include"), list):
        raise ReleaseError("plugin.manifest.json: release.include must be a list")
    if not release["include"]:
        raise ReleaseError("plugin.manifest.json: release.include must not be empty")
    if not isinstance(mcp_servers, dict) or not mcp_servers:
        raise ReleaseError("plugin.manifest.json: mcpServers must be non-empty")
    return spec


def release_files(root: Path, spec: dict[str, Any]) -> list[Path]:
    files: set[Path] = set()
    for entry in spec["release"]["include"]:
        relative = Path(entry)
        if relative.is_absolute() or ".." in relative.parts:
            raise ReleaseError(f"release include escapes plugin root: {entry}")
        source = root / relative
        if source.is_symlink():
            raise ReleaseError(f"release include must not be a symlink: {entry}")
        if source.is_file():
            files.add(relative)
            continue
        if not source.is_dir():
            raise ReleaseError(f"release include does not exist: {entry}")
        for path in source.rglob("*"):
            if path.is_symlink():
                raise ReleaseError(
                    f"release artifact must not contain symlinks: {path.relative_to(root)}"
                )
            if not path.is_file() or ignored(path):
                continue
            files.add(path.relative_to(root))
    if not files:
        raise ReleaseError("release include set contains no files")
    return sorted(files, key=lambda path: path.as_posix())


def ignored(path: Path) -> bool:
    return (
        any(part in IGNORED_NAMES for part in path.parts)
        or path.suffix in IGNORED_SUFFIXES
    )


def artifact_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ReleaseError(
                f"release artifact must not contain symlinks: {path.relative_to(root)}"
            )
        if path.is_file() and not ignored(path):
            files.append(path.relative_to(root))
    return sorted(files, key=lambda path: path.as_posix())


def file_record(root: Path, relative: Path) -> dict[str, Any]:
    path = root / relative
    mode = stat.S_IMODE(path.stat().st_mode)
    return {
        "path": relative.as_posix(),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "executable": bool(mode & 0o111),
    }


def tree_receipt(root: Path, spec: dict[str, Any]) -> dict[str, Any]:
    files = [file_record(root, path) for path in release_files(root, spec)]
    payload = json.dumps(files, sort_keys=True, separators=(",", ":")).encode()
    mcp_payload = json.dumps(
        spec["mcpServers"], sort_keys=True, separators=(",", ":")
    ).encode()
    return {
        "schema_version": 1,
        "plugin": spec["plugin"]["name"],
        "version": spec["plugin"]["version"],
        "artifact_content_sha256": hashlib.sha256(payload).hexdigest(),
        "mcp_fingerprint_sha256": hashlib.sha256(mcp_payload).hexdigest(),
        "file_count": len(files),
        "files": files,
    }


def verify_manifests(root: Path, spec: dict[str, Any]) -> None:
    name = spec["plugin"]["name"]
    version = spec["plugin"]["version"]
    claude = read_json(root / ".claude-plugin" / "plugin.json")
    codex = read_json(root / ".codex-plugin" / "plugin.json")
    mcp = read_json(root / ".mcp.json")
    if claude.get("name") != name or codex.get("name") != name:
        raise ReleaseError("source and generated host plugin names differ")
    versions = {version, claude.get("version"), codex.get("version")}
    if versions != {version}:
        raise ReleaseError(f"source and generated host versions differ: {versions}")
    if claude.get("mcpServers") != spec["mcpServers"]:
        raise ReleaseError("Claude MCP payload differs from canonical manifest")
    if mcp.get("mcpServers") != spec["mcpServers"]:
        raise ReleaseError("Codex .mcp.json differs from canonical manifest")
    if codex.get("mcpServers") != "./.mcp.json":
        raise ReleaseError("Codex manifest must reference generated .mcp.json")


def verify_artifact(
    source: Path, artifact: Path, spec: dict[str, Any]
) -> dict[str, Any]:
    source_receipt = tree_receipt(source, spec)
    artifact_spec = contract(artifact)
    verify_manifests(artifact, artifact_spec)
    expected_files = release_files(source, spec)
    actual_files = artifact_files(artifact)
    if actual_files != expected_files:
        unexpected = sorted(set(actual_files) - set(expected_files))
        missing = sorted(set(expected_files) - set(actual_files))
        detail = []
        if unexpected:
            detail.append(
                "unexpected=" + ",".join(path.as_posix() for path in unexpected)
            )
        if missing:
            detail.append("missing=" + ",".join(path.as_posix() for path in missing))
        raise ReleaseError("artifact file-set drift: " + " ".join(detail))
    artifact_receipt = tree_receipt(artifact, artifact_spec)
    for key in (
        "plugin",
        "version",
        "artifact_content_sha256",
        "mcp_fingerprint_sha256",
    ):
        if artifact_receipt[key] != source_receipt[key]:
            raise ReleaseError(
                f"source/artifact {key} drift: "
                f"source={source_receipt[key]} artifact={artifact_receipt[key]}"
            )
    return artifact_receipt


def copy_release(source: Path, destination: Path, spec: dict[str, Any]) -> None:
    for relative in release_files(source, spec):
        source_path = source / relative
        destination_path = destination / relative
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, destination_path)


def install(source: Path, destination: Path, backup_dir: Path | None) -> dict[str, Any]:
    spec = contract(source)
    verify_manifests(source, spec)
    destination = destination.resolve()
    if (
        destination == source
        or source in destination.parents
        or destination in source.parents
    ):
        raise ReleaseError("install destination must not overlap the plugin source")
    destination.parent.mkdir(parents=True, exist_ok=True)
    backup: Path | None = None
    if destination.exists() or destination.is_symlink():
        if backup_dir is None:
            raise ReleaseError(
                "destination exists; pass --backup-dir for a reversible reinstall"
            )
        backup_dir = backup_dir.resolve()
        if backup_dir == source or source in backup_dir.parents:
            raise ReleaseError("backup directory must stay outside the plugin source")
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup = backup_dir / f"{destination.name}.previous"
        if backup.exists() or backup.is_symlink():
            raise ReleaseError(f"backup destination already exists: {backup}")

    temp = Path(
        tempfile.mkdtemp(prefix=f".{destination.name}.tmp-", dir=destination.parent)
    )
    try:
        copy_release(source, temp, spec)
        verify_artifact(source, temp, spec)
        if backup is not None:
            destination.rename(backup)
        temp.rename(destination)
    except Exception:
        shutil.rmtree(temp, ignore_errors=True)
        if backup is not None and backup.exists() and not destination.exists():
            backup.rename(destination)
        raise

    receipt = verify_artifact(source, destination, spec)
    receipt["installed_path"] = str(destination)
    receipt["backup_path"] = str(backup) if backup else None
    if backup is not None:
        receipt["rollback_command"] = (
            f"rm -rf -- {shell_quote(destination)} && mv -- "
            f"{shell_quote(backup)} {shell_quote(destination)}"
        )
    else:
        receipt["rollback_command"] = f"rm -rf -- {shell_quote(destination)}"
    return receipt


def shell_quote(path: Path) -> str:
    value = str(path)
    return "'" + value.replace("'", "'\"'\"'") + "'"


def write_receipt(receipt: dict[str, Any], output: Path | None) -> None:
    rendered = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    if output is None:
        sys.stdout.write(rendered)
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    inspect_parser = subparsers.add_parser("inspect")
    inspect_parser.add_argument("plugin")
    inspect_parser.add_argument("--receipt", type=Path)

    install_parser = subparsers.add_parser("install")
    install_parser.add_argument("plugin")
    install_parser.add_argument("destination", type=Path)
    install_parser.add_argument("--backup-dir", type=Path)
    install_parser.add_argument("--receipt", type=Path)

    verify_parser = subparsers.add_parser("verify")
    verify_parser.add_argument("plugin")
    verify_parser.add_argument("artifact", type=Path)
    verify_parser.add_argument("--receipt", type=Path)

    args = parser.parse_args()
    try:
        source = plugin_root(args.plugin)
        spec = contract(source)
        verify_manifests(source, spec)
        if args.command == "inspect":
            receipt = tree_receipt(source, spec)
        elif args.command == "install":
            receipt = install(source, args.destination, args.backup_dir)
        else:
            receipt = verify_artifact(source, args.artifact.resolve(), spec)
        write_receipt(receipt, args.receipt)
        return 0
    except (OSError, ReleaseError) as exc:
        print(f"plugin release failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
