/**
 * Claude.ai conversation capture adapter (MEM-040).
 *
 * Sibling of `adapters/codex.ts`. Where the Codex adapter prepares a
 * Codex bundle from a Theorem context compile, this adapter goes the
 * other direction: it takes a captured claude.ai conversation array and
 * produces a session-summary payload that callers can feed to
 * `harness.memory.remember(...)`.
 *
 * The MD-file conversation
 * (`Theseus/Persistent-Interoperable agent memory ,Gap-Driven Fracture-Expansion, RustyRed-GraphBD.md`)
 * described a "/handoff claude-code" slash-command demo: capture the
 * claude.ai conversation, hand it off, spawn a Claude Code session
 * that boots with the same context. The realistic shape of that demo
 * is two-step:
 *
 *   1. `current_conversation(messages)` returns a session-summary
 *      payload built from the message array.
 *   2. `harness.memory.remember(payload)` saves it to the
 *      cross-surface memory store.
 *   3. `harness.action.handoff(...)` compiles a handoff artifact
 *      that the backend builds from the active workstream state
 *      (including the just-remembered summary).
 *
 * The host-side capture mechanism (claude.ai plugin, userscript, or
 * hook) is external to this repo; the adapter assumes a conversation
 * array is provided. Tests with fixture arrays verify the shaping
 * logic in isolation.
 */

export interface ConversationMessage {
  /** 'user' for human messages, 'assistant' for model replies. */
  role: 'user' | 'assistant';
  /** Raw text content of the message. */
  content: string;
  /** Optional ISO-8601 timestamp; used for first/last bookkeeping. */
  timestamp?: string;
}

export interface CapturedConversation {
  /**
   * Synthesized session-summary text. Compact, ~one-paragraph
   * description of the conversation's decisions and direction.
   * Suitable for `harness.memory.remember({observation})`.
   */
  observation: string;
  /**
   * Evidence pointers. Currently empty when the conversation is the
   * only source; callers can extend with URLs / commit hashes / file
   * paths the conversation referenced.
   */
  evidence: string[];
  /** Capture metadata for downstream provenance. */
  metadata: {
    surface: 'claude-ai';
    captured_at: string;
    message_count: number;
    first_message_at: string | null;
    last_message_at: string | null;
  };
}

/**
 * Build a session-summary payload from a claude.ai conversation array.
 *
 * The synthesis is intentionally simple: it concatenates message
 * content with role labels and adds a header that names the
 * conversation as a session_summary candidate. Callers who want
 * richer extraction (decisions, open questions, references) can
 * pass the raw `messages` array to a downstream LLM step before
 * calling `harness.memory.remember(...)`.
 */
export function currentConversation(
  messages: ConversationMessage[],
): CapturedConversation {
  const safeMessages = messages.filter(
    (msg) =>
      msg
      && typeof msg.content === 'string'
      && msg.content.trim().length > 0
      && (msg.role === 'user' || msg.role === 'assistant'),
  );

  const timestamps = safeMessages
    .map((msg) => (msg.timestamp || '').trim())
    .filter((t) => t.length > 0);

  const observationLines: string[] = ['Session summary captured from claude.ai conversation.'];
  for (const msg of safeMessages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    observationLines.push(`${role}: ${msg.content.trim()}`);
  }
  const observation = observationLines.join('\n\n');

  return {
    observation,
    evidence: [],
    metadata: {
      surface: 'claude-ai',
      captured_at: new Date().toISOString(),
      message_count: safeMessages.length,
      first_message_at: timestamps.length > 0 ? timestamps[0] : null,
      last_message_at: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null,
    },
  };
}

/**
 * Alias matching the Python snake_case naming so cross-language docs
 * can use the same identifier. The canonical TS export is
 * `currentConversation`; `current_conversation` is an alias.
 */
export const current_conversation = currentConversation;
