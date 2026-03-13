# web-acquisition

## Discipline Focus
Ingest external evidence reliably and convert it into reviewable knowledge candidates.

## Core Concepts
- Normalize source types (URL, PDF, repo, media, dataset).
- Extract clean text/metadata with parser-specific adapters.
- Persist ingestion provenance and parser outcomes.
- Route failed or blocked captures into retryable queues.

## research_api Touchpoints
- `apps/notebook/file_ingestion.py`
- `apps/notebook/services.py`
- Object URL and OG metadata fields

## Firecrawl-to-Learning Flow
1. Scrape and clean source content.
2. Extract claims and entities.
3. Run cross-source NLI pairing.
4. Build high-confidence training triplets.
5. Fine-tune retrieval models.
6. Re-index and evaluate.

## Guardrails
- Do not collapse all source types into one parser path.
- Do not lose blocked/failed ingestion diagnostics.
- Do not skip source attribution on extracted claims.
