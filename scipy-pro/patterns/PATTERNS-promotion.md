# Pattern: Promotion Pipeline

The promotion pipeline governs how knowledge moves from raw capture to
canonical status. Nothing auto-promotes. LLMs propose, humans review.

## Promotion Stages

```
captured -> parsed -> extracted -> reviewed -> promoted -> compiled -> learned from
```

### captured
Raw ingested content. An Object is created with the original text, file,
or URL content. No processing has occurred.

```python
obj = Object.objects.create(
    title=title,
    body=raw_text,
    type='note',
    notebook=notebook,
    status='captured',
    capture_method='manual',  # or 'api', 'firecrawl', 'file_upload'
)
```

### parsed
Structure has been extracted. Sentences split, metadata identified,
format normalized. The Object's body may be cleaned but the original
is preserved in provenance.

```python
obj.status = 'parsed'
obj.metadata.update({
    'sentence_count': len(sentences),
    'word_count': word_count,
    'language': detected_lang,
    'parsed_at': now_iso(),
})
obj.save()
```

### extracted
Specific knowledge units identified: claims decomposed, entities
recognized, structure mapped. Claim and entity records created as
child objects.

```python
claims = decompose_claims(obj)
entities = extract_entities(obj)
obj.status = 'extracted'
obj.metadata['claim_count'] = len(claims)
obj.metadata['entity_count'] = len(entities)
obj.save()
```

### reviewed
Human or rule-based quality check passed. This is the gate before
canonical status. Review can be:
- Human approval via UI
- Rule-based: minimum claim count, entity count, or quality score
- LLM-assisted: quality assessment with human confirmation

```python
# Rule-based review (proposes, does not auto-promote)
def propose_review(obj, config):
    """Assess if object meets quality threshold for promotion."""
    checks = {
        'has_claims': obj.claims.count() >= 1,
        'min_length': len(obj.body) >= 100,
        'has_title': bool(obj.title and obj.title.strip()),
        'not_duplicate': not _is_near_duplicate(obj),
    }
    passed = all(checks.values())

    return {
        'object_id': obj.pk,
        'checks': checks,
        'passed': passed,
        'recommendation': 'promote' if passed else 'needs_attention',
    }
```

The review result is stored but does NOT auto-advance the status:

```python
obj.metadata['review'] = review_result
obj.metadata['reviewed_at'] = now_iso()
obj.metadata['reviewed_by'] = 'rule_engine'  # or user.pk
obj.save()
# Status stays 'extracted' until human confirms
```

### promoted
Enters the canonical knowledge base. Only happens after human review.

```python
# In the view handling human approval
def promote_object(request, obj_id):
    obj = get_object_or_404(Object, pk=obj_id)
    obj.status = 'promoted'
    obj.metadata['promoted_by'] = request.user.pk
    obj.metadata['promoted_at'] = now_iso()
    obj.save()

    # Provenance record
    Provenance.objects.create(
        object=obj,
        action='promoted',
        actor=request.user,
        details={'from_status': 'reviewed'},
    )
```

### compiled
Turned into executable form. Only applies to certain types:
- Paper -> Protocol (step-by-step procedure)
- Law/Rule -> Rule set (machine-evaluable conditions)
- Guide -> Checklist (ordered verification steps)
- Method -> Scoring function (input/output spec)

```python
method = Method.objects.create(
    source_object=obj,
    title=f"Method: {obj.title}",
    definition=compiled_definition,  # Structured JSON
    version=1,
    status='compiled',
    provenance_sha=obj.sha_hash,
)
```

### learned from
Used in training data. The Object's claims have been included in
fine-tuning triplets, its content has informed model updates, or its
patterns have been encoded into system behavior.

```python
obj.metadata['used_in_training'] = {
    'dataset': 'domain_nli_v3',
    'triplet_count': 15,
    'training_run': run_id,
    'trained_at': now_iso(),
}
obj.save()
```

## Queue-Mediated Process

Status transitions are mediated through review queues, not direct
mutation. The UI presents items at each stage for human action.

```python
# API endpoint: get items pending review
def get_review_queue(request, notebook_id):
    notebook = get_object_or_404(Notebook, pk=notebook_id)
    pending = Object.objects.filter(
        notebook=notebook,
        status='extracted',
        metadata__review__passed=True,
    ).order_by('-created_at')

    return Response(ObjectSerializer(pending, many=True).data)
```

## Provenance at Every Step

Every status transition creates a provenance record:

```python
def _transition_status(obj, new_status, actor=None, details=None):
    """Transition object status with provenance tracking."""
    old_status = obj.status
    obj.status = new_status
    obj.save()

    Provenance.objects.create(
        object=obj,
        action=f'status_transition:{old_status}->{new_status}',
        actor=actor,
        details=details or {},
        sha_hash=obj.sha_hash,
    )
```

## Rules

1. **Nothing auto-promotes to canonical.** LLMs and rules can propose
   promotion, but a human must confirm. The `reviewed -> promoted`
   transition always requires `promoted_by` to be a real user.

2. **Provenance at every step.** Every transition records who/what
   triggered it and when. SHA hashes link to the exact content version.

3. **Backward transitions are allowed.** A promoted Object can be
   demoted back to `reviewed` or `extracted` if issues are found.
   This also creates a provenance record.

4. **Status is per-Object, not per-Notebook.** Different Objects in
   the same Notebook can be at different promotion stages.

5. **Compilation is optional.** Not every promoted Object needs to
   become a Method. Only knowledge that has an executable form
   (procedures, rules, scoring criteria) gets compiled.
