# PATTERNS-argumentation-assembly.md

## Building an ArgumentGraph with Formal Semantics

### What This Pattern Covers

Mapping EvidenceRelations to a bipolar argumentation framework,
computing grounded/preferred extensions, and producing gradual
strength scores for deliberation.

### Step 1: Map EvidenceRelations to AF Relations

```python
# In evidence_assembly.py, after building nodes and relations:

attacks = defaultdict(set)   # attacker_pk -> set of attacked_pks
supports = defaultdict(set)  # supporter_pk -> set of supported_pks

for rel in argument_graph.relations:
    if rel.relation_type == 'contradicts':
        attacks[rel.from_pk].add(rel.to_pk)
    elif rel.relation_type in ('supports', 'elaborates'):
        supports[rel.from_pk].add(rel.to_pk)
    elif rel.relation_type == 'temporal':
        # Temporal ordering informs but does not attack/support
        pass
```

### Step 2: Compute Grounded Extension

```python
from argumentation import compute_grounded_extension

node_pks = set(argument_graph.nodes.keys())
grounded = compute_grounded_extension(node_pks, attacks)
# grounded contains the PKs of arguments that survive all attacks
```

### Step 3: Identify Perspectives via Support Components

```python
from argumentation import identify_perspectives

perspectives = identify_perspectives(node_pks, attacks, supports)
# Each perspective is a set of PKs forming a conflict-free,
# support-connected component
```

### Step 4: Compute Gradual Strength

```python
from argumentation import gradual_strength

strengths = gradual_strength(
    node_pks, attacks, supports,
    max_iter=100, epsilon=0.001,
)
# strengths maps pk -> float in (0, 1]
# Use as the calibrated confidence for each EvidenceNode
```

### Step 5: Apply Preference Ordering

When two arguments symmetrically attack each other, the preference
ordering breaks the tie:

```python
def apply_preferences(attacks, nodes):
    """Remove attacks from less-preferred to more-preferred arguments."""
    resolved_attacks = defaultdict(set)
    for attacker, targets in attacks.items():
        for target in targets:
            # If symmetric attack, compare preferences
            if attacker in attacks.get(target, set()):
                pref_a = preference_score(nodes[attacker])
                pref_t = preference_score(nodes[target])
                if pref_a >= pref_t:
                    resolved_attacks[attacker].add(target)
                # else: this attack is suppressed
            else:
                resolved_attacks[attacker].add(target)
    return resolved_attacks

def preference_score(node):
    """Compute preference from epistemic properties."""
    return (
        0.4 * node.source_quality +
        0.3 * (1.0 if node.epistemic_role == 'substantive' else 0.2) +
        0.2 * node.relevance_score +
        0.1 * (1.0 if node.signal_sources.get('multi_signal', False) else 0.0)
    )
```

### Verification

```python
# Test with a known conflict:
graph = build_test_argument_graph()
grounded = compute_grounded_extension(graph.node_pks, graph.attacks)
strengths = gradual_strength(graph.node_pks, graph.attacks, graph.supports)

# Unattacked nodes should have strength near 1.0
# Attacked-but-defended nodes should have strength > 0.5
# Undefended attacked nodes should have strength < 0.5
```

### Agents Involved

1. argumentation-frameworks: AF semantics, extension computation
2. formal-epistemology: preference ordering justification
3. control-theory: convergence of gradual strength iteration
