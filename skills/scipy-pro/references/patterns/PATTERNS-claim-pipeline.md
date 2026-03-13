# PATTERNS-claim-pipeline

## Goal
Move from text to reviewable claim and tension artifacts.

## Pipeline
1. Parse source into cleaned text segments.
2. Decompose segments into atomic claims.
3. Deduplicate and cap claim volume.
4. Pair claims for NLI scoring.
5. Emit support/contradiction candidates with provenance quotes.
6. Route candidates to promotion queue for review.

## Verify
- Validate fallback decomposition when LLM unavailable.
- Validate claim-pair provenance references.
- Validate contradictory pairs surface as tensions.
