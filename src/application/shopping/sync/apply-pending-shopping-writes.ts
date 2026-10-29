import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingOutbox } from '@domain/shopping/outbox/shopping-outbox';
import { ShoppingPendingWriteKind } from '@domain/shopping/outbox/shopping-pending-write-kind';

/**
 * A page from the server as the user last left it: waiting ticks shown, waiting deletes gone.
 * The page may predate them (read from the first-page cache, or read while they were still
 * queued), and showing it raw would undo on screen what the user did offline.
 */
export const applyPendingShoppingWrites = (
  items: readonly ShoppingItemEntity[],
  outbox: ShoppingOutbox,
): { readonly items: readonly ShoppingItemEntity[]; readonly removed: number } => {
  let removed = ValueConstants.zero;
  const next = items.flatMap((item) => {
    const pending = outbox.writes.find((write) => write.itemId === item.id);
    if (pending === undefined) return [item];
    if (pending.kind === ShoppingPendingWriteKind.Delete) {
      removed += ValueConstants.one;
      return [];
    }
    return [item.withChecked(pending.isChecked)];
  });
  return { items: next, removed };
};
