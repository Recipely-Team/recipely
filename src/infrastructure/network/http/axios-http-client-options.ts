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
}
