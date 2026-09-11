/** Who said a line of the conversation. */
export const Speaker = {
  User: 'user',
  Assistant: 'assistant',
} as const;

export type SpeakerType = (typeof Speaker)[keyof typeof Speaker];
