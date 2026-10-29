import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import type { ShoppingOutboxRepositoryInterface } from '@domain/shopping/outbox/shopping-outbox-repository-interface';
import { SHOPPING_OUTBOX_STORAGE_KEY } from '@infrastructure/constants/storage';
import { toShoppingPendingWrites } from '@infrastructure/shopping/to-shopping-pending-writes';

const parseJson = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Implements `ShoppingOutboxRepositoryInterface` as one JSON list in the key-value store. */
export class ShoppingOutboxRepository implements ShoppingOutboxRepositoryInterface {
  constructor(private readonly kv: KeyValueStoreInterface) {}

  async load(): Promise<Result<ShoppingOutbox, Failure>> {
    const stored = await this.kv.getItem(SHOPPING_OUTBOX_STORAGE_KEY);
    if (!stored.ok) return stored;
    return ok(ShoppingOutbox.of(toShoppingPendingWrites(parseJson(stored.value))));
  }

  save(outbox: ShoppingOutbox): Promise<Result<void, Failure>> {
    return outbox.isEmpty()
      ? this.kv.removeItem(SHOPPING_OUTBOX_STORAGE_KEY)
      : this.kv.setItem(SHOPPING_OUTBOX_STORAGE_KEY, JSON.stringify(outbox.writes));
  }
}
