import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';

/** The server's list order as a comparator: unchecked before checked, then by `position`. */
export const compareShoppingItems = (a: ShoppingItemEntity, b: ShoppingItemEntity): number =>
  Number(a.checked) - Number(b.checked) || a.position - b.position;
