import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** One page of the viewer's shopping list: unchecked lines first, then checked. */
export class ListShoppingItemsUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(page: number, pageSize: number): Promise<Result<Page<ShoppingItemEntity>, Failure>> {
    return this.repo.list(page, pageSize);
  }
}
