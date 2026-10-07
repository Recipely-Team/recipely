import { type InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { isFormData } from '@core/guards/type-guards';
import { HttpMethod, METHODS_WITH_BODY } from '@infrastructure/network/http/http-method';
import { LogTag } from '@infrastructure/constants/log-tag';
import { HttpHeader, HttpMediaType } from '@infrastructure/network/http/http-header';
import { MULTIPART_UPLOAD_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
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
      // set(): AxiosHeaders has its own normalised storage.
      headers.set(name, value);
    }

    const isFormDataPayload =
      isFormData(config.data);

    if (isFormDataPayload) {
      // Plain delete would leave the AxiosHeaders entry live.
      if (config.headers instanceof AxiosHeaders) {
        config.headers.delete(HttpHeader.contentType);
      }
      // Identity transform: send RN's FormData untouched.
      config.transformRequest = [(data) => data];
      // Uploads get the longer upload budget.
      config.timeout = MULTIPART_UPLOAD_TIMEOUT_MS;
      return config;
    }

    config.headers[HttpHeader.contentType] = HttpMediaType.json;

    // Bodied methods are always encrypted (an empty envelope when there is no data).
    if (METHODS_WITH_BODY.includes((config.method?.toUpperCase() ?? CharConstants.empty) as HttpMethod)) {
      const bodyData = config.data ?? {};
      // Wrapped as { data } to mirror the response envelope.
      config.data = encryptEnvelope({ data: bodyData }, aesKey);
    }
    if (options.enableLogging) {
      console.log(`${LogTag.httpRequest} ${config.method?.toUpperCase()} ${config.baseURL ?? CharConstants.empty}${config.url ?? CharConstants.empty}`);
    }
    return config;
  };
};
