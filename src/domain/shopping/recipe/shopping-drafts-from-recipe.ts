import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingRecipeRef } from '@domain/shopping/recipe/shopping-recipe-ref';
import { shoppingDraftOf } from '@domain/shopping/recipe/shopping-draft-of';

/**
 * A recipe's ingredient lines → the lines its shopping list gets.
 *
 * `lines` are the lines as the reader sees them — already scaled to the
 * chosen servings and converted to the chosen units — so what is bought is
 * what the page says. Headings and blanks are skipped. `recipe` is null for
 * lines that belong to no saved recipe (a fridge idea's missing items).
 */
export const shoppingDraftsFromRecipe = (lines: readonly string[], recipe: ShoppingRecipeRef | null): ShoppingItemDraft[] =>
  lines.flatMap((line) => {
    const draft = shoppingDraftOf(line, recipe);
    return draft === null ? [] : [draft];
  });
