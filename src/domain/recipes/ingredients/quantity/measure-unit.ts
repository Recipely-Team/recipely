/**
 * Every unit an ingredient line's quantity can be read in.
 *
 * @remarks
 * - **Keys, not spellings.** How each one is written (in Turkish and English,
 *   with abbreviations) and what it is worth lives in `MEASURE_UNITS`.
 * - **Turkish household spoons share the US ones**: "yemek kaşığı" reads as
 *   `Tablespoon` and "çay kaşığı" as `Teaspoon`; the other household measures
 *   have keys of their own.
 */
export const MeasureUnit = {
  Gram: 'g',
  Kilogram: 'kg',
  Millilitre: 'ml',
  Litre: 'l',
  Cup: 'cup',
  Tablespoon: 'tbsp',
  Teaspoon: 'tsp',
  FluidOunce: 'floz',
  Ounce: 'oz',
  Pound: 'lb',
  WaterGlass: 'waterGlass',
  TeaGlass: 'teaGlass',
  CoffeeCup: 'coffeeCup',
  DessertSpoon: 'dessertSpoon',
  Piece: 'piece',
  Clove: 'clove',
  Bunch: 'bunch',
  Pinch: 'pinch',
  Pack: 'pack',
} as const;

export type MeasureUnitType = (typeof MeasureUnit)[keyof typeof MeasureUnit];
