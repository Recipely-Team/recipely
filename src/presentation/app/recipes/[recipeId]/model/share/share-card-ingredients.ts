import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

/** A component header ("# Syrup") is a heading in the list, not something to buy. */
const COMPONENT_HEADER = '#';

/**
 * The ingredient lines the share card prints, and how many it leaves out.
 * Component headers are dropped: on a card this short they read as ingredients.
 */
export const shareCardIngredients = (
  ingredients: readonly string[],
): { readonly shown: readonly string[]; readonly hidden: number } => {
  const lines = ingredients.map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith(COMPONENT_HEADER));
  const shown = lines.slice(0, ShareCardLayout.maxIngredients);
  return { shown, hidden: lines.length - shown.length };
};
