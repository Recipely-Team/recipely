import * as SecureStore from 'expo-secure-store';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

export const kvStore: KeyValueStoreInterface = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};
