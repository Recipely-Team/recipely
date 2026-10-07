import { Quantity } from '@domain/recipes/ingredients/quantity/quantity';
import { MeasureUnit } from '@domain/recipes/ingredients/quantity/measure-unit';
import { parseAmount } from '@domain/recipes/ingredients/quantity/parse-amount';
import { formatAmount } from '@domain/recipes/ingredients/quantity/format-amount';

const quantity = (amount: number, unit: (typeof MeasureUnit)[keyof typeof MeasureUnit] | null = null, upTo: number | null = null): Quantity => {
  const result = Quantity.create(amount, unit, upTo);
  if (!result.ok) throw new Error(result.failure.message);
  return result.value;
};

describe('Quantity.create', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('refuses the amount %p', (amount) => {
    expect(Quantity.create(amount).ok).toBe(false);
  });

  it('refuses a range that does not climb', () => {
    expect(Quantity.create(3, null, 2).ok).toBe(false);
    expect(Quantity.create(3, null, 3).ok).toBe(false);
  });
});

describe('Quantity', () => {
  it('scales both ends and keeps its unit', () => {
    const scaled = quantity(2, MeasureUnit.Clove, 3).scale(2);
    expect([scaled.amount, scaled.upTo, scaled.unit]).toEqual([4, 6, MeasureUnit.Clove]);
  });

  it('converts within a dimension only', () => {
    expect(quantity(1, MeasureUnit.WaterGlass).toMetric().toText('.')).toBe('200 ml');
    expect(quantity(2, MeasureUnit.Piece).toMetric().unit).toBe(MeasureUnit.Piece);
  });

  it('round-trips a cup through metric and back', () => {
    expect(quantity(1, MeasureUnit.Cup).toMetric().toImperial().toText('.')).toBe('1 cup');
  });

  it('chooses a quarter cup over four tablespoons', () => {
    expect(quantity(60, MeasureUnit.Millilitre).toImperial().toText('.')).toBe('¼ cup');
  });

  it('compares by value', () => {
    expect(quantity(2, MeasureUnit.Gram).equals(quantity(2, MeasureUnit.Gram))).toBe(true);
    expect(quantity(2, MeasureUnit.Gram).equals(quantity(2, MeasureUnit.Kilogram))).toBe(false);
  });
});

describe('parseAmount', () => {
  it.each([
    ['2 un', 2, null],
    ['1,5 kg', 1.5, null],
    ['1.5 kg', 1.5, null],
    ['1/2 cup', 0.5, null],
    ['1 1/2 cup', 1.5, null],
    ['½ limon', 0.5, null],
    ['⅓ cup', 1 / 3, null],
    ['1½ cup', 1.5, null],
    ['2-3 diş', 2, 3],
    ['2 – 3 diş', 2, 3],
  ])('%s', (text, amount, upTo) => {
    const parsed = parseAmount(text);
    expect(parsed?.amount).toBeCloseTo(amount);
    expect(parsed?.upTo ?? null).toBe(upTo);
  });

  it.each(['tuz', '0 g', '1/0 cup', ''])('reads no amount in %p', (text) => {
    expect(parseAmount(text)).toBeNull();
  });

  it('keeps a falling "range" to its first amount', () => {
    expect(parseAmount('3-2 eggs')).toEqual({ amount: 3, upTo: null, length: 1 });
  });
});

describe('formatAmount', () => {
  it.each([
    [0.5, true, '½'],
    [1.25, true, '1¼'],
    [2.0001, true, '2'],
    [0.98, true, '1'],
    [0.83, true, '0.83'],
    [7.5, false, '7.5'],
    [42.46, false, '42.5'],
    [454.4, false, '454'],
  ])('%p (fraction %p) reads as %s', (value, asFraction, text) => {
    expect(formatAmount(value, asFraction, '.')).toBe(text);
  });

  it('writes the decimal with the mark it is given', () => {
    expect(formatAmount(2.25, false, ',')).toBe('2,25');
  });
});
