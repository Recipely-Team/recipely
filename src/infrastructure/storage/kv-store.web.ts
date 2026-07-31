import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

export const kvStore: KeyValueStoreInterface = {
  getItem: async (key: string): Promise<string | null> =>
    localStorage.getItem(key),
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};
