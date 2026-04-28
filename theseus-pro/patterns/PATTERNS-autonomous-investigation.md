# PATTERNS-autonomous-investigation.md

## R5 Autonomous Investigation Cycle

### What This Pattern Covers

The full cycle of autonomous gap detection, prioritization,
investigation, and integration. Designed to run as a weekly RQ cron job.

### The Cycle

```
1. Survey graph for investigation opportunities
   a. Unresolved tensions (sorted by severity * entrenchment)
   b. Structural gaps between dense clusters
   c. High-novelty unconnected objects (RND score > threshold)
   d. Low-entrenchment claims that could be strengthened or refuted
2. Rank opportunities by expected information gain
3. Investigate top N using investigation.py (R3)
4. Log results and update IQ snapshot
```

### Opportunity Scoring

```python
def score_opportunity(opp) -> float:
    weights = {
        'tension_severity': 0.30,    # high-severity, high-entrenchment tensions
        'gap_size': 0.25,            # structural gap between dense clusters
        'novelty_significance': 0.20, # high RND score + high connectivity
        'resolution_feasibility': 0.25, # concrete, searchable question
    }
    return sum(weights[k] * getattr(opp, k, 0.0) for k in weights)
```

### Scheduling Integration

```python
# In scheduling.py, add to the weekly cron:
if os.environ.get('AUTONOMOUS_INVESTIGATION_ENABLED', 'false').lower() == 'true':
    scheduler.cron(
        '0 3 * * 0',  # 3 AM Sunday
        func='apps.notebook.autonomous_investigator.run_autonomous_cycle',
        kwargs={'max_investigations': 3, 'budget_per_investigation': 10},
        queue_name='default',
    )
```

### Convergence Criteria

The investigation cycle stops when:
1. Budget exhausted (max_investigations reached)
2. Expected information gain of next opportunity < threshold (0.1)
3. Confidence delta from last investigation < 0.01 (diminishing returns)

### Investigation Log Format

```
Autonomous Investigation Cycle [2026-04-06T03:00:00Z]
  Opportunities surveyed: 45
  Investigations run: 3

  Investigation 1: Tension T-1234
    Between: "Bayesian updating requires priors" vs "Objective methods need no priors"
    Searched: "Bayesian vs frequentist epistemology"
    Found: 2 relevant sources
    Result: Tension reclassified as scope_conflict (confidence delta +0.08)

  Investigation 2: Gap between [cluster: complexity_theory] and [cluster: economics]
    Searched: "complexity economics agent-based models"
    Found: 3 relevant sources
    Result: 2 new cross-cluster edges proposed

  Investigation 3: Low-entrenchment claim: "Network effects dominate platform markets"
    Searched: "network effects platform economics evidence"
    Found: 1 relevant source
    Result: Entrenchment increased (0.3 -> 0.45)

  IQ snapshot: composite 64.2 (delta: +1.5)
```

### Agents Involved

1. control-theory: convergence criteria, budget optimization
2. active-learning: opportunity prioritization by expected gain
3. web-acquisition: search execution strategy
4. systems-theory: IQ impact estimation
5. formal-epistemology: tension resolution logic, entrenchment updates
