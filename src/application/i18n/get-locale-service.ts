import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { LocaleService } from '@application/i18n/locale-service';
import { noopKeyValueStore } from '@application/storage/noop-key-value-store';
import { DEFAULT_LOCALE } from '@application/i18n/supported-locales';

/**
 * Detached service used only when no composition root has run (unit tests that
 * mount UI without DI). It never persists and always starts at the default
 * locale — the real service is registered before the app's UI mounts.
 */
let fallback: LocaleService | null = null;

/**
 * Resolves the app-wide {@link LocaleService} — the one place any layer may read
 * the active language from.
 */
export const getLocaleService = (): LocaleService => {
  if (container.has(TOKENS.LocaleService)) {
    return container.resolve<LocaleService>(TOKENS.LocaleService);
  }
  fallback ??= new LocaleService(noopKeyValueStore, { getDeviceLocale: () => DEFAULT_LOCALE });
  return fallback;
};
