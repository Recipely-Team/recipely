/** Whether a recent food re-logs as servings (a recipe or a quick add) or as a product quantity. */
export const RecentFoodKind = {
  Food: 'food',
  Product: 'product',
} as const;

export type RecentFoodKindType = (typeof RecentFoodKind)[keyof typeof RecentFoodKind];
