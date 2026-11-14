import { shoppingItemOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import { shoppingShareText } from '@presentation/app/shopping-list/model/shopping-share-text';

const WORDS = { title: 'Shopping list', toBuy: 'To buy', completed: 'Completed', decimalMark: ',' };

/** The shared list reads as a checklist anywhere it is pasted: open boxes to buy, ticked ones done. */
describe('shoppingShareText', () => {
  it('writes to-buy lines as open boxes and bought ones as ticked, with amounts in the locale', () => {
    const text = shoppingShareText(
      [
        shoppingItemOf({ id: 'a', label: 'potatoes', quantity: 1.5, unit: 'kg', position: 0 }),
        shoppingItemOf({ id: 'b', label: 'salt', quantity: null, unit: null, position: 1 }),
        shoppingItemOf({ id: 'c', label: 'milk', quantity: 1, unit: 'l', checked: true, position: 2 }),
      ],
      WORDS,
    );
    expect(text).toBe(['Shopping list', '', 'To buy', '☐ 1,5 kg potatoes', '☐ salt', '', 'Completed', '☑ 1 l milk'].join('\n'));
  });

  it('leaves out a half with nothing in it', () => {
    const text = shoppingShareText([shoppingItemOf({ id: 'a', label: 'eggs', quantity: null, unit: null, position: 0 })], WORDS);
    expect(text).toBe('Shopping list\n\nTo buy\n☐ eggs');
  });
});
