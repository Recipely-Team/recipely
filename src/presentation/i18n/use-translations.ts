import type { TranslationsType } from '@presentation/i18n/translations';
import { translationsFor } from '@presentation/i18n/i18n';
import { useLocale } from '@presentation/i18n/use-locale';

/**
 * The catalogue in the language the user chose, re-read when they choose another.
 *
 * @remarks
 * - **The language is state, so it is read as state.** It subscribes through
 *   {@link useLocale}; the catalogue it returns is a different object for each
 *   language and the same object otherwise, so a switch re-renders exactly the
 *   components that show text, and the React Compiler's caches key on it.
 * - **Pure helpers take the catalogue as a parameter** rather than reading it
 *   themselves: a helper that read the language on its own would be cached on
 *   its other arguments and keep the old language.
 */
export const useTranslations = (): TranslationsType => translationsFor(useLocale());
