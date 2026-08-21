/**
 * Why voice is off.
 *
 * @remarks
 * - **The two limits are kept apart** because "come back tomorrow" is the right
 *   advice for only one of them: everyone shares one free-tier key, so a busy
 *   afternoon can close voice for a user who has spent nothing of their own
 *   allowance.
 * - **A refused microphone belongs here too**, and used to be reported as a
 *   generic failure instead — so the one refusal the user can actually fix read
 *   as "this request did not arrive", with the sentence explaining it sitting
 *   unused in all fourteen catalogues.
 */
export const AssistantDenialReason = {
  UserDailyLimit: 'user_daily_limit',
  GlobalDailyLimit: 'global_daily_limit',
  MicrophoneDenied: 'microphone_denied',
} as const;

export type AssistantDenialReasonType = (typeof AssistantDenialReason)[keyof typeof AssistantDenialReason];
