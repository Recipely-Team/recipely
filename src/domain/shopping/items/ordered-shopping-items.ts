import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { compareShoppingItems } from '@domain/shopping/items/compare-shopping-items';

/**
 * The list's order, as the server returns it: unchecked lines first, then
 * checked, each half by `position`. Stable for equal positions, so a tick
 * that fails puts its line back exactly where it was.
 */
export const orderedShoppingItems = (items: readonly ShoppingItemEntity[]): ShoppingItemEntity[] =>
  [...items].sort(compareShoppingItems);
