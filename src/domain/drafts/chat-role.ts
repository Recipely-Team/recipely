/**
 * Who spoke a turn in the AI refine conversation. Mirrors the backend
 * `ChatMessage.role` wire values, and is written out at every place the UI
 * appends a reply — which is why it is a name rather than a literal.
 */
export const ChatRole = {
  User: 'user',
  Assistant: 'assistant',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];
