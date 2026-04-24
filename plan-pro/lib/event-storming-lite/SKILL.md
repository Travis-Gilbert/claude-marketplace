---
name: event-storming-lite
description: "Event-first decomposition for workflow features. Walk the happy path as past-tense events. Identify handlers, side effects, and failure branches before writing code."
---

# Event Storming Lite

When a feature has clear temporal flow and multiple side effects, events are a better decomposition than entities or functions.

## When to use

- A user action triggers multiple side effects (email, notification, audit, analytics)
- The flow has clear before/after stages
- The feature coordinates async work (queues, jobs, webhooks)
- Agent chains with branching behavior

Skip for: pure CRUD, single-surface UI, stateless transforms.

## The event vocabulary

Events are **past-tense facts**. Something happened. They are never commands and never queries.

Good:
- `UserSignedUp`
- `ProjectShared`
- `EmailSent`
- `PaymentCaptured`

Bad:
- `SignUpUser` (that's a command)
- `GetProjects` (that's a query)
- `WillShareProject` (events don't have tense other than past)

## The walk

Walk the happy path. For each step:

1. Name the event.
2. Name the payload (fields that downstream handlers need).
3. Name the handlers (what fires in response).
4. Name the failure branches (what happens if this event doesn't fire, or fires with bad data).

## Format in design-doc.md

```markdown
## Event Flow

### Happy path
1. `UserInitiatedShare { user_id, project_id, recipient_email }`
   Handler: validate & persist → emits next event.

2. `ShareRecordCreated { share_id, user_id, project_id, recipient_email, created_at }`
   Handlers:
   - `QueueShareEmail` → enqueues `NotificationQueued { share_id, channel: "email" }`
   - `CreateInAppNotification` → enqueues `NotificationQueued { share_id, channel: "in-app" }`
   - `LogShareAudit` → writes audit entry

3. `NotificationQueued { share_id, channel }` (one per channel)
   Handler: dispatched to channel-specific worker.

4. `EmailSent { share_id, recipient_email, sent_at }` or `InAppNotificationDelivered { share_id, recipient_user_id }`
   Handler: final state recorded.

### Failure branches
- `ShareRecordCreated` fails (DB constraint, etc.) → user sees error, no downstream events fire. Propagate error up, no retry (user-driven action).
- `EmailSent` fails → retry 3x with exponential backoff, then dead-letter. In-app notif still fires.
- `NotificationQueued` but worker down → RQ/Celery retry policy applies.

### Read models (if needed)
- `project_shares` table: projection of ShareRecordCreated events for UI.
- `user_notifications` inbox: projection of NotificationQueued + Delivered events.
```

## Plan integration

- One task per event + its handler(s). Task body includes the event schema + the handler implementation.
- Integration test task: end-to-end happy path triggers each event in order.
- Separate tasks for each failure branch (retries, dead-letter, error UI).

## Why past-tense matters

Events you've committed to cannot be undone. Naming them past-tense forces you to think about what's recoverable vs. irrevocable. `PaymentCaptured` is different from `PaymentAttempted` — they have different downstream consequences.

## Anti-pattern

Do not conflate events and commands. "SendEmail" is a command (it can fail); "EmailSent" is an event (it happened, can't un-happen). The handler-function is usually the command; its outcome is the event.
