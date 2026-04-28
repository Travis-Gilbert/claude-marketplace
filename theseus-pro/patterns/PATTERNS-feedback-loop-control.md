# PATTERNS-feedback-loop-control.md

How to safely close a feedback loop in a self-organizing system.

## The Protocol

### Step 1: Measure Baseline

Before enabling any loop:
```bash
python3 manage.py iq_report > iq_baseline.txt
```
Record all seven axis scores and the composite.

### Step 2: Implement with Kill Switch

Every feedback loop MUST have:
```python
# In engine_config (per-Notebook JSON field):
{
    "loops": {
        "auto_classify": {"active": false, "dampening": 0.5},
        "community_notebook": {"active": false, "dampening": 0.5},
        "entity_promotion": {"active": false, "dampening": 0.5},
        "edge_decay": {"active": false, "dampening": 0.5},
        "emergent_types": {"active": false, "dampening": 0.5}
    }
}
```

The `active` flag is the kill switch. The `dampening` coefficient
(0.0 to 1.0) controls how aggressively the loop modifies structure.
Start at 0.5, never above 0.8 without sensitivity analysis.

### Step 3: Sensitivity Analysis

Before activating a loop:
```python
def sensitivity_test(loop_name, param, delta_pct=0.1):
    baseline_output = run_loop_preview(loop_name, default_params)
    perturbed_params = default_params.copy()
    perturbed_params[param] *= (1 + delta_pct)
    perturbed_output = run_loop_preview(loop_name, perturbed_params)

    change = measure_output_difference(baseline_output, perturbed_output)
    if change > 0.30:
        print(f"WARNING: {param} +{delta_pct:.0%} causes {change:.0%} output change")
        print(f"ADD DAMPENING before closing this loop.")
    return change
```

Rule: if 10% parameter change causes >30% output change, the loop
needs dampening or the parameter needs constraints.

### Step 4: Enable for One Notebook

```python
# Enable for a single test Notebook
notebook.engine_config['loops']['entity_promotion']['active'] = True
notebook.save()
```

Run the engine daily for one week. Monitor:
- IQ score variance: should be <5% day-to-day
- Edge count trend: should not be monotonically increasing
- Community count: should not oscillate

### Step 5: Stabilize

If variance exceeds 5%:
- Reduce dampening coefficient by 0.1
- If still unstable at dampening=0.1, the loop may have a design problem
- Review the loop's detection/proposal/threshold/mutation chain

### Step 6: Scale

After one stable week on one Notebook:
- Enable for all Notebooks
- Monitor for 2 more weeks
- Only then consider enabling the NEXT loop

## Loop Interaction Rules

Some loop combinations are dangerous:
- Entity promotion (positive) + emergent types (positive) = potential runaway
  -> Enable emergent types only AFTER entity promotion is stable
- Edge decay (negative) + community detection (neutral) = safe
  -> These can be enabled in parallel
- Auto-classify (positive) + community notebook (neutral) = safe
  -> These can be enabled in parallel

General rule: never enable two POSITIVE feedback loops simultaneously.
Pair one positive with one negative, wait for stability, then add the next.

## Emergency Shutdown

If IQ composite drops >10 points from baseline:
```python
# Kill all loops immediately
for notebook in Notebook.objects.all():
    for loop in notebook.engine_config.get('loops', {}).values():
        loop['active'] = False
    notebook.save()
```
Investigate before re-enabling.
