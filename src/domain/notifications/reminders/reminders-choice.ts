/**
 * **The user's answer to "may we remind you?"**, as stored. No stored value means not asked yet,
 * which counts as no: a come-back reminder is promotional, so it waits for an explicit yes
 * (App Store guideline 4.5.4).
 */
export const RemindersChoice = {
  On: '1',
  Off: '0',
} as const;

export type RemindersChoiceType = (typeof RemindersChoice)[keyof typeof RemindersChoice];
