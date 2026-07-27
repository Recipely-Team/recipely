import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

/**
 * The saved grid, in the order the backend returned the favourites.
 *
 * The rows themselves come from the feed's loaded page, so filtering that page
 * by id inherited the FEED's ordering — which changes with whatever sort the
 * user last picked on the home screen, and again after each silent refetch.
 * The list then reshuffled itself between visits for no reason the user could
 * see. Iterating the favourite ids instead gives one stable order (most
 * recently saved first) that no unrelated screen can move.
 */
export const orderSavedRecipes = (
  savedIds: ReadonlySet<string>,
  recipes: readonly RecipeSummaryEntity[],
): readonly RecipeSummaryEntity[] => {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const ordered: RecipeSummaryEntity[] = [];
  for (const id of savedIds) {
    const recipe = byId.get(id);
    if (recipe !== undefined) ordered.push(recipe);
  }
  return ordered;
};
