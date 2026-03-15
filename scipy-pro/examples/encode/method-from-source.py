"""
Method from Source Example
===========================
Demonstrates creating a Method from a source Object: extract procedural
knowledge from text, structure it as a JSON definition conforming to the
Method DSL, link to source Objects for provenance, and track versions.

Pipeline:
  source Object -> extract procedural steps -> structure as Method JSON
  -> link to source Objects -> create versioned Method record

Key concepts:
  - Method: versioned executable knowledge in research_api
  - Method DSL: JSON structure for encoding procedures (not Turing-complete)
  - Provenance: every Method links to the Objects it was derived from
  - Version tracking: Methods are versioned, each change creates a new version
  - Two-mode: LLM extraction in dev, rule-based in production
"""

import hashlib
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import
# ---------------------------------------------------------------------------
try:
    from apps.research.advanced_nlp import extract_procedures_llm
    _LLM_AVAILABLE = True
except ImportError:
    _LLM_AVAILABLE = False

import spacy
nlp = spacy.load("en_core_web_sm")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Object:
    """Source Object containing procedural knowledge."""
    id: int
    title: str
    body: str
    object_type: str = "source"


@dataclass
class MethodStep:
    """A single step in a Method definition."""
    order: int
    action: str          # verb phrase: "measure", "compare", "apply"
    target: str          # what the action operates on
    parameters: dict = field(default_factory=dict)
    condition: Optional[str] = None  # optional guard condition
    output: Optional[str] = None     # what this step produces


@dataclass
class Method:
    """Versioned executable knowledge. Methods encode procedures extracted
    from source Objects into a structured, repeatable form.

    Invariant: every Method carries its provenance -- the source Objects
    and extraction method used to create it.
    """
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    version: int = 1
    steps: list[MethodStep] = field(default_factory=list)
    source_object_ids: list[int] = field(default_factory=list)
    extraction_method: str = "rule"  # rule | llm
    domain: str = "general"
    status: str = "draft"            # draft | reviewed | canonical
    sha: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        if not self.sha:
            self.sha = self._generate_sha()

    def _generate_sha(self) -> str:
        """Deterministic identity based on name, version, and step content."""
        step_text = "|".join(f"{s.order}:{s.action}:{s.target}" for s in self.steps)
        payload = f"{self.name}|v{self.version}|{step_text}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]

    def to_dsl_json(self) -> dict:
        """Serialize to the Method DSL JSON format.

        The DSL is intentionally not Turing-complete: it supports
        sequential steps with conditions but no loops or recursion.
        This keeps Methods auditable and human-reviewable.
        """
        return {
            "method": self.name,
            "version": self.version,
            "domain": self.domain,
            "description": self.description,
            "provenance": {
                "source_object_ids": self.source_object_ids,
                "extraction_method": self.extraction_method,
                "sha": self.sha,
            },
            "steps": [
                {
                    "order": step.order,
                    "action": step.action,
                    "target": step.target,
                    "parameters": step.parameters,
                    **({"condition": step.condition} if step.condition else {}),
                    **({"output": step.output} if step.output else {}),
                }
                for step in self.steps
            ],
        }


# ---------------------------------------------------------------------------
# Stage 1: Extract procedural steps from source text
# ---------------------------------------------------------------------------

# Procedural verb indicators for rule-based extraction
PROCEDURAL_VERBS = {
    "measure", "calculate", "compute", "determine", "evaluate",
    "compare", "check", "verify", "test", "validate",
    "apply", "use", "select", "choose", "identify",
    "record", "document", "note", "report", "log",
    "prepare", "set up", "configure", "initialize",
    "repeat", "iterate", "review", "revise", "update",
}


def extract_steps_rule_based(text: str) -> list[MethodStep]:
    """Rule-based extraction of procedural steps from text.

    Looks for:
      1. Numbered lists (1. Do X, 2. Do Y)
      2. Imperative sentences (verb-first with procedural verbs)
      3. Conditional patterns ("if X, then Y")

    Available in both production and dev modes.
    """
    doc = nlp(text)
    steps = []
    order = 1

    for sent in doc.sents:
        s = sent.text.strip()
        if not s:
            continue

        # Pattern 1: Numbered list items
        # "1. Measure the specimen" or "Step 1: Measure the specimen"
        import re
        numbered = re.match(r"^(?:step\s+)?(\d+)[.):]\s*(.+)", s, re.IGNORECASE)
        if numbered:
            step_text = numbered.group(2).strip()
            step = _parse_step_text(step_text, order)
            if step:
                steps.append(step)
                order += 1
            continue

        # Pattern 2: Imperative sentences starting with a procedural verb
        first_token = sent[0] if len(sent) > 0 else None
        if first_token and first_token.lemma_.lower() in PROCEDURAL_VERBS:
            step = _parse_step_text(s, order)
            if step:
                steps.append(step)
                order += 1
            continue

        # Pattern 3: Conditional patterns
        if s.lower().startswith("if "):
            cond_match = re.match(r"^if\s+(.+?),\s*(?:then\s+)?(.+)", s, re.IGNORECASE)
            if cond_match:
                condition = cond_match.group(1).strip()
                action_text = cond_match.group(2).strip()
                step = _parse_step_text(action_text, order)
                if step:
                    step.condition = condition
                    steps.append(step)
                    order += 1

    return steps


def _parse_step_text(text: str, order: int) -> Optional[MethodStep]:
    """Parse a step description into action and target components."""
    doc = nlp(text)

    # Extract the main verb (action) and its object (target)
    action = None
    target = None

    for token in doc:
        if token.pos_ == "VERB" and action is None:
            action = token.lemma_.lower()
        if token.dep_ in ("dobj", "pobj") and target is None:
            # Get the full noun phrase
            target = " ".join(t.text for t in token.subtree)

    if action:
        return MethodStep(
            order=order,
            action=action,
            target=target or text,  # fallback to full text if no object found
        )
    return None


def extract_steps_llm(text: str) -> list[MethodStep]:
    """LLM-based extraction of procedural steps. More accurate for
    complex or implicit procedures. Only available in dev mode."""
    if not _LLM_AVAILABLE:
        return extract_steps_rule_based(text)

    # extract_procedures_llm returns structured step data
    raw_steps = extract_procedures_llm(text)
    return [
        MethodStep(
            order=i + 1,
            action=step["action"],
            target=step["target"],
            parameters=step.get("parameters", {}),
            condition=step.get("condition"),
            output=step.get("output"),
        )
        for i, step in enumerate(raw_steps)
    ]


# ---------------------------------------------------------------------------
# Stage 2: Create Method from extracted steps
# ---------------------------------------------------------------------------
def create_method_from_source(
    source_object: Object,
    name: Optional[str] = None,
    domain: str = "general",
    prefer_llm: bool = True,
) -> Method:
    """Full pipeline: extract procedural knowledge from a source Object
    and create a versioned Method record.

    1. Extract steps (LLM or rule-based)
    2. Structure as Method with DSL-conformant JSON
    3. Link to source Object for provenance
    4. Set status to 'draft' (humans review before promotion)
    """
    # Choose extraction method
    if prefer_llm and _LLM_AVAILABLE:
        steps = extract_steps_llm(source_object.body)
        extraction_method = "llm"
    else:
        steps = extract_steps_rule_based(source_object.body)
        extraction_method = "rule"

    if not steps:
        logger.warning("No procedural steps found in '%s'", source_object.title)

    method = Method(
        name=name or f"Method from '{source_object.title}'",
        description=f"Procedural knowledge extracted from Object #{source_object.id}",
        steps=steps,
        source_object_ids=[source_object.id],
        extraction_method=extraction_method,
        domain=domain,
        status="draft",  # LLMs propose, humans review
    )

    logger.info(
        "Created method '%s' with %d steps (extraction=%s)",
        method.name, len(method.steps), extraction_method,
    )
    return method


# ---------------------------------------------------------------------------
# Stage 3: Version tracking
# ---------------------------------------------------------------------------
def create_new_version(
    existing_method: Method,
    updated_steps: list[MethodStep],
    reason: str = "",
) -> Method:
    """Create a new version of an existing Method.

    Methods are immutable once reviewed. To update a Method, create a new
    version that links back to the same source Objects plus any new ones.
    """
    new_method = Method(
        name=existing_method.name,
        description=existing_method.description,
        version=existing_method.version + 1,
        steps=updated_steps,
        source_object_ids=existing_method.source_object_ids.copy(),
        extraction_method=existing_method.extraction_method,
        domain=existing_method.domain,
        status="draft",
    )

    logger.info(
        "Created v%d of '%s' (was v%d). Reason: %s",
        new_method.version, new_method.name, existing_method.version, reason,
    )
    return new_method


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    source = Object(
        id=42,
        title="Concrete Strength Testing Protocol",
        body="""
        1. Prepare three cylindrical specimens (150mm x 300mm) from the batch.
        2. Cure specimens in a water bath at 23 +/- 2 degrees Celsius for 28 days.
        3. Remove specimens and allow surface moisture to evaporate for 2 hours.
        4. Measure the diameter at three points along the height.
        5. If any diameter varies by more than 2%, reject the specimen.
        6. Apply compressive load at a rate of 0.25 MPa per second.
        7. Record the maximum load at failure.
        8. Calculate compressive strength as load divided by cross-sectional area.
        9. Report the average of three specimens as the batch strength.
        """,
    )

    method = create_method_from_source(
        source,
        name="Concrete Compressive Strength Test",
        domain="structural_engineering",
    )

    print(f"Method: {method.name}")
    print(f"Version: {method.version}")
    print(f"Status: {method.status}")
    print(f"SHA: {method.sha}")
    print(f"Source Objects: {method.source_object_ids}")
    print(f"Extraction: {method.extraction_method}")
    print(f"\nSteps ({len(method.steps)}):")
    for step in method.steps:
        cond = f" [if {step.condition}]" if step.condition else ""
        print(f"  {step.order}. {step.action} -> {step.target}{cond}")

    print(f"\nDSL JSON:")
    print(json.dumps(method.to_dsl_json(), indent=2))
