import * as SecureStore from 'expo-secure-store';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

export const kvStore: KeyValueStoreInterface = {
  getItem: (key: string) => toStorageResult(() => SecureStore.getItemAsync(key)),
  setItem: (key: string, value: string) => toStorageResult(() => SecureStore.setItemAsync(key, value)),
  removeItem: (key: string) => toStorageResult(() => SecureStore.deleteItemAsync(key)),
};
