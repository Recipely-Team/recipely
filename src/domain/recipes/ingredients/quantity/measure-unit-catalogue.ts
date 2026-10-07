import { MeasureDimension, type MeasureDimensionType } from '@domain/recipes/ingredients/quantity/measure-dimension';
import { MeasureUnit, type MeasureUnitType } from '@domain/recipes/ingredients/quantity/measure-unit';

/**
 * The ONE place a unit's worth and spellings live.
 *
 * @remarks
 * - **Household Turkish measures** are the values Turkish recipe books state:
 *   a water glass 200 ml, a tea glass 100 ml, a coffee cup 75 ml, a dessert
 *   spoon 10 ml. They are conventions, not standards; change them here only.
 * - **US measures** use the labelling cup (240 ml) and its 15 / 5 ml spoons;
 *   mass uses the exact avoirdupois ounce and pound.
 * - **`base`** is grams (mass) or millilitres (volume) in one unit; `null`
 *   marks a count unit, which scales but never converts.
 * - **`fraction`** says the amount reads as ½ / ¼ rather than 0.5 — kitchen
 *   measures do, metric ones do not.
 * - **`aliases`** are lowercase spellings, Turkish and English, with and
 *   without diacritics; the first is the name a converted amount is shown in.
 */
const MILLILITRES = {
  millilitre: 1,
  litre: 1000,
  cup: 240,
  tablespoon: 15,
  teaspoon: 5,
  fluidOunce: 29.5735,
  waterGlass: 200,
  teaGlass: 100,
  coffeeCup: 75,
  dessertSpoon: 10,
} as const;

const GRAMS = { gram: 1, kilogram: 1000, ounce: 28.3495, pound: 453.592 } as const;

interface MeasureUnitDefinition {
  dimension: MeasureDimensionType;
  base: number | null;
  fraction: boolean;
  /** How a converted amount names the unit, singular and plural. */
  one: string;
  other: string;
  aliases: readonly string[];
}

const unit = (
  dimension: MeasureDimensionType,
  base: number | null,
  fraction: boolean,
  aliases: readonly [string, ...string[]],
  plural?: string,
): MeasureUnitDefinition => {
  const [one] = aliases;
  return { dimension, base, fraction, one, other: plural ?? one, aliases };
};

const { Mass, Volume, Count } = MeasureDimension;

export const MEASURE_UNITS: Readonly<Record<MeasureUnitType, MeasureUnitDefinition>> = {
  [MeasureUnit.Gram]: unit(Mass, GRAMS.gram, false, ['g', 'gr', 'gram', 'grams']),
  [MeasureUnit.Kilogram]: unit(Mass, GRAMS.kilogram, false, ['kg', 'kilo', 'kilogram', 'kilograms']),
  [MeasureUnit.Millilitre]: unit(Volume, MILLILITRES.millilitre, false, ['ml', 'mililitre', 'millilitre', 'milliliter', 'millilitres', 'milliliters']),
  [MeasureUnit.Litre]: unit(Volume, MILLILITRES.litre, false, ['l', 'lt', 'litre', 'liter', 'litres', 'liters']),
  [MeasureUnit.Cup]: unit(Volume, MILLILITRES.cup, true, ['cup', 'cups'], 'cups'),
  [MeasureUnit.Tablespoon]: unit(Volume, MILLILITRES.tablespoon, true, ['tbsp', 'tbs', 'tablespoon', 'tablespoons', 'yemek kaşığı', 'yemek kasigi', 'yk', 'y.k']),
  [MeasureUnit.Teaspoon]: unit(Volume, MILLILITRES.teaspoon, true, ['tsp', 'teaspoon', 'teaspoons', 'çay kaşığı', 'cay kasigi', 'çk', 'ç.k']),
  [MeasureUnit.FluidOunce]: unit(Volume, MILLILITRES.fluidOunce, true, ['fl oz', 'fl. oz', 'fluid ounce', 'fluid ounces']),
  [MeasureUnit.Ounce]: unit(Mass, GRAMS.ounce, true, ['oz', 'ounce', 'ounces']),
  [MeasureUnit.Pound]: unit(Mass, GRAMS.pound, true, ['lb', 'lbs', 'pound', 'pounds']),
  [MeasureUnit.WaterGlass]: unit(Volume, MILLILITRES.waterGlass, true, ['su bardağı', 'su bardagi', 'sb', 's.b', 'bardak']),
  [MeasureUnit.TeaGlass]: unit(Volume, MILLILITRES.teaGlass, true, ['çay bardağı', 'cay bardagi']),
  [MeasureUnit.CoffeeCup]: unit(Volume, MILLILITRES.coffeeCup, true, ['kahve fincanı', 'kahve fincani', 'fincan']),
  [MeasureUnit.DessertSpoon]: unit(Volume, MILLILITRES.dessertSpoon, true, ['tatlı kaşığı', 'tatli kasigi', 'tk', 't.k']),
  [MeasureUnit.Piece]: unit(Count, null, true, ['adet', 'tane', 'piece', 'pieces', 'pcs']),
  [MeasureUnit.Clove]: unit(Count, null, true, ['diş', 'dis', 'clove', 'cloves']),
  [MeasureUnit.Bunch]: unit(Count, null, true, ['demet', 'bunch', 'bunches']),
  [MeasureUnit.Pinch]: unit(Count, null, true, ['tutam', 'pinch', 'pinches']),
  [MeasureUnit.Pack]: unit(Count, null, true, ['paket', 'pack', 'packs', 'package', 'packages', 'packet', 'packets']),
};
