# Promotion Pipeline

## Objective
Convert artifacts into canonical, review-backed epistemic knowledge.

## State Progression
`captured -> parsed -> extracted -> reviewed -> promoted -> compiled -> learned_from`

## Entities
- Artifact (source + ingestion metadata)
- ExtractionRun (parser and extractor outcomes)
- PromotionItem (candidate claim/entity/event/rule/method)
- ReviewAction (accept/reject/attach/contest/compile)
- PromotionEvent (audit timeline)

## Required Behaviors
- Keep promotion queue explicit and queryable.
- Keep all review actions auditable by actor and time.
- Keep canonical promotion reversible via new review actions (not silent mutation).
- Keep compile step optional; not every promoted item becomes executable.

## API Surface (minimum)
- Create/list queue items by notebook/question/model context.
- Submit review actions with rationale.
- Promote accepted items into kernel models.
- Generate method draft from promoted procedures.
