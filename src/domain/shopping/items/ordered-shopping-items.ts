import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';

/**
 * The list's order, as the server returns it: unchecked lines first, then
 * checked, each half by `position`. Stable for equal positions, so a tick
 * that fails puts its line back exactly where it was.
 */
export const orderedShoppingItems = (items: readonly ShoppingItemEntity[]): ShoppingItemEntity[] => {
  const byPosition = (a: ShoppingItemEntity, b: ShoppingItemEntity): number => a.position - b.position;
  return [...items.filter((item) => !item.checked).sort(byPosition), ...items.filter((item) => item.checked).sort(byPosition)];
};
