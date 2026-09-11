/** What a transcript entry records: something said, or a tool the assistant ran. */
export const TranscriptEntryKind = {
  Message: 'message',
  Tool: 'tool',
} as const;

export type TranscriptEntryKindType = (typeof TranscriptEntryKind)[keyof typeof TranscriptEntryKind];
