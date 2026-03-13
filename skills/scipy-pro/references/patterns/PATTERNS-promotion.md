# PATTERNS-promotion

## Goal
Turn capture-centric flow into review-mediated knowledge promotion.

## State Model
`captured -> parsed -> extracted -> reviewed -> promoted -> compiled -> learned_from`

## Workflow
1. Capture artifact with provenance anchor.
2. Parse by source type and log extraction runs.
3. Generate claim/entity/event/rule/method candidates.
4. Queue candidates for human review actions.
5. Promote accepted items to canonical kernel objects.
6. Compile selected promoted items into methods/models.
7. Feed outcomes into retrieval and learning signals.

## Review Actions
- Accept candidate
- Reject candidate
- Attach to question/model
- Mark contradiction target
- Draft method from procedure

## Verify
- Validate no direct `extracted -> promoted` shortcut exists.
- Validate acceptance/rejection audit trails.
- Validate promoted objects retain provenance links.
