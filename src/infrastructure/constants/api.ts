import Constants from "expo-constants";

// Build variant, injected by app.config.ts into `extra.variant` at config
// evaluation time (driven by the APP_VARIANT env var). Lets the dev build
// (APP_VARIANT=development, com.recipely.app.dev) talk to the dev backend while
// the production build talks to prod. Falls back to "production" when unset
// (e.g. inside unit tests, where expoConfig is the static app.json manifest).
const IS_DEV_VARIANT: boolean =
  Constants.expoConfig?.extra?.variant === "development";

// Server root — the bare host:port, selected per variant. Override either
// default with EXPO_PUBLIC_API_BASE_URL (kept under the existing env var name
// for backward compat with any device already shipping with that override).
const PROD_SERVER_URL = "https://api.recipely.net";
const DEV_SERVER_URL = "https://dev-api.recipely.net";
const DEFAULT_SERVER_URL = IS_DEV_VARIANT ? DEV_SERVER_URL : PROD_SERVER_URL;

const SERVER_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  DEFAULT_SERVER_URL;

// /health is unversioned on the backend (mounted directly on the Express app,
// not under /api/v1).
export const HEALTH_URL: string = `${SERVER_URL}/health`;

// HttpClient.baseURL — every relative `url:` in the repositories resolves
// under here, so the v1 prefix lives in one place.
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;

// Upload endpoint is mounted at the server root (outside /api/v1), so it
// needs an absolute URL that bypasses HttpClient's baseURL.
export const UPLOAD_URL: string = `${SERVER_URL}/upload`;

// Avatar upload endpoint is mounted at the server root (outside /api/v1), so
// it needs an absolute URL that bypasses HttpClient's baseURL.
export const AVATAR_UPLOAD_URL: string = `${SERVER_URL}/me/avatar`;

// Canonical public web origin (universal-link domain in app.json). Distinct
// from the API server. Used to build shareable deep links that round-trip back
// into the app via expo-router path matching. Dev points at the dev Firebase
// Hosting site so shared links stay within the dev web build.
const PROD_WEB_APP_BASE_URL = "https://recipely.net";
const DEV_WEB_APP_BASE_URL = "https://app-recipely-dev.web.app";
const DEFAULT_WEB_APP_BASE_URL = IS_DEV_VARIANT
  ? DEV_WEB_APP_BASE_URL
  : PROD_WEB_APP_BASE_URL;

export const WEB_APP_BASE_URL: string =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/$/, "") ??
  DEFAULT_WEB_APP_BASE_URL;

// Public legal pages served as static HTML on the production web origin
// (recipely.net/privacy|/terms, Firebase-rewritten to /legal/*.html). Always
// the production site, regardless of build variant or platform: the dev
// backend and the dev web build don't ship these pages, and the legal text is
// environment-independent anyway.
export const PRIVACY_POLICY_URL: string = `${PROD_WEB_APP_BASE_URL}/privacy`;
export const TERMS_OF_USE_URL: string = `${PROD_WEB_APP_BASE_URL}/terms`;

/** Shareable canonical URL for a recipe — opens the app's recipes/[recipeId] route. */
export const recipeWebUrl = (recipeId: string): string =>
  `${WEB_APP_BASE_URL}/recipes/${recipeId}`;

// Fallback verification-code lifetime (seconds) used only when the backend
// response omits both expiresAt and expiresInSeconds. Mirrors the backend
// CODE_TTL_MS (3 minutes).
export const DEFAULT_CODE_TTL_SECONDS = 180;

// Default size of the trending discover rail (backend caps `limit` at 1–30).
export const TRENDING_RECIPES_LIMIT = 10;

export const RECIPES_PAGE_SIZE = 30;

export const DRAFTS_PAGE_SIZE = 20;

export const COMMENTS_PAGE_SIZE = 20;

export const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

// WHY: the Instagram import endpoint runs yt-dlp + Whisper transcription +
// vision on the backend, with a server-side budget of ~120s. The default 10s
// JSON timeout would abort a normal import as `ECONNABORTED` → TimeoutFailure
// long before the backend replies. Give the per-request override 10s of
// headroom over the backend budget so only genuinely stuck requests time out.
export const IMPORT_REQUEST_TIMEOUT_MS = 130_000;

// WHY: the text-only AI endpoints (generate/refine) call Gemini synchronously,
// which routinely runs well past the 10s JSON default — cold calls especially —
// so the default budget aborts a request the backend then completes. They never
// approach the video-import budget (no download/transcription), so give them
// their own headroom between the two.
export const AI_REQUEST_TIMEOUT_MS = 90_000;

// WHY: image uploads regularly exceed 10s on cellular (a 3 MB JPEG at 1 Mbps
// upload is ~25s). The default 10s budget surfaces as `ECONNABORTED` →
// NetworkFailure('Request timed out'), which mobile users see as "Network
// error". Give multipart its own headroom independent of JSON timeouts.
export const MULTIPART_UPLOAD_TIMEOUT_MS = 60_000;

// Shared AES-256-GCM key for the /api/v1 envelope. Must equal the backend's
// API_AES_KEY (`openssl rand -hex 32`). Override at build time via
// EXPO_PUBLIC_API_AES_KEY. NOTE: this key lives in the binary and is
// extractable via reverse engineering — see backend PR for the security
// caveat. TLS is the proper transport-layer fix.
const DEFAULT_AES_KEY_HEX =
  "0000000000000000000000000000000000000000000000000000000000000000";

export const API_AES_KEY_HEX: string =
  process.env.EXPO_PUBLIC_API_AES_KEY?.toLowerCase() ?? DEFAULT_AES_KEY_HEX;

// OAuth 2.0 Web client ID from Firebase Console (Authentication → Sign-in method → Google).
// Required for Android Google Sign-In and for verifying the ID token.
// Override at build time via EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
export const GOOGLE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
