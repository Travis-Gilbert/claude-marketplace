#!/bin/bash
set -euo pipefail

HOOK_INPUT=$(cat)
STATE_FILE=".claude/spec-grind.local.md"

# No active grind, allow exit
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Parse frontmatter
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/')

# Validate
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]] || [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "Spec Grind: State file corrupted. Stopping." >&2
  rm "$STATE_FILE"
  rm -f ".claude/spec-guard.local.md"
  exit 0
fi

# Check max iterations
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "Spec Grind: Max iterations ($MAX_ITERATIONS) reached."
  rm "$STATE_FILE"
  rm -f ".claude/spec-guard.local.md"
  exit 0
fi

# Check for completion promise in transcript
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ -f "$TRANSCRIPT_PATH" ]]; then
  LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
  if [[ -n "$LAST_LINE" ]]; then
    LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
      .message.content |
      map(select(.type == "text")) |
      map(.text) |
      join("\n")
    ' 2>/dev/null || echo "")

    PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<promise>(.*?)<\/promise>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

    if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
      echo "Spec Grind: All spec requirements met."
      rm "$STATE_FILE"
      rm -f ".claude/spec-guard.local.md"
      exit 0
    fi
  fi
fi

# Continue loop
NEXT_ITERATION=$((ITERATION + 1))
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$STATE_FILE")

if [[ -z "$PROMPT_TEXT" ]]; then
  echo "Spec Grind: No prompt in state file. Stopping." >&2
  rm "$STATE_FILE"
  rm -f ".claude/spec-guard.local.md"
  exit 0
fi

# Update iteration
TEMP_FILE="${STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$STATE_FILE"

SYSTEM_MSG="Spec Grind iteration $NEXT_ITERATION/$MAX_ITERATIONS | Output <promise>SPEC_COMPLETE</promise> only when ALL requirements are implemented and verified"

jq -n \
  --arg prompt "$PROMPT_TEXT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

exit 0
