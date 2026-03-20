# UX Review Report

## Project Information

| Field | Value |
|-------|-------|
| **Project** | [Project Name] |
| **Reviewer** | [Reviewer Name] |
| **Date** | [YYYY-MM-DD] |
| **Scope** | [Pages, flows, or features reviewed] |
| **Version/Build** | [Version number or build identifier] |
| **Device(s) Tested** | [Desktop, mobile, tablet; browser and OS] |

---

## Executive Summary

[3-5 sentences summarizing the overall UX quality, key strengths, and the most impactful issues found. Include the total number of issues and the breakdown by severity. This section should stand on its own for stakeholders who will not read the full report.]

**Overall UX Quality:** [Strong / Adequate / Needs Work / Poor]

**Issues Found:** [n] total ([n] critical, [n] major, [n] minor, [n] cosmetic)

**Top 3 Priorities:**
1. [Most important finding or recommendation]
2. [Second most important]
3. [Third most important]

---

## Screen-by-Screen Review

<!-- Guidance: Create one section per screen or page reviewed. For flows, review each step as a separate screen. Include the URL or route if applicable. -->

### Screen 1: [Screen Name]

**URL/Route:** [URL or path, e.g., "/dashboard"]

**Screenshot:**
<!-- Attach or embed a screenshot. Annotate with numbered callouts matching the issues below. -->
[Screenshot placeholder: annotated screenshot of the screen]

#### Heuristic Violations

| # | Heuristic | Issue | Severity |
|---|-----------|-------|----------|
| 1.1 | [e.g., Visibility of System Status] | [Description of the violation] | [Critical/Major/Minor/Cosmetic] |
| 1.2 | [e.g., Consistency and Standards] | [Description of the violation] | [Critical/Major/Minor/Cosmetic] |
| 1.3 | [e.g., Error Prevention] | [Description of the violation] | [Critical/Major/Minor/Cosmetic] |

#### Pattern Recommendations

- **Navigation:** [Observations about how users navigate to and from this screen]
- **Layout/Hierarchy:** [Observations about information architecture and visual hierarchy]
- **Interaction Design:** [Observations about interactive elements, affordances, and feedback]
- **Content/Copy:** [Observations about labels, instructions, and microcopy]
- **Visual Design:** [Observations about consistency, spacing, color usage]

#### Accessibility Notes

- [e.g., "Color contrast on the secondary CTA does not meet AA standards (ratio: 3.2:1)"]
- [e.g., "Form fields lack visible labels; only placeholder text is used"]
- [e.g., "Tab order skips the filter controls entirely"]

---

### Screen 2: [Screen Name]

**URL/Route:** [URL or path]

**Screenshot:**
[Screenshot placeholder: annotated screenshot of the screen]

#### Heuristic Violations

| # | Heuristic | Issue | Severity |
|---|-----------|-------|----------|
| 2.1 | [Heuristic] | [Description] | [Severity] |
| 2.2 | [Heuristic] | [Description] | [Severity] |

#### Pattern Recommendations

- **Navigation:** [Observations]
- **Layout/Hierarchy:** [Observations]
- **Interaction Design:** [Observations]
- **Content/Copy:** [Observations]
- **Visual Design:** [Observations]

#### Accessibility Notes

- [Note]
- [Note]

---

### Screen 3: [Screen Name]

**URL/Route:** [URL or path]

**Screenshot:**
[Screenshot placeholder: annotated screenshot of the screen]

#### Heuristic Violations

| # | Heuristic | Issue | Severity |
|---|-----------|-------|----------|
| 3.1 | [Heuristic] | [Description] | [Severity] |
| 3.2 | [Heuristic] | [Description] | [Severity] |

#### Pattern Recommendations

- **Navigation:** [Observations]
- **Layout/Hierarchy:** [Observations]
- **Interaction Design:** [Observations]
- **Content/Copy:** [Observations]
- **Visual Design:** [Observations]

#### Accessibility Notes

- [Note]
- [Note]

---

### Screen 4: [Screen Name]

**URL/Route:** [URL or path]

**Screenshot:**
[Screenshot placeholder: annotated screenshot of the screen]

#### Heuristic Violations

| # | Heuristic | Issue | Severity |
|---|-----------|-------|----------|
| 4.1 | [Heuristic] | [Description] | [Severity] |
| 4.2 | [Heuristic] | [Description] | [Severity] |

#### Pattern Recommendations

- **Navigation:** [Observations]
- **Layout/Hierarchy:** [Observations]
- **Interaction Design:** [Observations]
- **Content/Copy:** [Observations]
- **Visual Design:** [Observations]

#### Accessibility Notes

- [Note]
- [Note]

---

<!-- Guidance: Add as many screen sections as needed. For large reviews, group related screens under subheadings (e.g., "Onboarding Flow," "Settings Area"). -->

## Cross-Cutting Findings

<!-- Guidance: These are issues and patterns that appear on multiple screens. They are often the most valuable findings because fixing them improves the entire product. -->

### Systemic Issues

| # | Issue | Heuristic | Affected Screens | Severity |
|---|-------|-----------|-----------------|----------|
| C1 | [e.g., Inconsistent button styles across all CTAs] | [Consistency and Standards] | [List of screens] | [Severity] |
| C2 | [e.g., No loading states on any data-fetching interaction] | [Visibility of System Status] | [List of screens] | [Severity] |
| C3 | [e.g., Error messages use technical jargon] | [Help Users Recognize, Diagnose, and Recover from Errors] | [List of screens] | [Severity] |
| C4 | [e.g., Touch targets below 44x44px on mobile] | [Accessibility] | [List of screens] | [Severity] |

### Positive Patterns

<!-- Guidance: Noting what works well is just as important as noting what does not. It reinforces good practices and gives the team credit. -->

- [e.g., "The onboarding flow does an excellent job of progressive disclosure, introducing features one at a time."]
- [e.g., "Microcopy throughout the settings area is clear, friendly, and actionable."]
- [e.g., "The mobile layout adapts well, with no horizontal scrolling on any tested screen."]

---

## Priority Matrix: Impact vs Effort

<!-- Place each finding in the appropriate quadrant. This helps stakeholders decide what to tackle first. -->

```
                    HIGH IMPACT
                        |
   Quick Wins           |        Major Projects
   (High impact,        |        (High impact,
    low effort)         |         high effort)
                        |
  ----------------------+----------------------
                        |
   Fill-ins             |        Thankless Tasks
   (Low impact,         |        (Low impact,
    low effort)         |         high effort)
                        |
                    LOW IMPACT
```

### Quick Wins (High Impact, Low Effort)
_Fix these first. Maximum return for minimum investment._

| # | Finding | Effort Estimate |
|---|---------|-----------------|
| [ID] | [Brief description] | [e.g., 1-2 hours] |
| [ID] | [Brief description] | [e.g., Half day] |

### Major Projects (High Impact, High Effort)
_Plan these into the roadmap. They will take time but deliver significant improvement._

| # | Finding | Effort Estimate |
|---|---------|-----------------|
| [ID] | [Brief description] | [e.g., 1-2 sprints] |
| [ID] | [Brief description] | [e.g., 1 week] |

### Fill-ins (Low Impact, Low Effort)
_Address these when convenient, or bundle them with related work._

| # | Finding | Effort Estimate |
|---|---------|-----------------|
| [ID] | [Brief description] | [e.g., 30 minutes] |
| [ID] | [Brief description] | [e.g., 1 hour] |

### Thankless Tasks (Low Impact, High Effort)
_Deprioritize unless they compound with other issues._

| # | Finding | Effort Estimate |
|---|---------|-----------------|
| [ID] | [Brief description] | [e.g., 1 week] |
| [ID] | [Brief description] | [e.g., Multiple sprints] |

---

## Recommendations Summary

<!-- Guidance: This is the ordered action list. Stakeholders should be able to read this section alone and know exactly what to do. -->

| Priority | Recommendation | Related Finding(s) | Severity | Effort | Quadrant |
|----------|----------------|-------------------|----------|--------|----------|
| 1 | [Specific, actionable recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quick Win / Major Project / Fill-in / Thankless] |
| 2 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 3 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 4 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 5 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 6 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 7 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 8 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 9 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |
| 10 | [Recommendation] | [Finding IDs] | [Severity] | [Low/Med/High] | [Quadrant] |

---

## Appendix

### Methodology

This UX review was conducted as an expert evaluation combining heuristic analysis, accessibility spot-checks, and pattern recognition. The reviewer walked through each screen and primary user flow, evaluating against Nielsen's 10 Usability Heuristics and WCAG 2.2 Level AA guidelines.

**Review process:**
1. Walkthrough of all primary task flows to establish context
2. Screen-by-screen inspection against heuristic checklist
3. Keyboard and screen reader spot-checks for accessibility
4. Cross-cutting analysis to identify systemic patterns
5. Prioritization using impact vs. effort framework

### Evaluation Criteria

**Severity Scale:**

| Severity | Definition |
|----------|------------|
| **Critical** | Prevents task completion. Users are blocked or lose data. Must fix before launch. |
| **Major** | Causes significant confusion or friction. Users can work around it but with difficulty. Fix in next release. |
| **Minor** | Creates a minor inconvenience or inconsistency. Users notice but are not significantly impacted. Plan into backlog. |
| **Cosmetic** | Visual polish or minor wording issue. Does not affect task completion. Fix when convenient. |

**Heuristics Referenced:**
1. Visibility of System Status
2. Match Between System and the Real World
3. User Control and Freedom
4. Consistency and Standards
5. Error Prevention
6. Recognition Rather Than Recall
7. Flexibility and Efficiency of Use
8. Aesthetic and Minimalist Design
9. Help Users Recognize, Diagnose, and Recover from Errors
10. Help and Documentation

### Limitations

- [e.g., "This review was conducted on desktop only. Mobile review is recommended as a follow-up."]
- [e.g., "Accessibility checks were spot-level, not a full WCAG audit. A comprehensive audit is recommended for the identified issues."]
- [e.g., "The review was based on a staging build and may not reflect final production behavior."]

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Date] | [Name] | Initial review |
