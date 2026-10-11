import { getLocale } from '@presentation/i18n/i18n';

/** One string per CLDR plural category, each with `{n}`; every locale lists all six so the parity tests hold. */
interface PluralForms {
  readonly zero: string;
  readonly one: string;
  readonly two: string;
  readonly few: string;
  readonly many: string;
  readonly other: string;
}

/**
 * "{n} recipes" in the ACTIVE language, with the plural form that language
 * wants for `n` (`Intl.PluralRules`) and the number where that language puts it.
 *
 * @remarks
 * - **Why**: "{count} {word}" concatenation said "1 results" in English and
 *   picked one fixed form in Russian and Arabic, which have three to six.
 */
export const pluralCount = (forms: PluralForms, n: number): string =>
  forms[new Intl.PluralRules(getLocale()).select(n)].replace('{n}', String(n));
