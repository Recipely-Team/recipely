/**
 * What the meal parser matched an item to: a catalogue food (its id is a
 * `foodVariantId`), a recipe, or nothing. Also the wire values.
 */
export const MealMatchKind = {
  Food: 'food',
  Recipe: 'recipe',
  None: 'none',
} as const;

export type MealMatchKindType = (typeof MealMatchKind)[keyof typeof MealMatchKind];
