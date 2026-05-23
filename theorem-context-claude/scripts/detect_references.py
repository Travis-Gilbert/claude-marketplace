#!/usr/bin/env python3
"""Detect whether a tool result referenced recently injected atoms."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

TOKEN_RE = re.compile(r"[A-Za-z0-9_./:-]{3,}")


def detect_references(
    *,
    tool_event: dict[str, Any],
    atoms: list[dict[str, Any]],
    threshold: float = 0.4,
) -> list[dict[str, Any]]:
    text = _event_text(tool_event)
    text_tokens = _tokens(text)
    matches: list[dict[str, Any]] = []
    for atom in atoms:
        atom_id = str(atom.get("atom_id") or atom.get("id") or "").strip()
        if not atom_id:
            continue
        body = str(atom.get("body") or atom.get("text") or "")
        title = str(atom.get("title") or atom.get("kind") or atom_id)
        score = max(
            _slug_score(atom_id, text),
            _path_score(atom, text),
            _overlap_score(text_tokens, _tokens(body)),
        )
        if score < threshold:
            continue
        matches.append({
            "atom_id": atom_id,
            "confidence": round(score, 4),
            "match_type": _match_type(atom_id, atom, text, score),
            "title": title,
        })
    matches.sort(key=lambda item: item["confidence"], reverse=True)
    return matches


def _event_text(event: dict[str, Any]) -> str:
    parts: list[str] = []
    stack: list[Any] = [event]
    while stack:
        value = stack.pop()
        if isinstance(value, dict):
            stack.extend(value.values())
        elif isinstance(value, list):
            stack.extend(value)
        elif value is not None:
            parts.append(str(value))
    return "\n".join(parts)


def _tokens(text: str) -> set[str]:
    return {token.lower() for token in TOKEN_RE.findall(str(text or ""))}


def _slug_score(atom_id: str, text: str) -> float:
    slug = atom_id.lower()
    if slug and slug in text.lower():
        return 1.0
    tail = slug.rsplit(":", 1)[-1].rsplit("/", 1)[-1]
    if len(tail) >= 5 and tail in text.lower():
        return 0.85
    return 0.0


def _path_score(atom: dict[str, Any], text: str) -> float:
    text_lower = text.lower()
    for key in ("path", "file_path", "filepath"):
        raw = str(atom.get(key) or "").strip()
        if raw and raw.lower() in text_lower:
            return 0.9
    return 0.0


def _overlap_score(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return min(1.0, len(left & right) / max(4, min(len(left), len(right))))


def _match_type(atom_id: str, atom: dict[str, Any], text: str, score: float) -> str:
    if _slug_score(atom_id, text) >= score:
        return "slug"
    if _path_score(atom, text) >= score:
        return "path"
    return "token_overlap"


def _read_json_arg(value: str) -> dict[str, Any]:
    if value == "-":
        raw = sys.stdin.read()
    else:
        raw = Path(value).read_text(encoding="utf-8")
    payload = json.loads(raw or "{}")
    if not isinstance(payload, dict):
        raise ValueError("tool event JSON must be an object")
    return payload


def _read_atoms(path: str) -> list[dict[str, Any]]:
    if not path:
        return []
    raw = Path(path).read_text(encoding="utf-8") if Path(path).exists() else "[]"
    if not raw.strip():
        return []
    if raw.lstrip().startswith("["):
        parsed = json.loads(raw)
        return [dict(item) for item in parsed if isinstance(item, dict)]
    atoms = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        item = json.loads(line)
        if isinstance(item, dict):
            atoms.append(item)
    return atoms


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tool-json", default="-")
    parser.add_argument("--atoms-file", default="")
    parser.add_argument("--threshold", type=float, default=0.4)
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    event = _read_json_arg(args.tool_json)
    atoms = _read_atoms(args.atoms_file)[-max(1, args.limit):]
    references = detect_references(
        tool_event=event,
        atoms=atoms,
        threshold=args.threshold,
    )
    print(json.dumps({"references": references}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
