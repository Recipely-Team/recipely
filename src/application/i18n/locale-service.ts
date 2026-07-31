import type { DeviceLocaleProviderInterface } from '@domain/i18n/device-locale-provider-interface';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { toSupportedLocale } from '@application/i18n/supported-locales';
import { LANGUAGE_STORAGE_KEY } from '@infrastructure/constants/storage';

/**
 * The single source of truth for the app's active language.
 *
 * Everything that needs a locale reads it from here: the UI translations, the
 * localized create/update payloads, and — through the HTTP client's
 * `localeProvider` — the `Accept-Language` header on every request. Nothing
 * else may read the device language or keep its own copy, otherwise a language
 * switch can leave one of them stale (the bug this class exists to prevent).
 *
 * Precedence is strictly: stored user choice > device language > default. The
 * device language is a synchronous seed so the first render has *something* to
 * show; it must never reach the backend. {@link hydrate} is what guarantees that
 * — every request awaits it, so a saved preference can never lose to the device
 * language.
 */
export class LocaleService {
  private current: string;
  private hydration: Promise<void> | null = null;
  private chosenByUser = false;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly store: KeyValueStoreInterface,
    deviceLocaleProvider: DeviceLocaleProviderInterface,
  ) {
    this.current = toSupportedLocale(deviceLocaleProvider.getDeviceLocale());
  }

  getLocale(): string {
    return this.current;
  }

  /**
   * Resolves once the persisted choice has been restored, starting the restore
   * on first call. Every request awaits this (through the HTTP client's async
   * `localeProvider`), which is what makes the saved language — not the device
   * seed — the one that reaches the backend, without any UI having to block on
   * it.
   */
  hydrate(): Promise<void> {
    this.hydration ??= this.restore();
    return this.hydration;
  }

  /**
   * Reads the persisted choice exactly once. A storage failure never rejects —
   * that would hang every request behind a rejected promise — it drops the
   * cached attempt instead, so the app keeps running on the device seed and the
   * next request retries the read.
   *
   * A restore still in flight when the user picks a language loses to that
   * choice: applying the stored value afterwards would silently undo it.
   */
  private async restore(): Promise<void> {
    try {
      const stored = await this.store.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === null || this.chosenByUser) return;
      this.apply(toSupportedLocale(stored));
    } catch {
      this.hydration = null;
    }
  }

  /** Switches the active language and persists it across restarts. */
  setLocale(locale: string): void {
    const next = toSupportedLocale(locale);
    this.chosenByUser = true;
    if (!this.apply(next)) return;
    void this.store.setItem(LANGUAGE_STORAGE_KEY, next);
  }

  /** Subscribes to language changes (backs `useSyncExternalStore` in presentation). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Returns false when the locale is unchanged, so callers can skip persisting. */
  private apply(locale: string): boolean {
    if (locale === this.current) return false;
    this.current = locale;
    for (const listener of this.listeners) listener();
    return true;
  }
}
