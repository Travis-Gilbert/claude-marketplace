# PATTERNS-engine-pass.md

How to add a new pass to either the post-capture engine (engine.py) or the live compose engine (compose_engine.py).

## Build Sequence

### Step 1: Define the Pass Function

```python
# In engine.py (stateful) or compose_engine.py (stateless)
def _run_mypass_engine(
    obj: Object,
    config: dict,
    process_record: ProcessRecord | None = None,
) -> list[Edge]:
    """
    Pass N: <description>.
    Returns a list of newly created Edge objects.
    """
    if not _should_run_pass(config, 'mypass'):
        return []
    # ... scoring logic ...
    return edges
```

1. Stateful pass (engine.py): creates Edge rows, writes ProcessRecord steps
2. Stateless pass (compose_engine.py): returns Candidate dataclasses, no DB writes

### Step 2: Register the Pass in the Engine Config

```python
# Add to _get_active_engines() conditional list
if 'mypass' in config.get('engines', []):
    active.add('mypass')

# Add default threshold to DEFAULT_ENGINE_CONFIG
DEFAULT_ENGINE_CONFIG = {
    ...
    'mypass_threshold': 0.4,
}
```

### Step 3: Wire into run_engine / compose_discover

For engine.py, add the call inside `run_engine()`:
```python
# Pass N
if 'mypass' in active_engines:
    mypass_edges = _run_mypass_engine(obj, config, process_record=process_record)
    results['edges_from_mypass'] = len(mypass_edges)
    all_new_edges.extend(mypass_edges)
```

For compose_engine.py, add to `_resolve_passes()` and the dispatch in `compose_discover()`:
```python
PASS_PRIORITY = ('ner', 'shared_entity', 'keyword', 'tfidf', 'sbert', 'nli', 'kge', 'mypass')
```

### Step 4: Handle Two-Mode Deployment

```python
try:
    from some_heavy_lib import heavy_function
    _MYPASS_AVAILABLE = True
except ImportError:
    _MYPASS_AVAILABLE = False

def _run_mypass_engine(obj, config, process_record=None):
    if not _MYPASS_AVAILABLE:
        logger.info('mypass unavailable (no PyTorch), skipping')
        return []
```

### Step 5: Add the Results Key

Add `'edges_from_mypass': 0` to the results dict in `run_engine()`.
This key is used by IQ Tracker and the admin dashboard.

### Step 6: Test

1. Unit test: call the pass function directly with a fixture Object
2. Integration test: call `run_engine()` with the pass enabled in config
3. Two-mode test: verify the pass skips cleanly when its dependency is absent
4. IQ test: run `python3 manage.py iq_report` before and after enabling

## Critical Constraints

- Never let an ImportError escape from a pass -- always use try/except guards
- compose_engine passes must be stateless (no DB writes, no side effects)
- engine.py passes must create Edges with `is_auto=True` and `engine='mypass'`
- Every Edge.reason must be a plain-English sentence, not a score or keyword list
- Add the pass to `PASS_PRIORITY` in compose_engine to control execution order
- Log pass timing with `time.time()` and report in process_record metadata
- New passes default to `active: false` in engine_config until tested
