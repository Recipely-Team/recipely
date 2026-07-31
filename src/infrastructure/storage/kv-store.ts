import * as SecureStore from 'expo-secure-store';
import type { IKeyValueStore } from '@domain/storage/i-key-value-store';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

export const kvStore: IKeyValueStore = {
  getItem: (key: string) => toStorageResult(() => SecureStore.getItemAsync(key)),
  setItem: (key: string, value: string) => toStorageResult(() => SecureStore.setItemAsync(key, value)),
  removeItem: (key: string) => toStorageResult(() => SecureStore.deleteItemAsync(key)),
};
