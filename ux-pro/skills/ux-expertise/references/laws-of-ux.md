# Laws of UX

## Reference Overview

The Laws of UX, compiled by Jon Yablonski, are a collection of principles grounded in psychology research that inform how users perceive and interact with digital products. Understanding these laws enables evidence-based design decisions rather than relying on intuition alone.

---

## Category 1: Perception and Cognition

### Fitts's Law

**Definition.** The time to acquire a target is a function of the distance to and size of the target. Larger, closer targets are faster to select.

**Origin.** Paul Fitts, 1954. Originally studied human motor performance in pointing tasks.

**Key Takeaways**
- Make primary action targets large and visually prominent
- Place frequently used actions near the user's current focus
- Edges and corners of screens are high-performance target areas (infinite edge on pointer devices)
- Touch targets require minimum 44x44 CSS pixels (Apple), 48x48dp (Material Design)

**Design Implications**
- Size call-to-action buttons proportionally to their importance
- Place destructive actions (delete, cancel) away from constructive actions (save, submit)
- Use full-width buttons on mobile for primary actions
- Consider thumb zones when placing mobile navigation elements

---

### Miller's Law

**Definition.** The average person can keep approximately 7 (plus or minus 2) items in working memory at once.

**Origin.** George A. Miller, 1956. Published "The Magical Number Seven, Plus or Minus Two."

**Key Takeaways**
- Chunk information into groups of 5 to 9 items
- Do not interpret this as "always limit options to 7"; the law is about working memory, not menu length
- Use chunking to make complex information digestible (phone numbers, credit card numbers, IP addresses)
- Progressive disclosure reduces cognitive load by revealing information incrementally

**Design Implications**
- Group navigation items into logical categories rather than presenting flat lists of 20+ items
- Break long forms into logical sections or multi-step flows
- Format numeric inputs with visual chunking (e.g., 4-4-4-4 for credit cards)
- Limit the number of choices presented simultaneously in selection interfaces

---

### Von Restorff Effect (Isolation Effect)

**Definition.** When multiple similar objects are present, the one that differs from the rest is most likely to be remembered.

**Origin.** Hedwig von Restorff, 1933. Studied memory and the isolation effect in perception.

**Key Takeaways**
- Visual distinction drives attention and recall
- Use contrast purposefully to highlight the most important element
- Overusing distinction nullifies the effect; if everything is highlighted, nothing is
- The effect applies to color, size, shape, position, and motion

**Design Implications**
- Visually differentiate the recommended pricing tier from alternatives
- Use a distinct color or size for the primary call-to-action button
- Highlight new, updated, or critical items in lists and feeds
- Reserve strong visual treatments (bold color, animation, size) for genuinely important elements

---

### Serial Position Effect

**Definition.** Users have a propensity to best remember the first and last items in a series.

**Origin.** Hermann Ebbinghaus, 1885. Studied memory through serial recall experiments.

**Key Takeaways**
- The primacy effect: first items are rehearsed more and enter long-term memory
- The recency effect: last items are still in working memory during recall
- Middle items receive the least attention and recall

**Design Implications**
- Place the most important actions at the beginning and end of navigation bars
- Position key information at the start and conclusion of onboarding flows
- In bottom navigation, put primary destinations at the leftmost and rightmost positions
- Structure content so the most critical points appear at the beginning and end of sequences

---

### Aesthetic-Usability Effect

**Definition.** Users often perceive aesthetically pleasing design as more usable. Attractive interfaces are more forgiving of minor usability issues.

**Origin.** Masaaki Kurosu and Kaori Kashimura, 1995. Studied the relationship between perceived aesthetics and perceived usability of ATM interfaces.

**Key Takeaways**
- Visual appeal creates a positive emotional response that biases perception
- Attractive interfaces can mask usability problems in initial testing
- The effect does not mean aesthetics replace usability; it means aesthetics amplify perceived quality
- This bias can lead evaluators to underrate problems in beautiful interfaces

**Design Implications**
- Invest in visual polish for first impressions (landing pages, onboarding)
- Do not rely solely on preference testing; pair it with task-based usability testing
- Use aesthetic quality as a differentiator when functional parity exists with competitors
- Recognize that ugly-but-functional interfaces face an uphill battle for user trust

---

### Law of Common Region

**Definition.** Elements tend to be perceived as a group if they are enclosed within the same bounded area.

**Origin.** Stephen Palmer, 1992. Extended Gestalt grouping principles.

**Key Takeaways**
- Boundaries create visual grouping more strongly than proximity alone
- Cards, containers, and bordered regions establish clear relationships
- Background color changes can define regions without explicit borders

**Design Implications**
- Use card patterns to group related content (image, title, description, actions)
- Apply subtle background changes to distinguish sections
- Use bordered containers to associate labels with their input fields
- Group related form fields within clearly bounded sections

---

### Law of Proximity

**Definition.** Objects that are near each other tend to be perceived as a group.

**Origin.** Gestalt psychology, early 20th century. Max Wertheimer formalized proximity as a grouping principle in 1923.

**Key Takeaways**
- Spacing is a powerful grouping mechanism that requires no additional visual elements
- Related items should be closer together than unrelated items
- White space between groups is as meaningful as the content itself

**Design Implications**
- Place labels close to their corresponding inputs (closer than to adjacent fields)
- Group related actions together and separate them from unrelated actions
- Use consistent spacing scales to establish visual rhythm and hierarchy
- Increase spacing between logical sections to signal topic changes

---

### Law of Similarity

**Definition.** Elements that share visual characteristics (shape, size, color, orientation) are perceived as related.

**Origin.** Gestalt psychology. Wertheimer, 1923.

**Key Takeaways**
- Consistent visual treatment signals functional equivalence
- Breaking similarity draws attention (see Von Restorff Effect)
- Similarity applies across multiple dimensions: color, shape, size, orientation, texture

**Design Implications**
- Style all clickable elements consistently so users recognize them as interactive
- Use consistent icon styles within an icon family
- Apply the same visual treatment to all items in a category
- Differentiate categories through deliberate style changes (color-coded tags, distinct card layouts)

---

### Law of Uniform Connectedness

**Definition.** Elements that are visually connected are perceived as more related than elements that are not connected.

**Origin.** Stephen Palmer and Irvin Rock, 1994.

**Key Takeaways**
- Lines, arrows, and connecting visual elements create the strongest grouping
- Connectedness overrides proximity and similarity in ambiguous layouts
- Flow diagrams and timelines rely on this principle

**Design Implications**
- Use connecting lines in step indicators and progress bars
- Draw explicit connections between related nodes in graph or diagram views
- Use borders or background fills to connect labels to values in data displays
- Apply visual connectors in timelines, workflows, and process diagrams

---

## Category 2: Decision Making

### Hick's Law (Hick-Hyman Law)

**Definition.** The time it takes to make a decision increases with the number and complexity of choices. Specifically, decision time increases logarithmically with the number of options.

**Origin.** William Edmund Hick and Ray Hyman, 1952. Studied reaction time as a function of stimulus alternatives.

**Key Takeaways**
- More choices slow decision making, but the relationship is logarithmic (not linear)
- The law applies most strongly when choices are unfamiliar or equally weighted
- Categorization and progressive disclosure can mitigate choice overload
- The law does not apply to well-practiced, habitual choices

**Design Implications**
- Reduce the number of options visible at any given time
- Use progressive disclosure: show primary options, reveal secondary options on demand
- Highlight recommended or default options to reduce decision burden
- Categorize long lists into meaningful groups (navigation menus, settings)
- Apply smart defaults for configuration screens

---

### Jakob's Law

**Definition.** Users spend most of their time on other sites. This means users prefer interfaces that work the same way as the sites they already know.

**Origin.** Jakob Nielsen, 2000. Articulated as a principle of web usability.

**Key Takeaways**
- User expectations are shaped by cumulative experience across all products they use
- Novel interaction patterns carry a learning cost
- Familiarity reduces cognitive load and increases perceived usability
- Innovation should focus on solving problems, not reinventing established patterns

**Design Implications**
- Follow platform conventions (Material Design, Apple HIG, common web patterns)
- Place navigation, search, and account settings where users expect them
- Use standard iconography for universal actions (search, settings, profile, close)
- When innovating on interaction patterns, provide scaffolding (onboarding, tutorials)

---

### Tesler's Law (Law of Conservation of Complexity)

**Definition.** For any system there is a certain amount of complexity that cannot be reduced. The question is who bears that complexity: the user or the system.

**Origin.** Larry Tesler, mid-1980s. Articulated while working at Xerox PARC and Apple.

**Key Takeaways**
- Some complexity is inherent and irreducible
- Absorb complexity into the system rather than exposing it to the user
- Oversimplifying an interface may push complexity into confusing workarounds
- The goal is appropriate allocation of complexity, not elimination

**Design Implications**
- Use smart defaults to handle complex configuration for most users
- Offer "advanced" modes that reveal complexity only to those who need it
- Automate repetitive or error-prone steps when possible
- Accept that some features require complexity and design for learnability rather than simplicity

---

### Postel's Law (Robustness Principle)

**Definition.** Be liberal in what you accept and conservative in what you produce. Originally a networking principle, it applies broadly to interface design.

**Origin.** Jon Postel, 1980. Formulated for TCP/IP protocol design (RFC 761).

**Key Takeaways**
- Accept varied user inputs and interpret them generously
- Produce clean, consistent, predictable outputs
- Flexibility in input reduces errors and frustration
- Strict input requirements create friction

**Design Implications**
- Accept multiple date formats and normalize internally
- Handle phone numbers with or without country codes, spaces, dashes, or parentheses
- Allow case-insensitive search and fuzzy matching
- Accept both commas and periods as decimal separators where locale is ambiguous

---

## Category 3: Action and Effort

### Doherty Threshold

**Definition.** Productivity soars when a computer and its users interact at a pace (<400ms) that ensures neither has to wait on the other.

**Origin.** Walter Doherty and Ahrvind Thadani, 1982. IBM Systems Journal research on system response time.

**Key Takeaways**
- System response times under 400ms feel instantaneous and maintain flow state
- Delays beyond 1 second break the user's train of thought
- Perceived performance is as important as actual performance
- Animation and progressive loading can mask latency

**Design Implications**
- Optimize for sub-400ms response on critical interactions
- Use skeleton screens and optimistic UI to mask loading time
- Prioritize above-the-fold content loading
- Provide instant visual feedback (button press states, hover effects) even before processing completes

---

### Goal-Gradient Effect

**Definition.** The tendency to approach a goal increases with proximity to the goal. Users accelerate their behavior as they get closer to completing a task.

**Origin.** Clark Hull, 1932. Observed in animal behavior studies; later applied to human motivation by Ran Kivetz and colleagues (2006).

**Key Takeaways**
- Progress indicators motivate completion
- Artificial advancement (pre-filling progress) increases engagement
- Users are more likely to abandon tasks early than near completion
- The effect applies to loyalty programs, onboarding checklists, and multi-step forms

**Design Implications**
- Show progress bars in multi-step workflows
- Start progress indicators slightly advanced (e.g., "Step 1 of 5 complete" on arrival)
- Use onboarding checklists that show completed vs. remaining items
- Reduce perceived remaining effort by front-loading easy steps

---

### Parkinson's Law

**Definition.** Any task will inflate to fill the time available for its completion.

**Origin.** Cyril Northcote Parkinson, 1955. Observed in bureaucratic and organizational contexts.

**Key Takeaways**
- Open-ended tasks expand in scope and duration
- Constraints (time limits, character limits, step limits) focus effort
- Deadlines and scarcity drive completion

**Design Implications**
- Use time limits for temporary offers and session-based features
- Set reasonable character limits on input fields
- Provide clear structure for open-ended tasks (templates, guided flows)
- Show completion status to encourage finishing rather than perfectionism

---

## Category 4: Experience and Memory

### Peak-End Rule

**Definition.** People judge an experience largely based on how they felt at its most intense point (the peak) and at its end, rather than on the average of every moment.

**Origin.** Daniel Kahneman, Barbara Fredrickson, Charles Schreiber, and Donald Redelmeier, 1993.

**Key Takeaways**
- The ending of an experience disproportionately shapes overall perception
- Positive peaks create memorable highlights
- Negative peaks are especially damaging to overall satisfaction
- Duration has little impact on remembered experience (duration neglect)

**Design Implications**
- Invest in delightful moments at key milestones (account creation, first success, upgrade)
- Ensure the final step of any flow is smooth and positive (confirmation, success message, reward)
- Identify and eliminate the most painful moment in each user journey
- Add celebratory microinteractions at completion points

---

### Zeigarnik Effect

**Definition.** People remember uncompleted or interrupted tasks better than completed tasks.

**Origin.** Bluma Zeigarnik, 1927. Observed that waiters remembered incomplete orders better than completed ones.

**Key Takeaways**
- Incomplete tasks create cognitive tension that maintains engagement
- Progress indicators leverage this effect by showing unfinished status
- Interrupting a task creates motivation to return and complete it

**Design Implications**
- Show incomplete profile or onboarding checklists to encourage completion
- Use "Save draft" features to allow interruption without loss
- Display progress toward goals (badges, levels, completion percentages)
- Send reminders about incomplete actions (abandoned carts, unfinished forms)

---

## Gestalt Principles

These foundational principles of visual perception underpin many of the laws above.

### Proximity

Objects near each other are perceived as belonging together. Use spacing to create and break visual groups.

### Similarity

Objects sharing visual characteristics (color, shape, size) are perceived as related. Consistent styling signals functional equivalence.

### Continuity

The eye follows smooth paths. Aligned elements are perceived as related. Use alignment grids and consistent visual flow.

### Closure

The mind fills in missing parts to perceive a complete shape. Use implied shapes and partial boundaries to suggest structure without visual heaviness.

### Common Region

Elements within the same bounded area are perceived as grouped. Cards, sections, and containers leverage this principle.

### Figure/Ground

The mind separates visual fields into foreground (figure) and background (ground). Use this principle for modals, overlays, and focus states. Ensure clear distinction through contrast, blur, or dimming.

---

## Quick Reference Table

| Law | Core Principle | Primary Application |
|-----|---------------|-------------------|
| Fitts's Law | Bigger + closer = faster | Target sizing, button placement |
| Hick's Law | More choices = slower decisions | Menu design, option reduction |
| Miller's Law | ~7 items in working memory | Chunking, progressive disclosure |
| Jakob's Law | Users prefer familiar patterns | Convention following |
| Doherty Threshold | <400ms response maintains flow | Performance optimization |
| Peak-End Rule | Endings and peaks define memory | Journey design, delight moments |
| Von Restorff Effect | Different items are remembered | Visual emphasis, CTAs |
| Serial Position Effect | First and last items recalled best | Navigation ordering |
| Aesthetic-Usability | Beautiful feels more usable | Visual polish, first impressions |
| Common Region | Bounded areas create groups | Card design, sections |
| Proximity | Nearness creates grouping | Spacing, layout |
| Similarity | Visual likeness creates grouping | Consistent styling |
| Uniform Connectedness | Connected elements are related | Flows, timelines |
| Tesler's Law | Complexity must live somewhere | Smart defaults, advanced modes |
| Postel's Law | Accept liberally, produce strictly | Input handling, validation |
| Goal-Gradient Effect | Effort increases near the goal | Progress bars, checklists |
| Zeigarnik Effect | Incomplete tasks persist in memory | Engagement, reminders |
| Parkinson's Law | Tasks fill available time | Constraints, deadlines |
