/**
 * The tile a food without a photo gets (Add food v2 spec §2): a bolt for a
 * quick add, a cup for a drink, a plate for a food, a box for a branded pack.
 */
export const FoodThumbIcon = {
  QuickAdd: 'flash',
  Drink: 'cafe',
  Food: 'restaurant',
  Packaged: 'cube',
} as const;

export type FoodThumbIconType = (typeof FoodThumbIcon)[keyof typeof FoodThumbIcon];
