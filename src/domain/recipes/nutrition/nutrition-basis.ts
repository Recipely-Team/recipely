/**
 * The quantity a nutrition reading is expressed against.
 *
 * `Per100g` needs the recipe's serving weight; without one the only honest
 * basis is the serving the backend measured.
 */
export const NutritionBasis = {
  /** Scaled to 100 g of the finished dish. */
  Per100g: 'per100g',
  /** As reported: one serving. */
  PerServing: 'perServing',
} as const;

export type NutritionBasisType = (typeof NutritionBasis)[keyof typeof NutritionBasis];
