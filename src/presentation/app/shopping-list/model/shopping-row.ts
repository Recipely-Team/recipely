import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';

/** One row of the list: a half's heading ("To buy", "Completed") or a line. */
export type ShoppingRow =
  | { kind: 'heading'; key: string; title: string; count: number }
  | { kind: 'item'; key: string; item: ShoppingItemEntity };
