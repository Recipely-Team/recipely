/**
 * One line to add to the shopping list — what `POST /items` takes per line.
 * Built by `shoppingDraftOf` / `shoppingDraftsFromRecipe`, so the label is
 * never blank and the quantity never non-positive.
 */
export interface ShoppingItemDraft {
  readonly label: string;
  readonly quantity: number | null;
  readonly unit: string | null;
  readonly recipeId: string | null;
  readonly recipeName: string | null;
}
