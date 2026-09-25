/**
 * Who a newly created recipe is visible to. The app always creates `private`
 * recipes; publishing is a separate, deliberate step.
 */
export const RecipeVisibility = {
  Private: 'private',
  Public: 'public',
} as const;

export type RecipeVisibilityType = (typeof RecipeVisibility)[keyof typeof RecipeVisibility];
