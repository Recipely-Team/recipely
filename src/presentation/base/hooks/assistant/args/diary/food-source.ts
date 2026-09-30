/** Where a food the assistant can log comes from — also the word `searchFood` answers with. */
export const FoodSource = {
  Mine: 'my recipe',
  Saved: 'saved',
  Recipely: 'Recipely',
  Recent: 'recent',
} as const;

export type FoodSourceType = (typeof FoodSource)[keyof typeof FoodSource];
