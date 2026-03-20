# UX Writing and Content Design

## Reference Overview

UX writing is the practice of crafting the words that guide users through a product. Every label, message, instruction, and prompt is a design element. Good UX writing reduces cognitive load, prevents errors, builds trust, and helps users accomplish their goals. This reference covers microcopy patterns, voice and tone frameworks, content hierarchy principles, and established content standards.

---

## Microcopy Patterns

### Button Labels

**Principle.** Use a verb-first format that describes the specific action the button performs. Avoid generic labels.

| Instead of | Use |
|-----------|-----|
| Submit | Create account |
| OK | Save changes |
| Yes | Delete project |
| Cancel | Discard changes |
| Next | Continue to payment |
| Click here | Download report |

**Guidelines:**
- Start with a strong verb (Create, Save, Send, Delete, Download, Upload, Share, Export)
- Be specific about what the action does
- Match the button label to the context (a dialog asking "Delete this file?" should have "Delete file" and "Keep file" buttons, not "Yes" and "No")
- Use sentence case, not title case
- Keep labels under 4 words when possible
- Primary action buttons should describe the positive/forward action
- Secondary buttons should describe the alternative (Cancel, Go back, Not now)

### Error Messages

**Structure.** What happened + why it happened + how to fix it.

**Examples:**

Poor: "Error 422"
Better: "Could not save your changes. The title field is required. Add a title and try again."

Poor: "Invalid input"
Better: "Email address must include an @ symbol and a domain (e.g., name@example.com)."

Poor: "Something went wrong. Please try again later."
Better: "Could not connect to the server. Check your internet connection and try again."

**Guidelines:**
- Write in plain language (no error codes, no technical terms)
- Be specific about what went wrong
- Provide a concrete next step
- Place the error message next to the field that caused it
- Do not blame the user ("You entered an invalid email" vs. "Check the email format")
- For system errors, be honest ("We are having trouble processing your request" rather than "Something went wrong")

### Empty States

**Structure.** What this space is for + why it is empty + what to do next.

**Examples:**

For a new user's project list:
"Projects appear here once you create them. Start with your first project to organize your work."
[Button: Create a project]

For filtered results with no matches:
"No results match your current filters. Try broadening your search or removing some filters."
[Button: Clear filters]

For a feature the user has not activated:
"Notifications keep you informed about updates to your projects. Turn on notifications to stay in the loop."
[Button: Enable notifications]

**Guidelines:**
- Never leave an empty space unexplained
- Use the empty state as an onboarding opportunity
- Include a single, clear call-to-action
- Use illustration or icon to make the state feel intentional (not broken)
- Differentiate between "no data yet" and "no data matching filters"

### Confirmation Dialogs

**Structure.** State the consequence + provide distinct action labels.

**Examples:**

Poor:
Title: "Are you sure?"
Buttons: "Yes" / "No"

Better:
Title: "Delete 'Q1 Marketing Report'?"
Description: "This will permanently remove the file and its contents. This action cannot be undone."
Buttons: "Delete file" / "Keep file"

**Guidelines:**
- State exactly what will happen, not just "Are you sure?"
- Name the specific item being affected
- If the action is irreversible, say so explicitly
- Button labels should be specific verbs, not "Yes/No" or "OK/Cancel"
- Make the destructive action visually distinct (danger color for delete, default for cancel)

### Loading Messages

**Guidelines:**
- For brief waits (under 2 seconds), a spinner with no text is sufficient
- For moderate waits (2 to 10 seconds), add a brief message: "Loading your dashboard..."
- For long waits (10+ seconds), provide progress updates: "Processing 247 files... 62% complete"
- Use active voice and present tense: "Saving your changes" not "Your changes are being saved"
- For first-time loads with setup, use the time to educate: "Setting up your workspace. This usually takes about 30 seconds."

### Success Messages

**Guidelines:**
- Confirm what happened: "Report exported successfully" not just "Success"
- Provide the next step when relevant: "Your account has been created. Check your email for a verification link."
- Be brief; success messages should not require careful reading
- Use a positive, reassuring tone
- Auto-dismiss after 4 to 8 seconds (with a dismiss option)

### Placeholder Text

**Guidelines:**
- Use placeholder text to show format, not to replace labels ("MM/DD/YYYY" not "Enter your birth date")
- Never use placeholder text as the sole label; it disappears on focus and fails accessibility requirements
- Show an example of valid input: "e.g., San Francisco, CA"
- Keep placeholder text visually distinct from entered text (lighter color, but meeting contrast requirements for non-essential text)

### Tooltips

**Guidelines:**
- Keep tooltips to 1 to 2 short sentences
- Provide supplementary information, not essential instructions
- Do not hide critical information in tooltips; if users need it to complete a task, put it inline
- Trigger on hover (desktop) and on tap or long-press (mobile)
- Ensure tooltips are accessible to keyboard users and screen readers

---

## Voice and Tone

### Voice vs. Tone

**Voice** is consistent: it reflects the product's personality and values. Voice does not change.

**Tone** adapts to context: it shifts based on the user's emotional state, the severity of the situation, and the type of content.

A product might have a voice that is "clear, friendly, and professional." The tone would be:
- Encouraging during onboarding
- Calm and precise during error recovery
- Celebratory during success moments
- Empathetic during frustrating situations

### Defining Voice Attributes

Create 3 to 5 voice attributes, each with a spectrum:

| Attribute | We are... | We are not... |
|-----------|----------|--------------|
| Clear | Direct, specific, jargon-free | Vague, technical, wordy |
| Friendly | Warm, approachable, human | Overly casual, slangy, juvenile |
| Confident | Knowledgeable, decisive, helpful | Arrogant, dismissive, condescending |
| Honest | Transparent, straightforward | Evasive, misleading, overpromising |

### Tone Across Contexts

| Context | Tone adjustment |
|---------|----------------|
| Onboarding | Encouraging, patient, guiding |
| Task completion | Brief, affirming |
| Error recovery | Calm, specific, solution-oriented |
| Empty states | Helpful, inviting |
| Destructive actions | Serious, clear, unambiguous |
| Celebrations | Warm, congratulatory (not over the top) |
| System downtime | Honest, empathetic, informative |

---

## Content Hierarchy

### Front-Loading

Put the most important information first. In every sentence, paragraph, and page, lead with the key message. Users scan; they do not read linearly.

**Instead of:** "After considering the various options and reviewing your account settings, we have determined that your subscription will be renewed on March 15."
**Write:** "Your subscription renews on March 15."

### Inverted Pyramid

Borrowed from journalism: lead with the conclusion, follow with supporting details, end with background.

1. Most important: what happened or what the user needs to know
2. Supporting details: context, conditions, specifics
3. Background: additional information for those who want it

### Scannable Structure

- Use headings and subheadings to create a scannable outline
- Keep paragraphs short (2 to 4 sentences)
- Use bullet lists for 3+ related items
- Bold key terms and actions within paragraphs
- Use tables for comparative information
- Place one idea per paragraph

### Plain Language

- Use common words ("use" not "utilize," "start" not "commence," "end" not "terminate")
- Write short sentences (aim for under 20 words; absolute maximum 25)
- Use active voice ("Save your changes" not "Changes will be saved")
- Address the user directly ("You can export your data" not "Users can export their data")
- Remove unnecessary words ("to" not "in order to," "because" not "due to the fact that")
- Define technical terms on first use if they cannot be avoided

---

## GOV.UK Content Principles

The UK Government Digital Service established content design principles that have become an industry standard for clear, user-centered writing. These principles apply well beyond government services.

### Core Principles

**1. Start with user needs.** Every piece of content should exist because a user needs it. If no user has the need, the content should not exist. Research user needs before writing.

**2. Do not duplicate content.** Every piece of content should have a single, canonical location. Duplication leads to inconsistency and maintenance burden. Link to existing content rather than restating it.

**3. Use active voice.** Active voice is clearer, more direct, and easier to understand. "Complete the form" not "The form should be completed."

**4. Use plain English.** Write at a reading level accessible to the broadest possible audience. Avoid jargon, acronyms (without definition), and complex sentence structures.

**5. Address the user as "you."** Speak directly to the reader. "You can apply online" not "Applicants can apply online." This creates a conversational, personal tone.

**6. Avoid jargon.** If a term is not universally understood by the target audience, replace it or define it. Technical terms are acceptable when the audience is technical, but always consider whether a simpler alternative exists.

**7. Keep sentences under 25 words.** Long sentences are harder to parse, especially on screens. If a sentence exceeds 25 words, look for opportunities to split it.

**8. Use the shortest, simplest word.** "Buy" not "purchase." "Help" not "assist." "Need" not "require." "About" not "approximately."

### Content Design Process

1. **Identify the user need.** What question is the user trying to answer? What task are they trying to complete?
2. **Research.** What language do users use to describe this need? What do they already know?
3. **Write.** Draft content that directly addresses the need in the user's language
4. **Pair write or review.** Content design benefits from collaboration; a second perspective catches assumptions
5. **Test.** Validate with users that the content is understandable and actionable
6. **Iterate.** Revise based on testing, analytics (search queries, support tickets), and feedback

---

## Writing Checklist

Use this checklist when reviewing UX copy:

| Criterion | Check |
|-----------|-------|
| **Clarity** | Would a new user understand this without additional context? |
| **Specificity** | Does the text describe the specific action or state, not a generic one? |
| **Brevity** | Can any words be removed without losing meaning? |
| **Action-orientation** | Does the text tell the user what to do (or what happened)? |
| **Tone match** | Does the tone match the context (encouraging, serious, neutral)? |
| **Consistency** | Is the same terminology used for the same concepts throughout? |
| **Accessibility** | Is the reading level appropriate? Are there any idioms or cultural references that may not translate? |
| **Error coverage** | Does every possible error state have a clear, helpful message? |
| **Empty states** | Does every empty view explain itself and provide a next step? |
| **Labels** | Are all buttons, links, and form fields clearly labeled? |

---

## Common UX Writing Anti-Patterns

**"Something went wrong."** Always specify what went wrong and what the user can do about it.

**"Invalid input."** Always specify what makes the input invalid and what the valid format looks like.

**"Click here."** Always use descriptive link text that makes sense out of context (screen readers often navigate by listing all links on a page).

**"Are you sure?"** Always state the specific consequence of the action.

**"Please wait..."** Provide context. Waiting for what? How long?

**"N/A" or blank fields.** Use contextual messages: "No phone number provided" is more informative than blank space.

**"Error" as a toast.** A single-word toast communicates nothing actionable.

**Overuse of exclamation marks.** Enthusiasm is fine at success moments. Exclamation marks on every notification dilute their impact and create a frantic tone.

**"Did you mean...?" when the user did not make a mistake.** Only show spell-check suggestions when the original query returns poor results. If results are good, the suggestion is noise.
