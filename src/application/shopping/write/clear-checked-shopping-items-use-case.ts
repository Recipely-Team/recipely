import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** Removes every ticked line ("Clear completed"); answers how many went. */
export class ClearCheckedShoppingItemsUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(): Promise<Result<number, Failure>> {
    return this.repo.removeChecked();
  }
}
