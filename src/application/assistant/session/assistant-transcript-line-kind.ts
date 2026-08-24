/**
 * What a transcript line is: something that was said, or something that was
 * done.
 *
 * The panel renders the two differently — speech as a bubble, an action as a
 * chip — and the line itself carries different fields for each, so the kind is
 * the discriminant of `AssistantTranscriptLine` rather than a rendering hint.
 */
export const AssistantTranscriptLineKind = {
  Speech: 'speech',
  Action: 'action',
} as const;

export type AssistantTranscriptLineKindType = (typeof AssistantTranscriptLineKind)[keyof typeof AssistantTranscriptLineKind];
