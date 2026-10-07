import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-helpers';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingRecipeRef } from '@domain/shopping/recipe/shopping-recipe-ref';
import { shoppingDraftsFromRecipe } from '@domain/shopping/recipe/shopping-drafts-from-recipe';
import { ShoppingLimits } from '@domain/shopping/shopping-limits';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/**
 * Puts a recipe's ingredients on the shopping list.
 *
 * @remarks
 * - **`lines` are the lines the reader sees** — scaled and converted — and
 *   the domain reads each into a label, amount and unit; headings are skipped.
 * - **Batches of `ShoppingLimits.batchMax`**, one after another; a refusal
 *   stops there and is returned (the lines already added stay added).
 * - **Nothing to buy sends nothing** and answers an empty result.
 */
export class AddRecipeIngredientsUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  async execute(lines: readonly string[], recipe: ShoppingRecipeRef): Promise<Result<ShoppingAddResult, Failure>> {
    const drafts = shoppingDraftsFromRecipe(lines, recipe);
    const items: ShoppingItemEntity[] = [];
    let added = ValueConstants.zero;
    let merged = ValueConstants.zero;
    for (let start = ValueConstants.zero; start < drafts.length; start += ShoppingLimits.batchMax) {
      const result = await this.repo.add(drafts.slice(start, start + ShoppingLimits.batchMax));
      if (!result.ok) return result;
      items.push(...result.value.items);
      added += result.value.added;
      merged += result.value.merged;
    }
    return ok({ items, added, merged });
  }
}
