import type { Result } from '@core/result/result';
import { type Failure, FailureCode } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { ValueConstants } from '@core/constants';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';
import type { ShoppingPendingWriteType } from '@domain/shopping/outbox/shopping-pending-write';
import type { ShoppingOutboxRepositoryInterface } from '@domain/shopping/outbox/shopping-outbox-repository-interface';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import type { ShoppingFlushReport } from '@application/shopping/sync/shopping-flush-report';
import { isOfflineFailure } from '@application/shopping/sync/is-offline-failure';

/**
 * Sends the waiting shopping-list changes, oldest first.
 *
 * @remarks
 * - **Stops at the first change that cannot reach the API** and keeps it and everything after
 *   it, so the order the user made them in is the order the server sees.
 * - **A refusal is final** (a 4xx, a 500): the change is dropped and counted in `refused`, so
 *   the caller re-reads the list instead of retrying a change the server will never take.
 * - **A delete of a line already gone is a success** — the line is gone either way.
 * - **Saves what is left** whether the pass finished or stopped.
 */
export class FlushShoppingOutboxUseCase {
  constructor(
    private readonly repo: ShoppingListRepositoryInterface,
    private readonly outbox: ShoppingOutboxRepositoryInterface,
  ) {}

  async execute(): Promise<Result<ShoppingFlushReport, Failure>> {
    const loaded = await this.outbox.load();
    if (!loaded.ok) return loaded;
    if (loaded.value.isEmpty()) return ok({ sent: ValueConstants.zero, refused: ValueConstants.zero, remaining: loaded.value });
    let remaining = loaded.value;
    let sent = ValueConstants.zero;
    let refused = ValueConstants.zero;
    for (const write of loaded.value.writes) {
      const result = await this.send(write);
      if (!result.ok && isOfflineFailure(result.failure)) break;
      if (result.ok || result.failure.code === FailureCode.NotFound) sent += ValueConstants.one;
      else refused += ValueConstants.one;
      remaining = remaining.without(write.itemId);
    }
    const saved = await this.outbox.save(remaining);
    if (!saved.ok) return saved;
    return ok({ sent, refused, remaining });
  }

  private async send(write: ShoppingPendingWriteType): Promise<Result<unknown, Failure>> {
    return write.kind === ShoppingPendingWriteKind.Check
      ? this.repo.update(write.itemId, { checked: write.isChecked })
      : this.repo.remove(write.itemId);
  }
}
