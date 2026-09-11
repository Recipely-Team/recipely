import type { TranscriptEntry, TranscriptEntryKind } from '@live-assistant/core';

/** A said line of the transcript — what `renderMessage` receives. */
export type MessageEntry = Extract<TranscriptEntry, { readonly kind: typeof TranscriptEntryKind.Message }>;
