import { ok } from '@core/result/result-helpers';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

/**
 * Null-object key-value store used only when no platform store is registered in
 * the container (unit tests that mount UI without the composition root). Reads
 * return `null` and writes are dropped, mirroring an empty secure store — the
 * real platform store is always registered before the UI mounts in the app.
 */
export const noopKeyValueStore: KeyValueStoreInterface = {
  getItem: async () => ok(null),
  setItem: async () => ok(undefined),
  removeItem: async () => ok(undefined),
};
