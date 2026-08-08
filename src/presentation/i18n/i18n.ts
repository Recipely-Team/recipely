import { ar } from '@presentation/i18n/locales/ar';
import { de } from '@presentation/i18n/locales/de';
import { en } from '@presentation/i18n/locales/en';
import { es } from '@presentation/i18n/locales/es';
import { fr } from '@presentation/i18n/locales/fr';
import { id } from '@presentation/i18n/locales/id';
import { it } from '@presentation/i18n/locales/it';
import { ja } from '@presentation/i18n/locales/ja';
import { pt } from '@presentation/i18n/locales/pt';
import { ru } from '@presentation/i18n/locales/ru';
import { tr } from '@presentation/i18n/locales/tr';
import type { Translations } from '@presentation/i18n/translations';
import { getLocaleService } from '@application/i18n/get-locale-service';

/**
 * Every catalogue the app can render.
 *
 * `ar` is present and complete but deliberately NOT in `LocaleConstants`: the
 * app has no RTL layout yet, and Arabic laid out left-to-right is harder to
 * read than English. The translation waits here for the day the layout lands.
 */
const translations: Record<string, Translations> = { en, tr, es, pt, fr, de, it, ru, id, ja, ar };

/**
 * Presentation-side view of the app's language. The state itself lives in the
 * application-layer `LocaleService` — the single source of truth it shares with
 * the `Accept-Language` header — so what the user reads and what the backend is
 * asked for can never drift apart.
 */
export const t = (): Translations => {
  return translations[getLocaleService().getLocale()] ?? en;
};

/**
 * Restores the persisted language choice. Awaited during bootstrap before the
 * first request goes out, so a saved preference always beats the device
 * language seed.
 */
export const hydrateLocale = (): Promise<void> => getLocaleService().hydrate();

/** Switches the active locale and persists the choice across app restarts. */
export const setLocale = (lang: string): void => {
  getLocaleService().setLocale(lang);
};

export const getLocale = (): string => getLocaleService().getLocale();

/** Subscribes to locale changes (for `useSyncExternalStore`). */
export const subscribeLocale = (listener: () => void): (() => void) =>
  getLocaleService().subscribe(listener);

/** Current locale snapshot (for `useSyncExternalStore`). */
export const getLocaleSnapshot = (): string => getLocaleService().getLocale();
