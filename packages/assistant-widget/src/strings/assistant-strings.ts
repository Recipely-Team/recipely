import type { AssistantFailureCodeType, AssistantStatusType, EndReasonType } from '@live-assistant/core';

/**
 * Every word the widget shows or announces. Pass a partial `strings` to
 * `AssistantWidget` in the user's language; anything left out is English.
 */
export interface AssistantStrings {
  readonly start: string;
  readonly stop: string;
  readonly mute: string;
  readonly unmute: string;
  readonly send: string;
  readonly composerPlaceholder: string;
  readonly status: Readonly<Record<AssistantStatusType, string>>;
  /** Shown after a session ended, when it did not end because the user stopped it. */
  readonly ended: Readonly<Partial<Record<EndReasonType, string>>>;
  readonly errors: Readonly<Partial<Record<AssistantFailureCodeType, string>>>;
  readonly genericError: string;
  readonly toolRunning: (name: string) => string;
  readonly toolFailed: (name: string) => string;
}
