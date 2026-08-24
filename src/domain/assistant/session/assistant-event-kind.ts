/**
 * The discriminant of {@link AssistantSessionEventType}, defined once.
 *
 * The union, the mapper that builds each variant and every consumer that
 * matches on one would otherwise each spell these words out, and a typo in the
 * third copy compiles into a branch that simply never runs.
 */
export const AssistantEventKind = {
  Ready: 'ready',
  Transcript: 'transcript',
  Audio: 'audio',
  ToolCall: 'toolCall',
  Interrupted: 'interrupted',
  TurnComplete: 'turnComplete',
  Resumption: 'resumption',
  GoAway: 'goAway',
  Usage: 'usage',
  Closed: 'closed',
} as const;

export type AssistantEventKindType = (typeof AssistantEventKind)[keyof typeof AssistantEventKind];
