import { ValueConstants } from '@core/constants';
import type { SecureKeyValueStoreInterface } from '@domain/storage/secure-key-value-store-interface';
import { isAndroid, isIos } from '@infrastructure/constants/platform';
import type { AppAttestorInterface } from '@infrastructure/integrity/app-attestor-interface';
import { AppAttestAttestor } from '@infrastructure/integrity/app-attest-attestor';
import { PlayIntegrityAttestor } from '@infrastructure/integrity/play-integrity-attestor';
import type { AttestationRepository } from '@infrastructure/integrity/attestation-repository';

/**
 * The attestor this runtime has: App Attest on iOS, Play Integrity on Android
 * (when the build carries its Cloud project number), none on the web.
 */
export const createAppAttestor = (
  store: SecureKeyValueStoreInterface,
  repository: AttestationRepository,
): AppAttestorInterface | null => {
  if (isIos()) return new AppAttestAttestor(store, repository);
  const cloudProjectNumber = process.env.EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER;
  if (isAndroid() && cloudProjectNumber !== undefined && cloudProjectNumber.length > ValueConstants.zero) {
    return new PlayIntegrityAttestor(cloudProjectNumber);
  }
  return null;
};
