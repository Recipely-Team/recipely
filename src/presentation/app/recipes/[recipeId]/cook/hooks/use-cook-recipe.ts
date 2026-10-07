import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { CookRecipeState } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-state';
import { CookRecipeStatus } from '@presentation/app/recipes/[recipeId]/cook/model/cook-recipe-status';
import { ValueConstants } from '@core/constants';

/**
 * The recipe cook mode walks through, from the same stores the recipe page reads.
 *
 * @remarks
 * - **Usually already loaded**: cook mode is opened from the recipe page, so
 *   the detail store holds it. Opened cold (a reload on the web, a deep link)
 *   it loads the recipe itself.
 * - **A local recipe wins**, as on the recipe page: one the user created is
 *   read from their own list, never fetched.
 */
export const useCookRecipe = (recipeId: string): CookRecipeState => {
  const { recipeDetailStore, createdRecipesStore } = useStores();
  const networkState = recipeDetailStore((s) => s.byId[recipeId]);
  const load = recipeDetailStore((s) => s.load);
  const localRecipe = createdRecipesStore((s) => s.findById(recipeId));

  const needsLoad = localRecipe === undefined && networkState === undefined && recipeId.length > ValueConstants.zero;
  useEffect(() => {
    if (needsLoad) void load(recipeId);
  }, [needsLoad, load, recipeId]);

  const recipe = localRecipe ?? (networkState?.status === StoreStatus.Loaded ? networkState.recipe : undefined);
  if (recipe !== undefined) {
    return recipe.instructions.length > ValueConstants.zero
      ? { status: CookRecipeStatus.Ready, recipe }
      : { status: CookRecipeStatus.Empty, recipe };
  }
  if (networkState?.status === StoreStatus.Error) return { status: CookRecipeStatus.Error, failure: networkState.failure };
  return { status: CookRecipeStatus.Loading };
};
