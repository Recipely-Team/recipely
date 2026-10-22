export interface AxiosHttpClientOptions {
  baseUrl: string;
  tokenProvider: () => Promise<string | null>;
  /**
   * Resolves the active language for `Accept-Language`.
   *
   * Async on purpose: it awaits the restore of the user's saved language, so a
   * request issued during startup waits for it instead of racing ahead with the
   * device language. Required on purpose too — a defaulted locale would silently
   * ship every request in the wrong language the moment the wiring breaks.
   */
  localeProvider: () => Promise<string>;
  timeoutMs?: number;
  // WHY: keeps logging opt-in — production builds flip this off to drop PII out of logcat/xcode.
  enableLogging?: boolean;
  /**
   * Invoked whenever the backend returns 401, so the app can clear the session
   * and route to login. Side-effect only — the request still resolves to an
   * UnauthorizedFailure.
   */
  onUnauthorized?: () => void;
  /**
   * Renews the session after a 401; `true` when it did. The failed request is
   * then sent once more, and `onUnauthorized` fires only if the renewal failed.
   */
  refreshSession?: () => Promise<boolean>;
  /**
   * Web: the refresh token lives in the API's HttpOnly cookie. Requests carry
   * credentials and ask for cookie delivery (`X-Recipely-Session: cookie`).
   */
  cookieSession?: boolean;
  /** Mints the `X-Request-Id` of each request (a UUID); no header when absent. */
  requestIdProvider?: () => string;
  /**
   * Told about every failed request, with its request id, so the line reaches
   * the crash log's breadcrumbs. Diagnostic only; never user copy.
   */
  onRequestFailed?: (summary: string) => void;
}
