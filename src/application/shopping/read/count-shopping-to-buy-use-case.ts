import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';

/** How many shopping-list lines are still to buy — the number on the cart badge. */
export class CountShoppingToBuyUseCase {
  constructor(private readonly repo: ShoppingListRepositoryInterface) {}

  execute(): Promise<Result<number, Failure>> {
    return this.repo.countToBuy();
  }
}
