import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

export const kvStore: KeyValueStoreInterface = {
  // localStorage throws in private mode and over quota: fold it like native.
  getItem: (key: string) => toStorageResult(async () => localStorage.getItem(key)),
  setItem: (key: string, value: string) => toStorageResult(async () => { localStorage.setItem(key, value); }),
  removeItem: (key: string) => toStorageResult(async () => { localStorage.removeItem(key); }),
};
