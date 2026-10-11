/** The diet an ideas request may ask for — the backend's `diet` values. */
export const FridgeDiet = {
  None: 'none',
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
  HighProtein: 'highProtein',
} as const;

export type FridgeDietType = (typeof FridgeDiet)[keyof typeof FridgeDiet];
