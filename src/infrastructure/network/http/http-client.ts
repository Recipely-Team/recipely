import { create, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { failureFromResponse } from '@infrastructure/network/errors/failure-from-response';
import { API_AES_KEY_HEX, DEFAULT_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api';
import { keyFromHex } from '@infrastructure/crypto/aes-envelope';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import { isRecipelyDataBody } from '@infrastructure/network/envelope/is-recipely-data-body';
import { mapAxiosError } from '@infrastructure/network/errors/map-axios-error';
import { buildRequestInterceptor } from '@infrastructure/network/http/build-request-interceptor';
import { buildResponseInterceptor } from '@infrastructure/network/http/build-response-interceptor';
import { uploadMultipart } from '@infrastructure/network/upload/upload-multipart';
import type { UploadProgressEvent } from '@infrastructure/network/upload/upload-progress-event';
import { isSuccessStatus } from '@infrastructure/network/http/http-status';
import { HttpMethod } from '@infrastructure/network/http/http-method';
import type { RequestConfig } from '@infrastructure/network/http/request-config';

/**
 * Axios-backed HTTP client for the Recipely backend. Automatically attaches
 * the JWT bearer token and `Accept-Language` header on every request, encrypts
 * JSON request bodies and decrypts AES-GCM response envelopes, and maps
 * non-2xx responses and network errors to the domain `Failure` hierarchy.
 */
export class HttpClient {
  private readonly instance: AxiosInstance;
  private readonly aesKey: Uint8Array;

  constructor(private readonly options: HttpClientOptions) {
    this.aesKey = keyFromHex(API_AES_KEY_HEX);

    this.instance = create({
      baseURL: options.baseUrl,
      timeout: options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      headers: {
        Accept: 'application/json',
        // Content-Type is set per-request in the interceptor so FormData uploads
        // can omit it and let the XHR runtime auto-set multipart + boundary.
      },
      validateStatus: () => true,
    });

    this.instance.interceptors.request.use(buildRequestInterceptor(options, this.aesKey));
    this.instance.interceptors.response.use(
      buildResponseInterceptor(options, this.aesKey),
      (error: unknown) => Promise.reject(error),
    );
  }

  /**
   * The verb is the method you call, not a string you pass.
   *
   * Every repository spelled `method: 'POST'` into a config object, so the verb
   * was a literal thirty-odd times over and nothing stopped one from being
   * typed `'Post'` or landing on the wrong call. These read as the request they
   * make; `request` stays for the rare call needing a full Axios config.
   */
  get<T>(url: string, config?: RequestConfig): Promise<Result<T, Failure>> {
    return this.request<T>({ ...config, method: HttpMethod.Get, url });
  }

  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Result<T, Failure>> {
    return this.request<T>({ ...config, method: HttpMethod.Post, url, data });
  }

  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Result<T, Failure>> {
    return this.request<T>({ ...config, method: HttpMethod.Put, url, data });
  }

  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Result<T, Failure>> {
    return this.request<T>({ ...config, method: HttpMethod.Patch, url, data });
  }

  delete<T>(url: string, config?: RequestConfig): Promise<Result<T, Failure>> {
    return this.request<T>({ ...config, method: HttpMethod.Delete, url });
  }

  async request<T>(config: AxiosRequestConfig): Promise<Result<T, Failure>> {
    try {
      const response = await this.instance.request<unknown>(config);
      if (isSuccessStatus(response.status)) {
        const dataEnvelope = response.data;
        if (isRecipelyDataBody<T>(dataEnvelope)) {
          return ok(dataEnvelope.data);
        }
        // Backwards compat / non-/api/v1 responses (eg /health) come through unchanged.
        return ok(dataEnvelope as T);
      }
      return this.failWithUnauthorizedHook(failureFromResponse(response.status, response.data));
    } catch (error: unknown) {
      return this.failWithUnauthorizedHook(mapAxiosError(error));
    }
  }

  /**
   * Wraps a mapped failure in `fail()` and fires the `onUnauthorized` hook when
   * the failure is an `UnauthorizedFailure`. Detecting via the mapped failure
   * (rather than the raw status) covers both the `validateStatus` path and the
   * thrown-AxiosError path uniformly. The returned value is unchanged.
   */
  private failWithUnauthorizedHook<T>(failure: Failure): Result<T, Failure> {
    if (failure instanceof UnauthorizedFailure) {
      this.options.onUnauthorized?.();
    }
    return fail(failure);
  }

  uploadMultipart<T>(
    url: string,
    formData: FormData,
    onProgress?: (event: UploadProgressEvent) => void,
  ): Promise<Result<T, Failure>> {
    return uploadMultipart<T>(this.options, this.aesKey, url, formData, onProgress);
  }
}
