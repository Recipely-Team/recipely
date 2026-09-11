import type { TranscriptEntry, TranscriptEntryKind } from '@live-assistant/core';

/** A tool the assistant ran — what `renderTool` receives. */
export type ToolEntry = Extract<TranscriptEntry, { readonly kind: typeof TranscriptEntryKind.Tool }>;
