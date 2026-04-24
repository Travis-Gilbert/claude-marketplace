# Pattern: Event Storming Lite

See: `lib/event-storming-lite/SKILL.md` for full methodology.

## Concrete example

Feature: user shares a project.

```markdown
## Event Flow

### Happy path

1. `UserInitiatedShare { user_id, project_id, recipient_email }`
   Handler: `validate_and_persist_share()` — checks permission, creates Share row, emits next event.

2. `ShareRecordCreated { share_id, user_id, project_id, recipient_email, created_at }`
   Handlers (parallel):
   - `queue_share_email(share_id)` → emits `NotificationQueued { share_id, channel: "email" }`
   - `create_in_app_notification(share_id)` → emits `NotificationQueued { share_id, channel: "in-app" }`
   - `log_share_audit(share_id)` → writes audit entry (no downstream event)

3. `NotificationQueued { share_id, channel }` (one per channel)
   Handler: dispatched to channel-specific RQ worker.

4. `EmailSent { share_id, recipient_email, sent_at }`
   Handler: no downstream event. Final state.

5. `InAppNotificationDelivered { share_id, recipient_user_id }`
   Handler: updates read/unread indicator. Final state.

### Failure branches

- `ShareRecordCreated` fails (permission, DB constraint) → user sees error. No notifications fire.
- `EmailSent` fails → retry 3x with exponential backoff, then dead-letter. In-app notification still fires.
- Worker down (RQ retry policy) → event eventually fires or dead-letters.

### Read models

- `project_shares` table: projection of `ShareRecordCreated` events for UI.
- `user_notifications` inbox: projection of `NotificationQueued` + `Delivered` events.
```

## Conventions

- Events in `PascalCase`, past tense.
- Payload in `{ field: type }` after event name.
- Handler names are verbs (`queue_share_email`, `send_email`).
- Happy path is numbered; branches are not (they're off-path).

## Rules

- Events are facts, not commands. `EmailSent` not `SendEmail`.
- Events are past tense. Once committed, can't be un-emitted.
- Handlers can emit new events or write read models (or both).
- Failure branches belong on the diagram. They're part of the design.

## Plan integration

- One task per event + its handler(s).
- Test task per event schema + happy-path handler.
- Integration test task: full happy path emits events in order.
- Separate task per failure branch.

## Anti-patterns

- Mixing commands and events. Keep the vocabulary clean.
- Huge payloads (dump everything into the event). Pass IDs, let handlers read what they need.
- Events without handlers (unused). Delete or figure out what's missing.
- Handlers without events (side effects invisible to the flow). Emit even a no-op event if the side effect matters.
