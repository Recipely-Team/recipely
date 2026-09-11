/**
 * What a voice session is doing, for a UI to show.
 *
 * `thinking` is the gap between the user finishing and the first sound of a
 * reply — nothing in the protocol marks it, so without it a UI said
 * "listening" over a question it had already heard. `working` is a tool
 * running.
 */
export const AssistantStatus = {
  Idle: 'idle',
  Connecting: 'connecting',
  Listening: 'listening',
  Thinking: 'thinking',
  Speaking: 'speaking',
  Working: 'working',
} as const;

export type AssistantStatusType = (typeof AssistantStatus)[keyof typeof AssistantStatus];
