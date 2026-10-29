import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import type { ShoppingOutboxRepositoryInterface } from '@domain/shopping/outbox/shopping-outbox-repository-interface';

/** Drops every waiting change — on sign-out, so one account's changes never reach the next account's list. */
export class ClearShoppingOutboxUseCase {
  constructor(private readonly outbox: ShoppingOutboxRepositoryInterface) {}

  execute(): Promise<Result<void, Failure>> {
    return this.outbox.save(ShoppingOutbox.empty());
  }
}
