import type { Result } from '@core/result/result';
import { ok } from '@core/result/result-helpers';
import type { Failure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import { ShoppingLimits } from '@domain/shopping/shopping-limits';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/**
 * Puts ready-made lines on the shopping list — a recipe's, or a planned
 * week's merged ingredients.
 *
 * @remarks
 * - **Batches of `ShoppingLimits.batchMax`**, one after another; a refusal
 *   stops there and is returned (the lines already added stay added).
 * - **Nothing to buy sends nothing** and answers an empty result.
 */
export class AddShoppingDraftsUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  async execute(drafts: readonly ShoppingItemDraft[]): Promise<Result<ShoppingAddResult, Failure>> {
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
