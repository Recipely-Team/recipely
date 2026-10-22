import { CharConstants, ValueConstants } from '@core/constants';

/** One CLDR plural category — the key `pluralCount` reads from a locale's forms. */
type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/** CLDR's integer boundaries for the rules below, by the language that reads them. */
const CLDR = {
  ten: 10,
  hundred: 100,
  million: 1_000_000,
  ruFew: { low: 2, high: 4 },
  ruTeens: { low: 11, high: 14 },
  ruFewTeens: { low: 12, high: 14 },
  arFew: { low: 3, high: 10 },
  arMany: { low: 11, high: 99 },
} as const;

const { zero, one, two } = ValueConstants;

const within = (value: number, range: { low: number; high: number }): boolean =>
  value >= range.low && value <= range.high;

/** `es` / `fr` / `it` / `pt` say "many" for an exact non-zero number of millions ("1 million de recettes"). */
const millions = (n: number): boolean => n !== zero && n % CLDR.million === zero;

const oneIfOne = (n: number): PluralCategory => (n === one ? 'one' : 'other');
const oneIfZeroOrOne = (n: number): PluralCategory => (n === zero || n === one ? 'one' : 'other');
const withMillions = (base: (n: number) => PluralCategory) => (n: number): PluralCategory =>
  base(n) === 'one' ? 'one' : millions(n) ? 'many' : 'other';

const russian = (n: number): PluralCategory => {
  const last = n % CLDR.ten;
  const lastTwo = n % CLDR.hundred;
  if (last === one && lastTwo !== CLDR.ruTeens.low) return 'one';
  if (within(last, CLDR.ruFew) && !within(lastTwo, CLDR.ruFewTeens)) return 'few';
  return 'many';
};

const arabic = (n: number): PluralCategory => {
  if (n === zero) return 'zero';
  if (n === one) return 'one';
  if (n === two) return 'two';
  const lastTwo = n % CLDR.hundred;
  if (within(lastTwo, CLDR.arFew)) return 'few';
  if (within(lastTwo, CLDR.arMany)) return 'many';
  return 'other';
};

const RULES: Readonly<Record<string, (n: number) => PluralCategory>> = {
  en: oneIfOne,
  de: oneIfOne,
  tr: oneIfOne,
  hi: oneIfZeroOrOne,
  es: withMillions(oneIfOne),
  it: withMillions(oneIfOne),
  fr: withMillions(oneIfZeroOrOne),
  pt: withMillions(oneIfZeroOrOne),
  ru: russian,
  ar: arabic,
};

/**
 * The CLDR cardinal plural category of a whole, non-negative `n` in `locale`
 * (its base language; `id`, `ja`, `ko`, `zh` and anything unknown are `other`).
 *
 * @remarks
 * - **Why not `Intl.PluralRules`**: Hermes, the engine of the iOS and Android
 *   builds, ships only `Intl.Collator`, `DateTimeFormat` and `NumberFormat`.
 *   The constructor threw on the recipe feed and v1.4.0 opened on the crash
 *   screen on both phones; browsers and Jest's Node have it, so nothing short
 *   of a native build saw it (`check:structure` rule AU). These are CLDR's own
 *   integer rules for the 14 app languages, held equal to Node's ICU by the test.
 */
export const pluralCategory = (locale: string, n: number): PluralCategory =>
  (RULES[locale.split(CharConstants.dash)[zero]] ?? (() => 'other'))(n);
