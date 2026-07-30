export const WebHeaderTabKey = {
  Recipes: 'recipes',
  MyRecipes: 'myRecipes',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type WebHeaderTabKey = (typeof WebHeaderTabKey)[keyof typeof WebHeaderTabKey];
