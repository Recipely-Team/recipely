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
  /**
   * The user has finished speaking and nothing has come back yet.
   *
   * Distinct from `Working`, which means the APP is doing something the user
   * can watch. Here the app is doing nothing at all — it is waiting on the
   * model — and the difference matters because it is the state in which the
   * screen has nothing else to say.
   */
  Thinking: 'thinking',
  /** The model is producing audio; talking over it interrupts. */
  Speaking: 'speaking',
  /** A tool call is being performed — the app is visibly doing something. */
  Working: 'working',
  /** Out of budget, or the backend refused. Text mode is the way through. */
  Unavailable: 'unavailable',
} as const;

export type AssistantStatusType = (typeof AssistantStatus)[keyof typeof AssistantStatus];

