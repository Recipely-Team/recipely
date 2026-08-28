import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolve-taxonomy-key';
import { Difficulty, DIFFICULTY_VALUES } from '@domain/recipes/difficulty';
import { SortKey } from '@presentation/app/recipes/model/sorting/sort-key';

/**
 * Two reports, one cause: the feed matched a spoken word against the MACHINE
 * vocabulary and nothing else.
 *
 * - "Orta zorlukta bir filtre de bulamadım" — said with the Orta chip on
 *   screen. `machineUpper('Orta')` is `'ORTA'`, and the enum holds `'MEDIUM'`.
 * - "Maalesef puana göre sıralayamıyorum" — said by a screen holding a
 *   `rating` sort whose label is the phrase the user had just spoken.
 *
 * Both denied a capability the app has. These pin the label side of each
 * vocabulary; the enum side never stopped working.
 */
describe('a spoken word reaches the filter it names', () => {
  const difficulties = (labels: Record<Difficulty, string>) =>
    DIFFICULTY_VALUES.map((d) => ({ key: d, name: labels[d] }));

  const TR_DIFFICULTY: Record<Difficulty, string> = {
    [Difficulty.Easy]: 'Kolay',
    [Difficulty.Medium]: 'Orta',
    [Difficulty.Hard]: 'Zor',
  };

  it('finds MEDIUM from the Turkish word on the chip', () => {
    expect(resolveTaxonomyKey(difficulties(TR_DIFFICULTY), 'Orta')).toBe(Difficulty.Medium);
    expect(resolveTaxonomyKey(difficulties(TR_DIFFICULTY), 'orta zorlukta')).toBe(Difficulty.Medium);
  });

  it('finds EASY and HARD the same way', () => {
    expect(resolveTaxonomyKey(difficulties(TR_DIFFICULTY), 'kolay olsun')).toBe(Difficulty.Easy);
    expect(resolveTaxonomyKey(difficulties(TR_DIFFICULTY), 'Zor')).toBe(Difficulty.Hard);
  });

  const TR_SORT: Record<SortKey, string> = {
    [SortKey.Popular]: 'Popüler',
    [SortKey.Rating]: 'En yüksek puan',
    [SortKey.Time]: 'Süre',
    [SortKey.Newest]: 'En yeni',
    [SortKey.MostLiked]: 'En çok beğenilen',
  };

  const sorts = (Object.values(SortKey) as SortKey[]).map((key) => ({ key, name: TR_SORT[key] }));

  it('finds the rating sort from what the user said out loud', () => {
    expect(resolveTaxonomyKey(sorts, 'En yüksek puanlı olarak sıralama')).toBe(SortKey.Rating);
  });

  it('tells the sorts apart, including the two that both start with "En"', () => {
    expect(resolveTaxonomyKey(sorts, 'en yeni tarifler')).toBe(SortKey.Newest);
    expect(resolveTaxonomyKey(sorts, 'en çok beğenilen')).toBe(SortKey.MostLiked);
    expect(resolveTaxonomyKey(sorts, 'popüler')).toBe(SortKey.Popular);
  });
});
