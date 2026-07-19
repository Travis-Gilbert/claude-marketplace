# Together compatibility note

This loose historical guide is not an installed skill. Current coordination
teaching lives in `skills/harness-coordinate/SKILL.md` and
`references/COORDINATION_OPERATIONS_CAPABILITY.md`.

Use `coordination_intent` for a current footprint, `coordination_record` with a
real `record_type` for reflection, decision, tension, or event semantics, and
`mentions` or `stream_read` at bounded checkpoints. Use `stream_subscribe` for
durable topic membership. A footprint is not a lock and no read should be
described as host push.
