import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';
import { ATTESTATION_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';

type AttestationProvider = NonNullable<AxiosHttpClientOptions['attestationProvider']>;

/**
 * Asks for a proof without letting it hold the request up: a provider that
 * rejects or outlasts `ATTESTATION_TIMEOUT_MS` answers `null`, and the request
 * goes without one — attestation fails open on the client.
 */
export const boundedAttestation = (
  provider: AttestationProvider,
  binding: string,
  timeoutMs: number = ATTESTATION_TIMEOUT_MS,
): Promise<Readonly<Record<string, string>> | null> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  const proof = provider(binding).catch(() => null);
  return Promise.race([proof, timeout]).then((headers) => {
    clearTimeout(timer);
    return headers;
  });
};
