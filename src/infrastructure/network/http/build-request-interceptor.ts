import { type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { HttpHeader, HttpMediaType } from '@infrastructure/network/http/http-header';
import { MULTIPART_UPLOAD_TIMEOUT_MS } from '@infrastructure/constants/api';
import { encryptEnvelope } from '@infrastructure/crypto/aes-envelope';
import { buildCommonHeaders } from '@infrastructure/network/http/build-common-headers';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import { CharConstants } from '@core/constants';

/**
 * Builds the axios request interceptor that attaches the common headers (JWT
 * bearer token + `Accept-Language`, via `buildCommonHeaders`), then either
 * preserves FormData multipart uploads untouched or encrypts JSON bodies into
 * an AES envelope.
 *
 * WHY FormData is special-cased: the XHR runtime must set
 * `Content-Type: multipart/form-data; boundary=...` itself, so the explicit
 * `application/json` default is deleted and axios's default transforms are
 * bypassed — otherwise RN's polyfilled FormData is JSON-stringified to `"{}"`
 * and the backend rejects the request.
 */
export const buildRequestInterceptor = (
  options: HttpClientOptions,
  aesKey: Uint8Array,
) => {
  return async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const headers = config.headers ?? new AxiosHeaders();
    config.headers = headers;
    const common = await buildCommonHeaders(options);
    for (const [name, value] of Object.entries(common)) {
      // WHY .set(): AxiosHeaders keeps its own normalized storage — a bare index
      // assignment bypasses it (the same reason `delete` is wrong below).
      headers.set(name, value);
    }

    const isFormDataPayload =
      typeof FormData !== 'undefined' && config.data instanceof FormData; // TO DO: Static type check

    if (isFormDataPayload) {
      // WHY: AxiosHeaders uses internal storage — plain JS `delete` on the cast
      // Record does not call the class's delete() and leaves the header live.
      if (config.headers instanceof AxiosHeaders) {
        config.headers.delete(HttpHeader.contentType);
      }
      // WHY: identity transformRequest bypasses axios's default transformers so
      // RN's polyfilled FormData is sent untouched instead of JSON-stringified.
      config.transformRequest = [(data) => data];
      // WHY: bump timeout to the upload budget — multipart uploads over cellular
      // routinely exceed the 10s JSON default, surfacing as a "Network error".
      config.timeout = MULTIPART_UPLOAD_TIMEOUT_MS;
      return config;
    }

    config.headers[HttpHeader.contentType] = HttpMediaType.json;

    // Encrypt body for POST/PUT/PATCH. For requests with no data send an empty
    // encrypted envelope so the backend's decryptBody middleware accepts it.
    const methodsWithBody = ['POST', 'PUT', 'PATCH']; // TO DO: static list of methods with body, single source of truth for this
    if (methodsWithBody.includes(config.method?.toUpperCase() ?? CharConstants.empty)) {
      const bodyData = config.data ?? {};
      // WHY: backend's decryptBody middleware expects plaintext `{ data: <T> }`
      // (mirroring the response side). Wrap before encrypt so it is symmetric.
      config.data = encryptEnvelope({ data: bodyData }, aesKey);
    }
    if (options.enableLogging) {
      console.log(`[HTTP →] ${config.method?.toUpperCase()} ${config.baseURL ?? CharConstants.empty}${config.url ?? CharConstants.empty}`);
    }
    return config;
  };
};
