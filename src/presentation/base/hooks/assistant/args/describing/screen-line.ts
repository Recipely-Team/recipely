/**
 * The screen line's own punctuation and vocabulary.
 *
 * @remarks
 * - **One separator, not one per screen.** Three files spelled `'; '` out
 *   separately, and the registry joins the route to the content with the same
 *   two characters — four chances for one of them to drift into a comma and
 *   turn the line the model parses into prose. (The registry's copy stays
 *   where it is: it lives in the application layer, which cannot reach here.)
 * - **`Answer` is the line's yes and no**, said the same way on every screen so
 *   the model never has to guess whether `saved=true` and `saved=yes` are the
 *   same fact.
 */
export const SCREEN_PART_SEPARATOR = '; ';

/** How a screen line answers a yes-or-no about what is on screen. */
export const Answer = { yes: 'yes', no: 'no' } as const;
