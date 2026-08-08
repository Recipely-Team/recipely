/**
 * Locale codes the app ships translations for.
 *
 * The supported-locale list and the app default are derived from these in
 * `supported-locales.ts` next door; this is the single place a new language's
 * code is introduced.
 *
 * Lives in `application/`, not `core/`: which languages this product ships is a
 * decision about THIS app, not a reusable building block — the same reason the
 * DI token list sits in `application/di/` (see `architecture.md` §core).
 *
 * A code lands here in the SAME commit as its catalogue in `@presentation/i18n`,
 * never before: a locale listed without a catalogue is offered in the picker and
 * then silently renders English, which reads as a broken translation rather than
 * a missing one.
 */
export const LocaleConstants = {
  en: 'en',
  tr: 'tr',
  es: 'es',
  /** Written as Brazilian Portuguese — the larger market; `pt-BR` narrows to `pt`. */
  pt: 'pt',
  fr: 'fr',
  de: 'de',
  it: 'it',
  ru: 'ru',
  id: 'id',
  // Latin and Cyrillic only, deliberately. Everything else the app has been
  // translated into is listed in `preview-locales.ts` with the reason it is not
  // selectable yet — a complete catalogue is not the same as a screen that
  // renders it correctly, and nobody has read those on a device.
} as const;
