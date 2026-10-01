/**
 * The unit a product's nutrients are given per 100 of — and always a unit the
 * amount picker offers, even when the product lists serving units.
 */
export const FoodBaseUnit = {
  Grams: 'g',
  Milliliters: 'ml',
} as const;

export type FoodBaseUnitType = (typeof FoodBaseUnit)[keyof typeof FoodBaseUnit];
