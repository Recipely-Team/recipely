import type { AxiosResponse } from 'axios';
import { LogTag, DECRYPT_FAILED_LOG } from '@infrastructure/constants/log-tag';
import { decryptEnvelope } from '@infrastructure/crypto/aes-envelope';
import { isEnvelope } from '@infrastructure/network/envelope/is-envelope';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import { CharConstants } from '@core/constants';

/**
 * Builds the axios response interceptor that decrypts AES-GCM envelopes back
 * into plain JSON. A decrypt failure is logged (dev only) and the raw body is
 * left in place so downstream mapping can still fail cleanly.
 */
export const buildResponseInterceptor = (
  options: HttpClientOptions,
  aesKey: Uint8Array,
) => {
  return (response: AxiosResponse): AxiosResponse => {
    if (isEnvelope(response.data)) {
      try {
        response.data = decryptEnvelope(response.data, aesKey);
      } catch (err) {
        if (options.enableLogging) {
          console.log(`${LogTag.httpResponse} ${DECRYPT_FAILED_LOG} ${(err as Error).message}`); // TO DO: i18n key for this message
        }
      }
    }
    if (options.enableLogging) {
      console.log(`${LogTag.httpResponse} ${response.status} ${response.config.url ?? CharConstants.empty}`);
    }
    return response;
  };
};
