"""Programmatic auto-capture for the compound learning layer.

Accepts structured capture data from a solved problem, writes a solution
doc to knowledge/solutions/, extracts claims, deduplicates against
existing claims, and appends new claims to claims.jsonl.

The in-session path is direct file writes by the agent (CLAUDE.md
instructions). This module exists for programmatic use: testing, batch
capture, and retroactive extraction.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from scripts.epistemic.config import (
    CLAIMS_FILE,
    DEFAULT_CONFIDENCE,
    knowledge_path,
)
from scripts.epistemic.schema import (
    Claim,
    ClaimStatus,
    ClaimType,
    Evidence,
    claim_id,
    today_iso,
)

AUTO_CAPTURE_SOURCE = "auto-capture"
AUTO_CAPTURE_TYPE: ClaimType = "empirical"
AUTO_CAPTURE_STATUS: ClaimStatus = "active"


def _load_existing_ids(claims_file: Path) -> set[str]:
    """Load all existing claim IDs from a claims.jsonl file."""
    ids: set[str] = set()
    if not claims_file.exists():
        return ids
    with claims_file.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ids.add(json.loads(line)["id"])
            except (json.JSONDecodeError, KeyError):
                continue
    return ids


def _solution_filename(domain: str, date_str: str, solutions_dir: Path) -> str:
    """Generate a unique solution filename, appending a counter if needed."""
    slug = domain.replace(".", "-").replace("_", "-")
    base = f"{slug}-{date_str}"
    candidate = f"{base}.md"
    if not (solutions_dir / candidate).exists():
        return candidate
    counter = 2
    while (solutions_dir / f"{base}-{counter}.md").exists():
        counter += 1
    return f"{base}-{counter}.md"


def _render_solution_doc(
    problem: str,
    root_cause: str,
    solution: str,
    prevention: str,
    domain: str,
    agents_involved: list[str],
    claims: list[Claim],
    date_str: str,
) -> str:
    """Render a solution document in markdown."""
    agents_str = ", ".join(agents_involved) if agents_involved else "unknown"
    claims_lines = "\n".join(
        f'- claim-{c.id}: "{c.text}"' for c in claims
    )
    return f"""# {problem}

**Date:** {date_str}
**Domain:** {domain}
**Agents involved:** {agents_str}

## Problem
{problem}

## Root Cause
{root_cause}

## Solution
{solution}

## Prevention
{prevention}

## Claims Extracted
{claims_lines}
"""


def _extract_claims(
    root_cause: str,
    solution: str,
    prevention: str,
    agent_source: str,
) -> list[dict[str, str]]:
    """Extract candidate claim texts from structured capture data.

    Returns a list of dicts with 'text' and 'agent_source' keys.
    """
    claims: list[dict[str, str]] = []

    if root_cause and len(root_cause) > 20:
        claims.append({"text": root_cause.strip(), "agent_source": agent_source})

    if solution and len(solution) > 20:
        claims.append({"text": solution.strip(), "agent_source": agent_source})

    if prevention and len(prevention) > 10:
        claims.append({"text": prevention.strip(), "agent_source": agent_source})

    return claims


def capture_solution(
    plugin_name: str,
    problem: str,
    root_cause: str,
    solution: str,
    prevention: str,
    domain: str,
    agents_involved: list[str] | None = None,
    tags: list[str] | None = None,
    project: str = "",
) -> dict[str, Any]:
    """Capture a solved problem as a solution doc + claims.

    Returns:
        {
            "solution_file": "knowledge/solutions/filename.md",
            "claims_added": [{"id": "...", "text": "..."}, ...],
            "claims_skipped": int,
        }
    """
    agents_involved = agents_involved or []
    tags = tags or []
    date_str = today_iso()
    agent_source = agents_involved[0] if agents_involved else AUTO_CAPTURE_SOURCE

    kpath = knowledge_path(plugin_name)
    solutions_dir = kpath / "solutions"
    solutions_dir.mkdir(parents=True, exist_ok=True)

    claims_file = kpath / CLAIMS_FILE
    existing_ids = _load_existing_ids(claims_file)

    candidates = _extract_claims(root_cause, solution, prevention, agent_source)

    claims_skipped = 0
    new_claims: list[Claim] = []

    for candidate in candidates:
        cid = claim_id(plugin_name, candidate["text"])
        if cid in existing_ids:
            claims_skipped += 1
            continue
        existing_ids.add(cid)

        new_claims.append(Claim(
            id=cid,
            text=candidate["text"],
            domain=domain,
            agent_source=candidate["agent_source"],
            type=AUTO_CAPTURE_TYPE,
            confidence=DEFAULT_CONFIDENCE,
            source=AUTO_CAPTURE_SOURCE,
            first_seen=date_str,
            last_validated=date_str,
            status=AUTO_CAPTURE_STATUS,
            evidence=Evidence(),
            projects_seen=[project] if project else [],
            tags=tags,
            related_claims=[],
        ))

    filename = _solution_filename(domain, date_str, solutions_dir)
    solution_doc = _render_solution_doc(
        problem, root_cause, solution, prevention,
        domain, agents_involved, new_claims, date_str,
    )
    (solutions_dir / filename).write_text(solution_doc)

    if new_claims:
        with claims_file.open("a") as f:
            for claim in new_claims:
                f.write(claim.model_dump_json() + "\n")

    return {
        "solution_file": f"knowledge/solutions/{filename}",
        "claims_added": [{"id": c.id, "text": c.text} for c in new_claims],
        "claims_skipped": claims_skipped,
    }
