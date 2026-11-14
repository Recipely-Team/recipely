import { createContext } from 'react';

/**
 * The language a part of the screen previews, or `null` for the app's own language.
 *
 * @remarks
 * - **Scoped, so the saved language never moves.** A dev-only picker provides a
 *   value over one screen; the rest of the app keeps the language the user chose.
 * - **Read by `useTranslations` alone.** A component that reads the global `t()`
 *   or `useLocale()` directly keeps the app's language, so a preview covers
 *   everything that renders through the translations hook.
 */
export const LocalePreviewContext = createContext<string | null>(null);
