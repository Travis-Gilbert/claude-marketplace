# UX Metrics and Measurement Frameworks

## Reference Overview

UX metrics translate user experience quality into measurable data. Selecting the right metrics depends on what you are measuring (task, feature, product), when you are measuring (during testing, post-launch, ongoing), and what decisions the data will inform. This reference covers task-level metrics, standardized questionnaires, and strategic measurement frameworks.

---

## Task-Level Metrics

These metrics are collected during usability testing sessions (moderated or unmoderated) to evaluate specific tasks.

### Task Completion Rate (Success Rate)

**Definition.** The percentage of participants who successfully complete a given task.

**Calculation.** (Number of successful completions / Total attempts) x 100

**Binary scoring.** Task is either completed successfully or not. Simple to calculate, easy to explain.

**Partial scoring.** Award fractional credit for tasks that are partially completed. More nuanced but requires clear criteria for partial success.

**Benchmark.** Industry average across studies is approximately 78% (Jeff Sauro, MeasuringU). Below 70% indicates significant usability issues. Above 90% suggests the task is well-designed.

**When to use.** Every usability study. The most fundamental measure of whether an interface works.

---

### Time on Task

**Definition.** The elapsed time from when a participant begins a task to when they complete it (or abandon it).

**Measurement.** Record start and end times. Exclude time spent on post-task questions. For abandoned tasks, record time to abandonment separately.

**Analysis.** Task time data is typically skewed (a few participants take much longer). Report the geometric mean or median rather than the arithmetic mean. Compare across test rounds to track improvement.

**Benchmark.** No universal benchmark; compare across iterations of the same task. A 20%+ reduction between versions is meaningful.

**When to use.** When efficiency matters (high-frequency tasks, time-sensitive workflows, enterprise tools).

---

### Error Rate

**Definition.** The number of errors a participant makes while attempting a task, or the percentage of participants who make at least one error.

**Types of errors:**
- **Slips.** The user knows the correct action but executes it incorrectly (clicking the wrong button, typo)
- **Mistakes.** The user takes a deliberate but incorrect action based on a wrong understanding of the interface
- **Non-critical errors.** User recovers without significant disruption
- **Critical errors.** User cannot recover, resulting in task failure or data loss

**Calculation options:**
- Error rate per task: total errors / total task attempts
- Participants with errors: participants with 1+ error / total participants

**When to use.** When error consequences are high (medical, financial, legal). When comparing design alternatives for error-proneness.

---

### Lostness

**Definition.** A measure of how efficiently a participant navigated through the interface. Compares the participant's path to the optimal path.

**Calculation.** L = sqrt((N/S - 1)^2 + (R/N - 1)^2) / sqrt(2)

Where N = number of unique pages visited, S = minimum pages needed, R = total pages visited (including revisits).

**Interpretation.** 0 = perfectly efficient. Higher values indicate more wandering. Lostness above 0.4 indicates significant navigational difficulty.

**When to use.** Evaluating information architecture and navigation. Comparing alternative site structures.

---

### Efficiency

**Definition.** The ratio of task time for an expert user to the task time for the test participant. Alternatively, the ratio of minimum actions to actual actions.

**Calculation.** Expert time / Participant time, or Minimum clicks / Actual clicks.

**When to use.** When optimizing for expert users. When measuring learnability over repeated task attempts.

---

## Standardized Questionnaires

### System Usability Scale (SUS)

**Origin.** John Brooke, 1986. The most widely used standardized usability questionnaire.

**Administration.** 10 statements, each rated on a 5-point Likert scale (Strongly Disagree to Strongly Agree). Administer after the participant has had an opportunity to use the system but before any debrief discussion.

**The 10 items:**
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Scoring calculation:**
1. For odd-numbered items (1, 3, 5, 7, 9): score = response value minus 1
2. For even-numbered items (2, 4, 6, 8, 10): score = 5 minus response value
3. Sum all 10 adjusted scores
4. Multiply the sum by 2.5 to get a score from 0 to 100

**Interpretation:**

| SUS Score | Adjective Rating | Percentile |
|-----------|-----------------|------------|
| 84.1+ | Best imaginable | 96th+ |
| 80.3 | Excellent | 90th |
| 68.0 | OK (average) | 50th |
| 51.0 | Poor | 15th |
| 25.0 or below | Worst imaginable | Bottom 5% |

**Industry benchmark.** The global average SUS score across thousands of studies is approximately 68. Scores above 68 are above average; below 68 are below average.

**Sample size.** 12 to 14 respondents for a reliable score. 20+ for comparisons between versions.

---

### Single Ease Question (SEQ)

**Definition.** A single post-task question: "Overall, how easy or difficult was this task?" Rated on a 7-point scale (1 = Very Difficult, 7 = Very Easy).

**When to administer.** Immediately after each task in a usability test, before any discussion.

**Benchmark.** The average SEQ score across studies is approximately 5.5. Tasks scoring below 5.5 deserve investigation.

**Advantages.** Minimal burden on participants. Can be administered after every task without fatigue. Correlates well with task success and task time.

---

### UMUX-Lite

**Definition.** A 2-item alternative to SUS that measures perceived usability and usefulness.

**Items (7-point Likert scale):**
1. "[System name]'s capabilities meet my requirements."
2. "[System name] is easy to use."

**Scoring.** ((Sum of scores - 2) / 12) x 100 to get a 0 to 100 scale comparable to SUS.

**When to use.** When survey space is extremely limited. When a quick usability pulse is needed alongside other survey questions.

---

### NASA-TLX (Task Load Index)

**Definition.** A multidimensional assessment of perceived workload. Originally developed for aviation; applicable to any complex task.

**Six dimensions (each rated 0 to 100):**
1. **Mental Demand.** How mentally demanding was the task?
2. **Physical Demand.** How physically demanding was the task?
3. **Temporal Demand.** How hurried or rushed was the pace?
4. **Performance.** How successful were you in accomplishing the task?
5. **Effort.** How hard did you have to work to accomplish your level of performance?
6. **Frustration.** How insecure, discouraged, irritated, stressed, or annoyed were you?

**Scoring.** The raw TLX averages all six dimensions equally. The full TLX adds a pairwise weighting procedure to prioritize dimensions the participant considers most relevant.

**When to use.** Complex, high-stakes tasks (healthcare interfaces, industrial control systems, financial trading). When you need to diagnose which dimension of workload is problematic.

---

## Strategic Measurement Frameworks

### HEART Framework (Google)

Developed by Kerry Rodden, Hilary Hutchinson, and Xin Fu at Google. Provides a structured approach to defining UX metrics at the product level.

**Five dimensions:**

**Happiness.** Measures user attitudes and satisfaction.
- Goals: increase user satisfaction with the onboarding experience
- Signals: survey responses, star ratings, NPS scores
- Metrics: SUS score, NPS, CSAT, app store rating

**Engagement.** Measures the depth and frequency of user interaction.
- Goals: increase the frequency of feature usage
- Signals: session frequency, session duration, actions per session
- Metrics: DAU/MAU ratio, sessions per week, features used per session

**Adoption.** Measures new users and new feature uptake.
- Goals: increase the percentage of users who complete onboarding
- Signals: account creation, first task completion, feature activation
- Metrics: new accounts per week, onboarding completion rate, feature adoption rate

**Retention.** Measures whether users continue to use the product over time.
- Goals: reduce churn among active users
- Signals: return visits, subscription renewals, re-engagement
- Metrics: 7-day / 30-day / 90-day retention rate, churn rate, cohort retention curves

**Task Success.** Measures the effectiveness and efficiency of specific user tasks.
- Goals: improve the success rate of the search-to-purchase flow
- Signals: task completion, error occurrences, time to complete
- Metrics: task success rate, time on task, error rate

**Process for using HEART:**
1. Choose which dimensions are relevant (not all five apply to every product)
2. For each dimension, define Goals (what you are trying to achieve)
3. Identify Signals (user actions or attitudes that indicate progress)
4. Define Metrics (quantifiable measures derived from signals)

---

### AARRR (Pirate Metrics)

Developed by Dave McClure for startup growth measurement. Tracks the user lifecycle in five stages.

**Acquisition.** How do users find the product?
- Metrics: visitors, signups, channel effectiveness, cost per acquisition
- UX relevance: landing page conversion, first impression quality

**Activation.** Do users have a good first experience?
- Metrics: onboarding completion, first value moment, activation rate
- UX relevance: time to first value, onboarding friction, setup complexity

**Retention.** Do users come back?
- Metrics: return visit rate, DAU/MAU, cohort retention
- UX relevance: habit formation, notification effectiveness, core loop quality

**Revenue.** Do users pay (or generate value)?
- Metrics: conversion rate, ARPU, LTV
- UX relevance: pricing page UX, checkout friction, upgrade path clarity

**Referral.** Do users tell others?
- Metrics: NPS, referral rate, viral coefficient
- UX relevance: sharing features, invite flow UX, word-of-mouth triggers

---

## Choosing the Right Metrics

### By Study Type

| Study Type | Recommended Metrics |
|-----------|-------------------|
| Moderated usability test | Task success, time on task, error rate, SEQ, think-aloud observations |
| Unmoderated usability test | Task success, time on task, click paths, SEQ, SUS |
| A/B test | Conversion rate, click-through rate, engagement metrics |
| Benchmark study | SUS, task success, time on task (compared to baseline) |
| Post-launch monitoring | HEART metrics, retention, engagement, task completion funnels |

### By Decision Type

| Decision | Best Metrics |
|----------|-------------|
| "Is this usable?" | Task success rate, error rate, SUS |
| "Is this better than the previous version?" | SUS delta, task time delta, task success delta |
| "Which design option is better?" | A/B conversion, preference, SEQ comparison |
| "Where are users struggling?" | Error rate by step, lostness, heatmaps, session recordings |
| "Is the product healthy overall?" | HEART framework, retention curves, NPS trends |

### Statistical Considerations

- **Sample size for statistical significance.** Use a sample size calculator appropriate to the metric type. For binary metrics (success/failure), 20+ per condition for qualitative trends, 75+ for statistical significance.
- **Confidence intervals.** Always report confidence intervals alongside point estimates. A task success rate of 80% with a 95% CI of [60%, 92%] communicates very differently than 80% with [75%, 85%].
- **Effect size.** A statistically significant difference may not be practically meaningful. Define minimum meaningful differences before testing.
- **Pre-post comparison.** When comparing across versions, use the same tasks, the same metrics, and ideally the same participant pool (or matched cohorts).
