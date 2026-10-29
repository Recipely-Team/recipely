import { isNonEmptyString, isObject } from '@core/guards/type-guards';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';
import type { ShoppingPendingWriteType } from '@domain/shopping/outbox/shopping-pending-write';

/**
 * Reads the stored outbox back into writes. The store is the device's, but an app update can
 * change its shape: anything that is not a well-formed write is dropped rather than sent.
 */
export const toShoppingPendingWrites = (stored: unknown): readonly ShoppingPendingWriteType[] => {
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((entry: unknown): ShoppingPendingWriteType[] => {
    if (!isObject(entry) || !isNonEmptyString(entry['itemId'])) return [];
    const itemId = entry['itemId'];
    if (entry['kind'] === ShoppingPendingWriteKind.Delete) return [{ kind: ShoppingPendingWriteKind.Delete, itemId }];
    const isChecked = entry['isChecked'];
    if (entry['kind'] === ShoppingPendingWriteKind.Check && typeof isChecked === 'boolean') {
      return [{ kind: ShoppingPendingWriteKind.Check, itemId, isChecked }];
    }
    return [];
  });
};
