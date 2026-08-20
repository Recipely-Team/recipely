/**
 * Whether the server let this session start.
 *
 * `Denied` is not an error: the daily allowance running out is the expected
 * answer several times a day, and the app's response is to offer the text mode.
 */
export const AssistantGrantStatus = {
  Granted: 'granted',
  Denied: 'denied',
} as const;

export type AssistantGrantStatusType = (typeof AssistantGrantStatus)[keyof typeof AssistantGrantStatus];
