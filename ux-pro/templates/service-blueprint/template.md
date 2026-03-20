# Service Blueprint

## Header

| Field | Value |
|-------|-------|
| **Service Name** | [Service Name, e.g., "Customer onboarding"] |
| **Scope** | [Start and end points, e.g., "From signup through first successful project"] |
| **Date** | [YYYY-MM-DD] |
| **Version** | [1.0] |
| **Author** | [Name] |
| **Stakeholders** | [Names and roles] |
| **Data Sources** | [e.g., Service walkthroughs, staff interviews, system documentation] |

---

## Service Overview

**Service description:** [1-2 sentences describing the service being blueprinted]

**Target user:** [Who is the primary customer for this service]

**Service goal:** [What the service aims to accomplish for the customer]

**Current state vs. future state:** [Indicate whether this blueprint maps the current experience or a proposed redesign]

---

## Blueprint Legend

| Symbol | Meaning |
|--------|---------|
| **(F)** | Fail point: where things commonly go wrong |
| **(W)** | Wait point: where the customer experiences a delay |
| **(D)** | Decision point: where the flow branches based on a condition |

---

## Service Blueprint

<!-- Guidance: Each phase is a column. Populate every layer for each phase. If a layer has no activity in a given phase, write "None" rather than leaving it blank. Mark fail points (F), wait points (W), and decision points (D) inline. -->

### Phase 1: [Phase Name, e.g., "Discovery"]

**Time estimate:** [e.g., 5 minutes to 2 days]

#### Physical Evidence
_What the customer can see and touch_

- [e.g., Marketing website]
- [e.g., Social media ads]
- [e.g., Referral email from friend]

#### Customer Actions
_What the customer does_

- [e.g., Visits website]
- [e.g., Reads feature comparison page]
- [e.g., Clicks "Start free trial"] **(D)** User decides whether to sign up

#### Frontstage Actions
_Employee/system actions visible to the customer_

- [e.g., Website serves personalized landing page]
- [e.g., Chatbot offers help after 30 seconds]

---
**Line of Visibility** (customer cannot see below this line)

---

#### Backstage Actions
_Employee/system actions hidden from the customer_

- [e.g., Analytics tracks page views and scroll depth]
- [e.g., CRM creates lead record]

---
**Line of Internal Interaction** (cross-department boundary)

---

#### Support Processes
_Internal systems and infrastructure_

- [e.g., CMS serves landing page content]
- [e.g., A/B testing platform determines page variant]
- [e.g., CRM integration (Salesforce)]

#### Technology/Systems

| System | Role |
|--------|------|
| [e.g., Contentful] | [CMS for marketing pages] |
| [e.g., Salesforce] | [Lead tracking] |
| [e.g., Optimizely] | [A/B testing] |

---

### Phase 2: [Phase Name, e.g., "Sign Up"]

**Time estimate:** [e.g., 2 to 5 minutes]

#### Physical Evidence

- [e.g., Signup form]
- [e.g., Confirmation email]
- [e.g., Welcome screen]

#### Customer Actions

- [e.g., Fills in name, email, password]
- [e.g., Verifies email address] **(W)** Waiting for verification email
- [e.g., Completes profile setup] **(F)** Email sometimes lands in spam

#### Frontstage Actions

- [e.g., Form validates inputs in real time]
- [e.g., System sends verification email]
- [e.g., Welcome screen displays after verification]

---
**Line of Visibility**

---

#### Backstage Actions

- [e.g., Auth service creates user account]
- [e.g., Email service sends transactional email]
- [e.g., Provisioning service creates default workspace]

---
**Line of Internal Interaction**

---

#### Support Processes

- [e.g., Identity provider (Auth0)]
- [e.g., Email delivery service (SendGrid)]
- [e.g., Database: user record creation]

#### Technology/Systems

| System | Role |
|--------|------|
| [e.g., Auth0] | [Authentication and user management] |
| [e.g., SendGrid] | [Transactional email delivery] |
| [e.g., PostgreSQL] | [User data storage] |

---

### Phase 3: [Phase Name, e.g., "Onboarding"]

**Time estimate:** [e.g., 10 to 30 minutes]

#### Physical Evidence

- [e.g., Onboarding checklist]
- [e.g., Tutorial tooltips]
- [e.g., Sample project/template]

#### Customer Actions

- [e.g., Follows onboarding checklist]
- [e.g., Creates first project from template] **(D)** Chooses between blank project and template
- [e.g., Invites first team member]

#### Frontstage Actions

- [e.g., System displays progressive onboarding steps]
- [e.g., System pre-populates sample data]
- [e.g., System sends team invitation email]

---
**Line of Visibility**

---

#### Backstage Actions

- [e.g., Onboarding service tracks completion percentage]
- [e.g., Project service creates workspace with defaults]
- [e.g., Notification service queues follow-up emails] **(F)** Follow-up emails sometimes trigger before user completes setup

---
**Line of Internal Interaction**

---

#### Support Processes

- [e.g., Feature flag service (controls onboarding variant)]
- [e.g., Template library (maintained by content team)]
- [e.g., Analytics pipeline (tracks onboarding funnel)]

#### Technology/Systems

| System | Role |
|--------|------|
| [e.g., LaunchDarkly] | [Feature flags for onboarding variants] |
| [e.g., Segment] | [Event tracking] |
| [e.g., Internal CMS] | [Template content management] |

---

### Phase 4: [Phase Name, e.g., "First Use"]

**Time estimate:** [e.g., 1 to 3 days]

#### Physical Evidence

- [e.g., Project dashboard]
- [e.g., Notification emails]
- [e.g., Mobile push notifications]

#### Customer Actions

- [e.g., Creates and assigns first real task]
- [e.g., Checks dashboard for team activity]
- [e.g., Responds to a notification] **(W)** Waits for team members to take action

#### Frontstage Actions

- [e.g., Dashboard updates in real time]
- [e.g., System sends activity digest email]
- [e.g., In-app notification badge updates]

---
**Line of Visibility**

---

#### Backstage Actions

- [e.g., Real-time sync service pushes updates]
- [e.g., Notification engine batches and sends digests]
- [e.g., Success team monitors activation metrics] **(D)** If activation metrics are low, trigger proactive outreach

---
**Line of Internal Interaction**

---

#### Support Processes

- [e.g., WebSocket server (real-time updates)]
- [e.g., Notification scheduling service]
- [e.g., Customer success platform (Gainsight)]

#### Technology/Systems

| System | Role |
|--------|------|
| [e.g., Pusher] | [Real-time WebSocket connections] |
| [e.g., Customer.io] | [Behavioral email campaigns] |
| [e.g., Gainsight] | [Customer success monitoring] |

---

### Phase 5: [Phase Name, e.g., "Ongoing Support"]

**Time estimate:** [e.g., Ongoing]

#### Physical Evidence

- [e.g., Help center / knowledge base]
- [e.g., In-app chat widget]
- [e.g., Status page]

#### Customer Actions

- [e.g., Searches help center for answer]
- [e.g., Opens support chat] **(W)** Waits for agent response
- [e.g., Reports a bug through feedback form]

#### Frontstage Actions

- [e.g., Chatbot attempts to resolve with KB articles]
- [e.g., Support agent joins chat if bot cannot resolve] **(F)** Handoff from bot to agent sometimes loses context
- [e.g., Agent provides resolution and follow-up]

---
**Line of Visibility**

---

#### Backstage Actions

- [e.g., Support ticket created in ticketing system]
- [e.g., Bug report routed to engineering triage]
- [e.g., Agent updates knowledge base if gap found]

---
**Line of Internal Interaction**

---

#### Support Processes

- [e.g., Ticketing system (Zendesk)]
- [e.g., Bug tracking (Jira)]
- [e.g., Knowledge base CMS]

#### Technology/Systems

| System | Role |
|--------|------|
| [e.g., Zendesk] | [Support ticketing and chat] |
| [e.g., Jira] | [Bug tracking and engineering workflow] |
| [e.g., Confluence] | [Internal knowledge base] |

---

<!-- Guidance: Add or remove phases as needed to match your service journey. -->

## Annotations Summary

### Fail Points

| ID | Phase | Description | Current Impact | Frequency |
|----|-------|-------------|----------------|-----------|
| F1 | [Phase] | [Description of what goes wrong] | [Impact on customer experience] | [How often this occurs] |
| F2 | [Phase] | [Description] | [Impact] | [Frequency] |
| F3 | [Phase] | [Description] | [Impact] | [Frequency] |

### Wait Points

| ID | Phase | Description | Average Wait Time | Customer Perception |
|----|-------|-------------|-------------------|---------------------|
| W1 | [Phase] | [What the customer is waiting for] | [Duration] | [Acceptable / Frustrating / Blocking] |
| W2 | [Phase] | [Description] | [Duration] | [Perception] |

### Decision Points

| ID | Phase | Decision | Branches | Current Conversion |
|----|-------|----------|----------|--------------------|
| D1 | [Phase] | [What decision is being made] | [Option A / Option B] | [e.g., "70% choose A"] |
| D2 | [Phase] | [Decision] | [Branches] | [Conversion] |

---

## Key Insights

### Strengths
- [What works well in the current service]
- [What works well]

### Breakdowns
- [Where the service fails or creates friction]
- [Where the service fails]

### Cross-Channel Gaps
- [Where handoffs between channels lose information or context]
- [Where handoffs break]

### Redundancies
- [Where the same work is done in multiple places or by multiple teams]

---

## Improvement Opportunities

| Priority | Opportunity | Phase(s) | Effort | Expected Impact | Owner |
|----------|------------|----------|--------|-----------------|-------|
| 1 | [Improvement description] | [Phase] | [Low/Med/High] | [Description] | [Team/Person] |
| 2 | [Improvement description] | [Phase] | [Low/Med/High] | [Description] | [Team/Person] |
| 3 | [Improvement description] | [Phase] | [Low/Med/High] | [Description] | [Team/Person] |
| 4 | [Improvement description] | [Phase] | [Low/Med/High] | [Description] | [Team/Person] |
| 5 | [Improvement description] | [Phase] | [Low/Med/High] | [Description] | [Team/Person] |

---

## Appendix

### Methodology
[Describe how this blueprint was created: interviews conducted, systems documented, walkthroughs performed, data analyzed.]

### Related Artifacts
- [Link to journey map]
- [Link to service design documentation]
- [Link to system architecture diagrams]

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Name] | Initial version |
