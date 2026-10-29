import * as SecureStore from 'expo-secure-store';
import type { SecureKeyValueStoreInterface } from '@domain/storage/secure-key-value-store-interface';
import { toStorageResult } from '@infrastructure/storage/to-storage-result';

/**
 * The key-value store for secrets only — the session, the device id, the attestation key —
 * on Expo SecureStore (Keychain / Keystore). Everything else goes to `kvStore` (MMKV):
 * SecureStore is documented for small secrets, and every access is a Keychain call.
 */
export const secureKvStore: SecureKeyValueStoreInterface = {
  isSecretStore: true,
  getItem: (key: string) => toStorageResult(() => SecureStore.getItemAsync(key)),
  setItem: (key: string, value: string) => toStorageResult(() => SecureStore.setItemAsync(key, value)),
  removeItem: (key: string) => toStorageResult(() => SecureStore.deleteItemAsync(key)),
};
