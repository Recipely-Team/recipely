import { ok } from '@core/result/result-helpers';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';

/** Null-object preference store for DI-less test mounts: reads `null`, drops writes. */
export const noopPreferenceStore: PreferenceStoreInterface = {
  get: async () => ok(null),
  set: async () => ok(undefined),
};
