# PATTERNS-firecrawl-corpus

## Goal
Build high-quality training data from web evidence.

## Workflow
1. Define source domain and inclusion policy.
2. Scrape via Firecrawl and normalize markdown.
3. Store artifacts with source metadata and parser outcomes.
4. Extract claims and run cross-source NLI.
5. Keep only high-confidence entailment/contradiction pairs.
6. Build triplets for SBERT training.
7. Fine-tune model and rebuild retrieval index.
8. Evaluate with Precision@k, MRR, and human checks.

## Verify
- Validate failed scrape handling and retry policy.
- Validate confidence thresholds and class balance.
- Validate retrieval gains against a fixed baseline set.
