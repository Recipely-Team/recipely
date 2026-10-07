import { MeasureDimension } from '@domain/recipes/ingredients/quantity/measure-dimension';
import { MeasureUnit } from '@domain/recipes/ingredients/quantity/measure-unit';
import { MEASURE_UNITS } from '@domain/recipes/ingredients/quantity/measure-unit-catalogue';

/**
 * **The unit catalogue's invariants.** One spelling naming two units would make the parser pick
 * whichever comes first; a mass or volume unit without a base amount could not be converted.
 */
describe('MEASURE_UNITS', () => {
  const units = Object.values(MeasureUnit);

  it('gives every spelling to exactly one unit', () => {
    const owners = new Map<string, string[]>();
    for (const unit of units) {
      for (const alias of MEASURE_UNITS[unit].aliases) owners.set(alias, [...(owners.get(alias) ?? []), unit]);
    }

    expect([...owners].filter(([, of]) => of.length > 1)).toEqual([]);
  });

  it('writes every alias in lower case, as the matcher compares lower-cased text', () => {
    const spellings = units.flatMap((unit) => MEASURE_UNITS[unit].aliases);

    expect(spellings.filter((alias) => alias !== alias.toLowerCase())).toEqual([]);
  });

  it('gives a base amount to every unit that can be converted, and none to a count', () => {
    for (const unit of units) {
      const { dimension, base } = MEASURE_UNITS[unit];
      if (dimension === MeasureDimension.Count) expect(base).toBeNull();
      else expect(base).toBeGreaterThan(0);
    }
  });

  it('writes its first spelling as the singular and a plural only where English needs one', () => {
    expect(MEASURE_UNITS[MeasureUnit.Cup]).toMatchObject({ one: 'cup', other: 'cups' });
    expect(MEASURE_UNITS[MeasureUnit.Gram]).toMatchObject({ one: 'g', other: 'g' });
  });

  it('measures the kitchen units against the metric base', () => {
    expect(MEASURE_UNITS[MeasureUnit.Litre].base).toBe(1000 * (MEASURE_UNITS[MeasureUnit.Millilitre].base ?? 0));
    expect(MEASURE_UNITS[MeasureUnit.Tablespoon].base).toBe(3 * (MEASURE_UNITS[MeasureUnit.Teaspoon].base ?? 0));
    expect(MEASURE_UNITS[MeasureUnit.Kilogram].base).toBe(1000 * (MEASURE_UNITS[MeasureUnit.Gram].base ?? 0));
  });
});
