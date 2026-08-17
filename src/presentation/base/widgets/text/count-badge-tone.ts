/**
 * What a count badge is saying.
 *
 * @remarks
 * The two are not a colour choice, they are a different claim. `Alert` means
 * something arrived that the user has not dealt with — unread notifications —
 * and red is the app's word for that. `Tally` just counts what is already
 * there: how many recipes are behind a tab. Four red discs over the My-Recipes
 * tabs read as four problems, when the user had merely saved six recipes.
 *
 * They also differ in how much of the number survives. An alert stops being
 * countable once it is "a lot", so it caps early; a tally is the user's own
 * content and the exact figure is the thing they came to read.
 */
export const CountBadgeTone = {
  Alert: 'alert',
  Tally: 'tally',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type CountBadgeTone = (typeof CountBadgeTone)[keyof typeof CountBadgeTone];
