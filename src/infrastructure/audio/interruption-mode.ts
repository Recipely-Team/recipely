/**
 * How the alarm session treats audio already playing.
 *
 * @remarks
 * `DoNotMix` ducks everything else so the alarm is heard over music or a
 * podcast; `MixWithOthers` is restored afterwards so the app never holds the
 * session and silences the user's audio once the alarm is done. expo-audio
 * types these as a bare string union, so the names live here.
 */
export const InterruptionMode = {
  DoNotMix: 'doNotMix',
  MixWithOthers: 'mixWithOthers',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type InterruptionMode = (typeof InterruptionMode)[keyof typeof InterruptionMode];
