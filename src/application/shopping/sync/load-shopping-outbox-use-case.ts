import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import type { ShoppingOutboxRepositoryInterface } from '@domain/shopping/outbox/shopping-outbox-repository-interface';

/** The changes still waiting, so a freshly loaded page can show them as already made. */
export class LoadShoppingOutboxUseCase {
  constructor(private readonly outbox: ShoppingOutboxRepositoryInterface) {}

  execute(): Promise<Result<ShoppingOutbox, Failure>> {
    return this.outbox.load();
  }
}
