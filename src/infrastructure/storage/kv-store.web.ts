import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

export const kvStore: KeyValueStoreInterface = {
  // `localStorage` throws in private browsing and when a quota is exceeded,
  // so the web backend needs the same folding as the native one.
  getItem: (key: string) => toStorageResult(async () => localStorage.getItem(key)),
  setItem: (key: string, value: string) => toStorageResult(async () => { localStorage.setItem(key, value); }),
  removeItem: (key: string) => toStorageResult(async () => { localStorage.removeItem(key); }),
};
