"""Load agent definitions and skill text from the plugin filesystem."""
from __future__ import annotations

import re
from pathlib import Path

from claude_agent_sdk import AgentDefinition

_FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.DOTALL)


def _parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    raw, body = m.group(1), m.group(2)
    fields: dict[str, str] = {}
    current_key: str | None = None
    for line in raw.splitlines():
        if not line.strip():
            continue
        if line.startswith(" ") and current_key is not None:
            fields[current_key] = (fields.get(current_key, "") + " " + line.strip()).strip()
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        if val.startswith(">-") or val == ">":
            current_key = key
            fields[key] = ""
            continue
        fields[key] = val
        current_key = key
    return fields, body.strip()


def _split_csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


def load_agent_definitions(agents_dir: Path) -> dict[str, AgentDefinition]:
    """Read every *.md in agents_dir, return name -> AgentDefinition.

    Skips files without frontmatter or without a `name:` field.
    """
    out: dict[str, AgentDefinition] = {}
    if not agents_dir.is_dir():
        return out
    for path in sorted(agents_dir.glob("*.md")):
        text = path.read_text()
        fields, body = _parse_frontmatter(text)
        name = fields.get("name") or path.stem
        if not name:
            continue
        tools_field = fields.get("tools")
        tools = _split_csv(tools_field) if tools_field else None
        out[name] = AgentDefinition(
            description=fields.get("description", "").strip(),
            prompt=body,
            tools=tools,
            model=fields.get("model"),
        )
    return out


def load_skill_text(lib_dir: Path, *, names: list[str]) -> str:
    """Concatenate the SKILL.md files for the named skills. Missing skills skip silently."""
    parts: list[str] = []
    for name in names:
        skill = lib_dir / name / "SKILL.md"
        try:
            parts.append(skill.read_text())
        except (OSError, FileNotFoundError):
            continue
    return "\n\n".join(parts)
