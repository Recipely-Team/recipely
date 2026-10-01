/** The pick step's tabs, shown while the search is empty (Add food v2 spec §2). */
export const PickTab = {
  Recipes: 'recipes',
  Products: 'products',
  Recent: 'recent',
  QuickAdd: 'quickAdd',
} as const;

export type PickTabType = (typeof PickTab)[keyof typeof PickTab];
