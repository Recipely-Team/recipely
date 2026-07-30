import { getLocale } from '@presentation/i18n/i18n';
import { LocaleConstants } from '@application/i18n/locale-constants';

/** The two letters whose uppercase form is language-specific in Turkish. */
const TURKISH_UPPERCASE = [
  { lower: 'i', upper: 'İ' },
  { lower: 'ı', upper: 'I' },
] as const;

/**
 * Uppercases a user-facing string the way the ACTIVE language does.
 *
 * Neither `String.toUpperCase()` nor `textTransform: 'uppercase'` knows about
 * the Turkish dotted/dotless i, so both render "Beğeni" as "BEĞENI" — a word
 * that does not exist in Turkish, and the first thing a native reader notices.
 * The two letters that differ are mapped before the generic uppercase runs;
 * every other language keeps the default mapping.
 *
 * Use this instead of `textTransform` on any label built from `t()`: the style
 * property is applied by the platform, which does not know the app's language
 * (and on iOS ignores the device's locale for this mapping anyway).
 */
export const upperCase = (value: string): string => {
  if (getLocale() !== LocaleConstants.tr) return value.toUpperCase();
  return TURKISH_UPPERCASE.reduce(
    (text, { lower, upper }) => text.split(lower).join(upper),
    value,
  ).toUpperCase();
};
