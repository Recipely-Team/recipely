/** Why pressing a control by its label did or did not happen. */
export const ScreenPressOutcome = {
  Pressed: 'pressed',
  NotFound: 'not_found',
  Ambiguous: 'ambiguous',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ScreenPressOutcome = (typeof ScreenPressOutcome)[keyof typeof ScreenPressOutcome];
