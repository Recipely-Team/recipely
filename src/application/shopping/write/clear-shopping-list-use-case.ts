import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** Empties the list ("Clear all"); answers how many lines went. */
export class ClearShoppingListUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(): Promise<Result<number, Failure>> {
    return this.repo.removeAll();
  }
}
