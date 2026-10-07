import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemEntityProps } from '@domain/shopping/items/shopping-item-entity-props';
import { orderedShoppingItems } from '@domain/shopping/items/ordered-shopping-items';
import { readShoppingQuantity } from '@domain/shopping/items/read-shopping-quantity';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';
import { shoppingDraftOf } from '@domain/shopping/recipe/shopping-draft-of';
import { shoppingDraftsFromRecipe } from '@domain/shopping/recipe/shopping-drafts-from-recipe';

const props = (over: Partial<ShoppingItemEntityProps> = {}): ShoppingItemEntityProps => ({
  id: 'i1',
  label: 'Flour',
  quantity: 2,
  unit: 'cups',
  recipeId: null,
  recipeName: null,
  checked: false,
  position: 0,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...over,
});
const item = (over: Partial<ShoppingItemEntityProps> = {}): ShoppingItemEntity => {
  const r = ShoppingItemEntity.create(props(over));
  if (!r.ok) throw new Error('fixture');
  return r.value;
};
const recipe = { id: 'r1', name: 'Pancakes' };

describe('ShoppingItemEntity', () => {
  it('refuses a blank id or label and trims the label', () => {
    expect(ShoppingItemEntity.create(props({ id: ' ' })).ok).toBe(false);
    expect(ShoppingItemEntity.create(props({ label: '  ' })).ok).toBe(false);
    expect(item({ label: ' Milk ' }).label).toBe('Milk');
  });

  it('flips its tick without touching anything else', () => {
    const ticked = item().withChecked(true);
    expect([ticked.checked, ticked.label, ticked.quantity]).toEqual([true, 'Flour', 2]);
  });

  it('orders unchecked lines first, each half by position', () => {
    const ordered = orderedShoppingItems([item({ id: 'a', checked: true, position: 3 }), item({ id: 'b', position: 2 }), item({ id: 'c', checked: true, position: 1 }), item({ id: 'd', position: 0 })]);
    expect(ordered.map((i) => i.id)).toEqual(['d', 'b', 'c', 'a']);
  });
});

describe('adding a recipe to the shopping list', () => {
  it('skips headings and blanks and sends name, amount and unit per line', () => {
    const drafts = shoppingDraftsFromRecipe(['# Dough', '2 cups flour', '', '3 eggs', 'Salt'], recipe);
    expect(drafts).toEqual([
      { label: 'flour', quantity: 2, unit: 'cups', recipeId: 'r1', recipeName: 'Pancakes' },
      { label: 'eggs', quantity: 3, unit: null, recipeId: 'r1', recipeName: 'Pancakes' },
      { label: 'Salt', quantity: null, unit: null, recipeId: 'r1', recipeName: 'Pancakes' },
    ]);
  });

  it('sends the scaled amounts the reader is looking at, rounded to two decimals', () => {
    const scaled = IngredientList.of(['1 cup milk', '2 eggs']).present(1 / 3, UnitSystem.Original);
    const drafts = shoppingDraftsFromRecipe(scaled, recipe);
    expect(drafts.map((d) => [d.label, d.quantity])).toEqual([
      ['milk', 0.33],
      ['eggs', 0.67],
    ]);
    const doubled = shoppingDraftsFromRecipe(IngredientList.of(['200 g sugar']).present(2, UnitSystem.Original), recipe);
    expect(doubled[0]).toMatchObject({ label: 'sugar', quantity: 400, unit: 'g' });
  });

  it('buys the top of a range and leaves a typed line without a recipe', () => {
    expect(shoppingDraftOf('2-3 cloves garlic', null)).toMatchObject({ quantity: 3, recipeId: null, recipeName: null });
    expect(shoppingDraftOf('# Sauce', null)).toBeNull();
  });
});

describe('shopping amounts', () => {
  it('reads a typed amount: blank is none, a number is itself, anything else is refused', () => {
    expect(readShoppingQuantity(' ')).toEqual({ ok: true, value: null });
    expect(readShoppingQuantity('1,5')).toEqual({ ok: true, value: 1.5 });
    expect(readShoppingQuantity('two').ok).toBe(false);
    expect(readShoppingQuantity('2-3').ok).toBe(false);
    expect(readShoppingQuantity('0').ok).toBe(false);
  });

  it('renders the amount with the locale decimal mark and the unit', () => {
    expect(shoppingAmountText(2.5, 'kg', ',')).toBe('2,5 kg');
    expect(shoppingAmountText(null, null, '.')).toBe('');
    expect(shoppingAmountText(3, null, '.')).toBe('3');
  });
});
