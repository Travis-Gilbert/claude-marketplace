"""
Rule Compilation Example
=========================
Demonstrates compiling source text (design guides, laws, protocols) into
structured JSON Method definitions with full provenance tracking.

Pipeline:
  source text (guide/law/protocol) -> extract rules/steps -> compile to
  structured JSON -> create versioned Method with provenance chain

Key concepts:
  - Rule extraction: identifying normative statements (shall, must, requires)
  - Method DSL: JSON structure for executable knowledge (not Turing-complete)
  - Compilation: text rules become structured, evaluable definitions
  - Provenance chain: compiled Method links to source text, extraction event,
    and review decision
  - Domain packs: compilation rules vary by domain (engineering, legal, etc.)
"""

import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

logger = logging.getLogger(__name__)

import spacy
nlp = spacy.load("en_core_web_sm")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class ExtractedRule:
    """A normative statement extracted from source text."""
    text: str
    rule_type: str        # "requirement", "prohibition", "recommendation", "definition"
    modality: str         # "shall", "must", "should", "may"
    subject: str          # who/what the rule applies to
    condition: Optional[str] = None   # "if" / "when" guard
    source_span: tuple[int, int] = (0, 0)
    confidence: float = 1.0


@dataclass
class CompiledMethod:
    """A Method compiled from extracted rules. Conforms to the Method DSL."""
    name: str
    version: int = 1
    domain: str = "general"
    source_sha: str = ""
    rules: list[dict] = field(default_factory=list)
    evaluation_criteria: list[dict] = field(default_factory=list)
    provenance: dict = field(default_factory=dict)
    sha: str = ""

    def __post_init__(self):
        if not self.sha:
            rules_text = "|".join(r.get("text", "") for r in self.rules)
            payload = f"{self.name}|v{self.version}|{rules_text}"
            self.sha = hashlib.sha256(payload.encode()).hexdigest()[:16]

    def to_dsl_json(self) -> dict:
        """Serialize to Method DSL JSON.

        Structure:
          - method: name
          - version: integer
          - domain: domain pack identifier
          - rules: list of compiled rule objects
          - evaluation: criteria for checking compliance
          - provenance: full extraction and compilation chain
        """
        return {
            "method": self.name,
            "version": self.version,
            "domain": self.domain,
            "rules": self.rules,
            "evaluation": self.evaluation_criteria,
            "provenance": {
                **self.provenance,
                "compiled_sha": self.sha,
                "compiled_at": datetime.utcnow().isoformat(),
            },
        }


# ---------------------------------------------------------------------------
# Stage 1: Extract normative rules from text
# ---------------------------------------------------------------------------

# Modal verbs that signal normative statements
MODALITY_MAP = {
    "shall": ("requirement", "shall"),
    "must": ("requirement", "must"),
    "shall not": ("prohibition", "shall"),
    "must not": ("prohibition", "must"),
    "should": ("recommendation", "should"),
    "should not": ("recommendation", "should"),
    "may": ("permission", "may"),
    "is defined as": ("definition", "is"),
    "means": ("definition", "is"),
}

# Patterns for conditional guards
CONDITION_PATTERNS = [
    r"^(?:when|if|where|unless|provided that)\s+(.+?),\s*(.+)",
    r"^(.+?)\s+(?:when|if|where|unless)\s+(.+)",
]


def extract_rules(text: str, source_object_id: int = 0) -> list[ExtractedRule]:
    """Extract normative rules from source text.

    Identifies sentences containing modal verbs (shall, must, should, may)
    and classifies them as requirements, prohibitions, recommendations,
    or definitions.
    """
    doc = nlp(text)
    rules = []

    for sent in doc.sents:
        s = sent.text.strip()
        if not s or s.endswith("?"):
            continue

        lower = s.lower()

        # Check for normative modality
        matched_modality = None
        for modal, (rule_type, modality) in MODALITY_MAP.items():
            if f" {modal} " in f" {lower} ":
                matched_modality = (rule_type, modality, modal)
                break

        if not matched_modality:
            continue

        rule_type, modality, modal_text = matched_modality

        # Extract subject (typically the noun phrase before the modal verb)
        subject = _extract_subject(sent, modal_text)

        # Check for conditional guard
        condition = None
        for pattern in CONDITION_PATTERNS:
            match = re.match(pattern, s, re.IGNORECASE)
            if match:
                # Determine which group is the condition vs. the rule
                g1, g2 = match.group(1), match.group(2)
                if any(kw in g1.lower() for kw in ["when", "if", "where", "unless"]):
                    condition = g1
                else:
                    condition = g1 if modal_text in g2.lower() else g2
                break

        rules.append(ExtractedRule(
            text=s,
            rule_type=rule_type,
            modality=modality,
            subject=subject,
            condition=condition,
            source_span=(sent.start_char, sent.end_char),
        ))

    logger.info("Extracted %d rules from source text", len(rules))
    return rules


def _extract_subject(sent, modal_text: str) -> str:
    """Extract the subject of a normative sentence."""
    # Find the modal verb position and look for the subject before it
    for token in sent:
        if token.dep_ in ("nsubj", "nsubjpass"):
            return " ".join(t.text for t in token.subtree)

    # Fallback: text before the modal verb
    text = sent.text
    idx = text.lower().find(modal_text)
    if idx > 0:
        return text[:idx].strip().rstrip(",")
    return "unspecified"


# ---------------------------------------------------------------------------
# Stage 2: Compile extracted rules to Method DSL
# ---------------------------------------------------------------------------
def compile_rules(
    rules: list[ExtractedRule],
    method_name: str,
    domain: str = "general",
    source_object_id: int = 0,
    source_title: str = "",
) -> CompiledMethod:
    """Compile extracted rules into a structured Method definition.

    Each rule becomes a JSON object in the Method's rules array with:
      - id: sequential identifier
      - type: requirement | prohibition | recommendation | definition
      - text: the original rule text (preserved for human review)
      - subject: who/what the rule applies to
      - condition: optional guard ("if load exceeds 50kN")
      - modality: shall | must | should | may
      - evaluable: whether the rule can be checked programmatically
    """
    compiled_rules = []
    evaluation_criteria = []

    for i, rule in enumerate(rules, 1):
        compiled = {
            "id": f"R{i:03d}",
            "type": rule.rule_type,
            "text": rule.text,
            "subject": rule.subject,
            "modality": rule.modality,
            "evaluable": _is_evaluable(rule),
        }
        if rule.condition:
            compiled["condition"] = rule.condition

        compiled_rules.append(compiled)

        # Generate evaluation criteria for evaluable rules
        if compiled["evaluable"]:
            criteria = _generate_evaluation_criteria(rule, f"R{i:03d}")
            if criteria:
                evaluation_criteria.append(criteria)

    method = CompiledMethod(
        name=method_name,
        domain=domain,
        source_sha=hashlib.sha256(
            f"{source_object_id}|{source_title}".encode()
        ).hexdigest()[:16],
        rules=compiled_rules,
        evaluation_criteria=evaluation_criteria,
        provenance={
            "source_object_id": source_object_id,
            "source_title": source_title,
            "extraction_method": "rule-based",
            "num_rules_extracted": len(rules),
            "num_evaluable": sum(1 for r in compiled_rules if r["evaluable"]),
        },
    )

    logger.info(
        "Compiled %d rules into Method '%s' (%d evaluable)",
        len(compiled_rules), method_name,
        sum(1 for r in compiled_rules if r["evaluable"]),
    )
    return method


def _is_evaluable(rule: ExtractedRule) -> bool:
    """Determine if a rule contains enough quantitative information
    to be checked programmatically.

    Evaluable rules contain numbers, comparisons, or measurable criteria.
    Non-evaluable rules are qualitative ("shall be appropriate") and
    require human judgment.
    """
    text = rule.text.lower()

    # Contains numeric values
    if re.search(r"\d+\.?\d*\s*(mm|cm|m|kg|kn|mpa|psi|%|degrees?)", text):
        return True

    # Contains comparison operators
    comparisons = ["exceed", "less than", "greater than", "at least",
                    "at most", "minimum", "maximum", "not more than",
                    "not less than", "between"]
    if any(comp in text for comp in comparisons):
        return True

    return False


def _generate_evaluation_criteria(
    rule: ExtractedRule,
    rule_id: str,
) -> Optional[dict]:
    """Generate a machine-checkable evaluation criterion from a rule."""
    text = rule.text.lower()

    # Extract numeric thresholds
    threshold_match = re.search(
        r"(not\s+)?(exceed|less than|greater than|at least|at most|minimum|maximum)"
        r"\s+(\d+\.?\d*)\s*(\w+)",
        text,
    )
    if threshold_match:
        negated = bool(threshold_match.group(1))
        operator = threshold_match.group(2)
        value = float(threshold_match.group(3))
        unit = threshold_match.group(4)

        # Map to comparison operator
        op_map = {
            "exceed": "<=",
            "less than": "<",
            "greater than": ">",
            "at least": ">=",
            "at most": "<=",
            "minimum": ">=",
            "maximum": "<=",
        }
        op = op_map.get(operator, "==")
        if negated:
            # Flip the operator
            flip = {"<=": ">", "<": ">=", ">": "<=", ">=": "<"}
            op = flip.get(op, op)

        return {
            "rule_id": rule_id,
            "check": f"value {op} {value}",
            "unit": unit,
            "threshold": value,
            "operator": op,
        }

    return None


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # A building code excerpt (simplified)
    source_text = """
    Section 4.2 - Structural Requirements for Masonry Walls

    The wall thickness shall not be less than 190 mm for load-bearing walls.
    Non-load-bearing partition walls must have a minimum thickness of 90 mm.
    If the wall height exceeds 3.0 m, the thickness shall be increased
    proportionally.
    The mortar joint thickness should not exceed 12 mm.
    Walls shall be constructed using mortar complying with EN 998-2.
    The compressive strength of masonry units must be at least 5 MPa.
    When walls are exposed to moisture, they shall be protected with a
    damp-proof course.
    Decorative finishes may be applied after the mortar has cured for
    28 days.
    """

    # Extract and compile
    rules = extract_rules(source_text, source_object_id=100)

    print(f"Extracted {len(rules)} rules:\n")
    for rule in rules:
        cond = f" [condition: {rule.condition}]" if rule.condition else ""
        print(f"  [{rule.rule_type}] ({rule.modality}) {rule.text[:80]}...{cond}")

    method = compile_rules(
        rules,
        method_name="Masonry Wall Structural Requirements",
        domain="built_environment",
        source_object_id=100,
        source_title="Section 4.2 - Structural Requirements for Masonry Walls",
    )

    print(f"\nCompiled Method: {method.name}")
    print(f"Domain: {method.domain}")
    print(f"SHA: {method.sha}")
    print(f"\nDSL JSON:")
    print(json.dumps(method.to_dsl_json(), indent=2))
