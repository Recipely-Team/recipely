/**
 * Why voice was refused.
 *
 * The two are kept apart because "come back tomorrow" is the right advice for
 * only one of them: everyone shares one free-tier key, so a busy afternoon can
 * close voice for a user who has spent nothing of their own allowance.
 */
export const AssistantDenialReason = {
  UserDailyLimit: 'user_daily_limit',
  GlobalDailyLimit: 'global_daily_limit',
} as const;

export type AssistantDenialReasonType = (typeof AssistantDenialReason)[keyof typeof AssistantDenialReason];
