import { CharConstants, ValueConstants } from '@core/constants';
import { LocaleConstants } from '@application/i18n/locale-constants';

/** Language codes the app ships translations for. Keep in sync with `@presentation/i18n`. */
export const SUPPORTED_LOCALES: readonly string[] = [LocaleConstants.en, LocaleConstants.tr];

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
