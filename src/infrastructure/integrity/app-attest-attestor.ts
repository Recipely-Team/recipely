import { attestKeyAsync, generateAssertionAsync, generateKeyAsync, isSupported } from '@expo/app-integrity';
import { DevicePlatform } from '@domain/notifications/device-platform';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { HttpHeader } from '@infrastructure/network/http/http-header';
import { APP_ATTEST_KEY_STORAGE_KEY } from '@infrastructure/constants/storage';
import type { AppAttestorInterface } from '@infrastructure/integrity/app-attestor-interface';
import type { AttestationRepository } from '@infrastructure/integrity/attestation-repository';

/** The code `generateAssertionAsync` rejects with when the OS no longer holds the key. */
const INVALID_KEY_ERROR = 'ERR_APP_INTEGRITY_INVALID_KEY';

/**
 * iOS: an App Attest assertion per attested request, from a key attested once.
 *
 * @remarks
 * - **Once per install:** generate a Secure Enclave key, have Apple attest it
 *   over a backend challenge, register it, and keep only its id. The id is
 *   stored only after the backend accepted the key.
 * - **Per request:** an assertion over SHA-256 of the binding (the native
 *   module hashes it). The backend checks the signature with the registered
 *   public key and that the counter only goes up.
 * - **A lost key starts over.** A restored backup or a reinstall leaves an id
 *   the Secure Enclave no longer knows; that error forgets it, so the next
 *   attested request registers a new one.
 * - **One registration at a time**: concurrent requests share the pending one.
 */
export class AppAttestAttestor implements AppAttestorInterface {
  private keyId: Promise<string | null> | null = null;

  constructor(
    private readonly store: KeyValueStoreInterface,
    private readonly repository: AttestationRepository,
  ) {}

  async headersFor(binding: string): Promise<Readonly<Record<string, string>> | null> {
    if (!isSupported) return null;
    const keyId = await this.currentKey();
    if (keyId === null) return null;
    try {
      const assertion = await generateAssertionAsync(keyId, binding);
      return {
        [HttpHeader.appAttestationPlatform]: DevicePlatform.Ios,
        [HttpHeader.appAttestationKey]: keyId,
        [HttpHeader.appAttestation]: assertion,
      };
    } catch (error: unknown) {
      if ((error as { code?: unknown } | null)?.code === INVALID_KEY_ERROR) await this.forgetKey();
      return null;
    }
  }

  private currentKey(): Promise<string | null> {
    this.keyId ??= this.loadOrRegister().then((keyId) => {
      if (keyId === null) this.keyId = null;
      return keyId;
    });
    return this.keyId;
  }

  private async loadOrRegister(): Promise<string | null> {
    const stored = await this.store.getItem(APP_ATTEST_KEY_STORAGE_KEY);
    if (!stored.ok) return null;
    if (stored.value !== null) return stored.value;
    return this.register();
  }

  private async register(): Promise<string | null> {
    const challenge = await this.repository.fetchChallenge();
    if (!challenge.ok) return null;
    try {
      const keyId = await generateKeyAsync();
      const attestation = await attestKeyAsync(keyId, challenge.value);
      const registered = await this.repository.registerAppleKey({ keyId, attestation, challenge: challenge.value });
      if (!registered.ok) return null;
      const saved = await this.store.setItem(APP_ATTEST_KEY_STORAGE_KEY, keyId);
      return saved.ok ? keyId : null;
    } catch {
      return null;
    }
  }

  private async forgetKey(): Promise<void> {
    this.keyId = null;
    await this.store.removeItem(APP_ATTEST_KEY_STORAGE_KEY);
  }
}
