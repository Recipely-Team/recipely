import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import type { ShoppingPendingWriteType } from '@domain/shopping/outbox/shopping-pending-write';
import type { ShoppingOutboxRepositoryInterface } from '@domain/shopping/outbox/shopping-outbox-repository-interface';

/** Keeps a shopping-list change that could not reach the API, for {@link FlushShoppingOutboxUseCase} to send later. */
export class QueueShoppingWriteUseCase {
  constructor(private readonly outbox: ShoppingOutboxRepositoryInterface) {}

  async execute(write: ShoppingPendingWriteType): Promise<Result<ShoppingOutbox, Failure>> {
    const loaded = await this.outbox.load();
    if (!loaded.ok) return loaded;
    const next = loaded.value.with(write);
    const saved = await this.outbox.save(next);
    return saved.ok ? { ok: true, value: next } : saved;
  }
}
