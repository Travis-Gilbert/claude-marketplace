# PATTERNS-firecrawl-corpus.md

How to build training data from the web using Firecrawl scraping: Web -> extraction -> corpus.

## Build Sequence

### Step 1: Configure Firecrawl

```python
# Environment variables
FIRECRAWL_API_KEY = os.environ.get('FIRECRAWL_API_KEY', '')
FIRECRAWL_BASE_URL = os.environ.get('FIRECRAWL_BASE_URL', 'https://api.firecrawl.dev/v1')
```

The scraper in `apps/notebook/scraper.py` wraps Firecrawl with a provider-agnostic
interface using `NormalizedHit` objects. When no API key is set, the `NullProvider`
returns empty results and the inquiry engine runs in internal-only mode.

### Step 2: Scrape and Normalize

```python
from .scraper import FirecrawlProvider, NormalizedHit

provider = FirecrawlProvider()

# Search and scrape
hits = provider.search(query="epistemic logic formal systems", max_results=20)
for hit in hits:
    # hit.url, hit.title, hit.snippet, hit.domain
    # hit.source_type: 'academic', 'news', 'wiki', 'blog', etc.
    # hit.provider_score: relevance score from Firecrawl
    content = provider.scrape(hit.url)
    # content.markdown: cleaned text
    # content.metadata: title, description, language
```

### Step 3: Content Extraction and Typing

Classify scraped content by source type for downstream use:

```python
SOURCE_TYPE_MAP = {
    'arxiv.org': 'academic',
    'scholar.google': 'academic',
    'wikipedia.org': 'encyclopedia',
    'github.com': 'code',
    'medium.com': 'blog',
    'nytimes.com': 'news',
}

def classify_source(url: str, content: str) -> str:
    from urllib.parse import urlparse
    domain = urlparse(url).netloc
    for pattern, source_type in SOURCE_TYPE_MAP.items():
        if pattern in domain:
            return source_type
    return 'web'
```

### Step 4: Build Training Corpus

Transform scraped content into training data for SBERT and NLI models:

```python
def build_sbert_corpus(hits: list[NormalizedHit]) -> list[dict]:
    """Build sentence pairs for SBERT contrastive training."""
    corpus = []
    for hit in hits:
        content = provider.scrape(hit.url)
        if not content or not content.markdown:
            continue

        # Extract claims from scraped text
        from .claim_decomposition import decompose_claims
        claims = decompose_claims(content.markdown, max_claims=10)

        # Pair claims from same source (positive pairs)
        for i, c1 in enumerate(claims):
            for c2 in claims[i+1:]:
                corpus.append({
                    'sentence1': c1,
                    'sentence2': c2,
                    'label': 1.0,  # Same source -> related
                    'source_url': hit.url,
                    'source_type': classify_source(hit.url, ''),
                })
    return corpus

def build_nli_corpus(hits: list[NormalizedHit]) -> list[dict]:
    """Build premise/hypothesis pairs for NLI fine-tuning."""
    corpus = []
    for hit in hits:
        content = provider.scrape(hit.url)
        claims = decompose_claims(content.markdown, max_claims=10)
        # Cross-source claim pairs become NLI training candidates
        # Label with existing NLI model, then human-review high-uncertainty pairs
    return corpus
```

### Step 5: Corpus Storage

```python
import json
from pathlib import Path

CORPUS_DIR = Path('data/training_corpus/')

def save_corpus(corpus: list[dict], name: str):
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)
    path = CORPUS_DIR / f'{name}.jsonl'
    with open(path, 'w') as f:
        for record in corpus:
            f.write(json.dumps(record) + '\n')
    return path
```

### Step 6: Schedule Corpus Building

```python
# In tasks.py
@django_rq.job('ingestion', timeout=1800)
def build_corpus_task(query: str, corpus_name: str, max_results: int = 50):
    """Scrape web content and build training corpus as an RQ job."""
    provider = FirecrawlProvider()
    hits = provider.search(query, max_results=max_results)
    corpus = build_sbert_corpus(hits)
    path = save_corpus(corpus, corpus_name)
    logger.info('Built corpus %s: %d pairs from %d hits', corpus_name, len(corpus), len(hits))
    return str(path)
```

## Critical Constraints

- Firecrawl API key must be set; NullProvider returns empty results when absent
- Scraping runs in the `ingestion` RQ queue (never in request thread)
- Respect rate limits: max 20 scrapes per minute per Firecrawl plan
- Corpus files use JSONL format (one JSON object per line)
- Source type classification affects training weight (academic > blog)
- All scraped content retains source URL for provenance
- Training corpora are stored locally, not in the database
- Human review of high-uncertainty NLI pairs improves corpus quality
