import { Servings } from '@domain/diary/entry/servings';

describe('Servings', () => {
  it('accepts half steps from 0.5 to 20', () => {
    expect(Servings.create(0.5).ok).toBe(true);
    expect(Servings.create(1.5).ok).toBe(true);
    expect(Servings.create(20).ok).toBe(true);
    expect(Servings.create(0).ok).toBe(false);
    expect(Servings.create(1.25).ok).toBe(false);
    expect(Servings.create(20.5).ok).toBe(false);
  });

  it('steps by 0.5 and clamps at the bounds', () => {
    const one = Servings.one();
    expect(one.increment().value).toBe(1.5);
    expect(one.decrement().decrement().value).toBe(0.5);
    expect(one.decrement().canDecrement).toBe(false);
    expect(Servings.nearest(25).canIncrement).toBe(false);
  });

  it('rounds an arbitrary amount to the nearest valid step', () => {
    expect(Servings.nearest(1.3).value).toBe(1.5);
    expect(Servings.nearest(0.1).value).toBe(0.5);
  });
});
