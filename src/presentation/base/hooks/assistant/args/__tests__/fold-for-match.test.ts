import { foldForMatch } from '@presentation/base/hooks/assistant/args/fold-for-match';

/**
 * "Asistan mutfak seçemiyor." `'İtalyan'.toLowerCase()` is an `i` followed by a
 * COMBINING DOT ABOVE — eight code points where the spoken "italyan" is seven —
 * so the taxonomy lookup answered `unknown_cuisine` for a cuisine printed on
 * the screen in front of the user. Every name beginning with İ was affected.
 */
describe('foldForMatch', () => {
  it('matches a spoken "italyan" to the İtalyan on screen', () => {
    // The exact failure: these differ under toLowerCase and must not here.
    expect('İtalyan'.toLowerCase()).not.toBe('italyan');
    expect(foldForMatch('İtalyan')).toBe(foldForMatch('italyan'));
  });

  it.each([
    ['İspanyol', 'ispanyol'],
    ['Türk', 'turk'],
    ['Çin', 'cin'],
    ['Yoğurt', 'yogurt'],
    ['Şiş Kebap', 'sis kebap'],
    ['Akdeniz', 'AKDENİZ'],
  ])('folds %s and %s to the same thing', (screen, spoken) => {
    expect(foldForMatch(screen)).toBe(foldForMatch(spoken));
  });

  it('folds the mirror case a Turkish device produces', () => {
    // toLocaleLowerCase on a tr device gives a DOTLESS ı here — the bug rowAt had.
    expect(foldForMatch('Italian')).toBe(foldForMatch('ıtalian'));
  });

  it('keeps genuinely different names apart', () => {
    expect(foldForMatch('Türk')).not.toBe(foldForMatch('Çin'));
    expect(foldForMatch('Hint')).not.toBe(foldForMatch('Hindi'));
  });

  it('trims, so a trailing space from speech does not miss', () => {
    expect(foldForMatch('  Türk  ')).toBe('turk');
  });
});
