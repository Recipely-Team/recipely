/**
 * What a feedback submission is about. The values travel to the backend, so
 * they are the wire vocabulary as well as the client's.
 */
export const FeedbackCategory = {
  Bug: 'bug',
  Suggestion: 'suggestion',
  Help: 'help',
  Other: 'other',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type FeedbackCategory = (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

/** Fixed category sent for all submissions from this client (no category picker in the UI). */
export const DEFAULT_FEEDBACK_CATEGORY: FeedbackCategory = FeedbackCategory.Other;
