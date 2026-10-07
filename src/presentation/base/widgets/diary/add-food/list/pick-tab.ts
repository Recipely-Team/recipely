/**
 * The pick step's tabs, shown while the search is empty (Add food v2 spec §2).
 * `Meal` is "Describe or photograph your meal": reached from its own row, not a segment.
 */
export const PickTab = {
  Recipes: 'recipes',
  Products: 'products',
  Recent: 'recent',
  QuickAdd: 'quickAdd',
  Meal: 'meal',
} as const;

export type PickTabType = (typeof PickTab)[keyof typeof PickTab];
