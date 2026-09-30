/** The pick step's segmented tabs (v1: no generic foods catalogue — design spec → Food Diary, scope cut). */
export const FoodSourceTab = {
  Recipes: 'recipes',
  Recent: 'recent',
  QuickAdd: 'quickAdd',
} as const;

export type FoodSourceTabType = (typeof FoodSourceTab)[keyof typeof FoodSourceTab];
