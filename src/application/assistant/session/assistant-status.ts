/**
 * What the assistant is doing, as one word the UI can render from.
 *
 * A separate `isListening` / `isConnecting` / `isSpeaking` set of booleans
 * permits every impossible combination of them; the pill shows exactly one
 * thing at a time, so exactly one value says which.
 */
export const AssistantStatus = {
  /** No socket, no microphone. The resting state. */
  Idle: 'idle',
  /** Minting and connecting; the microphone is not open yet. */
  Connecting: 'connecting',
  /** Microphone open, waiting for the user. */
  Listening: 'listening',
  /** The model is producing audio; talking over it interrupts. */
  Speaking: 'speaking',
  /** A tool call is being performed — the app is visibly doing something. */
  Working: 'working',
  /** Out of budget, or the backend refused. Text mode is the way through. */
  Unavailable: 'unavailable',
} as const;

export type AssistantStatusType = (typeof AssistantStatus)[keyof typeof AssistantStatus];

/**
 * The states in which a socket is open and will carry a turn.
 *
 * `Connecting` is deliberately absent: the socket exists but has not been
 * acknowledged, and anything written to it in that window is discarded by the
 * server. A turn typed while connecting therefore goes over HTTP — an answer
 * the user gets, rather than one they wait for and never receive.
 */
export const LIVE_STATUSES: readonly AssistantStatusType[] = [
  AssistantStatus.Listening,
  AssistantStatus.Speaking,
  AssistantStatus.Working,
];
