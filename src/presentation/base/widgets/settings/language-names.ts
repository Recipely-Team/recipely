import { LocaleConstants } from '@application/i18n/locale-constants';

/**
 * Each language written in ITSELF.
 *
 * @remarks
 * - **Never translated.** A picker that says "Spanish" in the app's current
 *   language is useless to the person who cannot read that language — which is
 *   exactly the person reaching for the picker. Every entry is the endonym, so
 *   the row a user wants is legible before they can read anything else.
 * - **Keyed by plain code, not by `LocaleConstants`.** Names may be written
 *   ahead of the catalogue that makes a language selectable; the picker only
 *   ever renders codes the app actually ships (`SUPPORTED_LOCALE_LIST`), so an
 *   entry with no catalogue yet is inert rather than a promise the app breaks.
 */
export const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  [LocaleConstants.en]: 'English',
  [LocaleConstants.tr]: 'Türkçe',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  ru: 'Русский',
  id: 'Bahasa Indonesia',
  ja: '日本語',
};
