import type { RecipeDetailState } from '@application/recipes/detail/recipe-detail-state';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { StoreStatus } from '@application/store/store-status';

/**
 * The recipe a copy is being made from, once it has finished loading.
 *
 * @remarks
 * The detail store is keyed by id and holds every recipe the session has
 * opened, so reading it by key rather than watching "the current one" is what
 * keeps a copy from being seeded by whichever recipe was looked at last.
 * Returns null while it is still loading, or if it failed — the caller only
 * ever acts on a recipe it actually has.
 */
export const fromRecipeIdOf = (
  byId: Readonly<Record<string, RecipeDetailState>>,
  recipeId: string | undefined,
): RecipeEntity | null => {
  if (recipeId === undefined) return null;

  const entry = byId[recipeId];
  if (entry === undefined || entry.status !== StoreStatus.Loaded) return null;
  return entry.recipe;
};
