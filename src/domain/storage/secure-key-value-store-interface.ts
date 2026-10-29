import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

/**
 * Port for the key-value store that may hold secrets — the session, the device id, the
 * attestation key. Same surface as {@link KeyValueStoreInterface}; the `isSecretStore` mark is
 * what makes it a different type, so a consumer that keeps a secret declares this port and the
 * compiler refuses the everyday store (MMKV, unencrypted) in its place.
 */
export interface SecureKeyValueStoreInterface extends KeyValueStoreInterface {
  readonly isSecretStore: true;
}
