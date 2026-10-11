/** Where the ingredient list came from: a scan ("We found n") or the user's own typing ("What do you have?"). */
export const IngredientSource = {
  Scan: 'scan',
  Typed: 'typed',
} as const;

export type IngredientSourceType = (typeof IngredientSource)[keyof typeof IngredientSource];
