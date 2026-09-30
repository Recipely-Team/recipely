export const TabBarKey = {
  Recipes: 'recipes',
  MyRecipes: 'myRecipes',
  Diary: 'diary',
  Profile: 'profile',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type TabBarKey = (typeof TabBarKey)[keyof typeof TabBarKey];
