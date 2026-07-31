import type { BoundStore } from '@application/store/bound-store';
import { useEffect, useRef } from 'react';
import { useLocale } from '@presentation/i18n/use-locale';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { TaxonomyStoreState } from '@application/recipes/taxonomy/taxonomy-store-state';

/**
 * Keeps the backend cuisine + category catalogs loaded and in the app's
 * language. Loads on mount for everyone — the taxonomy endpoints are public
 * (guest browsing) — retries via `load()` (idempotent) whenever the auth state
 * changes, and force-refetches via `reload()` when the locale changes, because
 * the backend localizes catalog names through the `Accept-Language` header
 * and the cached entries would otherwise stay in the previous language.
 */
export const useTaxonomySync = (taxonomyStore: BoundStore<TaxonomyStoreState>, authStore: BoundStore<AuthStoreState>): void => {
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
