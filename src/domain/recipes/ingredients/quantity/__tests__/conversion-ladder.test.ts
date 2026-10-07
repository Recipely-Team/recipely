import { MeasureDimension } from '@domain/recipes/ingredients/quantity/measure-dimension';
import { MeasureUnit } from '@domain/recipes/ingredients/quantity/measure-unit';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import { conversionTarget } from '@domain/recipes/ingredients/quantity/conversion-ladder';

describe('conversionTarget', () => {
  it.each([
    [MeasureDimension.Mass, 1000, MeasureUnit.Kilogram],
    [MeasureDimension.Mass, 999, MeasureUnit.Gram],
    [MeasureDimension.Volume, 1000, MeasureUnit.Litre],
    [MeasureDimension.Volume, 250, MeasureUnit.Millilitre],
  ])('climbs to the bigger metric unit only from a whole one (%s, %p base)', (dimension, base, unit) => {
    expect(conversionTarget(UnitSystem.Metric, dimension, base)).toBe(unit);
  });

  it.each([
    [MeasureDimension.Volume, 60, MeasureUnit.Cup],
    [MeasureDimension.Volume, 59, MeasureUnit.Tablespoon],
    [MeasureDimension.Volume, 15, MeasureUnit.Tablespoon],
    [MeasureDimension.Volume, 10, MeasureUnit.Teaspoon],
    [MeasureDimension.Mass, 453.592, MeasureUnit.Pound],
    [MeasureDimension.Mass, 400, MeasureUnit.Ounce],
  ])('picks the imperial unit a cook would write (%s, %p base)', (dimension, base, unit) => {
    expect(conversionTarget(UnitSystem.Imperial, dimension, base)).toBe(unit);
  });

  it('falls to the smallest rung for an amount below every threshold', () => {
    expect(conversionTarget(UnitSystem.Imperial, MeasureDimension.Volume, 1)).toBe(MeasureUnit.Teaspoon);
    expect(conversionTarget(UnitSystem.Metric, MeasureDimension.Mass, 0.5)).toBe(MeasureUnit.Gram);
  });

  it('never converts a count, or anything when the original units are wanted', () => {
    expect(conversionTarget(UnitSystem.Metric, MeasureDimension.Count, 3)).toBeNull();
    expect(conversionTarget(UnitSystem.Original, MeasureDimension.Mass, 1000)).toBeNull();
  });
});
