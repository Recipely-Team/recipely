import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingRecipeRef } from '@domain/shopping/recipe/shopping-recipe-ref';
import { ShoppingLimits } from '@domain/shopping/shopping-limits';
import { RadixConstants, ValueConstants } from '@core/constants';

const SCALE = RadixConstants.decimal ** ShoppingLimits.quantityPlaces;

/**
 * One ingredient line (or a line typed into the list) → what the list adds.
 *
 * @remarks
 * - **The line is read the way the recipe reads it** (`IngredientLine`): a
 *   heading or a blank is not something to buy and gives null.
 * - **A range buys its top** — "2-3 cloves" puts 3 on the list.
 * - **The amount keeps `ShoppingLimits.quantityPlaces` decimals**, so a
 *   scaled third of a cup does not travel as 0.3333333.
 */
export const shoppingDraftOf = (text: string, recipe: ShoppingRecipeRef | null): ShoppingItemDraft | null => {
  const line = IngredientLine.of(text);
  if (!line.isIngredient) return null;
  const quantity = line.quantity;
  const amount = quantity === null ? null : Math.round((quantity.upTo ?? quantity.amount) * SCALE) / SCALE;
  return {
    label: line.name,
    quantity: amount !== null && amount > ValueConstants.zero ? amount : null,
    unit: line.unitText,
    recipeId: recipe?.id ?? null,
    recipeName: recipe?.name ?? null,
  };
};
