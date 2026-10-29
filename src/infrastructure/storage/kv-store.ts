import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

const mmkv = createMMKV({ id: 'recipely' });

/**
 * The key-value store for everything that is not a secret: caches, preferences, timers, the
 * shopping outbox. MMKV (memory-mapped, synchronous through Nitro) instead of
 * SecureStore, whose every read is a Keychain/Keystore call and which Expo documents for small
 * secrets, not the JSON pages cached here.
 *
 * @remarks
 * - **Secrets go to `secureKvStore`**: the session, device id and attestation key never come here.
 * - **Moved on first read**: a key this store does not hold yet is looked up in SecureStore, where
 *   every earlier version kept it, copied over and deleted there — so an update keeps the
 *   language, onboarding and caches, and each key moves once.
 */
export const kvStore: KeyValueStoreInterface = {
  getItem: (key: string) =>
    toStorageResult(async () => {
      const held = mmkv.getString(key);
      if (held !== undefined) return held;
      const legacy = await SecureStore.getItemAsync(key);
      if (legacy === null) return null;
      mmkv.set(key, legacy);
      await SecureStore.deleteItemAsync(key);
      return legacy;
    }),
  setItem: (key: string, value: string) => toStorageResult(async () => mmkv.set(key, value)),
  removeItem: (key: string) =>
    toStorageResult(async () => {
      mmkv.remove(key);
      // A key not read since the update still sits in SecureStore; removing it here keeps it from coming back.
      await SecureStore.deleteItemAsync(key);
    }),
};
