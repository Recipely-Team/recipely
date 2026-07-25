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
 */
export const LocaleConstants = {
  en: 'en',
  tr: 'tr',
} as const;
