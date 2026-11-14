import { CharConstants, ValueConstants } from '@core/constants';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';

/** The boxes a checklist line starts with; every notes and chat app shows them. */
const OPEN_BOX = '☐';
const TICKED_BOX = '☑';

/** The words the shared text carries around the lines. */
interface ShoppingShareWords {
  title: string;
  toBuy: string;
  completed: string;
  decimalMark: string;
}

/**
 * **The shopping list as a checklist to paste anywhere** — a title, then "To
 * buy" as open boxes and "Completed" as ticked ones, in the order on screen.
 *
 * @remarks
 * - **Plain text, not a format.** A message, a note or an email all keep
 *   `☐ 2 kg potatoes`; Markdown's `- [ ]` only reads as a box in a few apps.
 * - **A half with nothing in it is left out**, like on screen.
 */
export const shoppingShareText = (items: readonly ShoppingItemEntity[], words: ShoppingShareWords): string => {
  const line = (item: ShoppingItemEntity): string => {
    const amount = shoppingAmountText(item.quantity, item.unit, words.decimalMark);
    const text = amount.length > ValueConstants.zero ? `${amount}${CharConstants.space}${item.label}` : item.label;
    return `${item.checked ? TICKED_BOX : OPEN_BOX}${CharConstants.space}${text}`;
  };
  const section = (heading: string, lines: readonly ShoppingItemEntity[]): string[] =>
    lines.length === ValueConstants.zero ? [] : [CharConstants.empty, heading, ...lines.map(line)];
  return [
    words.title,
    ...section(words.toBuy, items.filter((item) => !item.checked)),
    ...section(words.completed, items.filter((item) => item.checked)),
  ].join(CharConstants.newline);
};
