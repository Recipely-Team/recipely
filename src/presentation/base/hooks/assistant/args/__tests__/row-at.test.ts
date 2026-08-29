import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';

const INGREDIENTS = ['2 yumurta', '200 g yoğurt', '1 tavuk göğsü', 'tuz'];

describe('rowAt', () => {
  it('finds a row by part of what it says', () => {
    expect(rowAt(INGREDIENTS, 'yoğurt')).toBe(1);
    expect(rowAt(INGREDIENTS, 'tavuk')).toBe(2);
  });

  it('finds a row by its 1-based position', () => {
    expect(rowAt(INGREDIENTS, '1')).toBe(0);
    expect(rowAt(INGREDIENTS, '4')).toBe(3);
  });

  // `parseInt('2 yumurta')` is 2. Matching on a leading number alone would read
  // "2 yumurta" as "row two" and quietly check off the yoghurt instead — the
  // wrong line, with nothing to tell the user it happened.
  it('does not read a leading number in a name as a position', () => {
    expect(rowAt(INGREDIENTS, '2 yumurta')).toBe(0);
    expect(rowAt(INGREDIENTS, '200 g yoğurt')).toBe(1);
  });

  it('ignores case and surrounding space', () => {
    expect(rowAt(INGREDIENTS, '  YOĞURT ')).toBe(1);
    expect(rowAt(INGREDIENTS, ' 3 ')).toBe(2);
  });

  it('answers null for a position outside the list', () => {
    expect(rowAt(INGREDIENTS, '0')).toBeNull();
    expect(rowAt(INGREDIENTS, '5')).toBeNull();
    expect(rowAt(INGREDIENTS, '-1')).toBeNull();
  });

  // Every caller turns null into a `not_found` the model says out loud. Acting
  // on the closest row instead is the one failure a user cannot see coming.
  it('answers null rather than guessing at a name that is not there', () => {
    expect(rowAt(INGREDIENTS, 'pizza')).toBeNull();
  });

  it('answers null for nothing at all', () => {
    expect(rowAt(INGREDIENTS, undefined)).toBeNull();
    expect(rowAt(INGREDIENTS, '')).toBeNull();
    expect(rowAt([], 'yoğurt')).toBeNull();
  });

  // A list with two yoghurts is one the speaker would disambiguate themselves;
  // silently picking the later one would be the surprising choice.
  it('takes the first match when several rows contain the word', () => {
    expect(rowAt(['yoğurtlu sos', 'süzme yoğurt'], 'yoğurt')).toBe(0);
  });
});
