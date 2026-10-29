import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

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
   * Renews the session after a 401. On success the failed request is sent once
   * more; `onUnauthorized` fires only when the API refused the renewal. A renewal
   * that could not reach the API returns its own failure and keeps the session.
   */
  refreshSession?: () => Promise<Result<unknown, Failure>>;
  /**
   * Web: the refresh token lives in the API's HttpOnly cookie. Requests carry
   * credentials and ask for cookie delivery (`X-Recipely-Session: cookie`).
   */
  cookieSession?: boolean;
  /** Mints the `X-Request-Id` of each request (a UUID); no header when absent. */
  requestIdProvider?: () => string;
  /**
   * Proves an `ATTESTED_ROUTES` request comes from the genuine app: given the
   * request's binding, answers its attestation headers, or `null` to send it
   * without. Needs `requestIdProvider` — the binding includes the request id.
   */
  attestationProvider?: (binding: string) => Promise<Readonly<Record<string, string>> | null>;
  /**
   * Told about every failed request, with its request id, so the line reaches
   * the crash log's breadcrumbs. Diagnostic only; never user copy.
   */
  onRequestFailed?: (summary: string) => void;
  /**
   * Store builds only: sent as `X-App-Platform` / `X-App-Version` so the
   * backend can refuse a build that must update. Absent on the web.
   */
  appBuild?: { platform: string; version: string };
  /** Invoked on every 426 from the version gate, so the app re-checks and shows its update gate. */
  onUpgradeRequired?: () => void;
}
