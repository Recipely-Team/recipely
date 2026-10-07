import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import { MeasureUnit } from '@domain/recipes/ingredients/quantity/measure-unit';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';

/**
 * Portion scaling and unit conversion on real recipe lines, Turkish and
 * English. The rule every case leans on: a line is only rewritten when it has
 * an amount the parser read with certainty — anything else comes back exactly
 * as the author wrote it, because an invented amount is worse than none.
 */

const scaled = (raw: string, factor: number): string => IngredientLine.of(raw).scaled(factor).toText();
const converted = (raw: string, system: (typeof UnitSystem)[keyof typeof UnitSystem], factor = 1): string =>
  IngredientLine.of(raw).scaled(factor).inSystem(system).toText();

describe('reading the amount', () => {
  it.each([
    ['2 su bardağı un', 2, MeasureUnit.WaterGlass, 'un'],
    ['1 1/2 cup milk', 1.5, MeasureUnit.Cup, 'milk'],
    ['200 g tavuk göğsü', 200, MeasureUnit.Gram, 'tavuk göğsü'],
    ['1,5 kg patates', 1.5, MeasureUnit.Kilogram, 'patates'],
    ['0.5 l water', 0.5, MeasureUnit.Litre, 'water'],
    ['½ çay kaşığı tuz', 0.5, MeasureUnit.Teaspoon, 'tuz'],
    ['1½ tbsp olive oil', 1.5, MeasureUnit.Tablespoon, 'olive oil'],
    ['¾ kahve fincanı süt', 0.75, MeasureUnit.CoffeeCup, 'süt'],
    ['1 tutam tuz', 1, MeasureUnit.Pinch, 'tuz'],
    ['3 diş sarımsak', 3, MeasureUnit.Clove, 'sarımsak'],
    ['1 paket kabartma tozu', 1, MeasureUnit.Pack, 'kabartma tozu'],
    ['2 tatlı kaşığı şeker', 2, MeasureUnit.DessertSpoon, 'şeker'],
    ['8 fl oz cream', 8, MeasureUnit.FluidOunce, 'cream'],
    ['1 lb beef', 1, MeasureUnit.Pound, 'beef'],
    ['3 yumurta', 3, null, 'yumurta'],
  ])('%s', (raw, amount, unit, name) => {
    const line = IngredientLine.of(raw);
    expect(line.quantity?.amount).toBeCloseTo(amount);
    expect(line.quantity?.unit ?? null).toBe(unit);
    expect(line.split().name).toBe(name);
  });

  it('reads a range as one quantity with two ends', () => {
    const quantity = IngredientLine.of('2-3 diş sarımsak').quantity;
    expect([quantity?.amount, quantity?.upTo]).toEqual([2, 3]);
  });

  it('takes no unit out of a word that only starts like one', () => {
    // "lemons" opens with "l", "glasses" with "g": neither is litres or grams.
    expect(IngredientLine.of('2 lemons').quantity?.unit).toBeNull();
    expect(IngredientLine.of('2 glasses water').quantity?.unit).toBeNull();
  });
});

describe('scaling a line', () => {
  // "1.000 gr" read as 1 became "2 gr" at double servings: a grouped amount is ambiguous, so it is left alone.
  it('never scales an amount written with a thousands separator', () => {
    expect(scaled('1.000 gr un', 2)).toBe('1.000 gr un');
    expect(scaled('1,000 ml water', 2)).toBe('1,000 ml water');
    expect(converted('1.000 g flour', UnitSystem.Imperial)).toBe('1.000 g flour');
  });

  it('keeps the unit as written and rewrites only the amount', () => {
    expect(scaled('2 su bardağı un', 1.5)).toBe('3 su bardağı un');
    expect(scaled('200 g tavuk göğsü', 2)).toBe('400 g tavuk göğsü');
    expect(scaled('1 tutam tuz', 2)).toBe('2 tutam tuz');
  });

  it('writes a kitchen measure as a fraction, not a decimal', () => {
    expect(scaled('1 su bardağı süt', 0.5)).toBe('½ su bardağı süt');
    expect(scaled('1 1/2 cup milk', 0.5)).toBe('¾ cup milk');
    expect(scaled('3 yumurta', 1.5)).toBe('4½ yumurta');
  });

  it('pluralises an English unit it rewrites', () => {
    expect(scaled('1 cup milk', 2)).toBe('2 cups milk');
    expect(scaled('2 cups milk', 0.5)).toBe('1 cup milk');
  });

  it('keeps the decimal mark the recipe used', () => {
    expect(scaled('1,5 kg patates', 1.5)).toBe('2,25 kg patates');
    expect(scaled('1.5 kg potatoes', 1.5)).toBe('2.25 kg potatoes');
  });

  it('scales both ends of a range', () => {
    expect(scaled('2-3 diş sarımsak', 2)).toBe('4-6 diş sarımsak');
  });

  it('returns a line with no amount unchanged', () => {
    expect(scaled('tuz', 3)).toBe('tuz');
    expect(scaled('Tuz, karabiber', 3)).toBe('Tuz, karabiber');
  });

  it('returns a group heading unchanged', () => {
    expect(scaled('# Şerbet', 2)).toBe('# Şerbet');
    expect(scaled('For the caramel:', 2)).toBe('For the caramel:');
  });

  it('returns the original text byte for byte at factor 1', () => {
    expect(scaled('  2 yk.  tereyağı ', 1)).toBe('  2 yk.  tereyağı ');
  });

  it('ignores a factor that is not a positive number', () => {
    expect(scaled('2 su bardağı un', 0)).toBe('2 su bardağı un');
    expect(scaled('2 su bardağı un', Number.NaN)).toBe('2 su bardağı un');
  });
});

describe('converting a line', () => {
  it('turns Turkish household measures into millilitres through the documented constants', () => {
    expect(converted('2 su bardağı un', UnitSystem.Metric)).toBe('400 ml un');
    expect(converted('1 yemek kaşığı yağ', UnitSystem.Metric)).toBe('15 ml yağ');
    expect(converted('1 çay kaşığı tuz', UnitSystem.Metric)).toBe('5 ml tuz');
    expect(converted('1 kahve fincanı süt', UnitSystem.Metric)).toBe('75 ml süt');
  });

  it('moves up to kilograms and litres when the amount fills one', () => {
    expect(converted('750 g un', UnitSystem.Metric, 2)).toBe('1.5 kg un');
    expect(converted('5 su bardağı su', UnitSystem.Metric)).toBe('1 l su');
  });

  it('turns US measures into metric', () => {
    expect(converted('1 cup milk', UnitSystem.Metric)).toBe('240 ml milk');
    expect(converted('1 lb beef', UnitSystem.Metric)).toBe('454 g beef');
    expect(converted('2 oz butter', UnitSystem.Metric)).toBe('56.7 g butter');
  });

  it('turns metric into US measures', () => {
    expect(converted('240 ml süt', UnitSystem.Imperial)).toBe('1 cup süt');
    expect(converted('30 ml oil', UnitSystem.Imperial)).toBe('2 tbsp oil');
    expect(converted('5 ml vanilla', UnitSystem.Imperial)).toBe('1 tsp vanilla');
    expect(converted('1 kg beef', UnitSystem.Imperial)).toBe('2¼ lb beef');
    expect(converted('100 g cheese', UnitSystem.Imperial)).toBe('3½ oz cheese');
  });

  it('never gives a count unit or a bare count a weight', () => {
    expect(converted('1 tutam tuz', UnitSystem.Metric)).toBe('1 tutam tuz');
    expect(converted('3 yumurta', UnitSystem.Imperial)).toBe('3 yumurta');
  });

  it('leaves the original units alone in Original mode', () => {
    expect(converted('2 su bardağı un', UnitSystem.Original)).toBe('2 su bardağı un');
  });
});
