import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, NetworkFailure, TimeoutFailure } from '@core/failure';
import { RegexConstants, ValueConstants } from '@core/constants';
import { MULTIPART_UPLOAD_TIMEOUT_MS } from '@infrastructure/constants/api';
import { decryptEnvelope } from '@infrastructure/crypto/aes-envelope';
import { failureFromResponse } from '@infrastructure/network/errors/failure-from-response';
import { isEnvelope } from '@infrastructure/network/envelope/is-envelope';
import { isRecipelyDataBody } from '@infrastructure/network/envelope/is-recipely-data-body';
import { buildCommonHeaders } from '@infrastructure/network/http/build-common-headers';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import type { UploadProgressEvent } from '@infrastructure/network/upload/upload-progress-event';
import { isSuccessStatus } from '@infrastructure/network/http/http-status';

/**
 * Uploads a `FormData` payload via raw `XMLHttpRequest`, bypassing axios
 * entirely. axios v1's XHR adapter is unreliable for RN multipart on Android:
 * its FormData detection misses RN's polyfilled FormData and the body is
 * JSON-stringified to `"{}"`, surfacing to the user as "Network error". XHR is
 * what every reliable RN upload library uses under the hood.
 *
 * `url` may be relative (resolved against `baseUrl`) or absolute (used as-is,
 * needed for endpoints mounted outside `/api/v1` like `/upload`).
 */
export const uploadMultipart = async <T>(
  options: HttpClientOptions,
  aesKey: Uint8Array,
  url: string,
  formData: FormData,
  onProgress?: (event: UploadProgressEvent) => void,
): Promise<Result<T, Failure>> => {
  const fullUrl = RegexConstants.absoluteHttpUrl.test(url)
    ? url
    : `${options.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  const commonHeaders = await buildCommonHeaders(options);
  const enableLogging = options.enableLogging === true;

  return new Promise<Result<T, Failure>>((resolve) => {
    if (enableLogging) {
      console.log(`[HTTP → multipart] POST ${fullUrl}`);
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', fullUrl, true);
    xhr.timeout = MULTIPART_UPLOAD_TIMEOUT_MS;
    xhr.setRequestHeader('Accept', 'application/json');
    for (const [name, value] of Object.entries(commonHeaders)) {
      xhr.setRequestHeader(name, value);
    }
    // WHY: deliberately NOT setting Content-Type — the XHR runtime sets it to
    // `multipart/form-data; boundary=...` from the FormData object. Any explicit
    // value breaks the boundary contract and the backend's middleware rejects it.

    if (onProgress !== undefined && xhr.upload) {
      xhr.upload.onprogress = (ev: ProgressEvent): void => {
        onProgress({ loaded: ev.loaded, total: ev.total });
      };
    }

    xhr.onload = (): void => {
      const status = xhr.status;
      const responseText = xhr.responseText;
      if (enableLogging) {
        console.log(`[HTTP ← multipart] ${status} ${fullUrl}`);
      }
      let body: unknown;
      try {
        body = JSON.parse(responseText);
      } catch {
        body = responseText;
      }
      if (isEnvelope(body)) {
        try {
          body = decryptEnvelope(body, aesKey);
        } catch (err) {
          if (enableLogging) {
            console.log(`[HTTP ← multipart] decrypt failed: ${(err as Error).message}`);
          }
        }
      }
      if (isSuccessStatus(status)) {
        if (isRecipelyDataBody<T>(body)) {
          resolve(ok(body.data));
          return;
        }
        resolve(ok(body as T));
        return;
      }
      if (status === 401) {
        options.onUnauthorized?.();
      }
      // `body` is the decrypted error envelope here, so the server's
      // `messageKey` rides onto the mapped Failure via failureFromResponse.
      // The onerror/ontimeout handlers below have no envelope at all — their
      // failures intentionally carry no key.
      resolve(fail(failureFromResponse(status, body)));
    };

    xhr.onerror = (): void => {
      if (enableLogging) {
        console.log(`[HTTP ← multipart] network error ${fullUrl} (status=${xhr.status}, body="${xhr.responseText}")`);
      }
      // WHY: XHR onerror fires for connection-level failures (DNS, TCP,
      // unreadable file URI, cleartext blocked). Surface as NetworkFailure with
      // the status (0 == no response) so the UI can show something concrete.
      resolve(fail(new NetworkFailure(`Network error (status ${xhr.status || ValueConstants.zero})`)));
    };

    xhr.ontimeout = (): void => {
      if (enableLogging) {
        console.log(`[HTTP ← multipart] timeout ${fullUrl}`);
      }
      resolve(fail(new TimeoutFailure('Request timed out')));
    };

    xhr.send(formData);
  });
};
