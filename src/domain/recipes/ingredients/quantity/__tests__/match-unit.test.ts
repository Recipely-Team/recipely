import { MeasureUnit } from '@domain/recipes/ingredients/quantity/measure-unit';
import { matchUnit } from '@domain/recipes/ingredients/quantity/match-unit';

describe('matchUnit', () => {
  it('prefers the longest spelling, so "fl oz" is not read as ounces', () => {
    expect(matchUnit('fl oz milk')).toEqual({ unit: MeasureUnit.FluidOunce, length: 5 });
  });

  it('reads a multi-word Turkish unit whole', () => {
    expect(matchUnit('su bardağı un')).toEqual({ unit: MeasureUnit.WaterGlass, length: 10 });
  });

  it('takes an abbreviation together with its full stop', () => {
    expect(matchUnit('tbsp. sugar')).toEqual({ unit: MeasureUnit.Tablespoon, length: 5 });
  });

  it('ignores case', () => {
    expect(matchUnit('Cups flour')?.unit).toBe(MeasureUnit.Cup);
  });

  it.each(['gramofon', 'lemon', 'pinchy', 'tomato'])('does not take the head of the word "%s" for a unit', (text) => {
    expect(matchUnit(text)).toBeNull();
  });

  it('reads a unit that ends the text', () => {
    expect(matchUnit('kg')).toEqual({ unit: MeasureUnit.Kilogram, length: 2 });
  });
});
