/** Whether a product is eaten or drunk — it picks the row's tile icon. Also the wire values. */
export const FoodKind = {
  Food: 'food',
  Drink: 'drink',
} as const;

export type FoodKindType = (typeof FoodKind)[keyof typeof FoodKind];
