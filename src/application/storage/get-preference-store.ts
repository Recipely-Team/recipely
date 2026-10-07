import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { noopPreferenceStore } from '@application/storage/noop-preference-store';

/**
 * Resolves the preference store from the DI container, falling back to an inert
 * no-op store when none is registered (DI-less unit test mounts).
 */
export const getPreferenceStore = (): PreferenceStoreInterface =>
  container.has(TOKENS.PreferenceStore)
    ? container.resolve<PreferenceStoreInterface>(TOKENS.PreferenceStore)
    : noopPreferenceStore;
