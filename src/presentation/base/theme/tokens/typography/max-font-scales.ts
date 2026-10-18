/**
 * Caps for `maxFontSizeMultiplier` on text that lives inside a shape which
 * genuinely cannot grow — a numbered circle, a count badge.
 *
 * Everywhere else text is left uncapped and the box is given a `minHeight`
 * instead, because capping is a last resort: it stops honouring the user's
 * accessibility setting. Only use a cap where growing the box would break the
 * shape itself (a circle stops being a circle), never to protect a layout that
 * could have been made flexible.
 */
export const maxFontScales = {
  /** Digits inside a fixed-diameter circle or count badge. */
  badge: 1.3,
  /**
   * The smallest a label may shrink to (`minimumFontScale`) when it sits in a
   * slot that cannot widen — five equal tabs, a row of cuisine circles — rather
   * than being cut with an ellipsis at the largest system text.
   */
  shrinkToFitFloor: 0.6,
  /**
   * The tab labels' floor: at Android's largest text (2×) this is still a
   * little under the 1× size, so "My Recipes" fits a fifth of a phone on ONE
   * line. Two lines were worse — Android broke the words ("My Re / cipes").
   */
  tabLabelFloor: 0.45,
} as const;
