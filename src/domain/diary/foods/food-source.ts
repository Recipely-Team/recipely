/**
 * Where a catalogue product comes from: Recipely's own curated foods, or a
 * branded pack read from Open Food Facts. Also the wire values.
 */
export const FoodSource = {
  Curated: 'curated',
  OpenFoodFacts: 'openfoodfacts',
} as const;

export type FoodSourceType = (typeof FoodSource)[keyof typeof FoodSource];
