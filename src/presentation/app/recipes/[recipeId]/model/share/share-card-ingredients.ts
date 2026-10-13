import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

/**
 * The ingredient names the share card runs together, and how many it leaves
 * out. Names only — "flour", not "2 cups flour" — and group headers dropped:
 * on a card this short they read as ingredients.
 */
export const shareCardIngredients = (
  ingredients: readonly string[],
): { readonly shown: readonly string[]; readonly hidden: number } => {
  const names = ingredients
    .map((raw) => IngredientLine.of(raw))
    .filter((line) => line.isIngredient)
    .map((line) => line.name)
    .filter((name) => name.length > 0);
  const shown = names.slice(0, ShareCardLayout.maxIngredients);
  return { shown, hidden: names.length - shown.length };
};
