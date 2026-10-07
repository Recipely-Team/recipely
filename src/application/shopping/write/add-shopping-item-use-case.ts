import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, type Failure, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import { shoppingDraftOf } from '@domain/shopping/recipe/shopping-draft-of';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/**
 * Adds one line the user typed. "2 kg potatoes" is read like a recipe line —
 * amount, unit and name — so a typed line merges with a recipe's the same
 * way; a line that reads as a heading is added as written.
 */
export class AddShoppingItemUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(text: string): Promise<Result<ShoppingAddResult, Failure>> {
    if (isBlank(text)) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.shopping.labelRequired, 'label', ErrorMessageKey.shoppingLabelRequired)));
    }
    const draft = shoppingDraftOf(text, null) ?? { label: text.trim(), quantity: null, unit: null, recipeId: null, recipeName: null };
    return this.repo.add([draft]);
  }
}
