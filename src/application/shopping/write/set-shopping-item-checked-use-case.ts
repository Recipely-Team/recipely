import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** Ticks a line off, or puts it back. */
export class SetShoppingItemCheckedUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(id: string, checked: boolean): Promise<Result<ShoppingItemEntity, Failure>> {
    return this.repo.update(id, { checked });
  }
}
