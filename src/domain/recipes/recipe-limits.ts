/**
 * The bounds a recipe's numbers live in — the entity validates against them and
 * the create screen's steppers stop at them, so the two can never disagree.
 */
export const RecipeLimits = {
  /** Fewest servings a recipe can be written for. */
  servingsMin: 1,
  /** Most servings the create screen's stepper offers. */
  servingsMax: 50,
} as const;
