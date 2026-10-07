import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** Removes one line. */
export class DeleteShoppingItemUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.remove(id);
  }
}
