import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolve-taxonomy-key';

/**
 * "Bak, tema paletlerinden İnci Beyazı istiyorum." — answered with "o da listede
 * yok" while the İnci Beyazı swatch was on the screen the user was looking at.
 *
 * Two separate faults met here. `SetPreference` knew `language` and `theme`
 * (light/dark/system) and had no word for the palette at all — light-or-dark
 * and which-palette are two settings under one word in ordinary speech. And the
 * palette is chosen by the NAME on the swatch while the app stores an id, so
 * even once the word existed the lookup had to match what the user can read.
 */
const PALETTES = [
  { key: 'pearl', name: 'İnci Beyazı' },
  { key: 'ember', name: 'Kırmızı Kor' },
  { key: 'emerald', name: 'Zümrüt Bahçe' },
  { key: 'royal', name: 'Kraliyet Moru' },
];

describe('choosing a theme palette by the name on the swatch', () => {
  it('finds İnci Beyazı, whose lowercase carries a combining dot', () => {
    expect(resolveTaxonomyKey(PALETTES, 'İnci Beyazı')).toBe('pearl');
    expect(resolveTaxonomyKey(PALETTES, 'inci beyazi')).toBe('pearl');
  });

  it('finds one named inside the sentence the user actually says', () => {
    expect(resolveTaxonomyKey(PALETTES, 'tema paletlerinden Kraliyet Moru istiyorum')).toBe('royal');
  });

  it('still takes the stored id', () => {
    expect(resolveTaxonomyKey(PALETTES, 'emerald')).toBe('emerald');
  });

  it('declines a palette that is not offered', () => {
    expect(resolveTaxonomyKey(PALETTES, 'Gece Mavisi')).toBeNull();
  });
});
