# User Journey Map

## Header

| Field | Value |
|-------|-------|
| **Persona** | [Persona Name, e.g., "Sarah, the busy project manager"] |
| **Journey Name** | [Journey Name, e.g., "First-time onboarding to active usage"] |
| **Date** | [YYYY-MM-DD] |
| **Version** | [1.0] |
| **Author** | [Name] |
| **Data Sources** | [e.g., User interviews (n=8), analytics, support tickets] |

---

## Journey Overview

**Goal:** [What the user is trying to accomplish, e.g., "Set up a new project workspace and invite team members"]

**Scenario:** [The specific context and situation, e.g., "Sarah has just signed up for the product after a colleague recommended it. She needs to create a project for her team's Q2 planning."]

**Scope:** [Start and end points of this journey, e.g., "From first landing on the marketing site through completing the first collaborative task"]

**Duration:** [How long this journey typically takes, e.g., "1 to 3 days"]

---

## Journey Phases

<!-- Guidance: Adapt the phase names below to match your specific journey. The five phases here represent a general customer lifecycle. For a more specific journey (e.g., checkout flow), use phases like "Browse," "Add to Cart," "Enter Details," "Review," "Confirm." -->

### Phase 1: Awareness

**Duration:** [e.g., Minutes to days]

**Actions** (what the user does):
- [Action 1, e.g., "Sees a colleague using the product in a meeting"]
- [Action 2, e.g., "Searches for the product online"]
- [Action 3, e.g., "Reads landing page and feature comparison"]

**Thoughts** (internal monologue):
- "[e.g., I wonder if this is better than what we use now]"
- "[e.g., This looks interesting but I do not want to deal with a complicated setup]"

**Feelings** (emotional state):
- Emotional level: [Positive / Neutral / Negative]
- Emotional curve: [e.g., Curious -> Slightly skeptical -> Intrigued]
<!-- Use a simple notation: ++ (very positive), + (positive), 0 (neutral), - (negative), -- (very negative) -->
- Curve notation: `0 ... + ... 0 ... +`

**Touchpoints:**
- [e.g., Word of mouth]
- [e.g., Google search results]
- [e.g., Marketing website]

**Pain Points:**
- [e.g., Hard to tell if the product fits their team size and workflow]
- [e.g., Pricing page is confusing]

**Opportunities:**
- [e.g., Add a "teams like yours" social proof section]
- [e.g., Offer a self-serve ROI calculator]

---

### Phase 2: Consideration

**Duration:** [e.g., Hours to days]

**Actions:**
- [Action 1, e.g., "Signs up for a free trial"]
- [Action 2, e.g., "Explores the empty dashboard"]
- [Action 3, e.g., "Watches a getting-started video"]

**Thoughts:**
- "[e.g., Where do I even start?]"
- "[e.g., I hope I can import our existing data]"

**Feelings:**
- Emotional level: [Positive / Neutral / Negative]
- Emotional curve: [e.g., Optimistic -> Overwhelmed -> Cautiously hopeful]
- Curve notation: `+ ... -- ... 0`

**Touchpoints:**
- [e.g., Signup form]
- [e.g., Welcome email]
- [e.g., Empty state / dashboard]
- [e.g., Help center / onboarding video]

**Pain Points:**
- [e.g., Empty dashboard provides no guidance on first steps]
- [e.g., Import tool is hidden in settings]

**Opportunities:**
- [e.g., Add a guided onboarding checklist]
- [e.g., Surface the import tool in the empty state]

---

### Phase 3: Acquisition

**Duration:** [e.g., Minutes to hours]

**Actions:**
- [Action 1, e.g., "Creates first project"]
- [Action 2, e.g., "Invites two team members"]
- [Action 3, e.g., "Configures project settings"]

**Thoughts:**
- "[e.g., This is taking longer than I expected]"
- "[e.g., I am not sure which template to pick]"

**Feelings:**
- Emotional level: [Positive / Neutral / Negative]
- Emotional curve: [e.g., Determined -> Frustrated -> Relieved]
- Curve notation: `0 ... - ... +`

**Touchpoints:**
- [e.g., Project creation wizard]
- [e.g., Team invitation flow]
- [e.g., Template gallery]

**Pain Points:**
- [e.g., Too many template choices with no way to preview them]
- [e.g., Team invitation requires email addresses (no link sharing)]

**Opportunities:**
- [e.g., Recommend templates based on team size and use case]
- [e.g., Add shareable invite links]

---

### Phase 4: Service

**Duration:** [e.g., Days to weeks]

**Actions:**
- [Action 1, e.g., "Creates and assigns tasks daily"]
- [Action 2, e.g., "Checks project dashboard for progress"]
- [Action 3, e.g., "Contacts support about a missing feature"]

**Thoughts:**
- "[e.g., This is working pretty well for our workflow]"
- "[e.g., I wish I could customize the dashboard view]"

**Feelings:**
- Emotional level: [Positive / Neutral / Negative]
- Emotional curve: [e.g., Satisfied -> Mildly annoyed -> Adapted]
- Curve notation: `+ ... 0 ... +`

**Touchpoints:**
- [e.g., Daily dashboard]
- [e.g., Email notifications]
- [e.g., Mobile app]
- [e.g., Customer support chat]

**Pain Points:**
- [e.g., Notification overload from team activity]
- [e.g., Dashboard does not show the metrics that matter most]

**Opportunities:**
- [e.g., Add notification preferences with smart defaults]
- [e.g., Allow dashboard widget customization]

---

### Phase 5: Loyalty

**Duration:** [e.g., Ongoing]

**Actions:**
- [Action 1, e.g., "Upgrades to paid plan"]
- [Action 2, e.g., "Recommends the product to another team"]
- [Action 3, e.g., "Explores advanced features"]

**Thoughts:**
- "[e.g., This has become essential to how our team works]"
- "[e.g., I wonder what else this product can do]"

**Feelings:**
- Emotional level: [Positive / Neutral / Negative]
- Emotional curve: [e.g., Confident -> Advocating -> Invested]
- Curve notation: `+ ... ++ ... ++`

**Touchpoints:**
- [e.g., Billing/upgrade page]
- [e.g., Feature announcements (email, in-app)]
- [e.g., Community forum]
- [e.g., Account manager (for paid plans)]

**Pain Points:**
- [e.g., Pricing jump from free to paid is steep for small teams]
- [e.g., Advanced features are hard to discover]

**Opportunities:**
- [e.g., Offer a mid-tier plan for small teams]
- [e.g., Surface advanced features through contextual tips]

---

## Emotional Curve Summary

<!-- Guidance: Plot the emotional high and low points across all phases. This visualization helps stakeholders quickly see where the experience breaks down. -->

```
Very Positive  ++  |          *                                          *  *
Positive        +  |    *        *                          *
Neutral         0  | *              *              *           *
Negative        -  |                   *     *
Very Negative  --  |                      *
                   |-------|---------|----------|---------|-----------|
                   Awareness  Consider  Acquire    Service   Loyalty
```

<!-- Replace the asterisks above with the actual emotional curve based on your findings. -->

---

## Moments of Truth

<!-- Guidance: These are critical decision points where the user's experience could go either way. Losing the user at these moments has outsized impact. -->

| # | Moment | Phase | What Happens | Why It Matters |
|---|--------|-------|--------------|----------------|
| 1 | [e.g., First 60 seconds after signup] | Acquisition | [User sees empty dashboard] | [Determines whether user engages or bounces] |
| 2 | [e.g., First team collaboration] | Service | [User and teammate complete a task together] | [Validates the product's core value proposition] |
| 3 | [e.g., Upgrade decision] | Loyalty | [Free trial ends, user decides whether to pay] | [Directly impacts conversion and revenue] |

---

## Key Findings

### Top Pain Points (Ranked by Impact)

1. **[Pain point]** (Phase: [Phase]). [Brief explanation of impact]
2. **[Pain point]** (Phase: [Phase]). [Brief explanation of impact]
3. **[Pain point]** (Phase: [Phase]). [Brief explanation of impact]

### Top Opportunities (Ranked by Value)

1. **[Opportunity]** (Phase: [Phase]). [Expected impact]
2. **[Opportunity]** (Phase: [Phase]). [Expected impact]
3. **[Opportunity]** (Phase: [Phase]). [Expected impact]

---

## Recommendations

| Priority | Recommendation | Phase | Effort | Expected Impact |
|----------|----------------|-------|--------|-----------------|
| 1 | [Recommendation] | [Phase] | [Low/Med/High] | [Description of expected improvement] |
| 2 | [Recommendation] | [Phase] | [Low/Med/High] | [Description of expected improvement] |
| 3 | [Recommendation] | [Phase] | [Low/Med/High] | [Description of expected improvement] |
| 4 | [Recommendation] | [Phase] | [Low/Med/High] | [Description of expected improvement] |
| 5 | [Recommendation] | [Phase] | [Low/Med/High] | [Description of expected improvement] |

---

## Appendix

### Data Sources
- [Source 1, e.g., "8 user interviews conducted 2024-01-15 to 2024-01-22"]
- [Source 2, e.g., "Google Analytics funnel data, Jan 2024"]
- [Source 3, e.g., "Customer support ticket analysis, Q4 2023"]

### Related Artifacts
- [Link to personas]
- [Link to research report]
- [Link to analytics dashboard]

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Name] | Initial version |
