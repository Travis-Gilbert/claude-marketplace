"""Cheap, deterministic codebase grounding (no LLM)."""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

_DEFAULT_INCLUDE = ["*.py", "*.ts", "*.tsx", "*.js", "*.jsx", "*.md", "*.toml"]
_DEFAULT_EXCLUDE = [".venv", "node_modules", ".git", "dist", "build", "__pycache__"]


def _have_rg() -> bool:
    return shutil.which("rg") is not None


def grep_for_topic(topic: str, *, repo_root: Path, max_files: int = 12) -> list[Path]:
    """Return up to max_files paths whose contents match the topic.

    Uses ripgrep when available; falls back to a Python walker.
    Topic words are split on whitespace; OR-matched (case-insensitive).
    """
    words = [w for w in topic.split() if len(w) >= 3]
    if not words:
        return []
    pattern = "|".join(words)

    if _have_rg():
        cmd = ["rg", "-l", "-i", "-e", pattern, "--max-count", "1"]
        for p in _DEFAULT_EXCLUDE:
            cmd += ["-g", f"!{p}"]
        for p in _DEFAULT_INCLUDE:
            cmd += ["-g", p]
        result = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True)
        files = [Path(line) for line in result.stdout.splitlines() if line.strip()]
        return files[:max_files]

    matches: list[Path] = []
    for path in repo_root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in _DEFAULT_EXCLUDE for part in path.parts):
            continue
        if not any(path.match(g) for g in _DEFAULT_INCLUDE):
            continue
        try:
            content = path.read_text(errors="ignore")
        except OSError:
            continue
        if any(w.lower() in content.lower() for w in words):
            matches.append(path.relative_to(repo_root))
            if len(matches) >= max_files:
                break
    return matches


def recent_commits_touching(files: list[Path], *, repo_root: Path, limit: int = 30) -> list[str]:
    """Return one-line commit messages touching any of `files`. Empty if no files."""
    if not files:
        return []
    cmd = ["git", "log", f"-n{limit}", "--pretty=format:%h %s", "--"] + [str(f) for f in files]
    result = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True)
    if result.returncode != 0:
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def read_claude_md_chain(*, project_root: Path, global_path: Path | None) -> str:
    """Concatenate global + project CLAUDE.md content. Missing files are skipped silently."""
    parts: list[str] = []
    paths: list[Path] = []
    if global_path is not None:
        paths.append(global_path)
    paths.append(project_root / "CLAUDE.md")
    for p in paths:
        try:
            parts.append(p.read_text())
        except (OSError, FileNotFoundError):
            continue
    return "\n\n".join(parts)
