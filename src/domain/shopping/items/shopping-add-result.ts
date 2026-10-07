import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';

/** What one add did: the lines it touched in their final state, how many were new and how many folded into existing ones. */
export interface ShoppingAddResult {
  readonly items: readonly ShoppingItemEntity[];
  readonly added: number;
  readonly merged: number;
}
