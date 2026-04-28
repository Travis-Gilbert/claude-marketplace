# PATTERNS-domain-pack.md

How to build a domain pack that specializes the engine for a particular knowledge domain.

## Build Sequence

### Step 1: Define Entity Types

Each domain pack declares the entity types it recognizes beyond spaCy's defaults:

```python
# domain_packs/computer_science.py
DOMAIN_ENTITY_TYPES = {
    'ALGORITHM': {
        'description': 'Named algorithm or data structure',
        'examples': ['Dijkstra', 'B-tree', 'PageRank', 'quicksort'],
        'object_type_slug': 'concept',
    },
    'LANGUAGE': {
        'description': 'Programming language or framework',
        'examples': ['Python', 'Rust', 'React', 'Django'],
        'object_type_slug': 'concept',
    },
    'SYSTEM': {
        'description': 'Named software system or service',
        'examples': ['PostgreSQL', 'Kubernetes', 'Linux', 'S3'],
        'object_type_slug': 'organization',
    },
}
```

### Step 2: Define Relation Types

Domain-specific edge types that supplement the 14 built-in types:

```python
DOMAIN_RELATION_TYPES = {
    'implements': {
        'description': 'X implements algorithm/pattern Y',
        'directional': True,
        'default_strength': 0.8,
    },
    'supersedes': {
        'description': 'X replaces or improves upon Y',
        'directional': True,
        'default_strength': 0.7,
    },
    'depends_on': {
        'description': 'X requires Y to function',
        'directional': True,
        'default_strength': 0.9,
    },
}
```

### Step 3: NER Patterns

Build PhraseMatcher patterns for domain-specific entities that spaCy misses:

```python
# Used by adaptive_ner.py
NER_PATTERNS = {
    'ALGORITHM': [
        'Dijkstra', 'A*', 'BFS', 'DFS', 'quicksort', 'mergesort',
        'binary search', 'dynamic programming', 'backtracking',
        'gradient descent', 'backpropagation', 'attention mechanism',
    ],
    'LANGUAGE': [
        'Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java',
        'C++', 'Haskell', 'OCaml', 'Elixir', 'Zig',
    ],
}

def get_phrase_patterns():
    """Return patterns for spaCy PhraseMatcher integration."""
    patterns = []
    for entity_type, phrases in NER_PATTERNS.items():
        for phrase in phrases:
            patterns.append((phrase, entity_type))
    return patterns
```

### Step 4: Evaluation Benchmarks

Define how to measure the domain pack's effectiveness:

```python
EVALUATION_BENCHMARKS = {
    'entity_recall': {
        'description': 'Fraction of known entities detected in test corpus',
        'test_corpus': 'data/benchmarks/cs_entities.jsonl',
        'target': 0.80,
    },
    'relation_precision': {
        'description': 'Fraction of detected relations that are correct',
        'test_corpus': 'data/benchmarks/cs_relations.jsonl',
        'target': 0.75,
    },
    'claim_quality': {
        'description': 'Fraction of extracted claims rated relevant by reviewer',
        'target': 0.70,
    },
}
```

### Step 5: Reference Sources

Declare authoritative sources for building the training corpus:

```python
REFERENCE_SOURCES = [
    {'url': 'https://en.wikipedia.org/wiki/List_of_algorithms', 'type': 'encyclopedia'},
    {'url': 'https://arxiv.org/list/cs.DS/recent', 'type': 'academic'},
    {'url': 'https://github.com/topics/algorithms', 'type': 'code'},
]
```

These feed into PATTERNS-firecrawl-corpus.md for corpus construction.

### Step 6: Django Fixture Format

Domain packs ship as Django fixtures for reproducible loading:

```json
[
    {
        "model": "notebook.objecttype",
        "fields": {
            "name": "Algorithm",
            "slug": "algorithm",
            "icon": "cpu",
            "color": "#4A6A8A",
            "is_built_in": false,
            "sort_order": 20,
            "description": "Named algorithm or data structure"
        }
    }
]
```

Load with:
```bash
python manage.py loaddata domain_packs/computer_science.json
```

### Step 7: Register the Domain Pack

```python
# domain_packs/__init__.py
AVAILABLE_PACKS = {
    'computer_science': {
        'module': 'domain_packs.computer_science',
        'entity_types': DOMAIN_ENTITY_TYPES,
        'relation_types': DOMAIN_RELATION_TYPES,
        'ner_patterns': NER_PATTERNS,
        'fixture': 'domain_packs/computer_science.json',
    },
}

def activate_pack(pack_name: str, notebook):
    """Activate a domain pack for a notebook's engine config."""
    pack = AVAILABLE_PACKS[pack_name]
    config = notebook.engine_config or {}
    config['domain_pack'] = pack_name
    config['custom_entity_types'] = list(pack['entity_types'].keys())
    notebook.engine_config = config
    notebook.save(update_fields=['engine_config'])
```

## Critical Constraints

- Domain packs extend but never replace built-in entity types (10 types are always present)
- NER patterns are additive to spaCy's model, loaded via adaptive_ner.py PhraseMatcher
- Fixtures use `is_built_in=false` to distinguish from core types
- Evaluation benchmarks must be run before shipping a domain pack
- Entity recall target: 80% on the test corpus before activation
- Domain packs are per-notebook (different notebooks can use different packs)
- Reference sources must include provenance URLs for every entity pattern
- Domain pack activation is recorded as a Timeline event
