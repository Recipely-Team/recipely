import { ok } from '@core/result/result-helpers';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';
import { ShoppingOutboxRepository } from '@infrastructure/shopping/shopping-outbox-repository';
import { SHOPPING_OUTBOX_STORAGE_KEY } from '@infrastructure/constants/storage';

const memoryKv = () => {
  const data = new Map<string, string>();
  const kv: KeyValueStoreInterface = {
    getItem: (key) => Promise.resolve(ok(data.get(key) ?? null)),
    setItem: (key, value) => Promise.resolve(ok(void data.set(key, value))),
    removeItem: (key) => Promise.resolve(ok(void data.delete(key))),
  };
  return { ...kv, seed: (key: string, value: string) => data.set(key, value), peek: (key: string) => data.get(key) ?? null };
};

describe('ShoppingOutboxRepository', () => {
  it('keeps the queued writes across a restart', async () => {
    const kv = memoryKv();
    const writes = [
      { kind: ShoppingPendingWriteKind.Check, itemId: 'a', isChecked: true },
      { kind: ShoppingPendingWriteKind.Delete, itemId: 'b' },
    ] as const;
    await new ShoppingOutboxRepository(kv).save(ShoppingOutbox.of(writes));

    const loaded = await new ShoppingOutboxRepository(kv).load();

    expect(loaded.ok && loaded.value.writes).toEqual(writes);
  });

  it('drops what an older app version or a broken write left behind instead of sending it', async () => {
    const kv = memoryKv();
    kv.seed(SHOPPING_OUTBOX_STORAGE_KEY, JSON.stringify([{ kind: 'check', itemId: 'a' }, { kind: 'rename', itemId: 'b' }, 'x', { kind: 'delete', itemId: 'c' }]));

    const loaded = await new ShoppingOutboxRepository(kv).load();

    expect(loaded.ok && loaded.value.writes).toEqual([{ kind: 'delete', itemId: 'c' }]);
    kv.seed(SHOPPING_OUTBOX_STORAGE_KEY, '{not json');
    const broken = await new ShoppingOutboxRepository(kv).load();
    expect(broken.ok && broken.value.isEmpty()).toBe(true);
  });

  it('removes the key once nothing waits', async () => {
    const kv = memoryKv();
    kv.seed(SHOPPING_OUTBOX_STORAGE_KEY, '[]');
    await new ShoppingOutboxRepository(kv).save(ShoppingOutbox.empty());
    expect(kv.peek(SHOPPING_OUTBOX_STORAGE_KEY)).toBeNull();
  });
});
