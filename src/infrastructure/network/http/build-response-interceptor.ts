import type { AxiosResponse } from 'axios';
import { LogTag, DECRYPT_FAILED_LOG } from '@infrastructure/constants/log-tag';
import { decryptEnvelope } from '@infrastructure/crypto/aes-envelope';
import { isEnvelope } from '@infrastructure/network/envelope/is-envelope';
import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';
import { CharConstants } from '@core/constants';

/**
 * Builds the axios response interceptor that decrypts AES-GCM envelopes back
 * into plain JSON.
 *
 * @remarks
 * - **A decrypt failure rejects the response.** The `EnvelopeDecryptError`
 *   propagates to `AxiosHttpClient.request`, where `mapAxiosError` turns it
 *   into a `ValidationFailure`. Leaving the raw envelope in place let a 2xx
 *   reply with no `data` key pass as `ok(envelope)`, so a write answered with
 *   the wrong key reported success.
 */
export const buildResponseInterceptor = (
  options: AxiosHttpClientOptions,
  aesKey: Uint8Array,
) => {
  return (response: AxiosResponse): AxiosResponse => {
    if (isEnvelope(response.data)) {
      try {
        response.data = decryptEnvelope(response.data, aesKey);
      } catch (err) {
        if (options.enableLogging) {
          console.log(`${LogTag.httpResponse} ${DECRYPT_FAILED_LOG} ${(err as Error).message}`);
        }
        throw err;
      }
    }
    if (options.enableLogging) {
      console.log(`${LogTag.httpResponse} ${response.status} ${response.config.url ?? CharConstants.empty}`);
    }
    return response;
  };
};
