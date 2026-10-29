import { create, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { HttpHeader, HttpMediaType } from '@infrastructure/network/http/http-header';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { failureFromResponse } from '@infrastructure/network/errors/failure-from-response';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { readRetryDelayMs } from '@infrastructure/network/errors/read-retry-delay';
import { API_AES_KEY_HEX } from '@infrastructure/constants/build-secrets';
import { keyFromHex } from '@infrastructure/crypto/aes-envelope';
import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';
import { isRecipelyDataBody } from '@infrastructure/network/envelope/is-recipely-data-body';
import { mapAxiosError } from '@infrastructure/network/errors/map-axios-error';
import { buildRequestInterceptor } from '@infrastructure/network/http/build-request-interceptor';
import { buildResponseInterceptor } from '@infrastructure/network/http/build-response-interceptor';
import { uploadMultipart } from '@infrastructure/network/upload/upload-multipart';
import type { UploadProgressEvent } from '@infrastructure/network/upload/upload-progress-event';
import { HttpStatus, isSuccessStatus } from '@infrastructure/network/http/http-status';
import { HttpMethod } from '@infrastructure/network/http/http-method';
import { CharConstants, ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';

/** Credential endpoints: a 401 there is a wrong password or a dead refresh token, never a reason to refresh. */
const CREDENTIAL_ROUTES: ReadonlySet<string> = new Set(Object.values(ApiRoutes.auth));

/**
 * The per-request knobs a caller may set — not the verb, url or body, which
 * are the arguments of `get` / `post` / `put` / `patch` / `delete`.
 *
 * Deliberately narrower than Axios' own config: a repository has no business
 * swapping the adapter or the status validator, and exposing the whole surface
 * invites call sites to rebuild the client's behaviour one request at a time.
 */
interface RequestConfig {
  /**
   * Query string values, serialised by Axios. Typed as `object` rather than
   * `Record<string, unknown>` so a purpose-built query DTO — the shape a
   * `RequestMapper` produces — satisfies it without an index signature it has
   * no reason to carry.
   */
  params?: object;
  /** Overrides the client default — the AI and import calls need far longer. */
  timeout?: number;
}

/**
 * Axios-backed HTTP client for the Recipely backend. Automatically attaches
 * the JWT bearer token and `Accept-Language` header on every request, encrypts
 * JSON request bodies and decrypts AES-GCM response envelopes, and maps
 * non-2xx responses and network errors to the domain `Failure` hierarchy.
 *
 * @remarks
 * - **A 401 renews the session before it ends it.** Outside the credential
 *   routes, a 401 runs `refreshSession` and sends the request once more;
 *   `onUnauthorized` (sign-out) fires only when the renewal fails or the
 *   retried request is refused again.
 */
export class AxiosHttpClient {
  private readonly instance: AxiosInstance;
  private readonly aesKey: Uint8Array;

  constructor(private readonly options: AxiosHttpClientOptions) {
    this.aesKey = keyFromHex(API_AES_KEY_HEX);

    this.instance = create({
      baseURL: options.baseUrl,
      timeout: options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      headers: {
        [HttpHeader.accept]: HttpMediaType.json,
        // Content-Type per request (multipart sets its own boundary).
      },
      validateStatus: () => true,
      // Web: lets the API set and read its HttpOnly refresh cookie.
      withCredentials: options.cookieSession === true,
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
  /** A read that timed out or found the API briefly unreachable is asked again, with backoff, before the user sees "this took a while" — {@link readRetryDelayMs}. */
  async get<T>(url: string, config?: RequestConfig): Promise<Result<T, Failure>> {
    let result = await this.request<T>({ ...config, method: HttpMethod.Get, url });
    for (let attempt = ValueConstants.zero; !result.ok; attempt += ValueConstants.one) {
      const delay = readRetryDelayMs(result.failure, attempt);
      if (delay === null) return result;
      await new Promise((resolve) => setTimeout(resolve, delay));
      result = await this.request<T>({ ...config, method: HttpMethod.Get, url });
    }
    return result;
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

  request<T>(config: AxiosRequestConfig): Promise<Result<T, Failure>> {
    return this.withSessionRefresh(config.url, () => this.send<T>(config));
  }

  private async send<T>(config: AxiosRequestConfig): Promise<Result<T, Failure>> {
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
      // Typed as always present; a response built outside axios (an adapter, a test) can lack it.
      const sentConfig = response.config as typeof response.config | undefined;
      if (response.status === HttpStatus.upgradeRequired) this.options.onUpgradeRequired?.();
      return this.failed(config, sentConfig?.headers, failureFromResponse(response.status, response.data));
    } catch (error: unknown) {
      const sent = (error as { config?: { headers?: unknown } } | null)?.config?.headers;
      return this.failed(config, sent, mapAxiosError(error));
    }
  }

  /** Notes the failure with the request id it was sent under, then returns it. */
  private failed<T>(config: AxiosRequestConfig, sentHeaders: unknown, failure: Failure): Result<T, Failure> {
    const requestId = (sentHeaders as Record<string, unknown> | undefined)?.[HttpHeader.requestId];
    this.options.onRequestFailed?.(
      `${String(config.method ?? CharConstants.empty).toUpperCase()} ${config.url ?? CharConstants.empty} → ${failure.code}${isString(requestId) ? ` (request ${requestId})` : CharConstants.empty}`,
    );
    return fail(failure);
  }

  /**
   * Sends, and on an `UnauthorizedFailure` renews the session and sends once
   * more. Detecting via the mapped failure (rather than the raw status) covers
   * the `validateStatus` path, the thrown-AxiosError path and the uploader alike.
   */
  private async withSessionRefresh<T>(
    url: string | undefined,
    send: () => Promise<Result<T, Failure>>,
  ): Promise<Result<T, Failure>> {
    const first = await send();
    if (first.ok || !(first.failure instanceof UnauthorizedFailure)) return first;
    const refresh = this.options.refreshSession;
    const renewed = refresh !== undefined && !CREDENTIAL_ROUTES.has(url ?? CharConstants.empty) ? await refresh() : undefined;
    // A renewal that never reached the API is not a refusal: keep the session and report why.
    if (renewed !== undefined && !renewed.ok && !(renewed.failure instanceof UnauthorizedFailure)) return fail(renewed.failure);
    const answer = renewed?.ok === true ? await send() : first;
    if (!answer.ok && answer.failure instanceof UnauthorizedFailure) {
      this.options.onUnauthorized?.();
    }
    return answer;
  }

  /** `timeoutMs` overrides the multipart default for an upload the server answers slowly. */
  uploadMultipart<T>(
    url: string,
    formData: FormData,
    onProgress?: (event: UploadProgressEvent) => void,
    timeoutMs?: number,
  ): Promise<Result<T, Failure>> {
    // The uploader reports nothing itself; the 401 decision is made here, as for every other request.
    const { onUnauthorized: _hook, ...quiet } = this.options;
    return this.withSessionRefresh(url, () => uploadMultipart<T>(quiet, this.aesKey, url, formData, onProgress, timeoutMs));
  }
}
