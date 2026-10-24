import { prepareIntegrityTokenProviderAsync, requestIntegrityCheckAsync } from '@expo/app-integrity';
import { digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { DevicePlatform } from '@domain/notifications/device-platform';
import { HttpHeader } from '@infrastructure/network/http/http-header';
import type { AppAttestorInterface } from '@infrastructure/integrity/app-attestor-interface';

/**
 * Android: a Play Integrity standard-request token per attested request.
 *
 * @remarks
 * - **`requestHash` is SHA-256 (hex) of the binding.** Google signs it into the
 *   token's `requestDetails.requestHash`; the backend decodes the token with
 *   Google and compares it with its own hash of the request.
 * - **The token provider is prepared once.** A failed preparation is forgotten
 *   so the next attested request tries again rather than never.
 * - **`cloudProjectNumber`** is the Google Cloud project linked to the app in
 *   Play Console (`EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER`, a repo variable).
 */
export class PlayIntegrityAttestor implements AppAttestorInterface {
  private prepared: Promise<boolean> | null = null;

  constructor(private readonly cloudProjectNumber: string) {}

  async headersFor(binding: string): Promise<Readonly<Record<string, string>> | null> {
    if (!(await this.prepare())) return null;
    try {
      const requestHash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, binding);
      const token = await requestIntegrityCheckAsync(requestHash);
      return {
        [HttpHeader.appAttestationPlatform]: DevicePlatform.Android,
        [HttpHeader.appAttestation]: token,
      };
    } catch {
      // A provider that expired answers with an error: prepare a fresh one next time.
      this.prepared = null;
      return null;
    }
  }

  private prepare(): Promise<boolean> {
    this.prepared ??= prepareIntegrityTokenProviderAsync(this.cloudProjectNumber).then(
      () => true,
      () => {
        this.prepared = null;
        return false;
      },
    );
    return this.prepared;
  }
}
