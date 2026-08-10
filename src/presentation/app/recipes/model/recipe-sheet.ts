/** Which of the recipe screen's sheets is open, if any. */
export const RecipeSheet = {
  Filter: 'filter',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type RecipeSheet = (typeof RecipeSheet)[keyof typeof RecipeSheet];
