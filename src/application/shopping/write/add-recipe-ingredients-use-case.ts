import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingRecipeRef } from '@domain/shopping/recipe/shopping-recipe-ref';
import { shoppingDraftsFromRecipe } from '@domain/shopping/recipe/shopping-drafts-from-recipe';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import { AddShoppingDraftsUseCase } from '@application/shopping/write/add-shopping-drafts-use-case';

/**
 * Puts a recipe's ingredients on the shopping list.
 *
 * @remarks
 * - **`lines` are the lines the reader sees** — scaled and converted — and
 *   the domain reads each into a label, amount and unit; headings are skipped.
 * - **Sent like any ready-made lines** (`AddShoppingDraftsUseCase`): batches of
 *   `ShoppingLimits.batchMax`, a refusal stops there, nothing to buy sends nothing.
 */
export class AddRecipeIngredientsUseCase {
  private readonly drafts: AddShoppingDraftsUseCase;

  constructor(repo: ShoppingListRepositoryInterface) {
    this.drafts = new AddShoppingDraftsUseCase(repo);
  }

  execute(lines: readonly string[], recipe: ShoppingRecipeRef): Promise<Result<ShoppingAddResult, Failure>> {
    return this.drafts.execute(shoppingDraftsFromRecipe(lines, recipe));
  }
}
