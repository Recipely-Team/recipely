import { pluralCount, setLocale, t } from '@presentation/i18n';

describe('pluralCount', () => {
  afterEach(() => setLocale('en'));

  // --- regression: "{count} {word}" said "1 results" and used one fixed form in Russian.
  it('picks the plural form the language wants for the number', () => {
    setLocale('en');
    expect(pluralCount(t().recipes.resultsCount, 1)).toBe('1 recipe');
    expect(pluralCount(t().recipes.resultsCount, 30)).toBe('30 recipes');
    setLocale('ru');
    expect(pluralCount(t().recipes.resultsCount, 1)).toBe('1 рецепт');
    expect(pluralCount(t().recipes.resultsCount, 3)).toBe('3 рецепта');
    expect(pluralCount(t().recipes.resultsCount, 5)).toBe('5 рецептов');
  });

  it('keeps the noun singular after a number where the language does', () => {
    setLocale('tr');
    expect(pluralCount(t().recipes.resultsCount, 4)).toBe('4 tarif');
  });
});
