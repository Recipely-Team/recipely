import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { defaultRecipeCommentsState } from '@application/comments/list/default-recipe-comments-state';

/**
 * Returns a new `byRecipe` map with one recipe's comment state patched. The
 * patch is computed from the recipe's current state (or a fresh default when it
 * has none yet), so callers can both set flat fields and derive from existing
 * items (append a page, drop a deleted comment) without repeating the merge.
 */
export const mergeRecipeComments = (
  byRecipe: Record<string, RecipeCommentsState>,
  recipeId: string,
  patch: (current: RecipeCommentsState) => Partial<RecipeCommentsState>,
): Record<string, RecipeCommentsState> => {
  const current = byRecipe[recipeId] ?? defaultRecipeCommentsState();
  return { ...byRecipe, [recipeId]: { ...current, ...patch(current) } };
};
