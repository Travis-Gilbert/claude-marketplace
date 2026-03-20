---
description: Audit animation quality and accessibility in a file or project.
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash
argument-hint: <file-or-directory>
---

Audit animation quality and accessibility.

1. Load the a11y-motion-auditor agent.
2. Load the motion-architect agent (for purpose evaluation).
3. Scan the target for all animation code.
4. For each animated element:
   a. Run the Purpose Test (orientation, feedback, relationship).
   b. Check for prefers-reduced-motion handling.
   c. Check exit animation duration (< 200ms).
   d. Check for vestibular triggers.
   e. Verify only transform/opacity are animated.
5. Produce a structured audit report.

Report: animation inventory, purpose test results, a11y compliance
status, performance concerns, and remediation steps.
