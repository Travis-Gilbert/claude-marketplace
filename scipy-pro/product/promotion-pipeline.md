# Promotion Pipeline Design

Detailed specification for how epistemic primitives move from initial capture through human review to canonical status.

## Core Principle

**Architectural invariant #7: LLMs propose, humans review. Nothing auto-promotes to canon.**

Every piece of extracted knowledge starts as a draft. Automated systems can parse, extract, and score. Only humans can promote to canonical.

## Pipeline Stages

```
captured -> parsed -> extracted -> reviewed -> promoted -> compiled -> learned from
```

### Stage 1: Captured

**Entry:** User creates content (types text, uploads file, pastes URL).

**What happens:**
- Object record created with `status='captured'`
- SHA identity generated via `_generate_sha()`
- Source metadata recorded (user, timestamp, input type)
- RQ task queued for parsing

**Exit criteria:** Object persisted with SHA identity.

### Stage 2: Parsed

**Entry:** RQ task picks up the captured Object.

**What happens:**
- spaCy processes the text: sentence splitting, NER, POS tagging
- Structural elements identified: headings, lists, tables, code blocks
- Language detected, encoding normalized
- Object updated with parsed metadata

**Exit criteria:** Sentences split, structural elements tagged.

### Stage 3: Extracted

**Entry:** Parsed Object enters the extraction pipeline.

**What happens:**
- Claims extracted (LLM or rule-based, depending on mode)
- Entities identified (adaptive NER + spaCy)
- Observations noted (quantitative statements, measurements)
- Each extraction gets its own SHA identity and provenance link
- Extracted items tagged with confidence scores
- Items enter the review queue

**Exit criteria:** All claims/entities/observations extracted with confidence scores.

### Stage 4: Reviewed

**Entry:** Human opens the review queue.

**Review queue mechanics:**

Items are sorted by priority. Priority is computed as:

```
priority = base_confidence * recency_boost * novelty_factor
```

Where:
- `base_confidence`: extraction confidence (0-1)
- `recency_boost`: 1.0 + 0.1 * days_since_last_review (caps at 2.0)
- `novelty_factor`: 1.5 if the claim introduces new entities, 1.0 otherwise

**Review actions:**

| Action | Effect |
|--------|--------|
| **Approve** | Item advances to REVIEWED stage |
| **Modify** | Reviewer edits the content, then advances to REVIEWED |
| **Reject** | Item marked as rejected with reason. Does not advance. |
| **Defer** | Item stays in queue. Priority reduced by 0.1. |
| **Split** | One item becomes multiple (compound claim decomposition) |
| **Merge** | Multiple items combined into one (duplicate consolidation) |

**Review UI (text wireframe):**

```
+-------------------------------------------------------+
| REVIEW QUEUE                        [Claims] [All]     |
+-------------------------------------------------------+
| Priority | Type   | Content (preview)     | Source     |
|----------|--------|-----------------------|-----------|
| 0.92     | claim  | "RC has compressive..." | Obj #42  |
| 0.87     | entity | "EN 206"              | Obj #42   |
| 0.81     | claim  | "Prestressed tendons.."| Obj #45  |
+-------------------------------------------------------+

Selected item:
+-------------------------------------------------------+
| Claim: "Reinforced concrete has a compressive          |
|         strength of 20-40 MPa."                        |
|                                                        |
| Source: Object #42 "Concrete Properties"               |
| Extracted by: LLM (confidence: 0.92)                   |
| SHA: abc123def456                                      |
|                                                        |
| [Edit text]                                            |
|                                                        |
| Related claims in graph:                               |
|   - "Concrete compressive strength varies by mix..."   |
|   - "EN 206 specifies strength classes C20 to C100"    |
|                                                        |
| Potential tensions:                                    |
|   - Object #78 states "25-50 MPa" (contradiction: 0.73)|
|                                                        |
| Actions: [Approve] [Modify] [Reject] [Defer] [Split]  |
+-------------------------------------------------------+
```

**Exit criteria:** Human has acted on the item (approve, modify, reject, or split).

### Stage 5: Promoted

**Entry:** Reviewed item is approved.

**What happens:**
- Item status set to `canonical`
- Canonical edges created linking the item to the knowledge graph
- Provenance event recorded: who approved, when, what they changed
- Self-organization triggered: re-cluster, re-classify, update NER
- Learning signal emitted for downstream systems

**Edge cases:**
- **Conflicting canonical claims:** If a new canonical claim contradicts an existing one, a Tension record is created. Neither claim is demoted. Humans resolve tensions separately.
- **Superseding claims:** If a new claim explicitly supersedes an old one (e.g., updated standards), the old claim's status changes to `superseded` with a link to the new one.
- **Batch promotion:** Multiple items can be promoted together. All edges and provenance events are created atomically.

**Exit criteria:** Item is canonical with all edges and provenance recorded.

### Stage 6: Compiled (Optional)

**Entry:** A canonical item contains procedural knowledge worth encoding.

**What happens:**
- Procedural knowledge extracted and structured as Method DSL JSON
- Method definition created with provenance links to source claims
- Method enters its own review cycle (Methods need separate approval)
- If approved, Method becomes executable

**Exit criteria:** Method DSL JSON created and reviewed.

### Stage 7: Learned From

**Entry:** Promotion and compilation events feed downstream learning.

**What happens:**
- **Retrieval learning:** Promoted items boost similar items' retrieval scores. BM25 term weights adjusted. SBERT embedding space fine-tuned (via /gather pipeline).
- **Knowledge learning:** World model updated. EpistemicModel assumptions validated or invalidated by new canonical claims.
- **Model training:** Extraction models fine-tuned on reviewed examples (correct extractions and reviewer modifications serve as training signal).

**Exit criteria:** Downstream systems updated.

## Integration Points

### With engine.py (7-pass enrichment)

The promotion pipeline runs after engine.py passes complete. Engine passes extract structure; promotion gates quality.

```
Object captured -> engine.py passes -> claims extracted -> review queue
```

### With self_organize.py (5 feedback loops)

Promotion events trigger self-organization:
- New canonical entity -> update adaptive NER patterns
- New canonical claim in a cluster -> re-evaluate cluster labels
- New canonical edge -> check for community structure changes

### With compose_engine.py (live discovery)

compose_engine remains stateless. It reads canonical items to suggest connections during writing. It never writes to the review queue.

### With tasks.py (RQ background jobs)

Each stage transition queues an RQ task:
- `parse_object` (captured -> parsed)
- `extract_from_object` (parsed -> extracted)
- `promote_item` (reviewed -> promoted)
- `emit_learning_signal` (promoted -> learned from)

## Audit Trail

Every stage transition creates a PromotionEvent:

```python
{
    "item_sha": "abc123def456",
    "from_stage": "extracted",
    "to_stage": "reviewed",
    "actor": "researcher_jane",      # "system" for automated transitions
    "reason": "Approved with modification: corrected MPa range per EN 206",
    "timestamp": "2024-03-14T10:30:00Z",
    "metadata": {
        "modifications": {"text": "...corrected text..."},
        "related_tensions": ["sha_xyz"],
    }
}
```

The full promotion history for any item can be reconstructed from its events. This is the provenance chain required by architectural invariant #10.
