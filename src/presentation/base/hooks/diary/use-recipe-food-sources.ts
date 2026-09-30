import { StoreStatus } from '@application/store/store-status';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { RecipeFoodSources } from '@presentation/base/widgets/diary/add-food/search/recipe-food-sources';

/** Stable identity for "the feed has nothing loaded", so the selector does not hand back a new array each render. */
const NO_RECIPES: readonly RecipeSummaryEntity[] = [];

/**
 * The recipes the Add food sheet can offer without a request of its own: the
 * user's recipes, their saved ones and the feed as already loaded.
 */
export const useRecipeFoodSources = (): RecipeFoodSources => {
  const { createdRecipesStore, savedRecipesStore, recipeListStore } = useStores();
  const mine = createdRecipesStore((s) => s.recipes);
  const saved = savedRecipesStore((s) => s.savedRecipes);
  const feed = recipeListStore((s) => (s.state.status === StoreStatus.Loaded ? s.state.recipes : NO_RECIPES));
  return { mine, saved, feed };
};
