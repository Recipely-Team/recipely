import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { readShoppingQuantity } from '@domain/shopping/items/read-shopping-quantity';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import type { ShoppingItemEdit } from '@application/shopping/write/shopping-item-edit';

/**
 * Rewrites a line's label, amount and unit from the edit sheet. A blank label
 * or an amount that does not read as one number is refused here, with the
 * backend's own `messageKey`, before a request is spent on it; a blank amount
 * or unit clears it.
 */
export class UpdateShoppingItemUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(id: string, edit: ShoppingItemEdit): Promise<Result<ShoppingItemEntity, Failure>> {
    if (isBlank(edit.label)) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.shopping.labelRequired, 'label', ErrorMessageKey.shoppingLabelRequired)));
    }
    const quantity = readShoppingQuantity(edit.quantityText);
    if (!quantity.ok) {
      return Promise.resolve(fail(new ValidationFailure(quantity.failure.message, 'quantity', ErrorMessageKey.shoppingQuantityInvalid)));
    }
    const unit = edit.unit.trim();
    return this.repo.update(id, { label: edit.label.trim(), quantity: quantity.value, unit: isBlank(unit) ? null : unit });
  }
}
