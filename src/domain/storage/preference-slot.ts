/**
 * **Preference slots** — the named, device-local settings the application persists.
 *
 * @remarks
 * - **Why slots:** application names WHAT it stores; the storage adapter alone owns the
 *   versioned key each slot lives under, so no layer above infrastructure sees a key.
 */
export const PreferenceSlot = {
  Timers: 'timers',
  Language: 'language',
  OnboardingSeen: 'onboardingSeen',
} as const;

export type PreferenceSlotType = (typeof PreferenceSlot)[keyof typeof PreferenceSlot];
