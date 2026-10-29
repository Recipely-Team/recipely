import type { SecureKeyValueStoreInterface } from '@domain/storage/secure-key-value-store-interface';
import { kvStore } from '@infrastructure/storage/kv-store';

/**
 * Web has no keychain: localStorage is the only store, so the secret store is that store.
 * The web session never lands here anyway — it rides an HttpOnly cookie.
 */
export const secureKvStore: SecureKeyValueStoreInterface = { ...kvStore, isSecretStore: true };
