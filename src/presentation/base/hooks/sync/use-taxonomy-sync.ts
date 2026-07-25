import { useEffect, useRef } from 'react';
import type { AuthStore } from '@application/auth/auth-store';
import type { TaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store';
import { useLocale } from '@presentation/i18n/use-locale';

/**
 * Keeps the backend cuisine + category catalogs loaded and in the app's
 * language. Loads on mount for everyone — the taxonomy endpoints are public
 * (guest browsing) — retries via `load()` (idempotent) whenever the auth state
 * changes, and force-refetches via `reload()` when the locale changes, because
 * the backend localizes catalog names through the `Accept-Language` header
 * and the cached entries would otherwise stay in the previous language.
 */
export const useTaxonomySync = (taxonomyStore: TaxonomyStore, authStore: AuthStore): void => {
  const locale = useLocale();
  const initialLocale = useRef(locale);

  useEffect(() => {
    void taxonomyStore.getState().load();
    return authStore.subscribe(() => {
      void taxonomyStore.getState().load();
    });
  }, [taxonomyStore, authStore]);

  useEffect(() => {
    if (locale === initialLocale.current) return;
    initialLocale.current = locale;
    void taxonomyStore.getState().reload();
  }, [locale, taxonomyStore]);
};
