import { parseIngredient } from '@presentation/app/recipes/[recipeId]/model/ingredients/parse-ingredient';

/**
 * The bug: an ingredient row showed the badge "3 yumurt" next to the name "a".
 * The unit part of the pattern is `{1,6}` letters and had nothing stopping it
 * at a word end, so it ate the first six letters of "yumurta" and left the
 * seventh behind as the ingredient.
 */

describe('parseIngredient', () => {
  it('does not take the head of a long word for a unit', () => {
    expect(parseIngredient('3 yumurta')).toEqual({ qty: '3', name: 'yumurta' });
  });

  it('still reads a unit written against the number', () => {
    expect(parseIngredient('200g pekan cevizi')).toEqual({ qty: '200g', name: 'pekan cevizi' });
  });

  it('still reads a unit written apart from the number', () => {
    expect(parseIngredient('150 ml glikoz')).toEqual({ qty: '150 ml', name: 'glikoz' });
  });

  it('keeps an abbreviated unit with its full stop', () => {
    expect(parseIngredient('2 yk. tereyağı')).toEqual({ qty: '2 yk.', name: 'tereyağı' });
  });

  it('reads a fraction as the amount', () => {
    expect(parseIngredient('½ limon')).toEqual({ qty: '½', name: 'limon' });
  });

  it('keeps the amount when the ingredient is short enough to look like a unit', () => {
    // "elma" is four letters, indistinguishable from a unit to the pattern.
    // Giving up on the whole line left short-named rows with no badge while
    // longer-named ones beside them kept theirs.
    expect(parseIngredient('3 elma')).toEqual({ qty: '3', name: 'elma' });
    expect(parseIngredient('2 soğan')).toEqual({ qty: '2', name: 'soğan' });
  });

  it('reads a range as the amount', () => {
    expect(parseIngredient('2-3 diş sarımsak')).toEqual({ qty: '2-3 diş', name: 'sarımsak' });
  });

  it('leaves a line with no amount alone', () => {
    expect(parseIngredient('tuz')).toEqual({ qty: '', name: 'tuz' });
  });

  it('does not split a line that is nothing but an amount', () => {
    // Splitting here would leave the name empty and the row unreadable.
    expect(parseIngredient('3')).toEqual({ qty: '', name: '3' });
  });

  it('returns empty for a blank line', () => {
    expect(parseIngredient('   ')).toEqual({ qty: '', name: '' });
  });

  it('handles a long word after the number in English too', () => {
    expect(parseIngredient('2 tomatoes')).toEqual({ qty: '2', name: 'tomatoes' });
  });
});
