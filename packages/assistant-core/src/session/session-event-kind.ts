/** The kinds of event a live session reports. */
export const SessionEventKind = {
  /** The provider accepted the session; audio sent from now on is heard. */
  Ready: 'ready',
  /** A piece of transcript. Arrives in fragments; the consumer joins them. */
  Transcript: 'transcript',
  /** A chunk of the assistant's voice, as mono float samples at `outputSampleRate`. */
  Audio: 'audio',
  /** The model asked the app to run one of its tools. Must be answered with `respondToTool`. */
  ToolCall: 'toolCall',
  /** The model withdrew tool calls it had made (usually because the user spoke over it). */
  ToolCallCancelled: 'toolCallCancelled',
  /** The user spoke over the assistant; drop whatever audio is still queued. */
  Interrupted: 'interrupted',
  /** The assistant finished its turn. */
  TurnComplete: 'turnComplete',
  /** A handle that lets a later session continue this one. */
  Resumption: 'resumption',
  /** The provider will close the session soon. */
  GoAway: 'goAway',
  /** Token usage reported by the provider. */
  Usage: 'usage',
  /** The transport closed. `expected` is true when the app closed it. */
  Closed: 'closed',
} as const;

export type SessionEventKindType = (typeof SessionEventKind)[keyof typeof SessionEventKind];
