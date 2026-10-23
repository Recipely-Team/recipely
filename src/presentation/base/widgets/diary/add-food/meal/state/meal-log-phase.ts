/** The faces of "Describe or photograph your meal": write, wait, a failure, or the confirm list. */
export const MealLogPhase = {
  Compose: 'compose',
  Parsing: 'parsing',
  Failed: 'failed',
  Review: 'review',
} as const;
