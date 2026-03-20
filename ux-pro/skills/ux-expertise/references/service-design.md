# Service Design Methods

## Reference Overview

Service design examines the entire ecosystem of a service: the people, processes, tools, and touchpoints involved in delivering value. While UX design often focuses on a single interface, service design zooms out to consider the complete experience across channels, time, and organizational boundaries. This reference covers five core methods: journey mapping, service blueprints, empathy maps, Jobs to Be Done, and opportunity solution trees.

---

## Journey Mapping

A journey map is a visualization of the process a person goes through to accomplish a goal over time. It tells the story of the experience from the user's perspective, including actions, thoughts, emotions, and touchpoints.

### Phases of a Typical Journey

Define phases based on the specific journey being mapped. A common starting structure:

1. **Awareness.** The user becomes aware of a need or discovers the product/service
2. **Consideration.** The user evaluates options and compares alternatives
3. **Acquisition.** The user signs up, purchases, or onboards
4. **Service/Usage.** The user engages with the core product or service
5. **Loyalty/Advocacy.** The user becomes a repeat customer, recommends to others, or churns

Adapt these phases to match the actual user journey. A healthcare journey might use: Symptoms, Diagnosis, Treatment, Recovery, Follow-up. An e-commerce journey might use: Browse, Compare, Purchase, Receive, Return.

### Rows (Lanes) of a Journey Map

| Row | Content |
|-----|---------|
| **Actions** | What the user does at each phase (searches, clicks, calls, visits) |
| **Thinking** | What the user is thinking, wondering, or deciding at each stage |
| **Feeling** | Emotional state at each phase (frustrated, confident, anxious, delighted); plot as an emotion curve |
| **Touchpoints** | Channels and interfaces the user interacts with (website, email, phone, physical store, mobile app) |
| **Pain Points** | Specific problems, friction, or frustrations at each phase |
| **Opportunities** | Design opportunities to improve the experience |

### Types of Journey Maps

**Current-state map.** Documents the experience as it exists today. Based on research data (not assumptions). Use for identifying pain points and prioritizing improvements.

**Future-state map.** Visualizes the desired experience after planned improvements. Use for aligning the team on the target experience and identifying the gap between current and future state.

**Day-in-the-life map.** Documents a user's entire day, not just their interaction with your product. Provides broader context about when and how your product fits into their life. Useful for discovering opportunities outside the current product scope.

### Building a Journey Map

1. **Define scope.** Select the persona, the scenario (specific goal or task), and the timeframe
2. **Gather data.** Use research inputs: contextual inquiry, interviews, diary studies, analytics, support tickets
3. **Map the phases.** Identify the major stages of the journey from the user's perspective
4. **Fill in the rows.** Document actions, thoughts, feelings, touchpoints, and pain points for each phase
5. **Identify opportunities.** Analyze pain points and emotional lows for improvement potential
6. **Validate.** Review with customer-facing staff and, ideally, with users

### Common Mistakes

- Building journey maps from assumptions rather than research data
- Making the map too granular (interaction-level detail belongs in wireflows, not journey maps)
- Focusing only on the digital experience while ignoring phone, email, and physical touchpoints
- Creating the map and never updating it

---

## Service Blueprints

A service blueprint extends the journey map by adding the organizational perspective: what happens behind the scenes to deliver the experience the user sees.

### Layers

From top to bottom:

**Physical Evidence.** Tangible artifacts the customer encounters at each touchpoint (website, email, packaging, receipt, physical space).

**Customer Actions.** What the customer does (same as the actions row in a journey map).

**Frontstage Actions.** Employee or system actions that the customer can see (chat support response, confirmation email, in-store greeting, UI response).

**Backstage Actions.** Employee or system actions that the customer cannot see but that directly support frontstage delivery (order processing, inventory check, data validation, agent looking up account).

**Support Processes.** Internal systems, policies, and third-party services that enable backstage actions (CRM, payment processing, logistics, training, IT infrastructure).

### Lines

Three horizontal lines separate the layers:

**Line of Interaction.** Between customer actions and frontstage actions. Represents direct interactions between the customer and the organization.

**Line of Visibility.** Between frontstage and backstage actions. Everything above is visible to the customer; everything below is hidden.

**Line of Internal Interaction.** Between backstage actions and support processes. Separates direct service delivery from enabling infrastructure.

### Marking Points

Annotate the blueprint with:

- **Fail points** (marked with F or a warning icon): steps where the process is likely to break down
- **Wait points** (marked with W or a clock icon): steps where the customer experiences a delay
- **Decision points** (marked with D or a diamond): steps where a choice determines the next path
- **Pain points**: customer-reported or observed friction areas

### Building a Service Blueprint

1. **Start with the journey map.** The customer actions row of the blueprint is the journey map
2. **Add frontstage actions.** For each customer action, document what the customer-facing system or employee does
3. **Add backstage actions.** For each frontstage action, document the behind-the-scenes work
4. **Add support processes.** For each backstage action, document the enabling systems and policies
5. **Mark failure, wait, and decision points.** Identify where the process is fragile or slow
6. **Validate with cross-functional stakeholders.** Operations, support, engineering, and business teams each own parts of the blueprint

### When to Use Service Blueprints

- Designing a new service end-to-end
- Diagnosing operational failures that affect the user experience
- Aligning multiple teams on how they contribute to the customer experience
- Identifying automation opportunities in backstage processes
- Planning for scaling a service (understanding dependencies and bottlenecks)

---

## Empathy Maps

An empathy map is a collaborative tool for synthesizing what is known about a user segment. It creates a shared understanding of user needs, behaviors, and motivations.

### Quadrants

**Says.** Direct quotes from users collected during interviews, usability tests, or customer support interactions. Use actual language, not paraphrased.

**Thinks.** What the user is thinking but may not say aloud. Internal motivations, concerns, aspirations. Often inferred from behavior and follow-up questions. Note contradictions between what users say and what they think.

**Does.** Observable actions and behaviors. What the user actually does (not what they say they do). Include workarounds, rituals, and patterns.

**Feels.** Emotional states: frustration, confidence, anxiety, excitement, boredom. What the user worries about. What excites them. What frustrates them.

### Building an Empathy Map

1. **Gather research data.** Interview transcripts, observation notes, survey responses
2. **Identify the persona or segment.** One empathy map per user type
3. **Fill each quadrant.** Use sticky notes or collaborative tools. Capture multiple data points per quadrant
4. **Identify patterns and tensions.** Look for contradictions (says one thing, does another) and recurring themes
5. **Extract needs.** Based on the patterns, articulate user needs in "verb + noun" format (e.g., "Find relevant content quickly," "Feel confident about data accuracy")

### Limitations

Empathy maps are synthesis tools, not research methods. They are only as good as the research that feeds them. Do not fill in quadrants with assumptions and call it empathy mapping.

---

## Jobs to Be Done (JTBD)

Jobs to Be Done is a framework for understanding user motivation. Instead of focusing on who the user is (demographics, personas), JTBD focuses on what progress the user is trying to make in a specific circumstance.

### Job Statement Format

"When [situation], I want to [motivation], so I can [expected outcome]."

Examples:
- "When I arrive at a new city for a conference, I want to find a restaurant near my hotel, so I can have dinner without navigating unfamiliar transit."
- "When I receive my monthly expenses report, I want to quickly identify anomalies, so I can address budget overruns before the next cycle."

### Three Dimensions of a Job

**Functional.** The practical task the user wants to accomplish. What needs to get done.

**Emotional.** How the user wants to feel (or avoid feeling) during and after the task. Confidence, control, reduced anxiety.

**Social.** How the user wants to be perceived by others. Status, competence, responsibility.

All three dimensions influence product decisions. A cheaper, faster solution may lose to a competitor that better addresses the emotional and social dimensions.

### Switch Interviews

Switch interviews are the primary research method for JTBD. Interview users who recently switched to (or from) a product.

**Timeline structure:**
1. First thought: When did you first start thinking about a new solution?
2. Passive looking: What made you start paying attention to alternatives?
3. Active looking: What triggered active searching and evaluation?
4. Decision: What made you choose this specific solution?
5. Consumption: What was the first use experience?
6. Ongoing use: How has the experience evolved?

**Four forces framework:**
- **Push of the current situation.** Dissatisfaction with the status quo
- **Pull of the new solution.** Appeal of the alternative
- **Anxiety of the new solution.** Fear of change, learning curve, risk
- **Habit of the current situation.** Comfort with the familiar, switching cost

Switch happens when push + pull > anxiety + habit.

### Applying JTBD to Design

- Frame feature requests as jobs: "What job is the user hiring this feature to do?"
- Prioritize by the importance and satisfaction gap of each job
- Design for the situation and motivation, not the demographic
- Use job statements to write acceptance criteria and evaluate designs

---

## Opportunity Solution Trees (Teresa Torres)

Opportunity Solution Trees (OSTs) are a visual framework for connecting product outcomes to customer needs, potential solutions, and experiments. Developed by Teresa Torres as part of continuous discovery practices.

### Tree Structure

```
Outcome (business or product metric)
  |
  +-- Opportunity (user need or pain point)
  |     |
  |     +-- Solution A
  |     |     +-- Experiment 1
  |     |     +-- Experiment 2
  |     |
  |     +-- Solution B
  |           +-- Experiment 3
  |
  +-- Opportunity
        |
        +-- Solution C
              +-- Experiment 4
```

### Levels of the Tree

**Outcome.** The measurable result the team is trying to achieve. Should be a product or business metric that the team can influence. Examples: "Increase 30-day retention by 5%," "Reduce time to first value from 10 minutes to 3 minutes."

**Opportunities.** User needs, pain points, or desires discovered through research. These are the reasons users are not achieving the outcome today. Frame as user problems, not solutions. Example: "Users do not understand what the product can do before they commit to signing up."

**Solutions.** Specific design ideas that address an opportunity. Generate multiple solutions per opportunity before committing to one. Example: "Interactive product tour," "Sample project with guided walkthrough," "2-minute explainer video."

**Experiments.** Small, fast tests to validate whether a solution will work before building it fully. Example: "Show 50% of new users a prototype of the interactive tour and measure completion rate."

### Building an Opportunity Solution Tree

1. **Start with a clear outcome.** Align with product leadership on the metric
2. **Map opportunities from research.** Use interview data, support tickets, analytics to identify user problems related to the outcome
3. **Prioritize opportunities.** Consider frequency (how many users), severity (how painful), and strategic fit
4. **Generate multiple solutions per opportunity.** Brainstorm at least three solutions before evaluating
5. **Design assumption tests.** For each promising solution, identify the riskiest assumption and design an experiment to test it
6. **Iterate.** As experiments produce results, add new opportunities, solutions, and experiments

### Benefits

- Keeps teams focused on outcomes rather than output
- Creates a clear link between user research and product decisions
- Encourages multiple solutions per problem (avoiding solution fixation)
- Builds a habit of experimentation before commitment
- Provides a living document that evolves with new research

### Common Mistakes

- Jumping to solutions without mapping opportunities first
- Having only one solution per opportunity (no comparison)
- Framing opportunities as solutions in disguise ("Users need a search bar" is a solution, not an opportunity; "Users cannot find content" is the opportunity)
- Not updating the tree as new data arrives
- Treating the tree as a one-time exercise rather than a living artifact
