import { pluralCategory } from '@presentation/i18n/plural-category';
import { pluralCount, setLocale, t } from '@presentation/i18n';

const LANGUAGES = ['en', 'tr', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'ar', 'hi', 'id', 'ja', 'ko', 'zh'];
const SAMPLES = [
  ...Array.from({ length: 1201 }, (_, i) => i),
  1_000_000, 1_000_001, 2_000_000, 3_000_011, 10_000_000,
];

describe('pluralCategory', () => {
  // Node's ICU is the reference; the app cannot use it on the phone (Hermes).
  it.each(LANGUAGES)('agrees with CLDR for every sampled count in %s', (language) => {
    const icu = new Intl.PluralRules(language);
    const mismatches = SAMPLES.filter((n) => pluralCategory(language, n) !== icu.select(n));

    expect(mismatches).toEqual([]);
  });

  it('reads the base language of a regional tag, and says "other" for one it does not know', () => {
    expect(pluralCategory('pt-BR', 1)).toBe('one');
    expect(pluralCategory('xx', 1)).toBe('other');
  });
});

describe('pluralCount without Intl.PluralRules', () => {
  const original = Intl.PluralRules;

  afterEach(() => {
    Object.defineProperty(Intl, 'PluralRules', { value: original, configurable: true, writable: true });
    setLocale('en');
  });

  // --- regression: v1.4.0 opened on the crash screen on iOS and Android — Hermes has no Intl.PluralRules.
  it('still counts on an engine without it, as Hermes is', () => {
    Object.defineProperty(Intl, 'PluralRules', { value: undefined, configurable: true, writable: true });

    expect(pluralCount(t().recipes.resultsCount, 1)).toBe('1 recipe');
    setLocale('ru');
    expect(pluralCount(t().recipes.resultsCount, 3)).toBe('3 рецепта');
  });
});
