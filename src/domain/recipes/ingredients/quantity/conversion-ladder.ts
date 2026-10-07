import { ValueConstants } from '@core/constants';
import { MeasureDimension, type MeasureDimensionType } from '@domain/recipes/ingredients/quantity/measure-dimension';
import { MeasureUnit, type MeasureUnitType } from '@domain/recipes/ingredients/quantity/measure-unit';
import { MEASURE_UNITS } from '@domain/recipes/ingredients/quantity/measure-unit-catalogue';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';

/**
 * The unit a converted amount is shown in: the largest of its system that the
 * amount fills at least `share` of.
 *
 * @remarks
 * - **Metric**: 1500 g reads as 1.5 kg, 750 ml stays 750 ml.
 * - **US**: a cup from a quarter cup up (¼ cup reads better than 4 tbsp),
 *   then tablespoons, then teaspoons; ounces below a pound.
 * - **No rung for a count unit or for `Original`**: the caller keeps the unit.
 */
const rung = (unit: MeasureUnitType, share: number = ValueConstants.one): { unit: MeasureUnitType; from: number } => ({
  unit,
  from: (MEASURE_UNITS[unit].base ?? ValueConstants.zero) * share,
});

/** A cup is the unit from a quarter cup up. */
const CUP_SHARE = { fromQuarter: 0.25 } as const;

const LADDERS: Readonly<Record<UnitSystemType, Partial<Record<MeasureDimensionType, readonly { unit: MeasureUnitType; from: number }[]>>>> = {
  [UnitSystem.Original]: {},
  [UnitSystem.Metric]: {
    [MeasureDimension.Mass]: [rung(MeasureUnit.Kilogram), rung(MeasureUnit.Gram)],
    [MeasureDimension.Volume]: [rung(MeasureUnit.Litre), rung(MeasureUnit.Millilitre)],
  },
  [UnitSystem.Imperial]: {
    [MeasureDimension.Mass]: [rung(MeasureUnit.Pound), rung(MeasureUnit.Ounce)],
    [MeasureDimension.Volume]: [rung(MeasureUnit.Cup, CUP_SHARE.fromQuarter), rung(MeasureUnit.Tablespoon), rung(MeasureUnit.Teaspoon)],
  },
};

export const conversionTarget = (
  system: UnitSystemType,
  dimension: MeasureDimensionType,
  baseAmount: number,
): MeasureUnitType | null => {
  const ladder = LADDERS[system][dimension];
  if (ladder === undefined) return null;
  return (ladder.find((step) => baseAmount >= step.from) ?? ladder.at(ValueConstants.minusOne))?.unit ?? null;
};
