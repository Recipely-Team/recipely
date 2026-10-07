import { ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingRow } from '@presentation/app/shopping-list/model/shopping-row';

const TO_BUY = 'heading:toBuy';
const COMPLETED = 'heading:completed';

/** The list's two halves as rows, each under its heading; a half with nothing in it has no heading either. */
export const shoppingRows = (items: readonly ShoppingItemEntity[], toBuyTitle: string, completedTitle: string): ShoppingRow[] => {
  const half = (key: string, title: string, lines: readonly ShoppingItemEntity[]): ShoppingRow[] =>
    lines.length === ValueConstants.zero
      ? []
      : [{ kind: 'heading', key, title, count: lines.length }, ...lines.map((item): ShoppingRow => ({ kind: 'item', key: item.id, item }))];
  return [
    ...half(TO_BUY, toBuyTitle, items.filter((item) => !item.checked)),
    ...half(COMPLETED, completedTitle, items.filter((item) => item.checked)),
  ];
};
