import { CharConstants, ValueConstants } from '@core/constants';
import { LocaleConstants } from '@application/i18n/locale-constants';

/**
 * Language codes the app ships translations for.
 *
 * Derived from {@link LocaleConstants} rather than listed again: a hand-kept
 * second list is a list that eventually disagrees with the first, and the
 * failure is silent — an unlisted locale simply falls back to English forever.
 * `@presentation/i18n` holds the matching catalogue for each of these, and a
 * test asserts the two sides agree.
 */
const SUPPORTED_LOCALES: readonly string[] = Object.values(LocaleConstants);

/** The same list, exported for the language picker to render. */
export const SUPPORTED_LOCALE_LIST: readonly string[] = SUPPORTED_LOCALES;

/** Locale used when neither a stored preference nor the device language is supported. */
export const DEFAULT_LOCALE = LocaleConstants.en;

/**
 * Narrows an arbitrary language code (a device locale, a stored value) to a
 * supported one, falling back to {@link DEFAULT_LOCALE}. Region subtags are
 * dropped, so `tr-TR` resolves to `tr`.
 */
export const toSupportedLocale = (locale: string | null | undefined): string => {
  const languageCode =
    (locale ?? CharConstants.empty).trim().toLowerCase().split('-')[ValueConstants.zero] ??
    CharConstants.empty;
  return SUPPORTED_LOCALES.includes(languageCode) ? languageCode : DEFAULT_LOCALE;
};
