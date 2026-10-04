/**
 * The food search's groups, in display order (Add food v2 spec §3): saved
 * recipes, the viewer's own, catalogue products, everyone's public recipes.
 * Also the wire values of `group=`.
 */
export const FoodSearchGroup = {
  Saved: 'saved',
  Mine: 'mine',
  Products: 'products',
  Recipes: 'recipes',
} as const;

export type FoodSearchGroupType = (typeof FoodSearchGroup)[keyof typeof FoodSearchGroup];
