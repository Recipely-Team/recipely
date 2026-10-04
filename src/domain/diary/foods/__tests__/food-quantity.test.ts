import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';

const glass = { key: 'glass', amount: 200 };
const ml = { key: 'ml', amount: 1 };
const g = { key: 'g', amount: 1 };

describe('FoodQuantity', () => {
  it('defaults to the first serving unit at 1, or 100 of the base unit when there is none', () => {
    expect(FoodQuantity.defaultFor([glass, ml]).equals(FoodQuantity.of(glass, 1))).toBe(true);
    const base = FoodQuantity.defaultFor([g]);
    expect(base.value).toBe(100);
    expect(base.unit.key).toBe('g');
  });

  it('steps a serving unit in halves, ml by 50 and g by 10, never below one step', () => {
    expect(FoodQuantity.of(glass, 1).increment().value).toBe(1.5);
    expect(FoodQuantity.of(glass, 0.5).canDecrement).toBe(false);
    expect(FoodQuantity.of(ml, 250).increment().value).toBe(300);
    expect(FoodQuantity.of(g, 10).decrement().value).toBe(10);
  });

  it('snaps any raw amount onto the step within the bounds', () => {
    expect(FoodQuantity.of(glass, 1.3).value).toBe(1.5);
    expect(FoodQuantity.of(ml, 0).value).toBe(50);
    expect(FoodQuantity.of(ml, 999999).value).toBe(5000);
  });

  it('converts into the base unit and restarts a serving unit at 1', () => {
    const two = FoodQuantity.of(glass, 2);
    expect(two.baseAmount).toBe(400);
    expect(two.inUnit(ml).value).toBe(400);
    expect(FoodQuantity.of(ml, 430).inUnit(glass).value).toBe(1);
    expect(FoodQuantity.of(g, 37).value).toBe(40);
  });
});
