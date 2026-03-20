# UX Research Method Selection Framework

## Reference Overview

Selecting the right research method depends on the project phase, the questions being answered, available resources, and the type of insight needed. This framework organizes methods by the four phases of product development: Discovery, Definition, Design, and Measurement.

### Selection Criteria

| Factor | Considerations |
|--------|---------------|
| **Phase** | Where in the product lifecycle is the team? |
| **Question type** | Behavioral (what users do) vs. attitudinal (what users say/think) |
| **Data type** | Qualitative (why) vs. quantitative (how many, how much) |
| **Context** | Natural use vs. scripted tasks |
| **Resources** | Budget, timeline, participant access, tooling |

---

## Phase 1: Discovery

Discovery research aims to understand the problem space, user needs, behaviors, and context before designing solutions.

### Contextual Inquiry

**When to use.** Early in the project; when the team lacks direct understanding of how users perform tasks in their real environment.

**What you learn.** Actual workflows, workarounds, pain points, environmental factors, unspoken needs, and the gap between what users say they do and what they actually do.

**Effort level.** High. Requires travel to user locations, scheduling, 1:1 observation sessions of 1 to 2 hours each, and extensive note-taking.

**Sample size.** 4 to 8 participants. The deep qualitative nature means fewer sessions yield rich insight.

**Process.** Observe users performing real tasks in their actual environment. Ask questions during natural breaks. Focus on the "master/apprentice" model: the user is the expert, the researcher is learning. Record observations, artifacts, environment details, and direct quotes.

---

### Stakeholder Interviews

**When to use.** Project kickoff; when aligning on business goals, constraints, success metrics, and organizational context.

**What you learn.** Business objectives, success criteria, known pain points, political dynamics, technical constraints, competitive landscape from the business perspective.

**Effort level.** Medium. 30 to 60 minutes per interview, minimal preparation beyond interview guide.

**Sample size.** 5 to 10 stakeholders across relevant roles (product, engineering, marketing, support, leadership).

**Process.** Prepare a semi-structured interview guide. Focus on goals, constraints, and definition of success. Document assumptions that need user validation.

---

### Diary Studies

**When to use.** When understanding behavior over time is critical; for infrequent or context-dependent activities; when real-time observation is impractical.

**What you learn.** Patterns over time, triggers for behavior, emotional context, frequency of activities, long-term adoption patterns.

**Effort level.** High. Requires participant recruitment, setup, daily monitoring, follow-up interviews, and analysis across days or weeks of data.

**Sample size.** 10 to 15 participants for 1 to 4 weeks.

**Process.** Define the capture prompt (what, when, how to log). Provide a capture tool (app, journal, text messages). Send daily or event-triggered reminders. Follow up with individual debrief interviews. Analyze across time and participants for patterns.

---

### Competitive Analysis

**When to use.** When entering an existing market; when evaluating alternative approaches to the same problem; during strategy and positioning work.

**What you learn.** Market patterns, feature gaps, UX conventions in the category, strengths and weaknesses of alternatives, opportunities for differentiation.

**Effort level.** Medium. Desktop research plus structured evaluation of 4 to 8 competitors.

**Sample size.** Not applicable (analysis, not participant research). Evaluate 4 to 8 direct and indirect competitors.

**Process.** Identify direct and indirect competitors. Create evaluation criteria (features, UX patterns, pricing, positioning). Perform structured walkthroughs. Document patterns, gaps, and opportunities. Optionally include heuristic evaluation of competitor interfaces.

---

### Exploratory Survey

**When to use.** When broad quantitative data is needed to validate assumptions, prioritize problems, or segment users before deeper qualitative research.

**What you learn.** Prevalence of behaviors, attitudes, preferences, and demographics across a population. Good for prioritizing which problems affect the most users.

**Effort level.** Medium. Design time for the survey instrument, distribution, and statistical analysis.

**Sample size.** 100+ for meaningful quantitative analysis. 200 to 400 for segmentation.

**Process.** Define research questions. Draft survey with mix of closed and open-ended questions. Pilot with 5 to 10 respondents. Iterate on wording. Distribute to target population. Analyze quantitative data statistically; code open-ended responses thematically.

---

### Open Card Sorting

**When to use.** When designing information architecture for a new product or restructuring existing content. When the team does not yet know how users mentally organize content.

**What you learn.** Users' mental models for categorizing content. Natural groupings, expected labels, and conceptual boundaries.

**Effort level.** Low to medium. Can be conducted remotely with tools like OptimalSort or Maze.

**Sample size.** 15 to 30 participants for statistically meaningful clusters.

**Process.** Prepare content items as individual cards (30 to 60 items). Ask participants to sort cards into groups that make sense to them and name each group. Analyze results using similarity matrices and dendrograms.

---

## Phase 2: Definition

Definition research synthesizes discovery insights into actionable frameworks for design.

### Personas

**When to use.** After discovery research reveals distinct user segments with different goals, behaviors, or contexts.

**What you learn.** A shared reference model for design decisions. Personas distill research into memorable archetypes that keep the team focused on real users.

**Effort level.** Medium. Requires completed discovery research as input. Creation takes 1 to 3 days. Maintenance is ongoing.

**Process.** Analyze discovery research for behavioral patterns and segments. Create 3 to 5 personas with: name, photo, role, goals, frustrations, behaviors, context, and a quote. Base every attribute on observed research data. Avoid demographics-only personas; focus on behavior-based attributes.

---

### Journey Mapping

**When to use.** After understanding the current user experience across touchpoints. When the team needs a shared view of the end-to-end experience.

**What you learn.** Pain points across the full experience, emotional highs and lows, opportunities for improvement, handoff problems between channels or teams.

**Effort level.** Medium to high. Requires existing research data. Workshop-based creation takes 1 to 2 days. See the Service Design reference for detailed methodology.

**Process.** Define the scope (which persona, which scenario). Map phases, actions, thoughts, feelings, touchpoints, and pain points. Identify opportunity areas. Validate with users or customer-facing staff.

---

### Jobs to Be Done (JTBD)

**When to use.** When framing problems around user motivation rather than demographics or features. When defining product strategy and prioritization.

**What you learn.** The functional, emotional, and social progress users are trying to make. What triggers a switch from one solution to another. Desired outcomes independent of specific solutions.

**Effort level.** Medium to high. Requires switch interviews (1 to 1.5 hours each) with users who recently adopted or abandoned a solution.

**Sample size.** 10 to 15 switch interviews.

**Process.** Recruit users who recently switched to or from a solution. Conduct timeline interviews exploring the journey from first thought to switch. Map forces: push (current pain), pull (new solution appeal), anxiety (fear of change), habit (attachment to current). Articulate jobs in the format: "When [situation], I want to [motivation], so I can [outcome]."

---

### Service Blueprints

**When to use.** When designing or improving a service with multiple touchpoints, channels, or backstage processes.

**What you learn.** How frontstage user interactions connect to backstage operations. Where handoffs fail, where wait times occur, and where support processes need improvement.

**Effort level.** High. Cross-functional workshop requiring participation from operations, support, engineering, and design.

**Process.** See the Service Design reference for full methodology.

---

### Task Analysis

**When to use.** When understanding the steps, decisions, and information needs within a specific workflow. Before redesigning a complex process.

**What you learn.** The sequential and hierarchical structure of tasks. Decision points, information dependencies, error-prone steps, and opportunities for automation or simplification.

**Effort level.** Medium. Requires observation or walkthrough of the task with 3 to 5 users.

**Process.** Observe the task performed by real users. Document each step, sub-step, decision, and information need. Create a hierarchical task analysis (HTA) diagram. Identify pain points, unnecessary steps, and optimization opportunities.

---

## Phase 3: Design

Design research evaluates proposed solutions through testing with users.

### Moderated Usability Testing

**When to use.** When deep qualitative insight into user behavior is needed. For complex or novel interactions. When follow-up questions are important.

**What you learn.** Whether users can complete tasks, where they struggle, why they struggle, what mental models they bring, and how they react emotionally.

**Effort level.** High. Requires screener, recruitment, test protocol, facilitation, and analysis. Each session runs 30 to 60 minutes.

**Sample size.** 5 to 8 participants per round. Nielsen and Landauer (1993) showed 5 users find approximately 80% of usability problems.

**Process.** Define tasks based on key user scenarios. Write a test protocol with task scripts and follow-up questions. Recruit representative participants. Facilitate sessions using think-aloud protocol. Record sessions. Analyze for patterns across participants.

---

### Unmoderated Usability Testing

**When to use.** When quantitative task-level metrics are needed. When testing with larger samples. When rapid turnaround is required.

**What you learn.** Task success rates, time on task, error rates, and click paths across a statistically meaningful sample. Less "why" insight compared to moderated testing.

**Effort level.** Medium. Setup requires careful task writing and tool configuration. Minimal facilitator time. Analysis can be partially automated.

**Sample size.** 15 to 30 participants for quantitative confidence. 5 to 10 for qualitative feedback.

**Process.** Configure tasks in a remote testing tool (UserTesting, Maze, Lookback). Write clear, self-contained task instructions. Set pre-task and post-task questions. Launch and monitor for quality. Analyze quantitative metrics and screen recordings.

---

### A/B Testing

**When to use.** When choosing between two or more specific design variants. When a clear success metric exists. When sufficient traffic is available.

**What you learn.** Which variant performs better on the target metric. Quantitative evidence for design decisions.

**Effort level.** Medium to high. Requires implementation of variants, traffic allocation, statistical analysis, and sufficient sample size.

**Sample size.** Depends on the minimum detectable effect and baseline conversion rate. Use a sample size calculator. Typically thousands to tens of thousands of visitors.

**Process.** Define the hypothesis and success metric. Implement variants. Randomize allocation. Run until statistical significance is reached (do not stop early on favorable results). Analyze results accounting for multiple comparisons.

---

### Tree Testing

**When to use.** When evaluating whether an information architecture allows users to find content. After card sorting and before building navigation.

**What you learn.** Whether users can navigate a proposed site structure to find specific content. Findability rates, directness (took the correct path), and time to completion.

**Effort level.** Low to medium. Can run remotely with tools like Treejack.

**Sample size.** 30 to 50 participants for reliable metrics.

**Process.** Create a text-only tree representing the proposed navigation hierarchy. Write 8 to 12 tasks asking users to find specific content. Measure success rate, directness, and time. Identify paths where users go wrong. Iterate on the tree structure based on findings.

---

### Closed Card Sorting

**When to use.** When validating a proposed category structure. When the navigation labels are defined but placement needs testing.

**What you learn.** Whether users agree on where content belongs within predetermined categories.

**Effort level.** Low. Remote tool-based, minimal facilitation.

**Sample size.** 15 to 30 participants.

**Process.** Define the categories (navigation labels). Prepare content items. Ask participants to place each item into the most appropriate category. Analyze agreement percentages per item per category.

---

### First-Click Testing

**When to use.** When evaluating whether users can identify the correct starting point for a task on a page or screen.

**What you learn.** Where users click first when given a task. Research shows that if the first click is correct, users are 2 to 3 times more likely to succeed at the overall task.

**Effort level.** Low. Can be run with static mockups or screenshots.

**Sample size.** 20 to 30 participants.

**Process.** Present a screenshot or wireframe. Give participants a task. Record where they click first. Analyze click distribution using heatmaps.

---

### Heuristic Evaluation

**When to use.** When expert review is needed quickly and at low cost. When identifying usability issues without involving users. Complements but does not replace user testing.

**What you learn.** Compliance with established usability principles. Expert-identified problems with severity ratings.

**Effort level.** Low to medium. 1 to 2 hours per evaluator. See the Nielsen Heuristics reference for detailed methodology.

**Sample size.** 3 to 5 evaluators (expert reviewers, not end users).

---

### Cognitive Walkthrough

**When to use.** When evaluating learnability and first-time usability for specific tasks.

**What you learn.** Whether a new user can figure out how to accomplish a task without training. Identifies steps where users are likely to fail or take wrong paths.

**Effort level.** Low to medium. Structured expert review.

**Process.** Define the target user persona and task. Walk through each step asking: (1) Will the user try to achieve the right effect? (2) Will the user notice the correct action is available? (3) Will the user associate the correct action with the desired effect? (4) Will the user see progress toward the goal after taking the action?

---

## Phase 4: Measurement

Measurement research quantifies UX quality and tracks improvement over time.

### Analytics Review

**When to use.** Continuously. When understanding actual usage patterns at scale. When identifying where users drop off, what features are used, and where navigation fails.

**What you learn.** Behavioral patterns, funnel completion rates, feature adoption, navigation paths, device and context distribution.

**Effort level.** Low for basic review. High for custom analysis and segmentation.

**Key metrics.** Bounce rate, session duration, task completion funnels, feature adoption rates, error page hits, search queries (especially failed searches).

---

### System Usability Scale (SUS)

**When to use.** After usability testing sessions. For benchmarking overall perceived usability over time. For comparing products or versions.

**What you learn.** A standardized usability score from 0 to 100. Industry average is approximately 68. See the UX Metrics reference for detailed scoring.

**Effort level.** Very low. 10 questions, takes 1 to 2 minutes.

**Sample size.** 12+ for reliable scores. 20+ for comparisons between versions.

---

### Net Promoter Score (NPS)

**When to use.** For measuring overall customer loyalty and satisfaction at a relationship level (not task level).

**What you learn.** The proportion of promoters (9 to 10) vs. detractors (0 to 6) on a 0 to 10 recommendation likelihood scale.

**Effort level.** Very low. Single question plus optional follow-up.

**Limitations.** Measures sentiment, not usability. Does not diagnose specific problems. Influenced by brand perception, pricing, and support, not just UX.

---

### HEART Framework (Google)

**When to use.** When defining a comprehensive measurement framework that connects UX goals to product metrics.

**What you learn.** A structured set of metrics across five dimensions: Happiness, Engagement, Adoption, Retention, and Task success.

**Effort level.** Medium. Requires cross-functional alignment on Goals, Signals, and Metrics for each dimension.

See the UX Metrics reference for detailed breakdown.

---

### AARRR (Pirate Metrics)

**When to use.** When measuring product growth and user lifecycle stages. Particularly relevant for startups and growth teams.

**What you learn.** Performance at each stage: Acquisition, Activation, Retention, Revenue, and Referral.

See the UX Metrics reference for detailed breakdown.

---

### NASA-TLX

**When to use.** When measuring perceived workload for complex or critical tasks (healthcare, aviation, enterprise tools).

**What you learn.** Perceived workload across six dimensions: mental demand, physical demand, temporal demand, performance, effort, and frustration.

**Effort level.** Low. Post-task questionnaire with 6 rating scales.

---

### UMUX-Lite

**When to use.** When a shorter alternative to SUS is needed. When survey space is limited.

**What you learn.** Perceived usability and usefulness in 2 items (strongly correlated with SUS scores).

**Effort level.** Very low. 2 questions on a 7-point scale.

---

### Single Ease Question (SEQ)

**When to use.** Immediately after each task in a usability test. When tracking task-level difficulty over time.

**What you learn.** Perceived ease of a specific task on a 1 to 7 scale. Industry benchmark is approximately 5.5.

**Effort level.** Very low. Single question per task.

---

## Method Selection Matrix

| Need | Recommended Methods |
|------|-------------------|
| Understand the problem space | Contextual inquiry, diary study, exploratory survey |
| Evaluate information architecture | Open card sort, tree test, first-click test |
| Test a prototype with users | Moderated usability test (5 to 8 users) |
| Quantify usability at scale | Unmoderated test, A/B test, analytics |
| Benchmark overall usability | SUS, UMUX-Lite, task success rate |
| Choose between design options | A/B test, preference test, first-click test |
| Measure perceived workload | NASA-TLX, SEQ |
| Track product health over time | HEART framework, analytics, periodic SUS |
| Understand user motivation | JTBD switch interviews, contextual inquiry |
| Validate a navigation structure | Tree test, closed card sort |
