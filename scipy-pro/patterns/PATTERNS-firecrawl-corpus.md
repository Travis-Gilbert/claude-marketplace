# Pattern: Firecrawl Corpus Pipeline (Web -> Training Data)

A 10-step pipeline that turns web content into domain-adapted NLI training
data and a fine-tuned SBERT model with rebuilt FAISS index.

## Pipeline Overview

```
1. Define Domain -> 2. Scrape (Firecrawl) -> 3. Store as Objects
-> 4. Claim Decomposition -> 5. Pairwise NLI -> 6. Filter High-Confidence
-> 7. Construct Triplets -> 8. Fine-Tune SBERT -> 9. Rebuild FAISS
-> 10. Assess Retrieval Quality
```

## Step 1: Define Domain

Specify what to scrape: URLs, site patterns, and content types.

```python
CORPUS_CONFIG = {
    'name': 'domain_nutrition_v1',
    'seed_urls': [
        'https://examine.com/supplements/',
        'https://pubmed.ncbi.nlm.nih.gov/?term=nutrition+review',
    ],
    'site_patterns': [
        r'examine\.com/supplements/\w+',
        r'pubmed\.ncbi\.nlm\.nih\.gov/\d+',
    ],
    'content_types': ['article', 'review', 'meta-analysis'],
    'max_pages': 500,
    'max_depth': 2,
    'exclude_patterns': [
        r'/login', r'/signup', r'/cart', r'/ads/',
    ],
}
```

## Step 2: Scrape via Firecrawl

Firecrawl returns clean markdown per page. Use crawl mode for site-wide
scraping, scrape mode for individual URLs.

```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

def scrape_corpus(config):
    """Scrape all URLs in corpus config."""
    results = []

    for url in config['seed_urls']:
        # Crawl mode: follow links within site patterns
        crawl_result = app.crawl_url(
            url,
            params={
                'limit': config['max_pages'],
                'maxDepth': config['max_depth'],
                'excludePaths': config['exclude_patterns'],
                'scrapeOptions': {
                    'formats': ['markdown'],
                },
            },
            poll_interval=5,
        )

        for page in crawl_result.get('data', []):
            results.append({
                'url': page['metadata']['url'],
                'title': page['metadata'].get('title', ''),
                'markdown': page.get('markdown', ''),
                'scraped_at': now_iso(),
            })

    return results
```

## Step 3: Store as Objects

Each scraped page becomes an Object with capture_method='api'.

```python
def store_scraped_pages(pages, notebook, corpus_name):
    """Store scraped pages as Objects."""
    objects = []
    for page in pages:
        if len(page['markdown'].strip()) < 100:
            continue  # Skip near-empty pages

        obj = Object.objects.create(
            title=page['title'] or page['url'],
            body=page['markdown'],
            type='source',
            notebook=notebook,
            status='captured',
            capture_method='api',
            metadata={
                'source_url': page['url'],
                'corpus': corpus_name,
                'scraped_at': page['scraped_at'],
            },
        )
        objects.append(obj)

    return objects
```

## Step 4: Run Claim Decomposition

Extract claims from each Object. This reuses the standard claim pipeline
(see PATTERNS-claim-pipeline.md).

```python
from apps.research.claim_decomposition import decompose_claims

def extract_corpus_claims(objects):
    """Run claim decomposition on all corpus objects."""
    all_claims = []
    for obj in objects:
        claims = decompose_claims(obj)
        all_claims.extend(claims)
        obj.status = 'extracted'
        obj.metadata['claim_count'] = len(claims)
        obj.save()
    return all_claims
```

## Step 5: Pairwise NLI on Claims Across Sources

Score claim pairs across different source Objects. This is the expensive
step -- dispatch to Modal for large corpora.

```python
def score_cross_source_claims(claims, batch_size=256):
    """
    Score NLI for claim pairs across different sources.

    Only pairs from DIFFERENT source objects are scored.
    Same-source pairs are skipped (intra-document coherence is assumed).
    """
    pairs = []
    claims_by_source = defaultdict(list)

    for claim in claims:
        claims_by_source[claim.source_object_id].append(claim)

    source_ids = list(claims_by_source.keys())
    for i, src_a in enumerate(source_ids):
        for src_b in source_ids[i + 1:]:
            for ca in claims_by_source[src_a]:
                for cb in claims_by_source[src_b]:
                    pairs.append((ca, cb))

    # For large corpora, dispatch to Modal
    if len(pairs) > 10000:
        return _dispatch_nli_to_modal(pairs, batch_size)

    return _score_pairs_local(pairs, batch_size)
```

## Step 6: Filter High-Confidence Pairs

Keep only pairs with strong entailment or contradiction signals.

```python
def filter_high_confidence(scored_pairs):
    """
    Filter for high-confidence NLI pairs.

    Entailment threshold: 0.8
    Contradiction threshold: 0.7 (lower because contradictions are rarer)
    """
    entailments = []
    contradictions = []

    for pair in scored_pairs:
        if pair['scores']['entailment'] > 0.8:
            entailments.append(pair)
        elif pair['scores']['contradiction'] > 0.7:
            contradictions.append(pair)

    return entailments, contradictions
```

## Step 7: Construct Triplets

Build (anchor, positive, negative) triplets for contrastive learning.

```python
def construct_triplets(entailments, contradictions):
    """
    Build training triplets: (anchor, positive, negative).

    anchor: a claim
    positive: a claim that entails/supports anchor
    negative: a claim that contradicts anchor (hard negative)
    """
    # Index contradictions by claim text for lookup
    contradiction_map = defaultdict(list)
    for pair in contradictions:
        contradiction_map[pair['claim_a'].text].append(pair['claim_b'])
        contradiction_map[pair['claim_b'].text].append(pair['claim_a'])

    triplets = []
    for pair in entailments:
        anchor = pair['claim_a'].text
        positive = pair['claim_b'].text

        # Find a hard negative: something that contradicts the anchor
        negatives = contradiction_map.get(anchor, [])
        if negatives:
            negative = negatives[0].text
            triplets.append({
                'anchor': anchor,
                'positive': positive,
                'negative': negative,
            })

    # Also mine semi-hard negatives (high similarity but neutral)
    # for triplets where no contradiction exists
    return triplets
```

## Step 8: Fine-Tune SBERT on Triplets

Train a domain-adapted sentence embedding model.

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

def fine_tune_sbert(triplets, base_model='all-MiniLM-L6-v2', epochs=3):
    """
    Fine-tune SBERT on domain triplets.

    This runs on Modal (GPU required).
    """
    model = SentenceTransformer(base_model)

    examples = [
        InputExample(texts=[t['anchor'], t['positive'], t['negative']])
        for t in triplets
    ]
    dataloader = DataLoader(examples, shuffle=True, batch_size=32)
    loss = losses.TripletLoss(model)

    model.fit(
        train_objectives=[(dataloader, loss)],
        epochs=epochs,
        warmup_steps=100,
        output_path=f'models/sbert-domain-{now_iso()[:10]}',
    )

    return model
```

## Step 9: Rebuild FAISS Index

Re-encode all Objects with the new model and rebuild the FAISS index.

```python
def rebuild_faiss_index(model, notebook_id=None):
    """
    Re-encode all Objects and rebuild FAISS index.

    Dispatched to Modal for GPU acceleration.
    """
    queryset = Object.objects.filter(is_deleted=False)
    if notebook_id:
        queryset = queryset.filter(notebook_id=notebook_id)

    texts = list(queryset.values_list('body', flat=True))
    pks = list(queryset.values_list('pk', flat=True))

    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

    # Build FAISS index
    import faiss
    import numpy as np

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # Inner product (cosine after normalization)
    faiss.normalize_L2(embeddings)
    index.add(embeddings)

    # Save index and ID mapping
    faiss.write_index(index, f'indexes/faiss_sbert_{notebook_id or "all"}.bin')
    np.save(f'indexes/faiss_ids_{notebook_id or "all"}.npy', np.array(pks))

    return index
```

## Step 10: Assess Retrieval Quality

Measure how well the new embeddings retrieve relevant content.

```python
def assess_retrieval(model, index, pk_map, test_queries, ground_truth, k=10):
    """
    Measure retrieval quality with Precision@k and MRR.

    test_queries: list of query strings
    ground_truth: dict mapping query -> set of relevant Object PKs
    """
    metrics = {'precision_at_k': [], 'mrr': []}

    for query in test_queries:
        q_embedding = model.encode([query])
        faiss.normalize_L2(q_embedding)
        scores, indices = index.search(q_embedding, k)

        retrieved_pks = [pk_map[i] for i in indices[0]]
        relevant = ground_truth.get(query, set())

        # Precision@k
        hits = sum(1 for pk in retrieved_pks if pk in relevant)
        metrics['precision_at_k'].append(hits / k)

        # MRR (Mean Reciprocal Rank)
        for rank, pk in enumerate(retrieved_pks, 1):
            if pk in relevant:
                metrics['mrr'].append(1.0 / rank)
                break
        else:
            metrics['mrr'].append(0.0)

    return {
        'precision_at_k': sum(metrics['precision_at_k']) / len(metrics['precision_at_k']),
        'mrr': sum(metrics['mrr']) / len(metrics['mrr']),
        'k': k,
        'query_count': len(test_queries),
    }
```

## Orchestration

The full pipeline is an RQ task chain:

```python
@rq_job('corpus')
def run_corpus_pipeline(config):
    """Full corpus pipeline: scrape -> train -> assess."""
    # Steps 1-3: Local (no GPU needed)
    pages = scrape_corpus(config)
    objects = store_scraped_pages(pages, notebook, config['name'])
    claims = extract_corpus_claims(objects)

    # Steps 4-7: Local if small, Modal if large
    scored_pairs = score_cross_source_claims(claims)
    entailments, contradictions = filter_high_confidence(scored_pairs)
    triplets = construct_triplets(entailments, contradictions)

    # Steps 8-10: Modal (GPU required)
    dispatch_to_modal('fine_tune_and_rebuild', {
        'triplets': triplets,
        'base_model': config.get('base_model', 'all-MiniLM-L6-v2'),
    })
```

## Key Considerations

- **Rate limits:** Firecrawl has rate limits. Use crawl mode (async)
  rather than scrape mode (sync) for large corpora.
- **Content cleaning:** Firecrawl's markdown output is generally clean
  but may include navigation, footers, etc. Apply post-processing.
- **Pair explosion:** n claims across m sources produces O(n^2) pairs.
  For corpora > 1000 claims, use Modal for NLI scoring.
- **Triplet quality:** Hard negatives (actual contradictions) produce
  much better embeddings than random negatives. Prioritize them.
- **Assessment dataset:** Build a small human-annotated test set before
  fine-tuning. Without ground truth, you cannot measure improvement.
