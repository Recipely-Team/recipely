/** The faces of the Add food sheet: pick, then a recipe's servings or a product's amount. */
export const AddFoodStep = {
  Pick: 'pick',
  Detail: 'detail',
  Product: 'product',
} as const;

export type AddFoodStepType = (typeof AddFoodStep)[keyof typeof AddFoodStep];
